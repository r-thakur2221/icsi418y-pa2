const express=require('express');
const app=express();

const cors=require('cors');

//just run db as a part of this program to establish db connection
require('./db.js');

const authRouter=require("./controllers/auth.controller.js");
const userRouter=require("./controllers/user.controller.js");


//third-party middleware
app.use(cors());
//json body parser
app.use(express.json());

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

//Error handling middleware >>> middleware with 4 arguments, calling next with args triggers error handling middleware.
app.use((err, req, res, next) => {
    res
    .status(err.status || 500)
    .json({
      success: false,
      msg: err.msg || err.message || "Server error",
      status: err.status || 500,
    });
  });

app.listen(8080,(err)=>{
    if(err){
        console.log("Server Error: ",err);
    }
    else{
        console.log("Successfully Connected at Port 8080");
    }
})


