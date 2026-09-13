const mongoose = require('mongoose')

console.log("Connecting to DB...")

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
})
.catch(err => console.log(err));