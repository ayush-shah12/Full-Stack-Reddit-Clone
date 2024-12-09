// Comment Document Schema
const mongoose = require('mongoose');
const CommentModel = require('./comments');

const comments = new mongoose.Schema({
    content: {
        type: String,
        maxlength: 500,
        required: true
    },
    commentedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},
    commentedDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    commentIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comment' }],
});

comments.virtual('url').get(function () {
    return `comments/${this._id}`;
});

const commentModel = mongoose.model('comment', comments);

module.exports = commentModel;
