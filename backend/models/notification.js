const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    tradeItem: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
});

// The following two functions allow us to use "id" instead of "_id" in queries
notificationSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

notificationSchema.set('toJSON', {
    virtuals: true,
});

exports.Notification = mongoose.model('Notification', notificationSchema);
