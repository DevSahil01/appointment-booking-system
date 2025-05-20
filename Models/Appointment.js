const mongoose=require('mongoose')

const Appointment=mongoose.Schema({
    serviceId:[{
        type:mongoose.Types.ObjectId,
        ref:"Services"
    }],
    serviceProviderId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"serviceProvider"
    }],
    userId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    }],
    name:{
        type:String,
        require:true
    },
    contactNo:{
        type:Number,
        require:true
    },
    address:{
        type:String,
        require:true
    },
    date:{
        type:String,
        require:true
    },
    timeSlot:{
        type:String,
        require:true
    },
    status:{
        type:String
    }
})

module.exports=mongoose.model("Appointments",Appointment)