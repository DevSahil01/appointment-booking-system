const express=require('express')
const router=express.Router();
const jwt=require('jsonwebtoken')
const bcrypt=require('bcryptjs')
const userSchema=require('../../Models/users');
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
router.get("/get_sp",async (req,res)=>{
     var data= await (service_provider.find({}))
     res.send({data:data})
})
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

router.get('/clearCookies',authenticate,(req,res)=>{
        res.clearCookie('accesstoken')
        res.status(200).send("Cookies Cleared")
})
module.exports=router;