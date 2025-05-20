const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  serviceProviderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'serviceProvider'
  },
  date: {
    type: String,
    required: true 
  },
  reason: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Holiday', holidaySchema);
