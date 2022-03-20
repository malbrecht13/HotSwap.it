const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
     type: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    }
});

// The following two functions allow us to use "id" instead of "_id" in queries
notificationSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

notificationSchema.set('toJSON', {
    virtuals: true,
});

exports.Notification = mongoose.model('Notification', notificationSchema);
