const  bcrypt =  require('bcryptjs');
const { check, validationResult }  = require('express-validator');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../schema/userSchema');

module.exports = {
    health : async (req,res) => {
        try {
            res.status(200).json({code:200,message:"Health is okey !! Cool 🤟"});
        } catch (err) {
            res.status(404).json({code:400,message:"Server error 🙏"})
        }
    },
    signup: async(req,res)=>{
        const errors = validationResult(req);
            if (!errors.isEmpty()) {
            return res.status(422).json({code:422, message: 'Parameter missing 😩', errors: errors.array() })
            }
        try {
            let {name, email, password, address,dob,description} = req.body
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            await User.findOne({email:email},(err,user)=>{
                if(err){
                    return res.status(500).json({code:500, message:"Internal server error "})
                }
                else if (!user){
                    userObj = {
                        name: name,
                        email: email,
                        password: hash,
                        dob:dob,
                        address: address,
                        description:description
                    }
                    let user = new User(userObj);
                    user.save((err,result)=>{
                        if(err) {
                            return res.status(500).json({code:500, message:"Internal server error "})
                        } else{
                            return res.status(200).json({code:200, message:"User signup Successfully "})                           
                        }
                    })
                }
                else {
                    return res.status(422).json({code:422,message:"User exist Already "})
                }
            })
        } catch (err) {
            res.status(500).json({code:500, message:"Server error "});
        }
    },

    login : 
    async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                data: {},
                errors: errors.array(),
                message: 'Unable to login',
                code:400
            });
        }
        try {
            const user = await User.findOne({email:req.body.email});
            if(!user){
                res.status(404).json({code:404,message:"User Not Registered"})
            }
            const matchPassword = await bcrypt.compare(req.body.password,user.password);
            if(!matchPassword){
                return res.status(422).json({code:422,message:"Incorrect email or password"})
            }
            const token = jwt.sign(
                { user: { id: user.id } },
                process.env.JWT_SECRET,
                (err, token)=>{
                    if(err){
                        res.status(500).json({code :500,message:"Internal server error"})
                    }
                    var data = {userData:user,token}
                    return res.status(200).json({code:200, message:"User Logged in Successfully", data})
                }
            )
            res.cookie('c',token,{expire: new Date()+ 9999});
        } catch (err) {
            res.status(500).json({code:400, message:"Server error"});           
        }
    },
    userProfile: async(req, res) => {
        try {
            const userId = req.user.id;
            const userData = User.findOne({_id:mongoose.Types.ObjectId(userId)},{name:1, email:1, dob:1,description:1,followers:1,following:1, address:1, createdDate:1})
            userData.exec((err, user)=>{
                if(!user || err){
                    return res.status(400).json({code:400, message:"User not found"})
                }
                var userDetails = {userData:user}
                return res.status(200).json({code:200, message:"User details Here !!", userDetails})
            })
        } catch (err) {
            res.status(500).json({code:500, message:"Server error "}); 
        }
    },
    getAllUsers: async (req, res) => {
        try {
            await User.find().exec((err, data)=> {
                if(err){
                    res.status(400).json({code:400, message:"Internal server Error "})
                }
                return res.status(200).json({code :200, message:"Succesfully fetched ", data})
            })
        } catch (err) {
            // console.log("err",err)
            res.status(500).json({code:500, message:"Server error "});  
        }
    },
    updateUser: async (req, res) => {
        try {
            const userId = req.user.id;
            const {name, dob, description, address} = req.body;
            await User.findOne({_id:mongoose.Types.ObjectId(userId)},{name:1, email:1, dob:1,description:1,address:1,upatedDate:1})
            .exec((err, data)=>{
                if(err) {
                    return res.status(400).json({code:400, message:"Internal error 1 "})
                }
                if(name)
                data.name = name;
                if(dob)
                data.dob = dob;
                if(description)
                data.description = description;
                if(address)
                data.address = address;
                data.save((err, result) => {
                    if(err) {
                        // console.log("object",err )
                        return res.status(400).json({code:400, message:"Internal error 2 "})
                    } else {
                        return res.status(200).json({code:200,message:"Successfully updated user details ", result})
                    }
                })
            })
        } catch (err) {
            res.status(500).json({code:500, message:"Server error "});  
        }
    },

    followUser: async(req, res) =>{
        try {
            if(req.user.id == req.body.followId){
                return res.status(422).json({code:422, message:"You can't follow yourself"})
            }
            await User.findByIdAndUpdate(req.body.followId,{$addToSet:{followers:req.user.id}},{new:true},async (err,result)=>{
            if(err){
                return res.status(422).json({code:422, message:"not processesed"})
            }
            await User.findByIdAndUpdate(req.user.id,{$addToSet:{following:req.body.followId}},{new:true}).then(result=>{
                res.status(200).json({code:200, message:"succesfully followed", result})
            }).catch(err=>{
                return res.status(422).json({error:err})
            })
            })
            
        } catch (err) {
            res.status(500).json({code:500, message:"Server error "}); 
        }
    },
    unFollowUser: async(req, res) =>{
        try {
            if(!req.body.followId){
                return res.status(422).json({code:422, message:"No able to follow"})
            }
            User.findByIdAndUpdate(req.body.followId,{$pull:{followers:req.user.id}},{new:true},async (err,result)=>{
            if(err){
                return res.status(422).json({code:422, message:"Incorrect following id",err})
            }
            await User.findByIdAndUpdate(req.user.id,{$pull:{following:req.body.followId}},{new:true}).then(result=>{
                res.status(200).json({code:200, message:"succesfully unfollowed", result})
            }).catch(err=>{
                return res.status(422).json({code:422, message:"internal server error", err});
            })
            })
            
        } catch (err) {
            res.status(500).json({code:500, message:"Server error "}); 
        }
    },
}