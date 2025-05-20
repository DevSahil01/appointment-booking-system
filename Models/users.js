const mongoose=require('mongoose');
const bcrypt=require('bcryptjs')
const userInfo=mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true,
    },
    password:{
        type:String,
        require:true
    },
    data:{
        type:Date,
        default:Date.now()
    }

});

module.exports=mongoose.model("users",userInfo);