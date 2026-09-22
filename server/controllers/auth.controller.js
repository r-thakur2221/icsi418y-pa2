const router=require('express').Router();

router.route("/")
    .get((req,res,next)=>{
        console.log(res.json({msg:"Empty Url from auth",method:res.method}))
    })
    .post((req,res,next)=>{
    })

router.route("/login")
    .get((req,res,next)=>{
        console.log(res.json({msg:"Login Url from auth",method:res.method}));
    })
    .post((req,res,next)=>{
        
    })
    .put((req,res,next)=>{
        
    })
    .delete((req,res,next)=>{
        
    })
    

module.exports=router;