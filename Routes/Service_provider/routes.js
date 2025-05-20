const express=require('express');
const multer=require('multer');
const moment=require('moment')
const sp_schema=require('../../Models/Service_provider_schema');
const services=require('../../Models/serviceSchema');
const router=express.Router();
const path=require('path');
const session=require('express-session');
var fs=require('fs');
// require('dotenv/config');
const bodyparser=require('body-parser');
router.use(bodyparser.urlencoded({extended:true}));
const database=require('../../Models/databaseSchema')
const httpProxy = require('http-proxy');
const serviceSchema = require('../../Models/serviceSchema');
const proxy = httpProxy.createServer({});

//jwt 
const jwt=require('jsonwebtoken')
//sp_authentication
const sp_authentication=require('../../Middleware/sp_Authentication');
const appointmentSchema= require('../../Models/Appointment');
const Service_provider_schema = require('../../Models/Service_provider_schema');
const NotificationSchema = require('../../Models/Notification');

router.get('/sp_login',function(req,res){
    res.render('service_provider/login',{error:''})
})
router.post('/api/spLogin',function(req,res){
    database.findOne({email:req.body.email,password:req.body.password})
    .then(docs=>{
        if(docs!=null){
            const serviceProviderToken=jwt.sign({id:docs._id},"AnotherSecretKey")
            res.cookie("ServiceProviderToken",serviceProviderToken,{
                                    expires:new Date(Date.now()+25892000000),   
                                    httpOnly:true
                              })
           if(docs.setup==true){
              res.redirect("http://localhost:3000/panel")
              
           }
           else{
              res.status(201).send("setup not done")
           }
        }
        else{
            res.status(404).send("invalid Credentials")
        }
    })
})



//storage multer
const Storage=multer.diskStorage({
    destination:'uploads/service_provider',
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"-"+Date.now()+file.originalname)
    },
})
const upload=multer({ storage:Storage })
var multipleUpload=upload.fields([{name:'B_Images',maxCount:10},{name:'B_pimage',maxCount:1}])
 
router.get('/api/setup',(req,res)=>{
    if(req.session.loggedIn==true){
        let Setup
        database.findById(req.session.spId,(err,doc)=>{
            if(err){
                console.log(err)
            }
            else{
                Setup=doc.setup
            }
        })
        res.json({
            logSession:req.session.loggedIn,
            sessionId:req.session.spId,
            setup:Setup
        })
    }
    else{
        console.log('you are not logged in yet')
    }
  
})
router.post('/api/setup',multipleUpload,sp_authentication,(req,res)=>{
           console.log(req.files)
           const files=req.files
           let imgArray=files.B_Images.map(file=>{
                let img=fs.readFileSync(file.path)
                return encodedImg=img.toString('base64')
           })
           let final_img=imgArray.map((src,index)=>{
                return f_img={
                    data:src,
                    contentType:files.B_Images[index].mimetype,
                    Filename:files.B_Images[index].originalname
                }
           })
           

            const sp_info=new sp_schema({
                B_name:req.body.B_name,
                B_address:req.body.B_address,
                B_contact_email:req.body.B_contact_email,
                B_contact_no:req.body.B_contact_no,
                B_Images:final_img,
                B_pimage:{
                    data:fs.readFileSync(files.B_pimage[0].path).toString('base64'),
                    contentType:'image/jpg',
                    Filename:files.B_pimage[0].filename
                },
                owner_name:req.body.owner_name,
                owner_address:req.body.owner_address,
                owner_contact_email:req.body.owner_contact_email,
                owner_contact_no:req.body.owner_contact_No,
                service_cat:req.body.service_cat,
                service_desc:req.body.service_desc,
                CredentialId:req.id
            })
            sp_info.save((err,doc)=>{
                if(err){
                    console.log(err)
                }
                else{
                    database.findByIdAndUpdate(req.id,{setup:true},(err,doc)=>{
                        if(err){
                            console.log(err)
                        }
                        else{
                            console.log('document is updated',doc)
                        }
                    })
                    res.redirect('http://localhost:3000/panel')
                }
             }) 
       
})

router.get('/api/profile',sp_authentication,async (req,res)=>{
    await sp_schema.findOne({CredentialId:req.id})
    .then(docs=>{
       if(docs!=null){
          res.send(docs)
       }
       else{
          res.status(404).send({message:"No Data Found"})
       }
    })
    .catch(err=>{
         res.send(500).send("Database Error")
        throw new Error(err)
    })
})

router.get('/api/panel',sp_authentication,async (req,res)=>{
    await  sp_schema.findOne({CredentialId:req.id},{B_name:1,B_pimage:1})
    .then(docs=>{
        res.send(docs)
    })
    .catch(err=>{
        res.status(500).send("Database Error")
        throw new Error(err)
    })
})

//endpoint to register the services 
const Storage2=multer.diskStorage({
    destination:'uploads/service_provider/Services',
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"-"+Date.now()+file.originalname)
    },
})
const upload2=multer({storage:Storage2})
const uploadFile=upload2.single('serviceImage')

router.post('/api/services',uploadFile,sp_authentication,async(req,res)=>{
            const spId=await sp_schema.findOne({CredentialId:req.id})
            if(!req.file){
                console.error('please upload a file');
                res.status(400).send('message:please upload a file')
            }
            else{
                // res.status(201).send('message:service is added')
                const starttime=moment().utc().set({hour:8 ,minute:00})
                const endTime=moment().utc().set({hour:20,minute:00})
                
                var timeslots=[]

                while(starttime <= endTime){
                    timeslots.push(new moment(starttime).format("HH:mm"))
                    starttime.add(req.body.duration,"minutes")
                }
                console.log(timeslots)
                const Services = new services({
                    serviceProvideId:spId,
                    serviceName:req.body.serviceName,
                    serviceDuration:req.body.duration,
                    serviceTimeslots:timeslots,
                    serviceImage:{
                        data:fs.readFileSync(req.file.path).toString('base64'),
                        contentType:'image/jpg',
                        Filename:req.file.filename
                    },
                    serviceDesc:req.body.serviceDesc,
                    serviceCharges:req.body.serviceCharges
                })
                await Services.save((doc,err)=>{
                    if(err){
                        console.log(err)
                    }
                    else{
                       console.log(doc)
                       console.log('Service provider added successfully')
                    }
                })
                res.status(201).send('message:service is added')
            }
   
})

//get services data
router.get('/api/services',sp_authentication,async (req,res)=>{
    const spId=await sp_schema.findOne({CredentialId:req.id},{_id:1})
    
    await serviceSchema.find({serviceProvideId:spId})
    .then(docs=>{
        // console.log(docs)
        res.send(docs)
    })
    .catch(err=>{
        res.status(500).send("Database Error")
        throw new Error(err)
    })
})


//endpoint to remove the service 
router.delete('/api/services/:id',async (req,res)=>{
   try{
   await serviceSchema.findByIdAndRemove(req.params.id,(err,docs)=>{
    if(err){
        console.log(err)
    }
    else{
        res.status(204).send('message:Service is Deleted successfully')
    }
   })
   }
   catch(e){
    console.log(e)
   }
})


router.get('/api/getAppointments',sp_authentication,async(req,res)=>{
     let spId=await sp_schema.findOne({CredentialId:req.id},{_id:1})
     console.log(spId)
     await appointmentSchema.find({serviceProviderId:spId})
     .populate("serviceId",{serviceName:1})
     .then(docs=>{
        console.log(docs)
        res.send(docs)
     })
     .catch(err=>{
        throw new Error(err)
     })

})


router.get('/api/getMyActivities',sp_authentication,async (req,res)=>{
    let spId=await sp_schema.findOne({CredentialId:req.id},{_id:1})
     console.log(spId)
  NotificationSchema.find({serviceProviderId:spId})
  .then(docs=>{
     res.send(docs)
  })
})


//get service info while updating the services
router.get('/api/getServiceInfo/:id',sp_authentication,(req,res)=>{
      serviceSchema.findById(req.params.id)
      .then(docs=>{
            res.send(docs)
      })
      .catch(err=>{
          throw new Error(err)
          res.status(500).send({message:"Database Error"})
      })
})



router.post('/api/updateService/:id',sp_authentication,(req,res)=>{
    serviceSchema.findByIdAndUpdate(req.params.id,{
        serviceName:req.body.serviceName,
        serviceDuration:req.body.serviceDuration,
        serviceDesc:req.body.serviceDesc
    })
    .then(()=>{
        res.status(200)
    })
    .catch(err=>{
        console.log(err)
    })
})

router.get('/api/updateStatus/:id',sp_authentication,(req,res)=>{
    appointmentSchema.findByIdAndUpdate(req.params.id,{
        status:"Attended"
    })
    .then(
        res.status(200).send({message:"upadated successfully"})
    )
})


router.post('/api/updateImage/:id',uploadFile,sp_authentication,(req,res)=>{
        serviceSchema.findByIdAndUpdate(req.params.id,{
            serviceImage:{
                    data:fs.readFileSync(req.file.path).toString('base64'),
                    contentType:'image/jpg',
                    Filename:req.file.filename
            }
        })
        .then(docs=>{
            res.status(200).send({message:'Image Updated'})
        })
})

router.post('/api/updateProfile',sp_authentication,(req,res)=>{
    sp_schema.findByIdAndUpdate(req.id,{
        B_name:req.body.B_name,
        B_address:req.body.B_address,
        B_contact_email:req.body.B_contact_email,
        B_contact_no:req.body.B_contact_no,
        owner_name:req.body.owner_name,
        owner_address:req.body.owner_address,
        owner_contact_email:req.body.owner_contact_email,
        owner_contact_no:req.body.owner_contact_no,
        service_desc:req.body.service_desc
    })
    .then(docs=>{
        res.status(200).send("Profile Updated Successfully")
    })
    .catch(err=>{
        console.log(err)
    })
})





router.get('/api/clearCookies',sp_authentication,(req,res)=>{
    res.clearCookie('ServiceProviderToken')
    res.send("cookies cleared")
})



module.exports=router;