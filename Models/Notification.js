const mongoose=require('mongoose')

const Notification=mongoose.Schema({
    serviceProviderId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"serviceProvider"
    }],
    userId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users"
    }],
    Notification:{
        type:String,
        require:true
    }
    ,
    Date:{
        type:Date,
        default:Date.now()
    }
})

module.exports=mongoose.model("Notification",Notification)