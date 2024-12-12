/* server/init.JSON
** You must write a script that will create documents in your database according
** to the datamodel you have defined for the application.  Remember that you 
** must at least initialize an admin user account whose credentials are derived
** from command-line arguments passed to this script. But, you should also add
** some communities, posts, comments, and link-flairs to fill your application
** some initial content.  You can use the initializeDB.js script as inspiration, 
** but you cannot just copy and paste it--you script has to do more to handle
** users.
*/

const mongoose = require('mongoose');
const UserModel = require('./models/user');
const CommunityModel = require('./models/communities');
const PostModel = require('./models/posts');
const CommentModel = require('./models/comments');


let bcrypt;
try {
    bcrypt = require('bcrypt');
} catch (e) {
    console.error('ERROR: bcrypt module is not installed. Please run "npm install bcrypt" and try again.');
    process.exit(1);
}

const [email, displayName, password] = process.argv.slice(2);

if (!email || !displayName || !password) {
    console.log('ERROR: You need to specify an email, display name, and password as the first three arguments');
    return
}

mongoose.connect('mongodb://127.0.0.1:27017/phreddit');
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.once('open', async function() {
    console.log('Connected to MongoDB');
    try {
        await createAdmin(email, displayName, password);

        const users = [
            { firstName: 'user1firstname', lastName: 'user1lastname', email: 'user1@example.com', displayName: 'user1', password: 'password1' },
            { firstName: 'user2firstname', lastName: 'user2lastname', email: 'user2@example.com', displayName: 'user2', password: 'password2' },
            { firstName: 'user3firstname', lastName: 'user3lastname', email: 'user3@example.com', displayName: 'user3', password: 'password3' },
            { firstName: 'user4firstname', lastName: 'user4lastname', email: 'user4@example.com', displayName: 'user4', password: 'password4' },
            { firstName: 'user5firstname', lastName: 'user5lastname', email: 'user5@example.com', displayName: 'user5', password: 'password5' },
        ];

        userIDs = [];

        for (const user of users) {
            userID = await createUser(user.firstName, user.lastName, user.email, user.displayName, user.password);
            userIDs.push(userID);
        }
        

        const communities = [
            { name: 'community1', description: 'description1', createdBy: userIDs[0], members: [userIDs[0], userIDs[2]] },
            { name: 'community2', description: 'description2', createdBy: userIDs[1], members: [userIDs[1], userIDs[3], userIDs[4]] }
        ];

        communityIDs = [];

        for (const community of communities) {
            communityID = await createCommunity(community.name, community.description, community.createdBy, community.members);
            communityIDs.push(communityID);
        }

        const posts = [
            { title: 'post1', content: 'content1', postedBy: userIDs[0], communityID: communityIDs[0] },
            { title: 'post2', content: 'content2', postedBy: userIDs[1], communityID: communityIDs[1] },
            { title: 'post3', content: 'content3', postedBy: userIDs[2], communityID: communityIDs[0] },
            { title: 'post4', content: 'content4', postedBy: userIDs[3], communityID: communityIDs[1] },
            { title: 'post5', content: 'content5', postedBy: userIDs[4], communityID: communityIDs[1] }
        ];

        postIDs = [];
        for (const post of posts) {
            const p = await createPost(post.title, post.content, post.postedBy, post.communityID);
            postIDs.push(p);
        }

        const comments = [
            { postID: postIDs[0] ,content: 'comment1', commentedBy: userIDs[0] },
            { postID: postIDs[1] ,content: 'comment2', commentedBy: userIDs[1] },
            { postID: postIDs[2] ,content: 'comment3', commentedBy: userIDs[2] },
            { postID: postIDs[3] ,content: 'comment4', commentedBy: userIDs[3] },
            { postID: postIDs[4] ,content: 'comment5', commentedBy: userIDs[4] }
        ];


        for (const comment of comments) {
            await createComment(comment.postID, comment.content, comment.commentedBy);
        }

        console.log("All data created successfully");
    } catch (error) {
        console.error('Error creating data:', error);
        console.log("\nData creation failed because one (or more) part(s) of initialization failed. Please check the error message above.");
        console.log("Drop the database and try again. If the script is run multiple times, it will fail because the data already exists.");
    } finally {
        mongoose.connection.close().then(() => console.log('Connection closed.')).catch(console.error);
    }
});



async function createAdmin(email, displayName, password) {
    try {
        const existing = await UserModel.findOne({ email });
        if (existing) {
            throw new Error("Error creating Admin! (email) already exists(Ran script twice?).");
            // console.log("Error creating Admin! (email) already exists(Ran script twice?).");
            return;
        }
        const display = await UserModel.findOne({ displayName });
        if (display) {
            // console.log("Error creating Admin! (display name) already exists(Ran script twice?).");
            throw new Error("Error creating Admin! (display name) already exists(Ran script twice?).");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let admin = new UserModel({
            firstName: 'Admins First Name',
            lastName: 'Admins Last Name',
            email: email,
            displayName: displayName,
            password: hashedPassword,
            role: 'admin',
            reputation: 1000
        });

        await admin.save();
        console.log(`Admin account created successfully, Credentials: email: ${email}, password: ${password}`);
    }
    catch (err) {
        console.error(err);
        throw err;
    }

}

async function createUser(first, last, email, displayName, password) {
    try {
        const existing = await UserModel.findOne({ email });
        if (existing) {
            throw new Error("Error creating User! (email) already exists(Ran script twice?).");
            // console.log("Error creating User! (email) already exists(Ran script twice?).");
            return;
        }
        const display = await UserModel.findOne({ displayName });
        if (display) {
            throw new Error("Error creating User! (display name) already exists(Ran script twice?).");
            // console.log("Error creating User! (display name) already exists(Ran script twice?).");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let user = new UserModel({
            firstName: first,
            lastName: last,
            email: email,
            displayName: displayName,
            password: hashedPassword,
        });
        const u = await user.save();
        console.log('User account created successfully');
        return u._id;
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}

async function createCommunity(name, description, createdBy, members) {
    try {
        const existing = await CommunityModel.findOne({ name });
        if (existing) {
            throw new Error("Error creating Community! (name) already exists(Ran script twice?).");
            // console.log("Error creating Community! (name) already exists(Ran script twice?).");
            return;
        }

        let community = new CommunityModel({
            name: name,
            description: description,
            postIDs: [],
            startDate: new Date(),
            members: members,
            createdBy: createdBy,
            memberCount: members.length
        });

        const u = await community.save();
        console.log('Community created successfully');
        return u._id;
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}

async function createPost(title, content, postedBy, communityID, commentIDs=[]) {
    try {
        let post = new PostModel({
            title: title,
            content: content,
            postedBy: postedBy,
            commentIDs: commentIDs
        });

        const u = await post.save();
        console.log('Post created successfully');
        
        const community = await CommunityModel.findById(communityID);
        community.postIDs.push(u._id);
        await community.save();
        console.log('Post added to community');
        return u._id;
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}

async function createComment(postID, content, commentedBy, commentIDs=[]) {
    try {
        let comment = new CommentModel({
            content: content,
            commentedBy: commentedBy,
            commentIDs: commentIDs
        });

        const u = await comment.save();
        console.log('Comment created successfully');

        const post = await PostModel.findById(postID);
        post.commentIDs.push(u._id);
        await post.save();
        console.log('Comment added to post');
        return u._id;
    }
    catch (err) {
        throw err;
        console.error(err);
    }
}