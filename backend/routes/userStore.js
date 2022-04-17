const express = require('express');
const router = express.Router();
const userStoreCtrl = require('../controllers/userStore');
const multer = require('multer');

// adding png, jpg, and jpeg images are supported
const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg'
}

// use the multer library to save the image to database
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('invalid image type');
    if(isValid) {
      uploadError = null;
    }
    cb(uploadError, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(' ').join('-');
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`)
  }
})

const uploadOptions = multer({ storage: storage })

router
    .route('/trades/:userStoreId')
    .get(userStoreCtrl.getItemsForTrade)
    .post(uploadOptions.single('image'), userStoreCtrl.addItemForTrade)

router
    .route('/previous-trades/:userStoreId')
    .get(userStoreCtrl.getPreviousTrades);

router
    .route('/avg-rating/:userStoreId')
    .get(userStoreCtrl.getAvgRating);

router
    .route('/images/:key')
    .get(userStoreCtrl.getImage);

module.exports = router;
