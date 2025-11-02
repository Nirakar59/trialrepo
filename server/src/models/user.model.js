import mongoose from "mongoose"
const userSchema = mongoose.Schema(
  {
     username: {
      type: String,
      unique: true,
      sparse: true // Allows null/undefined values while enforcing uniqueness
    },
    fullname: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    socketId:String,
    password: {
      type: String,
      required: true,
      minLength:8
    },
    verifyOtp: {
      type: String,
      default: '',
    },
    verifyOtpExpireAT: {
      type: Number,
      default: 0,
    },
    isAccountVerified: {
      type: Boolean,
      default: false,
    },
    reSetOtp: {
      type: String,
      default: '',
    },
    reSetOtpExpireAT: {
      type: Number,
      default: 0,
    },
    profilePics: {
      type: String,
      default:''
    },
    cover_photo:{
      type:String,
      default:'',
    },
    bio:{
      type:String,
      maxlength: 200,
      default:'',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    location:{
      type:String,
      maxlength: 200,
      default:'',
    },
    followers:[{
      type:mongoose.Schema.Types.ObjectId,
      default:[],
      ref:"User"  
    }],
    following:[{
      type:mongoose.Schema.Types.ObjectId,
      default:[],
      ref:"User"
    }],
    connections:[{
      type:mongoose.Schema.Types.ObjectId,
      default:[],
      ref:"User"
    }],
    connectionRequests:[{
      type:mongoose.Schema.Types.ObjectId,
      default:[],
      ref:"User"
    }],
  },
  {
    timestamps: true,
  }
);
const User=mongoose.model("User",userSchema)

export default User