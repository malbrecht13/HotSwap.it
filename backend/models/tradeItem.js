const mongoose = require('mongoose');

const tradeItemSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    condition: {
        type: String,
        required: true,
    },
    itemCategory: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    approximateMarketVal: {
        type: Number,
        required: true,
    },
    datePosted: {
        type: Date,
        default: Date.now,
    },
    traderStore: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserStore',
        required: true,
    },
    offers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TradeItem',
        },
    ],
    offeredTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TradeItem',
        default: null,
    },
    status: {
        type: String,
        default: 'NoOffers',
    },
    tradedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TradeItem',
        default: null,
    },
    hasShipped: {
        type: Boolean,
        default: false,
    },
});

// The following two functions allow us to use "id" instead of "_id" in queries
tradeItemSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

tradeItemSchema.set('toJSON', {
    virtuals: true,
});

exports.TradeItem = mongoose.model('TradeItem', tradeItemSchema);
