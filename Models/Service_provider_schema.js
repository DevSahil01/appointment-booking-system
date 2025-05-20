const mongoose=require('mongoose');
const databaseSchema = require('./databaseSchema');
const sp_info=mongoose.Schema({
    B_name:{
        type:String,
        require:[true,'please provide branch name']
    },
    B_address:{
        type:String,
        require:[true,"please provide branch address"]
    },
    B_contact_email:{
        type:String
    },
    B_contact_no:{
        type:Number
    },
    B_Images:{
        type:Array
    },
    B_pimage:{
        data:String,
        contentType:String,
        Filename:String
    },
    owner_name:{
        type:String,
        require:true
    },
    owner_address:{
        type:String,
        require:true,
    },
    owner_contact_email:{
        type:String
    },
    owner_contact_no:{
        type:Number
    }, 
    service_cat:{
        type:String,
        require:true
    },
    service_desc:{
        type:String,
        require:true
    },
    joinat:{
        type:Date,
        default:Date.now
    },
    CredentialId:mongoose.Types.ObjectId

})

module.exports=mongoose.model('serviceProvider',sp_info)