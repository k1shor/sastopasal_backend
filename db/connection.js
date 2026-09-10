const mongoose = require('mongoose')

mongoose.connect(process.env.mongoURI)
    .then(() => console.log("DATABASE CONNECTED SUCCESSFULLY"))
    .catch(error => console.log(error))