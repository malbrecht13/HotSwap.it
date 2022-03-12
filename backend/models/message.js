const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    messageText: {
      type: String,
      default: ''
    },
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
  },
});

// The following two functions allow us to use "id" instead of "_id" in queries
messageSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

messageSchema.set('toJSON', {
    virtuals: true,
});

exports.Message = mongoose.model('Message', messageSchema);