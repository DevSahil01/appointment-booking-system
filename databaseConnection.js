const mongoose=require('mongoose')

const mongoDb=mongoose.connect(
    "mongodb://localhost:27017/",{
        dbName:"Appointment_booking_system",
        useNewUrlParser:true,
        useUnifiedTopology:true
    })
module.exports=mongoDb