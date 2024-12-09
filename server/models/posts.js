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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
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
    votes: {
        type: Number,
        default: 0,
        required: true
    },
    linkFlairID: {type: mongoose.Schema.Types.ObjectId, ref: 'linkflair'},
    commentIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'comment' }],
    
    // Not sure if we need this, it was commented out in the original code
    // community contains posts, so we don't need to store communityID in posts but we can if we want to
    // communityID: {type: mongoose.Schema.Types.ObjectId, ref: 'community'}
});

posts.virtual('url').get(function () {
    return `posts/${this._id}`;
});

const PostModel = mongoose.model('post', posts);

module.exports = PostModel;
