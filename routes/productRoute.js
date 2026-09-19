const { addProduct, getAllProducts, getProductDetails, getProductsByCategory, updateProduct, deleteProduct, getFilteredProducts, getProductsBySubCategory, getProductsBySeller, searchProducts } = require('../controllers/productController')
const upload = require('../middlewares/fileUpload')
const router = require('express').Router()

router.post('/product', upload.array('product_image', 2), addProduct)
router.get('/product', getAllProducts)
router.get('/product/category/:categoryId', getProductsByCategory)
router.get('/product/subCategory/:subCategoryId', getProductsBySubCategory)
router.get('/product/seller/:sellerId',getProductsBySeller)
router.get('/product/search',searchProducts)
router.put('/product/:id', upload.single('product_image'),updateProduct)
router.delete('/product/:id', deleteProduct)
router.get('/product/:id', getProductDetails)
router.post('/filterproduct', getFilteredProducts)

module.exports = router