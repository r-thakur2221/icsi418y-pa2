const express=require('express');
const app=express();


//routing level middleware
const authRouter=require("./controllers/auth.controller.js");
const userRouter=require("./controllers/user.controller.js");

//use routing level middleware
app.use("/auth",authRouter);
app.use("/user",userRouter);

//404 catch block
app.use((req,res,next)=>{
    next({
        msg:"Page Not Found",
        status:404
    })
})

//Error handling middleware >>> middleware with 4 arguments, calling next with args triggers error ahndling middleware.
app.use((err,req,res,next)=>{
    res.json({
        msg:err.msg || err,
        status:err.status() || 400
    })
})

app.listen(8080,(err,done)=>{
    if(err){
        console.log("Error: ",err);
    }
    else{
        console.log("Successfully Connected at Port 8080");
    }
})


