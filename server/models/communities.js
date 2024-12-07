// Community Document Schema
// Post Document Schema
const mongoose = require('mongoose');
const PostModel = require('./posts');

const communities = new mongoose.Schema({
    name: {
        type: String,
        maxlength: 100,
        required: true
    },
    description: {
        type: String,
        maxlength: 500,
        required: true
    },
    postIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'post' }],
    startDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    members: {
        type: [String],
        default: [],
        required: true
    },
    memberCount: {
        type: Number,
        default: 0
    }
});

communities.virtual('url').get(function () {
    return `communities/${this._id}`;
});

const communitiessModel = mongoose.model('community', communities);

module.exports = communitiessModel;
