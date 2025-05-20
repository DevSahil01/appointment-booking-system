const express=require('express')
const path=require('path')
const router=require('./Routes/Service_provider/routes')
const userrouter=require('./Routes/user_Routes/userRoute');
const appointmentRouter=require('./Routes/user_Routes/appointment')
const userschema=require('./Models/users')
const moment=require('moment')
const cors=require('cors')
const app=express()
const bodyparser=require('body-parser')
const mongoose=require('mongoose')
const port=4000
const sp_credentials=require('./Models/databaseSchema')
require('./databaseConnection')
const session=require('express-session');
app.use(session({
    secret:'service provider',
    resave:false,
    saveUninitialized:true,
    cookie:{secure:false,}
}))
const cookieParser = require('cookie-parser');

app.use(cookieParser());

// const whitelist = ["http://localhost:3000"]
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || whitelist.indexOf(origin) !== -1) {
//       callback(null, true)
//     } else {
//       callback(new Error("Not allowed by CORS"))
//     }
//   },
//   credentials: true,
// }
// app.use(cors(corsOptions))

// //End here
app.use(cors())



//This is for the View engine that our app is going to use
app.set('view engine','ejs')
app.set('views','views')

//This is for the router that is declared for the service provider
app.use(router)

//This is for the router that is declared for the user 
app.use("/api/user",userrouter);
app.use("/api/appointments",appointmentRouter)

//This is to parse the data from the client
app.use(bodyparser.urlencoded({extended:true}))
//to serve static files at the client side
app.use(express.static(__dirname));
app.use(express.static('views/Admin_views'))
app.use(express.static('views/service_provider'))



//request Handling
app.get('/admin_login',function(req,res){
    res.sendFile(path.join(__dirname,'/views/Admin_views/Admin_login.html'))  
})
app.get('/admin_page',function(req,res){
    res.render('Admin_views/partials/admin_page')
})
app.get('/add_sp',function(req,res){
    res.render('Admin_views/add_sp',{ack:''})
})
app.post('/add_sp',function(req,res){
    console.log(req.body)
   const sp_credential=new sp_credentials({
            email:req.body.email,
            password:req.body.password
   })
   sp_credential.save((err,doc)=>{
    if(!err){
        res.render('Admin_views/add_sp',{ack:`Service Provider Registered Successfully!`})
     }
    else{
        res.send('the data is inserted')
    }
   })
})
//service provider info endpoint
app.get('/view_sp',function(req,res){
    sp_credentials.find({},function(err,service_providers)
    {
       if(err){
            console.log(err)
       }
       else{
          res.render('Admin_views/sp',{sp:service_providers})
       }
    })
})


app.listen(port,()=>{
    console.log("app run successullly on the server")
})
