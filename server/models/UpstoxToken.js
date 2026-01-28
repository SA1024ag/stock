const mongoose = require('mongoose');

const UpstoxTokenSchema = new mongoose.Schema({
  access_token: { type: String, required: true },
  refresh_token: { type: String },
  is_active: { type: Boolean, default: true },
  timestamp: { type: Number, default: Date.now }
});

module.exports = mongoose.model('UpstoxToken', UpstoxTokenSchema);
