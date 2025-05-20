const jwt=require('jsonwebtoken');
const databaseSchema=require('../Models/databaseSchema')

const sp_Authentication=async (req,res,next)=>{
    try{
        const token=req.cookies.ServiceProviderToken
        const verifyToken=jwt.verify(token,"AnotherSecretKey")
        
        const service_provider=await databaseSchema.findById(verifyToken.id)
        if(!service_provider){throw new Error("No Service Provider Registered")}

        req.token=token
        req.id=service_provider._id

        next()
    }
    catch(err){
        res.status(401).send({message:"you are not authenticated user"})
    }

}

module.exports=sp_Authentication