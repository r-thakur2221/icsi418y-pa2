const router=require('express').Router();
const UserModel=require("./../models/user.model");

router.route("/login")
    .post((req,res,next)=>{
        UserModel.findOne({username:req.body.username})
        .then((data)=>{
            res.json(data);
        })
        .catch(err=>{
            next(err);
        })
    })

router.route("/register")
    .post((req,res,next)=>{
        // console.log("req.body >>>>",req.body);
        const newUser=UserModel({});
        newUser.f_name=req.body.f_name;
        newUser.l_name=req.body.l_name;
        newUser.username=req.body.username;
        newUser.password=req.body.password;

        newUser.save((err,data)=>{
            if(err){
                return next(err);
            }
            res.json(data);
        })
    })
    
    

module.exports=router;