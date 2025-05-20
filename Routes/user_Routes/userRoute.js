const express=require('express')
const router=express.Router();
const jwt=require('jsonwebtoken')
const bcrypt=require('bcryptjs')
const userSchema=require('../../Models/users');
const Appointment=require('../../Models/Appointment')
const Review = require('../../Models/reviewSchema')
const service_provider=require('../../Models/Service_provider_schema')
const serviceSchema=require('../../Models/serviceSchema')
const httpProxy = require('http-proxy');
const bodyparser=require('body-parser');
const authenticate = require('../../Middleware/authenticate');
router.use(bodyparser.urlencoded({extended:true}));
router.use(bodyparser.json())
const proxy = httpProxy.createServer({});


//function to hash the password 
const securepassword=(password)=>{
        var salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(password, salt);      
        return hash
}
//Route for user Registration 
router.post('/register',(req,res)=>{
        console.log(req.body)
        userSchema.findOne({email:req.body.email},function(err,docs){
        if(docs!=null){
                res.status(409).send({message:"email already exists"})
        }
        else{   
               
                const userInfo=new userSchema({
                        name:req.body.name,
                        email:req.body.email,
                        password:securepassword(req.body.password)
                })
                userInfo.save()
                res.status(200).send({message:"User Is Created"})
        }
      })
})      

//User router for login 
router.post('/login',(req,res)=>{
      userSchema.findOne({email:req.body.email},(err,docs)=>{
        if(err){
                console.log(err)
        }
        else if(docs){ 
          var comparepass=bcrypt.compareSync(req.body.password,docs.password); 
          const accessToken=jwt.sign({id:docs._id,username:docs.name},"SecretKey")
          res.cookie("accesstoken",accessToken,{
                expires:new Date(Date.now()+25892000000),   
                httpOnly:true
          })
          if(comparepass==true){
                res.status(200).send(docs)
                console.log(docs)
          }
          else{
                res.status(401).send({message:"wrong credentials"})
          }
        }
        else{
                res.status(404).send("wrong Credentials")
        }
      })
})


//For Home page Content
router.get("/get_sp", async (req, res) => {
 
  const { lat, lng } = req.query;
 

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and longitude required in query params." });
  }

  try {
    const data = await service_provider.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 100000
        }
      }
    });
    console.log(data)

    res.json({ data });
  } catch (err) {
    console.error("Error fetching nearby service providers:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get('/getSer',async(req,res)=>{
        serviceSchema.find({},{serviceName:1,serviceDescription:1,serviceProvideId:1,serviceImage:1,serviceDuration:1})
        .populate('serviceProvideId',{B_name:1,B_address:1,B_pimage:1})
        .then(docs=>{
                res.send(docs)
        })
})

//To show the service Provider Information on the home page(but only particular one)
router.get('/get_sp/:id',async (req,res)=>{
       const data= await service_provider.findById(req.params.id)
        res.send({data:data})
})

//to show the services on profile page of that one particular service Provider
router.get('/get_services/:id',async (req,res)=>{
        const serviceData=await serviceSchema.find({
                serviceProvideId:req.params.id
                })
        if(serviceData.length!=0){
                res.send({data:serviceData})
        }
        else{
                res.status(404).send({message:"No services found"})
        }
})

router.get('/search/:by/:inParam',async (req,res)=>{
      if(req.params.by == "BYSP"){
        service_provider.find({B_name:{'$regex':req.params.inParam,'$options' : 'i' }},{B_name:1,B_address:1,service_cat:1,B_pimage:1})
        .then(docs=>{
                res.send(docs)
        })
      }
      else if(req.params.by == "BYSER"){
        serviceSchema.find({serviceName:{'$regex':req.params.inParam,'$options' : 'i' }},{serviceName:1,serviceImage:1,serviceProvideId:1,serviceCharges:1})
        .populate('serviceProvideId',{B_name:1})
        .then(docs=>{
               console.log(docs)
               res.send(docs)
        })
      }
})



router.get('/category/:cat', async (req, res) => {
        const { cat } = req.params;

        try {
        const providers = await service_provider.find({ service_cat: cat });
        res.status(200).json(providers);
        } catch (error) {
        console.error('Error fetching providers:', error);
        res.status(500).json({ error: 'Server Error' });
        }
});




router.get('/clearCookies',authenticate,(req,res)=>{
        res.clearCookie('accesstoken')
        res.status(200).send("Cookies Cleared")
})



router.post('/review/:serviceId', authenticate, async (req, res) => {
  const {rating, text } = req.body;
  const {serviceId}= req.params;
  const userId = req.user_id;
  console.log(serviceId)
  console.log(userId)

  try {
    // Check for completed appointment
    const appointment = await Appointment.findOne({
     userId: userId,
      serviceProviderId:serviceId,
      status: 'Attended'
    });
    console.log(appointment)

    if (!appointment) {
      return res.status(403).json({ message: 'You can only review services after completion.' });
    }

    // Optional: prevent duplicate review
    const alreadyReviewed = await Review.findOne({ userId, serviceId });
    if (alreadyReviewed) {
      return res.status(409).json({ message: 'You already reviewed this service.' });
    }

    const review = new Review({ serviceId, userId, rating, text });
    await review.save();

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/review/:serviceId', async (req, res) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.serviceId })
      .populate('userId', 'name avatar') // populate name and avatar
      .sort({ createdAt: -1 });

    const total = reviews.length;
    const breakdown = [1, 2, 3, 4, 5].reduce((acc, val) => {
      acc[val] = reviews.filter(r => r.rating === val).length;
      return acc;
    }, {});

    const avgRating = total ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : 0;

    res.json({
      rating: avgRating,
      total,
      breakdown,
      userReviews: reviews.map(r => ({
        name: r.userId.name,
        avatar: r.userId.avatar,
        rating: r.rating,
        text: r.text,
        date: r.createdAt.toDateString()
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});




module.exports=router;