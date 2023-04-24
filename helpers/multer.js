const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        return cb(null,"./public/images");
    },
    filename:(req,file,cb)=>{
        const uniqefilename ="ResumeBuilder-" + Date.now() + path.extname(file.originalname) ;
        return cb(null, uniqefilename);
    },
    
});

const upload = multer({storage:storage});

module.exports = upload;