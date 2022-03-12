const mongoose = require('mongoose');

const creditCardSchema = mongoose.Schema({
    cardHolderName: {
        type: String,
        required: true,
    },
    cardNumber: {
        type: String,
        required: true,
    },
    cvc: {
        type: String,
        required: true,
    },
    expiration: {
        type: Date,
    },
});

exports.CreditCard = mongoose.model('CreditCard', creditCardSchema);
