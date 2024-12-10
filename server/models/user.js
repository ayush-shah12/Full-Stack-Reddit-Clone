const mongoose = require('mongoose');

const user = new mongoose.Schema({
    firstName: {
        type: String,
        maxlength: 500,
        required: true
    },
    lastName: {
        type: String,
        maxlength: 500,
        required: true
    },
    email: {
        type: String,
        maxlength: 500,
        required: true
    },
    displayName:
    {
        type: String,
        maxlength: 500,
        required: true
    },
    password: {
        type: String,
        maxlength: 500,
        required: true
    },
    reputation: {
        type: Number,
        default: 100 //regular users start at 100
    },
    dateJoined: {
        type: Date,
        default: Date.now
    }
});


const userModel = mongoose.model('user', user);

module.exports = userModel;
