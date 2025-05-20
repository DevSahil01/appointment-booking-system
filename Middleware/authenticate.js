const jwt=require('jsonwebtoken');
const User=require('../Models/users')

const authenticate=async (req,res,next)=>{
    try{
        const token=req.cookies.accesstoken
        const verifyToken=jwt.verify(token,"SecretKey")
        const user=await User.findById(verifyToken.id)
        if(!user){throw new Error("user not found")}

        req.token=token
        req.user=user.name
        req.user_id=user._id

        next()
    }
    catch(err){
        res.status(401).send({message:"you are not authenticated user"})
    }

}

module.exports=authenticate