const mongoose = require('mongoose');

const ratingSchema = mongoose.Schema({
  rating: {
    type: Number,
    required: true
  },
  comment: {
    type: String,
    default: ''
  }
})

// The following two functions allow us to use "id" instead of "_id" in queries
ratingSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ratingSchema.set('toJSON', {
  virtuals: true,
});

exports.Rating = mongoose.model('Rating', ratingSchema);