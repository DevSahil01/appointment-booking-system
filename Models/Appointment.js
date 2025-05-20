const mongoose = require('mongoose');

const Appointment = mongoose.Schema({
  serviceId: [{
    type: mongoose.Types.ObjectId,
    ref: "Services"
  }],
  serviceProviderId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "serviceProvider"
  }],
  userId: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  }],
  name: {
    type: String,
    required: true
  },
  contactNo: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  noOfPersons: { // 🔥 NEW FIELD
    type: Number,
    required: true
  },
  status: {
    type: String
  }
});

module.exports = mongoose.model("Appointments", Appointment);
