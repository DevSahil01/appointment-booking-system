const express=require('express')
const moment=require('moment')
const router=express.Router();
const authenticate=require('../../Middleware/authenticate')
const serviceSchema=require('../../Models/serviceSchema')
const holidaySchema=require('../../Models/holidaySchema')
const appointmentSchema=require('../../Models/Appointment')
const serviceProviderSchema=require('../../Models/Service_provider_schema')
const bodyparser=require('body-parser');
const NotificationSchema=require('../../Models/Notification')
router.use(bodyparser.urlencoded({extended:true}));
router.use(bodyparser.json())

router.get('/services/:id/:date', authenticate, async (req, res) => {
  const { id, date } = req.params;

  try {
    // Fetch timeslots, service provider ID, charges, and capacity
    const service = await serviceSchema.findById(id, {
      serviceTimeslots: 1,
      serviceProvideId: 1,
      serviceCharges: 1,
      slotCapacity: 1
    });

    if (!service) {
      return res.status(404).send({ message: "Service not found" });
    }
    
    const serviceProviderIdMain=await serviceProviderSchema.findById(service.serviceProvideId)
    

    // Check if this date is a holiday for the service provider
    const isHoliday = await holidaySchema.findOne({
      serviceProviderId: serviceProviderIdMain.CredentialId,
      date: date
    });

    console.log(isHoliday )

    if (isHoliday) {
      return res.send({
        data: {
          timeslot: [], // Return empty timeslot list
          user: {
            name: req.user,
            id: req.user_id
          },
          spId: service.serviceProvideId,
          serviceCharges: service.serviceCharges,
          isHoliday: true,
          holidayReason: isHoliday.reason || "Holiday"
        }
      });
    }

    // Continue with normal timeslot logic
    const occupied = await appointmentSchema.find({
      serviceId: id,
      status: "UpComing",
      date: date
    }, {
      timeSlot: 1,
      noOfPersons: 1
    });

    // Count number of bookings per slot
    const slotCounts = {};
    occupied.forEach(({ timeSlot, noOfPersons }) => {
      slotCounts[timeSlot] = (slotCounts[timeSlot] || 0) + noOfPersons;
    });

    // Calculate available slots
    const resultTimeslots = service.serviceTimeslots.map(slot => {
      const booked = slotCounts[slot] || 0;
      const available = Math.max(service.slotCapacity - booked, 0);
      return { slot, available };
    });

    res.send({
      data: {
        timeslot: resultTimeslots,
        user: {
          name: req.user,
          id: req.user_id
        },
        spId: service.serviceProvideId,
        serviceCharges: service.serviceCharges,
        isHoliday: false
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server error while fetching slots" });
  }
});




router.post('/bookAppointment', authenticate, async (req, res) => {
  try {
    const { serviceId, serviceProviderId, date, timeslot, name, C_no, address, noOfPersons } = req.body;
    const userId = req.user_id;

    // Step 1: Count current bookings for the slot
    const existingBookings = await appointmentSchema.aggregate([
      {
        $match: {
          serviceId,
          date,
          timeSlot: timeslot
        }
      },
      {
        $group: {
          _id: null,
          totalPersons: { $sum: "$noOfPersons" }
        }
      }
    ]);

    const totalBooked = existingBookings.length > 0 ? existingBookings[0].totalPersons : 0;

    // Step 2: Get slot capacity from service provider or database
    const serviceProvider = await serviceSchema.find({serviceProvideId:serviceProviderId[0]}); 
    console.log(serviceProviderId[0])
    const slotCapacity = serviceProvider.slotCapacity || 6; // Default fallback if capacity not set

    // Step 3: Check if adding this booking exceeds capacity
    if (totalBooked + Number(noOfPersons) > slotCapacity) {
      return res.status(409).send({ message: "Slot capacity exceeded. Please choose another slot or reduce persons." });
    }

    // Step 4: Save appointment
    const appointment = new appointmentSchema({
      serviceId,
      serviceProviderId,
      userId,
      name,
      contactNo: C_no,
      address,
      date,
      timeSlot: timeslot,
      noOfPersons,
      status: "UpComing"
    });

    const savedAppointment = await appointment.save();

    // Step 5: Create notification
    const populatedAppointment = await appointmentSchema.findById(savedAppointment._id).populate("serviceId", { serviceName: 1 });

    const notification = new NotificationSchema({
      serviceProviderId,
      userId,
      Notification: `Someone just booked the ${populatedAppointment.serviceId.serviceName} appointment on ${date} at ${timeslot}`
    });
    await notification.save();

    return res.status(200).send({
      message: `Your appointment is scheduled on: ${savedAppointment.date} ${savedAppointment.timeSlot}`
    });

  } catch (err) {
    console.error(err);
    return res.status(500).send({ message: "Something went wrong!" });
  }
});



//Give all the appointments related to the user
router.get('/getmyappointments',authenticate,async(req,res)=>{
   await appointmentSchema.find({userId:req.user_id})
   .populate('serviceProviderId',{B_name:1})
   .populate('serviceId',{serviceName:1,serviceDuration:1})
   .then(docs=>{
         if(docs.length!=0){
             res.send(docs)
         }
         else{
            res.status(404).send({message:"No Appointments Found"})
         }
   })
   .catch(err=>{
        throw new Error(err)
   })


router.delete('/cancelAppointment/:id',authenticate,async(req,res)=>{
        await appointmentSchema.findByIdAndUpdate(req.params.id,{status:"Cancelled By User"})
        .then(doc=>{
            res.status(202).send({message:"Appointment is cancelled successfully"})
        })
        .catch(err=>{
            res.status(500).send({message:"Database Error"})
            throw new Error(err)
        })

        appointmentSchema.findById(req.params.id).populate("serviceProviderId",{_id:1})
        .populate("serviceId",{serviceName:1})
        .then((docs)=>{
            const notification= new NotificationSchema({
                    serviceProviderId:docs.serviceProviderId[0]._id,
                    userId:req.user_id,
                    Notification:`Someone just Cancelled the ${docs.serviceId[0].serviceName} on ${docs.date} the time is ${docs.timeSlot}`
            })
            notification.save()
        })
      

})
    
})
module.exports=router;