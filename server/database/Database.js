const mongoose = require ('mongoose');


const connectDB = async () => {
try{
    mongoose.connect(process.env.connectDB)
    console.log('database connected to the port')
}

catch(err){
    console.log(err.message)
}
}

module.exports = connectDB