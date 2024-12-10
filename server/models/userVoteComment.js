const mongoose = require('mongoose');

const userVoteCommentSchema = new mongoose.Schema({
  userID: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true },
  commentID: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'comment', 
    required: true },
  vote: { 
    type: String, 
    enum: ['none', 'up', 'down'], 
    default: 'none' }
});

const UserVoteCommentModel = mongoose.model('userVoteComment', userVoteCommentSchema);
module.exports = UserVoteCommentModel;