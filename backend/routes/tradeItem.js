const express = require('express');
const router = express.Router();
const multer = require('multer');
const tradeItemCtrl = require('../controllers/tradeItems');

// adding png, jpg, and jpeg images are supported
const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
};

// use the multer library to save the image to database
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');
        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/uploads');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    },
});

const uploadOptions = multer({ storage: storage });

router
    .route('/:tradeItemId')
    .patch(uploadOptions.single('image'), tradeItemCtrl.updateItemForTrade)
    .delete(tradeItemCtrl.deleteTradeItem);

router
    .route('/make-offer')
    .post(tradeItemCtrl.makeOffer);

router
    .route('/accept-offer')
    .post(tradeItemCtrl.acceptOffer);

router
    .route('/reject-offer')
    .post(tradeItemCtrl.rejectOffer);

router
    .route('/cancel-offer')
    .post(tradeItemCtrl.cancelOffer);

module.exports = router;
