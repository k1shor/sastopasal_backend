const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema


const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        required: true,
        trim: true
    },

    product_description:{
        type: String,
        required: true,
        trim: true
    },

    product_image:{
        type: [String]
    },

    product_brand:{
        type: String,
        required: true,
        trim: true
    },

    product_price:{
        type: Number,
        required: true,
        min: 0
    },

    category: {
        type: ObjectId, 
        ref: "Category"
    },

    subCategory: {
        type: ObjectId, 
        ref: "Category"
    },

    count_in_stock: {
        type: Number,
        required: true, 
        min : 0
    },

    product_condition:{
        type: String,
        enum: ['New', 'Used'],
        required: true
     },

    product_seller:{
        type: ObjectId,
        ref: 'User'
    },

    product_status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },

    rating: {
        type: Number,
        default: 1,
        min: 1,
        max:5
    },

    // Additional fields for Used Products
    usedCondition: {
        type: String,
        enum:['Like New', 'Excellent', 'Good', 'Fair']
    },

    productAge: {
        type: Number,
        min: 0
    },  

    defects: {
        type: String,
        trim: true
    },

    repairHistory: {
        type: String,
        trim: true
    },
    
    accessories: {
        type: String,
        trim: true
    }

},{timestamps: true})
module.exports = mongoose.model("Product", productSchema)