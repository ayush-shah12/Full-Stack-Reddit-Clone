// server running on port 8000
const authRoutes = require('./routes/auth');
const jwt = require('jsonwebtoken');
const UserVoteModel = require('./models/userVoteModel');
const UserVoteCommentModel = require('./models/userVoteComment');

const UserModel = require('./models/user');
const JWT_SECRET = 'fe95e4372bd1ad3d6a00fc0dd2d5f0743dee17247c1cbd3f9a2efafc6274f744'; // same secret used in auth


const CommunityModel = require('./models/communities');
const PostModel = require('./models/posts');
const CommentModel = require('./models/comments');
const LinkFlairModel = require('./models/linkflairs');



const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const cookieParser = require('cookie-parser');


const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({ credentials: true, origin: 'http://localhost:3000' })); //front end port
app.use(express.urlencoded({ extended: true }));

// NOTE: all auth routes must be prefixed with /auth
app.use("/auth", authRoutes);


const dbURL = 'mongodb://127.0.0.1:27017/phreddit';
mongoose.connect(dbURL);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.on('connected', () => { console.log("Connected to MongoDB..."); });


app.get("/", function (req, res) {
    res.send("Hello Phreddit!");
});

// gets ALL posts
app.get("/posts", async (req, res) => {
    try {
        const posts = await PostModel.find().populate('postedBy', 'displayName');;
        res.send(posts);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// gets post given a postID
app.get('/posts/:postID', async (req, res) => {
    try {
        const post = await PostModel.findById(req.params.postID).populate('postedBy', 'displayName');;
        if (post) {
            res.json(post);
        } else {
            res.status(404).json({ error: "Post not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch post" });
    }
});

// gets ALL communities
app.get("/communities", async (req, res) => {
    try {
        const communities = await CommunityModel.find();
        res.send(communities);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// gets post ids given a communityID
app.get('/postsbycommunity/:communityID', async (req, res) => {
    try {
        const community = await CommunityModel.findById(req.params.communityID);
        const posts = [];
        if (community) {
            const postIDs = community.postIDs;
            for (const postID of postIDs) {
                const post = await PostModel.findById(postID).populate('postedBy', 'displayName');
                if (post) {
                    posts.push(post);
                }
            }
            res.json(posts);
        } else {
            res.status(404).json({ error: "Community not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

// gets community given a communityID
app.get('/communities/:communityID', async (req, res) => {
    try {
        const community = await CommunityModel.findById(req.params.communityID)
            .populate('createdBy', 'displayName')
            .populate('members', '_id');
        if (community) {
            res.json(community);
        }
        else {
            res.status(404).json({ error: "Community not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch community" });
    }
});

// gets community name of a post given a postID
app.get('/communityName/:postID', async (req, res) => {
    try {
        const postID = req.params.postID;

        if (!postID) {
            return res.status(400).json({ error: "Invalid postID" });
        }

        const communities = await CommunityModel.find();

        for (const c of communities) {
            if (c.postIDs.includes(new mongoose.Types.ObjectId(postID))) {
                return res.json({ communityName: c.name });
            }
        }
        res.status(404).json({ error: "Community not found" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch community name" });
    }
});

// gets link flair of a post given a linkFlairID if available
app.get('/linkFlairs/:linkFlairID', async (req, res) => {
    try {
        const linkFlair = await LinkFlairModel.findById(req.params.linkFlairID);
        if (linkFlair) {
            res.json(linkFlair);
        } else {
            res.status(404).json({ error: "Link flair not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch link flair" });
    }
});

// gets comments given commentID
app.get('/comments/:commentID', async (req, res) => {
    try {
        const comment = await CommentModel.findById(req.params.commentID).populate('commentedBy', 'displayName');
        if (comment) {
            res.json(comment);
        } else {
            res.status(404).json({ error: "Comment not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch comment" });
    }
});

// increments views of a post given a postID; response is not used for anything
app.put('/posts/:postID/incrementViews', async (req, res) => {
    try {
        const postID = req.params.postID;
        const post = await PostModel.findById(postID);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const result = await PostModel.findByIdAndUpdate(postID, { views: post.views + 1 });
        if (result) {
            res.json({ message: "Views incremented" });
        }
        else {
            res.status(500).json({ error: "Failed to increment views" });
        }

    } catch (error) {
        res.status(500).json({ error: "Failed to increment views" });
    }
});

const sanitizeWord = (word) => {
    return word.replace(/[^\w]/g, '');
};

const stopWords = [
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is',
    'it', 'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'these',
    'they', 'this', 'to', 'was', 'will', 'with'
];
//search
app.get('/search', async (req, res) => {
    try {
        const searchQuery = req.query.query;

        if (!searchQuery) {
            return res.status(400).json({ error: "No search query provided" });
        }

        //split the search in individual terms
        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);

        //sanitize
        const filteredTerms = searchTerms
            .filter((term) => !stopWords.includes(term))
            .map(sanitizeWord)
            .filter(Boolean);

        if (filteredTerms.length === 0) {
            return res.json([]);
        }
        //regex pattern for each search (case insensetive)
        const regexTerms = filteredTerms.map(term => new RegExp(term, 'i'));

        //find posts with matching title/content
        const postsMatchingTitleOrContent = await PostModel.find({
            $or: [
                { title: { $in: regexTerms } },
                { content: { $in: regexTerms } }
            ]
        }).select('title content postedBy postedDate views linkFlairID commentIDs')
            .lean();

        //find posts with nested matching comments
        const postsWithMatchingComments = await PostModel.aggregate([
            {
                $match: {}
            },
            {
                $graphLookup: {
                    from: "comments", //frok comments collection
                    startWith: "$commentIDs",
                    connectFromField: "commentIDs", //field to traverse
                    connectToField: "_id", //field to match in the from collection
                    as: "allNestedComments" //output
                }
            },
            {
                $match: {
                    //check if nested comments containt the query words
                    "allNestedComments.content": { $in: regexTerms }
                }
            },
            {
                $project: {
                    title: 1,
                    content: 1,
                    postedBy: 1,
                    postedDate: 1,
                    views: 1,
                    linkFlairID: 1,
                    commentIDs: 1
                }
            }
        ]);

        //combine and remove dublicates
        const allMatchingPosts = [...postsMatchingTitleOrContent, ...postsWithMatchingComments];

        const uniquePostsMap = {};
        allMatchingPosts.forEach(post => {
            uniquePostsMap[post._id.toString()] = post;
        });

        const uniquePosts = Object.values(uniquePostsMap);

        res.json(uniquePosts);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Search Failed" });
    }
});

//creating post
app.post('/post', async (req, res) => {
    try {
        const { title, content, postedBy, communityID, linkFlairID, newLinkFlair } = req.body;

        //check if community exists
        const community = await CommunityModel.findById(communityID);
        if (!community) {
            return res.status(404).json({ error: "Community not found." });
        }

        let validLinkFlairID = null;
        if (linkFlairID && linkFlairID !== "AddNewLinkFlair") {
            const linkFlair = await LinkFlairModel.findById(linkFlairID);
            if (!linkFlair) {
                return res.status(400).json({ error: "Invalid Link Flair ID." });
            }
            validLinkFlairID = linkFlairID;
        }
        else if (linkFlairID == "AddNewLinkFlair") {
            if (!newLinkFlair || newLinkFlair.trim() === "") {
                return res.status(400).json({ error: "New Link Flair name is required." });

            }
            if (newLinkFlair.trim().length > 30) {
                return res.status(400).json({ error: "Link Flair cannot exceed 30 chars." });

            }

            const existingFlair = await LinkFlairModel.findOne({ content: newLinkFlair.trim() });
            if (existingFlair) {
                validLinkFlairID = existingFlair._id;
            }
            else {
                const newFlair = new LinkFlairModel({
                    content: newLinkFlair.trim(),
                });
                const savedFlair = await newFlair.save();
                validLinkFlairID = savedFlair._id;
            }
        }

        const newPost = new PostModel({
            title: title.trim(),
            content: content.trim(),
            postedBy: postedBy.trim(),
            linkFlairID: validLinkFlairID,
            commentIDs: [],
            views: 0,
            postedDate: new Date(),
        });

        let savedPost = await newPost.save();
        savedPost = await PostModel.findById(savedPost._id).populate('postedBy', 'displayName');
        //associate post with community
        community.postIDs.push(savedPost._id);
        await community.save();

        res.status(201).json(savedPost);
    }
    catch (error) {
        console.error("Error while creating new post:", error);
        res.status(500).json({ error: "Failed to create post." });
    }
});

// fetches link flairs
app.get('/linkFlairs', async (req, res) => {
    try {
        const linkFlairs = await LinkFlairModel.find();
        res.json(linkFlairs);
    }
    catch (error) {
        console.error("Error fetching link flairs:", error);
        res.status(500).json({ error: "Failed to fetch link flairs" });
    }
});


app.post('/communities', async (req, res) => {
    try {
        const { name, description, user_id } = req.body;

        //validation
        if (!name || !description || !user_id) {
            return res.status(400).json({ error: "Name, description and username are required." });
        }

        //check for unique community name

        const exisitingCommunity = await CommunityModel.findOne({ name: name.trim() });
        if (exisitingCommunity) {
            return res.status(400).json({ error: "Community name already exists." });
        }

        //new community object:
        const newCommunity = new CommunityModel({
            name: name.trim(),
            description: description.trim(),
            postIDs: [],
            startDate: new Date(),
            members: [user_id],
            memberCount: 1,
            createdBy: user_id,
        });
        const savedCommunity = await newCommunity.save();

        res.status(201).json(savedCommunity);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create community." });
    }
});

//create comment:
app.post('/posts/:postID/comment', async (req, res) => {
    const { postID } = req.params;
    const { content, commentedBy, commentedDate } = req.body;

    try {
        const newComment = new CommentModel({
            content,
            commentedBy,
            commentedDate: new Date(),
            commentIDs: []
        });
        const savedComment = await newComment.save();


        await PostModel.findByIdAndUpdate(postID, { $push: { commentIDs: savedComment._id } }, { new: true });

        res.status(201).json(savedComment);
    } catch (error) {
        console.error("Error creating comment", error);
        res.status(500).json({ error: "Failed to create comment" });

    }
});

//add a reply to an existing comment
app.post('/comments/:commentID/reply', async (req, res) => {
    const { commentID } = req.params;
    const { content, commentedBy, commentedDate } = req.body;

    try {
        const newComment = new CommentModel({
            content,
            commentedBy,
            commentedDate,
            commentIDs: [],
        });
        const savedComment = await newComment.save();

        await CommentModel.findByIdAndUpdate(commentID, { $push: { commentIDs: savedComment._id } }, { new: true });
        res.status(201).json(savedComment);
    }
    catch (error) {
        console.error("Error adding reply to comment:", error);
        res.status(500).json({ error: "Failed to add reply" });
    }
});
app.listen(8000, () => { console.log("Server listening on port 8000..."); });




app.post('/posts/:postID/vote', async (req, res) => {
    try {
        const { postID } = req.params;
        const { action } = req.body; //up or down

        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: "not logged in" });

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ error: "invalid token" });
        }

        const userID = decoded.id;
        const post = await PostModel.findById(postID);
        if (!post) return res.status(404).json({ error: "post not found" });

        let userVote = await UserVoteModel.findOne({ userID, postID });
        if (!userVote) {
            userVote = new UserVoteModel({ userID, postID, vote: 'none' });
        }

        //vote changes
        let voteChange = 0;
        let reputationChange = 0;
        let newVoteState = userVote.vote; //current state (none, up or down)

        if (action === 'up') {
            if (userVote.vote === 'none') {
                //if none -> up: +1 post vote, +5 rep
                voteChange = 1;
                reputationChange = 5;
                newVoteState = 'up';
            } else if (userVote.vote === 'up') {
                //if up -> none: -1 post vote, -5 rep
                voteChange = -1;
                reputationChange = -5;
                newVoteState = 'none';
            } else if (userVote.vote === 'down') {
                //if down -> up: +2 post votes, +15 rep (-10 +5)
                voteChange = 2;
                reputationChange = 15;
                newVoteState = 'up';
            }
        } else if (action === 'down') {
            if (userVote.vote === 'none') {
                //if none -> down: -1 vote, -10 rep
                voteChange = -1;
                reputationChange = -10;
                newVoteState = 'down';
            } else if (userVote.vote === 'down') {
                //if down -> none: +1 vote, +10 rep
                voteChange = 1;
                reputationChange = 10;
                newVoteState = 'none';
            } else if (userVote.vote === 'up') {
                //if up -> down: -2 votes, -15 rep (+5 to -10)
                voteChange = -2;
                reputationChange = -15;
                newVoteState = 'down';
            }
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }

        //update post votes
        post.votes += voteChange;
        await post.save();

        //update userVote record
        userVote.vote = newVoteState;
        await userVote.save();

        //update poster's reputation
        const poster = await UserModel.findById(post.postedBy);
        if (poster && reputationChange !== 0) {
            poster.reputation += reputationChange;
            await poster.save();
        }

        res.json({ success: true, newVoteState, newVoteCount: post.votes });
    } catch (error) {
        console.error("Failed to update vote:", error);
        res.status(500).json({ error: "Failed to update vote." });
    }
});


app.get('/posts/:postID/userVote', async (req, res) => {
    try {
        const { postID } = req.params;
        const token = req.cookies.token;
        if (!token) {
            return res.json({ vote: "none" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return res.json({ vote: "none" });
        }

        const userID = decoded.id;
        const userVote = await UserVoteModel.findOne({ userID, postID });
        if (!userVote) {
            return res.json({ vote: "none" });
        }

        return res.json({ vote: userVote.vote });
    } catch (error) {
        console.error("Failed to fetch user vote state:", error);
        res.status(500).json({ error: "Failed to fetch vote state" });
    }
});




app.get('/comments/:commentID/userVote', async (req, res) => {
    const { commentID } = req.params;
    const token = req.cookies.token;
    if (!token) return res.json({ vote: "none" });

    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return res.json({ vote: "none" });
    }

    const userID = decoded.id;
    const userVote = await UserVoteCommentModel.findOne({ userID, commentID });
    if (!userVote) {
        return res.json({ vote: "none" });
    }

    return res.json({ vote: userVote.vote });
});

//vote on a comment
app.post('/comments/:commentID/vote', async (req, res) => {
    try {
        const { commentID } = req.params;
        const { action } = req.body;

        const token = req.cookies.token;
        if (!token) return res.status(401).json({ error: "not logged in" });

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const userID = decoded.id;
        const comment = await CommentModel.findById(commentID);
        if (!comment) return res.status(404).json({ error: "Comment not found" });

        let userVote = await UserVoteCommentModel.findOne({ userID, commentID });
        if (!userVote) {
            userVote = new UserVoteCommentModel({ userID, commentID, vote: 'none' });
        }

        let voteChange = 0;
        let reputationChange = 0;
        let newVoteState = userVote.vote;

        if (action === 'up') {
            if (userVote.vote === 'none') {
                voteChange = 1;
                reputationChange = 5;
                newVoteState = 'up';
            } else if (userVote.vote === 'up') {
                voteChange = -1;
                reputationChange = -5;
                newVoteState = 'none';
            } else if (userVote.vote === 'down') {
                voteChange = 2;
                reputationChange = 15;
                newVoteState = 'up';
            }
        } else if (action === 'down') {
            if (userVote.vote === 'none') {
                voteChange = -1;
                reputationChange = -10;
                newVoteState = 'down';
            } else if (userVote.vote === 'down') {
                voteChange = 1;
                reputationChange = 10;
                newVoteState = 'none';
            } else if (userVote.vote === 'up') {
                voteChange = -2;
                reputationChange = -15;
                newVoteState = 'down';
            }
        } else {
            return res.status(400).json({ error: "Invalid action" });
        }

        comment.votes += voteChange;
        await comment.save();

        userVote.vote = newVoteState;
        await userVote.save();

        const commenter = await UserModel.findById(comment.commentedBy);
        if (commenter && reputationChange !== 0) {
            commenter.reputation += reputationChange;
            await commenter.save();
        }

        res.json({ success: true, newVoteState, newVoteCount: comment.votes });
    } catch (error) {
        console.error("Failed to update comment vote:", error);
        res.status(500).json({ error: "Failed to update comment vote" });
    }
});


//join and leave the community buttons
app.post('/communities/:communityID/join', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Not logged in" });
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
    const userID = decoded.id;

    const community = await CommunityModel.findById(req.params.communityID);
    if (!community) return res.status(404).json({ error: "community not found" });

    community.members.push(userID);
    community.memberCount = community.members.length;
    await community.save();

    res.json({ success: true });
});


app.post('/communities/:communityID/leave', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "not logged in" });
    let decoded;
    try {
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return res.status(401).json({ error: "Invalid token" });
    }
    const userID = decoded.id;

    const community = await CommunityModel.findById(req.params.communityID);
    if (!community) return res.status(404).json({ error: "community not found" });

    const index = community.members.indexOf(userID);
    if (index !== -1) {

        community.members.splice(index, 1);
        community.memberCount = community.members.length;
        await community.save();
    }

    res.json({ success: true });
});


// get all posts by a user
app.get('/users/:userID/posts', async (req, res) => {
    try {
        const posts = await PostModel.find({ postedBy: req.params.userID });
        res.json(posts);
    } catch (error) {
        console.error("Error fetching user posts:", error);
        res.status(500).json({ error: "Failed to fetch user posts" });
    }
});

// get all communities by a user
app.get('/users/:userID/communities', async (req, res) => {
    try {
        const communities = await CommunityModel.find({ createdBy: req.params.userID });
        res.json(communities);
    } catch (error) {
        console.error("Error fetching user communities:", error);
        res.status(500).json({ error: "Failed to fetch user communities" });
    }
});

// get all comments by a user (including replies)
app.get('/users/:userID/comments', async (req, res) => {
    try {
        const comments = await CommentModel.find({ commentedBy: req.params.userID });
        const commentsWithPostTitles = [];

        for (const comment of comments) {
            let post = await PostModel.findOne({ commentIDs: comment._id });
            if (post) {
                commentsWithPostTitles.push({
                    comment: comment,
                    postTitle: post.title
                });
            } else {
                // must be a reply to a comment then
                while (!post) {
                    parentComment = await CommentModel.findOne({ commentIDs: comment._id });
                    if (!parentComment) {
                        break;
                    }
                    post = await PostModel.findOne({ commentIDs: parentComment._id });
                    if (post) {
                        commentsWithPostTitles.push({
                            comment: comment,
                            postTitle: post.title
                        });
                    }
                }
                if (!post) {
                    return res.status(404).json({ error: `Comment ${comment._id} has no post associated with it` });
                }
            }

        }

        res.json(commentsWithPostTitles);
    } catch (error) {
        console.error("Error fetching user comments:", error);
        res.status(500).json({ error: "Failed to fetch user comments" });
    }
});

// get post from postID
app.get('/posts/alldata/:postID', async (req, res) => {
    try {
        const post = await PostModel.findById(req.params.postID);
        if (post) {
            res.json(post);
        } else {
            res.status(404).json({ error: "Post not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch post" });
    }
});

// updates post given a postID, only title and content can be updated
app.put('/posts/update/:postID', async (req, res) => {
    try {
        const post = await PostModel.findById(req.params.postID);
        if (!post) {
            console.error("Error fetching post:", error);
            return res.status(404).json({ error: "Post not found" });
        }

        const { title, content } = req.body;
        if (!title && !content) {
            return res.status(400).json({ error: "Title or content must be provided" });
        }

        if (title) {
            post.title = title;
        }
        if (content) {
            post.content = content;
        }

        const updatedPost = await post.save();
        res.status(201).json(updatedPost);
    } catch (error) {
        res.status(500).json({ error: "Failed to update post" });
    }
});


// gets community given a communityID
app.get('/communities/alldata/:communityID', async (req, res) => {
    try {
        const community = await CommunityModel.findById(req.params.communityID);
        if (community) {
            res.json(community);
        } else {
            res.status(404).json({ error: "Community not found" });
        }
    } catch (error) {
        res.json(500).json({ error: "Failed to fetch community" });
    }
});


// updates community given a communityID
app.put('/communities/update/:communityID', async (req, res) => {
    try{
        const community = await CommunityModel.findById(req.params.communityID);
        if(!community){
            return res.status(404).json({error: "Community not found"});
        }

        const {name, description} = req.body;
        if(!name && !description){
            return res.status(400).json({error: "Name or description must be provided"});
        }

        if(name){
            community.name = name;
        }
        if(description){
            community.description = description;
        }

        const updatedCommunity = await community.save();
        res.status(201).json(updatedCommunity);
    } catch (error) {
        res.status(500).json({ error: "Failed to update community" });

    };
});


app.get('/communities/exists/:communityName', async (req, res) => {
    try {
        const name = req.params.communityName;
        const community = await CommunityModel.findOne({name: name});
        if (community) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        res.status(500).json({ error });
    }
});

// update comment from commentID
app.get('/comments/alldata/:commentID', async (req, res) => {
    try {
        const comment = await CommentModel.findById(req.params.commentID);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: "Failed to get comment" });
    }
});

// update comment from commentID
app.put('/comments/update/:commentID', async (req, res) => {
    try {
        const comment = await CommentModel.findById(req.params.commentID);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: "Content is required" });
        }
        comment.content = content;
        const updatedComment = await comment.save();
        res.status(201).json(updatedComment);
    } catch (error) {
        res.status(500).json({ error: "Failed to update comment" });
    }
});
