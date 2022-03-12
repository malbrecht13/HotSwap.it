const mongoose = require('mongoose');

const tradeSchema = mongoose.Schema({
    tradeItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TradeItem',
    },
    offeredItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TradeItem',
    },
    dateTraded: {
        type: Date,
        default: Date.now,
    },
    ratingOfTrader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rating',
    },
    ratingOfOfferor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rating',
    },
    status: {
        type: String,
        default: 'NoItemsShipped',
    },
});

// The following two functions allow us to use "id" instead of "_id" in queries
tradeSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

tradeSchema.set('toJSON', {
    virtuals: true,
});

exports.Trade = mongoose.model('Trade', tradeSchema);
