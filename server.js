require("dotenv").config();
const express = require("express");

require("./config/db")


const CategoryRouter = require('./routes/categoryRoutes');
const ProductRouter = require('./routes/productRoute');

const app = express();

//middlewares
app.use(express.json());

const PORT = process.env.PORT;

app.use('/api', CategoryRouter);
app.use('/api', ProductRouter);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
