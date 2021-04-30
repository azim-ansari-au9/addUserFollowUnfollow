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
            let {name, email, password, address,dob,description,lat,lng} = req.body
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
                        description:description
                    }
                    let user = new User(userObj);
                    user.save((err,result)=>{
                        if(err) {
                            return res.status(500).json({code:500, message:"Internal server error ",err})
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
                    
                    return res.status(200).json({code:200, message:"User Logged in Successfully",userData:user, token})
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
                return res.status(200).json({code:200, message:"User details Here !!", userData:user})
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
    nearestAllUser : async(req, res)=>{
        const currentUserId = req.user.id;
        let latitude = parseInt(req.query.lat);
        let longitude = parseInt(req.query.lng);
        var match = {"_id":{"$ne":mongoose.Types.ObjectId(currentUserId)}}
        let aggr = [
            {
                $geoNear:
                {
                    near: {
                        type: "Point", coordinates: [longitude, latitude]
                    },
                    distanceField: "distance",
                    distanceMultiplier: 0.000621371,
                    spherical: true
                },
            },
            { $match: match},
            { $project: { _id: 1, userId: "$_id", name: 1, description: 1, email: 1, dob: 1, distance: 1, followers:1, following:1, address:1 } },
            { $sort: { distance: 1 } }
        ];

        User.aggregate(aggr).exec((err, data)=>{
            console.log(data,">>>>>>>")
            if(err){
                return res.status(400).json({code:400,message:"Internal server error"})
            }
            data.map(function(user){
                user.distance = parseInt(user.distance)
            })
            return res.status(200).json({code :200, message:"successfully fetched nearest user", data})
        })
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
                data.save((err, result) => {
                    if(err) {
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
    addAddress: async(req, res) => {
        try {
            const { lat, lng } = req.body;
            const userData = User.findOne({ _id: req.user.id }, { _id: 1, name: 1, address: 1})
            userData.exec((err, user) => {
                if (err || !user) {
                    return res.status(404).json({code:404, message:"Internal server error"})
                }
                user.address = {
                    type: "Point",
                    coordinates: [lng, lat]
                };
                user.save()
                    .then(result => {
                        // var resss = { userData: result }
                        return res.status(200).json({code:200, message:"User details updated successfully",addressData:result});
                    })
            })
        } catch (err) {
            res.status(500).json({code:500, message:"Server error ", err});  
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
            if(!result){
                return res.status(404).json({code:404, message:"User Not found"})
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