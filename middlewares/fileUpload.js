const multer = require('multer')
const fs = require('fs') //filesystem
const path = require('path') //path- pathname of file


const storage = multer.diskStorage({
  destination: function (req, file, cb) {

    let dstn = 'public/uploads';

    if(!fs.existsSync(dstn)){
        fs.mkdirSync(dstn, {recursive: true})
    }
    cb(null, dstn)
  },
  filename: function (req, file, cb) {
    
    let extname = path.extname(file.originalname)
    let basename = path.basename(file.originalname, extname)
    let fieldname = file.fieldname

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()* 1E9)

    let filename = fieldname + '-' + basename + '-' + uniqueSuffix + extname
    // image-cat-12345678912345.jpg
    cb(null, filename)
  }
})

const upload = multer({ storage: storage,
    limits: {
        fileSize: 2000000
    }
 })
 module.exports = upload