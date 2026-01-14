const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true
  },
  shares: {
    type: Number,
    required: true,
    min: 0
  },
  averagePrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalInvested: {
    type: Number,
    required: true,
    min: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ['buy', 'sell'],
      required: true
    },
    shares: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
portfolioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
portfolioSchema.index({ user: 1, symbol: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
