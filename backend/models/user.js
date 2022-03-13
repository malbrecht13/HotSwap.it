const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    passwordHash: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    shippingAddressLine1: {
        type: String,
        required: true,
    },
    shippingAddressLine2: {
        type: String,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
      type: String,
      required: true
    },
    zip: {
        type: String,
        required: true,
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserStore',
    },
    notifications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Notification',
        },
    ],
    messages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
    ],
});

// The following two functions allow us to use "id" instead of "_id"
userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});

exports.User = mongoose.model('User', userSchema);
