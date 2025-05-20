const mongoose = require('mongoose');
const services = mongoose.Schema({
    serviceProvideId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "serviceProvider"
    }],
    serviceName: {
        type: String,
        required: true
    },
    serviceDuration: {
        type: Number,
        required: true
    },
    serviceTimeslots: {
        type: Array,
        required: true
    },
    slotCapacity: {
        type: Number,
        required: true  // <-- New Field
    },
    serviceImage: {
        data: String,
        contentType: String,
        Filename: String
    },
    serviceCharges: {
        type: Number,
        required: true
    },
    serviceDesc: {
        type: String,
        required: true
    }
});
module.exports = mongoose.model('Services', services);
