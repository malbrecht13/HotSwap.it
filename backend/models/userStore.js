const mongoose = require('mongoose');

const userStoreSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    itemsForTrade: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TradeItem',
        },
    ],
    previousTrades: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trade',
        },
    ],
    ratings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Rating',
        },
    ],
    userAvgRating: {
        type: Number,
    },
});

// The following two functions allow us to use "id" instead of "_id"
userStoreSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userStoreSchema.set('toJSON', {
    virtuals: true,
});

exports.UserStore = mongoose.model('UserStore', userStoreSchema);
