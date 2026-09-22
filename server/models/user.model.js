const mongoose=require("mongoose");
const Schema=mongoose.Schema;

const UserSchema=new Schema({
    //database Schema modeling
    f_name:   { type: String, required: true, trim: true },
    l_name:   { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }

})


const UserModel=mongoose.model('user',UserSchema);
module.exports =UserModel;
