const mongoose = require('mongoose');

const userVoteSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true },
  postID: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'post', 
    required: true },
  vote: { 
    type: String, 
    enum: ['none', 'up', 'down'], 
    default: 'none' }
});

const UserVoteModel = mongoose.model('uservote', userVoteSchema);
module.exports = UserVoteModel;