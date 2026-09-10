const express = require('express')
require('dotenv').config
require('./db/connection')
const morgan = require('morgan')
const cors = require('cors')
const app = express()

app.use(morgan('dev'))
app.use(cors())

const PORT = process.env.PORT || 5000
app.listen(PORT, ()=> {
    console.log(`Server is running on port ${PORT}`)
})