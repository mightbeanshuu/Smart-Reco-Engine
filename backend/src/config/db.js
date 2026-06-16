import mongoose from 'mongoose';

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB connected successfully");
    } catch (error) {
        console.log("DB connection failed");
        console.error(error.message);
        process.exit(1)                         //this process shuts down the nodejs process immediately
        //i.e. here 1 -> means exit with an error and 0 means everything went fine so exit successfully
    }
};

export default dbConnect;