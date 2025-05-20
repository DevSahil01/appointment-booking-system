const mongoose=require('mongoose');
const sp_credentials=mongoose.Schema({
    email:String,
    password:String,
    data:{type:Date,default:Date.now},
    setup:{
        type:Boolean,
        default:false
    }
});
module.exports=mongoose.model("Service_provider",sp_credentials);