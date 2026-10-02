require("dotenv").config();
const express = require("express");

require("./config/db")


const CategoryRouter = require('./routes/categoryRoutes');

const app = express();

//middlewares
app.use(express.json());

const PORT = process.env.PORT;

app.use('/api', CategoryRouter);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
