const express=require('express')
const moment=require('moment')
const router=express.Router();
const authenticate=require('../../Middleware/authenticate')
const serviceSchema=require('../../Models/serviceSchema')
const appointmentSchema=require('../../Models/Appointment')
const bodyparser=require('body-parser');
const NotificationSchema=require('../../Models/Notification')
router.use(bodyparser.urlencoded({extended:true}));
router.use(bodyparser.json())

router.get('/services/:id/:date',authenticate,async (req,res)=>{

    const timeslots=await serviceSchema.findById(req.params.id
        ,{serviceTimeslots:1,serviceProvideId:1,serviceCharges:1}) 

    //got the occupied timslots
    const occupiedTimeslot=await appointmentSchema.find({serviceId:req.params.id,status:"UpComing",date:req.params.date},{timeSlot:1,date:1,_id:0})

    //Final timeslot after filtering occupied timeslots
    const finalTimeslot=[]
    function checkOccupied(timeSlot){
        let flag=false
        if(occupiedTimeslot.length!=0){
            occupiedTimeslot.map((doc)=>{
               if(doc.timeSlot==timeSlot){
                  flag=true
               }   
            })
         }
          return flag
        }

    for(let i=0;i<timeslots.serviceTimeslots.length;i++){
         //only if occupied timeslot is not empty
        if(checkOccupied(timeslots.serviceTimeslots[i])==false){
            finalTimeslot.push(timeslots.serviceTimeslots[i])
        }
    }
 
    res.send({data:{
               timeslot:finalTimeslot,
               user:{
                name:req.user,
                id:req.user_id
             },
             spId:timeslots.serviceProvideId,
             serviceCharges:timeslots.serviceCharges}})
})


router.post('/bookAppointment',authenticate,async(req,res)=>{
        appointmentSchema.find({userId:req.user_id,serviceId:req.body.serviceId,timeSlot:req.body.timeslot,date:req.body.date})
            .then(async docs=>{
                if(docs.length!=0){
                    res.status(409).send({message:"appointment is already scheduled"})
                }
                else{
                // register appointment starts here
                const appointment=new appointmentSchema({
                    serviceId:req.body.serviceId,
                    serviceProviderId:req.body.serviceProviderId,
                    userId:req.user_id,
                    name:req.body.name,
                    contactNo:req.body.C_no,
                    address:req.body.address,
                    date:req.body.date,
                    timeSlot:req.body.timeslot,
                    status:"UpComing"
                })
                await appointment.save((err,docs)=>{
                    if(err){
                        res.status(504).send({message:"Something went wrong !"})
                    }
                    else{
                        console.log(docs)
                        appointmentSchema.findById(docs._id,{serviceId:1})
                        .populate("serviceId",{serviceName:1})
                        .then(docs=>{
                            console.log()
                            console.log(req.body.serviceId)
                            //push Notification to database

                             const notification= new NotificationSchema({
                            serviceProviderId:req.body.serviceProviderId,
                            userId:req.user_id,
                            Notification:`Someone just Booked the ${docs.serviceId[0].serviceName} Appointment on ${req.body.date} the time is ${req.body.timeslot}`
                           })
                            notification.save()

                        })
                      
                        res.status(200).send({message:"Your appointment is scheduled on:"+docs.date+" "+docs.timeSlot+"pm"})
                    }
                })
                //ends here
            }
            //else ends above
})

             

})


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