const mongoose = require('mongoose');

const donationSchema = mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0,
        max: 1000,
    },
    frequencyOfPayment: {
        type: String,
        required: true,
    },
    creditCard: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CreditCard',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

// The following two functions allow us to use "id" instead of "_id" in queries
donationSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

donationSchema.set('toJSON', {
    virtuals: true,
});

exports.Donation = mongoose.model('Donation', donationSchema);
