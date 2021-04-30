const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique:true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    dob :{
        type: String,
        default:""
    },
    address: {
        type:{
            type:String,
            enum: ['Point']
        },
        coordinates:{
            type: [Number],
            default: [0, 0],
            index: '2dsphere'
        }
    },
    description: { 
        type: String
    },
    followers:[
        {
            type:ObjectId,
            ref:"User"
        }
    ],
    following:[
        {
            type:ObjectId,
            ref:"User"
        }
    ],
    createdDate: {
        type: Date,
        default: Date.now
    },
    upatedDate: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('User', userSchema)
