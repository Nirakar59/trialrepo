import mongooes from "mongoose"
export const connectDb = async()=>{
    try {
        const conn = await mongooes.connect(process.env.MONGODB_URI);
        console.log("MongoDb connected on: ",conn.connection.host);
    } catch (error) {
        console.log("Db connection errror: ", error.message);
        
    }
}
