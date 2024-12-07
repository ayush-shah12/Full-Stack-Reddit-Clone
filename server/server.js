// server running on port 8000

const CommunityModel = require('./models/communities');
const PostModel = require('./models/posts');
const CommentModel = require('./models/comments');
const LinkFlairModel = require('./models/linkflairs');


const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ credentials: true, origin: 'http://localhost:3000' })); //front end port
app.use(express.urlencoded({ extended: true }));

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
        const posts = await PostModel.find();
        res.send(posts);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// gets post given a postID
app.get('/posts/:postID', async (req, res) => {
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
                const post = await PostModel.findById(postID);
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
        const community = await CommunityModel.findById(req.params.communityID);
        if (community) {
            res.json(community);
        }
        else {
            res.status(404).json({ error: "Community not found" });
        }
    } catch (error) {
        res.status(500).json({error: "Failed to fetch community"});
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
        const comment = await CommentModel.findById(req.params.commentID);
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

        if(!searchQuery) {
            return res.status(400).json({error : "No search query provided"});
        }

        //split the search in individual terms
        const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);

        //sanitize
        const filteredTerms = searchTerms
        .filter((term) => !stopWords.includes(term))
        .map(sanitizeWord)
        .filter(Boolean);

        if(filteredTerms.length === 0) {
            return res.json([]);
        }
        //regex pattern for each search (case insensetive)
        const regexTerms = filteredTerms.map(term => new RegExp(term, 'i'));

        //find posts with matching title/content
        const postsMatchingTitleOrContent = await PostModel.find({
            $or: [
                {title: {$in:regexTerms}},
                {content: {$in:regexTerms}}
            ]
        }).select('title content postedBy postedDate views linkFlairID commentIDs')
        .lean();
        
        //find posts with nested matching comments
        const postsWithMatchingComments = await PostModel.aggregate([
            {$match:{}
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
                "allNestedComments.content": {$in: regexTerms}
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

        const uniquePostsMap  = {};
        allMatchingPosts.forEach(post => {
            uniquePostsMap[post._id.toString()] = post;
        });

        const uniquePosts = Object.values(uniquePostsMap);

        res.json(uniquePosts);
    }
    catch(error) {
        console.error(error);
        res.status(500).json({error: "Search Failed"});
    }
});

//creating post
app.post('/post', async(req, res) => {
    try {
        const {title, content, postedBy, communityID, linkFlairID, newLinkFlair} = req.body;

        //check if community exists
        const community = await CommunityModel.findById(communityID);
        if(!community){
            return res.status(404).json({error: "Community not found."});
        }

        let validLinkFlairID = null;
        if(linkFlairID && linkFlairID !== "AddNewLinkFlair") {
            const linkFlair = await LinkFlairModel.findById(linkFlairID);
            if(!linkFlair){
                return res.status(400).json({error: "Invalid Link Flair ID."});
            }
            validLinkFlairID = linkFlairID;
        }
        else if (linkFlairID =="AddNewLinkFlair"){
            if(!newLinkFlair || newLinkFlair.trim() === ""){
                return res.status(400).json({error: "New Link Flair name is required."});

            }
            if(newLinkFlair.trim().length > 30) {
                return res.status(400).json({error: "Link Flair cannot exceed 30 chars."});

            }

            const existingFlair = await LinkFlairModel.findOne({content: newLinkFlair.trim()});
            if(existingFlair) {
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

        const savedPost = await newPost.save();
        //associate post with community
        community.postIDs.push(savedPost._id);
        await community.save();

        res.status(201).json(savedPost);
    }
    catch(error){
        console.error("Error while creating new post:", error);
        res.status(500).json({error: "Failed to create post."});
    }
});

// fetches link flairs
app.get('/linkFlairs', async (req, res) => {
    try{
        const linkFlairs = await LinkFlairModel.find();
        res.json(linkFlairs);
    }
    catch(error){
        console.error("Error fetching link flairs:", error);
        res.status(500).json({error: "Failed to fetch link flairs"});
    }
});


app.post('/communities', async (req, res) => {
    try {
        const { name, description, creatorUsername } = req.body;

        //validation
        if(!name || !description || !creatorUsername) {
            return res.status(400).json({error: "Name, description and username are required."});
        }

        //check for unique community name

        const exisitingCommunity = await CommunityModel.findOne({name: name.trim()});
        if(exisitingCommunity) {
            return res.status(400).json({error: "Community name already exists."});
        }

        //new community object:
        const newCommunity = new CommunityModel({
            name: name.trim(),
            description: description.trim(),
            postIDs: [],
            startDate: new Date(),
            members: [creatorUsername.trim()],
            memberCount: 1,
        });
        const savedCommunity = await newCommunity.save();

        res.status(201).json(savedCommunity);
    }
    catch(error) {
        res.status(500).json({error: "Failed to create community."});
    }
});

//create comment:
app.post('/posts/:postID/comment', async (req, res) => {
    const {postID } = req.params;
    const {content, commentedBy, commentedDate } = req.body;

    try {
        const newComment = new CommentModel({
            content, 
            commentedBy,
            commentedDate: new Date(),
            commentIDs: []
        });
        const savedComment = await newComment.save();

        
        await PostModel.findByIdAndUpdate(postID, {$push: {commentIDs: savedComment._id }}, {new: true});

        res.status(201).json(savedComment);
    } catch(error) {
        console.error("Error creating comment", error);
        res.status(500).json({error: "Failed to create comment"});

    }
});

//add a reply to an existing comment
app.post('/comments/:commentID/reply', async(req, res) => {
    const {commentID} = req.params;
    const {content, commentedBy, commentedDate} = req.body;

    try {
        const newComment = new CommentModel({
            content,
            commentedBy,
            commentedDate,
            commentIDs: [],
        });
        const savedComment = await newComment.save();

        await CommentModel.findByIdAndUpdate(commentID, {$push: {commentIDs: savedComment._id}}, {new: true});
        res.status(201).json(savedComment);
    }
    catch(error){
        console.error("Error adding reply to comment:", error);
        res.status(500).json({error: "Failed to add reply"});
    }
});
app.listen(8000, () => { console.log("Server listening on port 8000..."); });