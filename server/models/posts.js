// Post Document Schema
const mongoose = require('mongoose');
const linkflairModel = require('./linkflairs');
const CommentModel = require('./comments');

const posts = new mongoose.Schema({
    title: {
        type: String,
        maxlength: 100,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    postedBy: {
        type: String,
        required: true
    },
    postedDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    views: {
        type: Number,
        default: 0,
        required: true
    },
    linkFlairID: {type: mongoose.Schema.Types.ObjectId, ref: 'linkflair'},
    commentIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comment' }],
    // communityID: {type: mongoose.Schema.Types.ObjectId, ref: 'community'}
});

posts.virtual('url').get(function () {
    return `posts/${this._id}`;
});

const PostModel = mongoose.model('post', posts);

module.exports = PostModel;
