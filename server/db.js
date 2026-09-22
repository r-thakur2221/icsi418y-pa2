const mongoose=require('mongoose');
const dbconfigs=require("./configs/db.config");

const connectionURL=dbconfigs.dbConnectionURL+"/"+dbconfigs.dbName;

mongoose.connect(connectionURL,{useNewParser:true,useUnifiedTopology:true},(err,done)=>{
    if(err){
        console.log("Error in Connecting database");
    }
    else
    {
        console.log("Database connection Successfull");
    }
})

