const ProductModel = require('../models/productModel')
const cloudinary = require('../config/cloudinary')
const fs = require('fs')

//To add product
exports.addProduct = async (req, res) => {
    try {
        if(!req.file){
            return res.status(400).json({error: "File is required"})
        }
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path)

        // Cloudinary image URL
        const imageUrl = result.secure_url

        // Delete local image after uploading to Cloudinary
        fs.unlinkSync(req.file.path)

        let newProduct = await ProductModel.create({
            product_name: req.body.product_name,
            product_description: req.body.product_description,
            product_image: imageUrl,
            product_brand: req.body.product_brand,
            product_price: req.body.product_price,
            category: req.body.category,
            subCategory: req.body,subCategory,
            count_in_stock: req.body.count_in_stock,
            product_condition: req.body.product_condition,
            product_seller: req.body.product_seller,
            product_status: req.body.product_status,
            rating: req.body.rating,
            usedCondition: req.body.usedCondition,
            productAge: req.body.productAge,
            defects: req.body.defects,
            repairHistory: req.body.repairHistory,
            accessories: req.body.accessories
        })
        if (!newProduct) {
            return res.status(400).json({error:"Something went wrong"})
        }
        res.send(newProduct)
    }catch (error) {
         console.log(error)

        res.status(500).json({
            error: error.message
        })

    }

}

//To list all products
exports.getAllProducts = async (req, res) => {
    let products = await ProductModel.find()
    // .populate('category')
    if(!products){
        return res.status(400).json({error: "SOmething went wrong"})
    }
    res.send(products)
}

// To get products of a particular category
exports.getProductsByCategory = async (req, res) => {
    let products = await ProductModel.find({category: req.params.categoryId})
    if(!products){
        return res.status(400).json({error: "Somethings went wrong"})
    }
    res.send(products)
}

// To get products of a particular sub category
exports.getProductsBySubCategory = async (req, res) => {
    let products = await ProductModel.find({subCategory: req.params.subCategoryId})
    if(!products){
        return res.status(400).json({error: "Somethings went wrong"})
    }
    res.send(products)
}

// To get products by seller
exports.getProductsBySeller = async (req, res) => {
    let products = await ProductModel.find({product_seller: req.params.sellerId})
    if (!products){
        return res.status(400).json({error: "Something went wrong"})
    }
    res.send(products)
}

// To search product
exports.searchProducts = async(req, res) => {
    const keyword = req.query.keyword

    let products = await ProductModel.find({
        product_name: {
            $regex: keyword,
            $options: 'i'
        }
    })

    if(!products){
        return res.status(400).json({error: "Something went wrong"})
    }
    res.send(products)
}

// To update product
exports.updateProduct = async (req, res) => {
    try{
        let productToUpdate = await ProductModel.findById(req.params.id)
        if(!productToUpdate){
            return res.status(400).json({error:"Something went wrong"})
        }

        // Update image if a new image is uploaded
        if (req.file) {

            // Upload new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path)

            // Delete old image from Cloudinary
            if (productToUpdate.product_image) {

                const imageUrl = productToUpdate.product_image

                const publicId = imageUrl
                    .split('/upload/')[1]
                    .split('/')
                    .slice(1)
                    .join('/')
                    .split('.')[0]

                    await cloudinary.uploader.destroy(publicId)
            }
                // Save new Cloudinary URL
                productToUpdate.product_image = result.secure_url

                // Delete temporary local file
                fs.unlinkSync(req.file.path)
        }
        // productToUpdate.product_name = req.body.product_name? req.body.product_name:productToUpdate.product_name or 
        const {product_name, product_description, product_brand, product_price,category,subCategory, count_in_stock,product_condition,product_seller, product_status, rating,usedCondition, productAge, defects, repairHistory, accessories} = req.body

        productToUpdate.product_name = product_name? product_name: productToUpdate.product_name
            
        productToUpdate.product_description = product_description? product_description: productToUpdate.product_description

        productToUpdate.product_brand = product_brand? product_brand: productToUpdate.product_brand

        productToUpdate.product_price = product_price? product_price: productToUpdate.product_price

        productToUpdate.category = category? category: productToUpdate.category

        productToUpdate.subCategory = subCategory? subCategory: productToUpdate.subCategory

        productToUpdate.count_in_stock = count_in_stock? count_in_stock: productToUpdate.count_in_stock

        productToUpdate.product_condition = product_condition? product_condition: productToUpdate.product_condition

        productToUpdate.product_seller = product_seller? product_seller: productToUpdate.product_seller

        productToUpdate.product_status = product_status? product_status: productToUpdate.product_status

        productToUpdate.rating = rating? rating: productToUpdate.rating

        productToUpdate.usedCondition = usedCondition? usedCondition: productToUpdate.usedCondition

        productToUpdate.productAge = productAge? productAge: productToUpdate.productAge

        productToUpdate.defects = defects? defects: productToUpdate.defects

        productToUpdate.repairHistory = repairHistory? repairHistory: productToUpdate.repairHistory

        productToUpdate.accessories = accessories? accessories: productToUpdate.accessories

        productToUpdate = await productToUpdate.save()

        if(!productToUpdate){
            return res.status(400).json({error: "Something went wrong"})
        }
        res.send(productToUpdate)
    }
    catch(error){
        console.log(error)

        res.status(500).json({
            error: error.message
        })
    }
    
}

//To delete product
exports.deleteProduct = (req, res) => {
    ProductModel.findByIdAndDelete(req.params.id)
    .then(async (deletedProduct) => {
        if(!deletedProduct){
            return res.status(400).json({error:"Product not found"})
        }

         // Delete image from Cloudinary
        if (deletedProduct.product_image) {

            const imageUrl = deletedProduct.product_image

            const publicId = imageUrl
                .split('/upload/')[1]
                .split('/')
                .slice(1)
                .join('/')
                .split('.')[0]

            await cloudinary.uploader.destroy(publicId) 
        }
        res.send({deletedProduct, message:"Product deleted successfully"})
    })
    .catch((error)=>{
        res.status.json({error: error.message})
    })
}

// To get product details
exports.getProductDetails = async (req, res) => {
    let product = await ProductModel.findById(req.params.id)
    // .populate('category')
    if(!product){
        return res.status(400).json({error:"Something went wrong"})
    }
    res.send(product)
}

//To get filtered products
exports.getFilteredProducts = async(req, res) =>{
    let filter = {}
    for(var key in req.body){
        if(req.body[key].length > 0){
            if(key == 'category'){
                filter[key] = req.body[key]
            }
            else{
                filter[key] = {
                    '$gte' : req.body[key][0],
                    '$lte' : req.body[key][1]
                }
            }
        }
    }
    let products = await ProductModel.find(filter).populate('category')
    if(!products){
        return res.status(400).json({error: "Something went wrong"})
    }
    res.send(products)
}