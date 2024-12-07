// LinkFlair Document Schema
const mongoose = require('mongoose');

const linkflair = new mongoose.Schema({
    content: {
        type: String,
        maxlength: 30,
        required: true
    }
});

linkflair.virtual('url').get(function () {
    return `linkFlairs/${this._id}`;
});

const linkflairModel = mongoose.model('linkflair', linkflair);

module.exports = linkflairModel;
