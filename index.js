const express = require('express')
require('dotenv').config()
require('./db/connection')
const morgan = require('morgan') 
const cors = require('cors')

const ProductRouter = require('./routes/productRoute')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'))
app.use(cors())

const PORT = process.env.PORT
app.use('/api', ProductRouter)

app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`)
})