import mongoose from "mongoose";
 

const callSchema= mongoose.Schema({

    caller:{

        type:mongoose.Schema.Types.ObjectId,
        ref:"User"


    },


    reciver:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    type:{
        type:String,
        enum:[
            'audio',
            'video',
        ],
    },

    status:{
        type:String,
        enum:[
            'initiated',
            'accepted',
            'rejected',   
        ],
        default:'initiated'
    },

    startAt:Date,
    endAt:Date,



},

{timestamps:true}


)
const Call= mongoose.model("Call",callSchema);
export default Call;