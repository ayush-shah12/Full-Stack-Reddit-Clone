import { useContext, useEffect, useState } from 'react';
import { ViewContext } from '../context/ViewContext';
import { generateTimeStamp } from './utils';
import { UserContext } from '../context/UserContext';
import axios from 'axios';
import '../stylesheets/Post.css';
import neutralUpIcon from '../images/upvote_neutral.png'
import activeUpIcon from '../images/upvote_color.png'
import neutralDownIcon from '../images/downvote_neutral.png'
import activeDownIcon from '../images/downvote_color.png'


function Post({ post, fullPost = false, showCommunityName = true }) {
    const { setView, setPostID, setCommentID } = useContext(ViewContext);
    const { authUser } = useContext(UserContext); 

    const [communityName, setCommunityName] = useState('');
    const [linkFlair, setLinkFlair] = useState(null);
    const [numComments, setNumComments] = useState(0);

    const [votes, setVotes] = useState(post.votes);
    const [currentVote, setCurrentVote] = useState('none'); 

    const loggedIn = !!authUser;
    const canVote = loggedIn && authUser.reputation >= 50;

    // fetches ALL data for a post
    useEffect(() => {
        const fetchCommunityName = async () => {
            try {
                const name = await axios.get(`http://localhost:8000/communityName/${post._id}`);
                setCommunityName(`p/${name.data.communityName}`);
            }
            catch (error) {
                console.error("Error fetching community name:", error);
            }
        }

        const fetchLinkFlair = async () => {
            try {
                if (!post.linkFlairID) {
                    return;
                }
                const linkflair = await axios.get(`http://localhost:8000/linkFlairs/${post.linkFlairID}`);
                setLinkFlair(linkflair.data.content);
            }
            catch (error) {
                if (error.response) {
                    if (error.response.status === 404) {
                        console.log('Post has no linkflair');
                    } else {
                        console.error('Error fetching link flair:', error.response.data.error);
                    }
                    console.error("Error fetching link flair:", error);
                }
            }
        }
        const fetchCommentsCount = async (commentIDs) => {
            let count = 0;
            for (const commentID of commentIDs) {
                count++;                
                const response = await axios.get(`http://localhost:8000/comments/${commentID}`);
                const nestedCommentIDs = response.data.commentIDs;

                if (nestedCommentIDs.length > 0) {
                    for (const nestedCommentID of nestedCommentIDs) {
                        count += await fetchCommentsCount([nestedCommentID]);
                    }
                }
            }
            return count;
        };

        const getCommentsCount = async (commentIDs) => {
            const count = await fetchCommentsCount(commentIDs);
            setNumComments(count);
        };

        fetchCommunityName();
        fetchLinkFlair();
        getCommentsCount(post.commentIDs);

    },[post]);

    useEffect(() => {
        const fetchUserVote = async () => {
            if (!authUser || !post || !post._id) return;
            try {
                const response = await axios.get(`http://localhost:8000/posts/${post._id}/userVote`, { withCredentials: true});
                if (response.data && response.data.vote) {
                    setCurrentVote(response.data.vote);
                }
            } catch (error) {
                console.error("Failed to fetch user vote state:", error);
            }
        };
        fetchUserVote();
    }, [authUser, post]);
    

    function onClickPost(postID) {
        setView("PostPage");
        setPostID(postID);

        axios.put(`http://localhost:8000/posts/${postID}/incrementViews`)
            .catch(error => console.error("Error updating views :", error));
    }

    const handleUpvote = async () => {
        if (!canVote || post.postedBy._id === authUser.id) return; //if can't vote, do nothing
        try {
            const response = await axios.post(`http://localhost:8000/posts/${post._id}/vote`, {action:'up'}, {withCredentials:true});
            if(response.data.success) {
                setVotes(response.data.newVoteCount);
                setCurrentVote(response.data.newVoteState);
            }

        } catch(e) {
            console.error("Upvote failed", e);
        }
    };

    const handleDownvote = async () => {
        if (!canVote || post.postedBy._id === authUser.id) return; //if can't vote, do nothing
        try {
            const response = await axios.post(`http://localhost:8000/posts/${post._id}/vote`, 
                {action: 'down'}, 
                {withCredentials:true}
            );
            if(response.data.success){
                setVotes(response.data.newVoteCount);
                setCurrentVote(response.data.newVoteState);
            }
        } catch(error) {
            console.error("Downvote failed:", error);
        }
    };

    //icon to show:
    let upIcon = neutralUpIcon;
    let downIcon = neutralDownIcon;

    if (currentVote === 'up') {
        upIcon = activeUpIcon;
    } 
    if (currentVote === 'down') {
        downIcon = activeDownIcon;
    }


    //if user not logged in or rep < 50, we display icons but they're disabled.
    //if guest is viewing post page do not display at all.
    let votingSection = null;
    if (fullPost) {
        if (loggedIn) {
            votingSection = (
                <div className="votingSection">
                    <img 
                        src={upIcon} 
                        alt="upvote" 
                        onClick={canVote ? handleUpvote : undefined}
                        style={{ cursor: (canVote || post.postedBy._id === authUser.id) ? 'pointer' : 'not-allowed', opacity: canVote ? 1 : 0.5 }}
                    />
                    <img 
                        src={downIcon} 
                        alt="downvote"
                        onClick={canVote ? handleDownvote : undefined}
                        style={{ cursor: (canVote || post.postedBy._id === authUser.id)? 'pointer' : 'not-allowed', opacity: canVote ? 1 : 0.5 }}
                    />
                </div>
            );
        } 
        //if guest  don't show any voting icons
    }
    let commentButton = null;
    if (fullPost && loggedIn) {
        commentButton = (
            <div className="addCommentButtonContainer">
                <button onClick={() => {
                    setCommentID(null);
                    setView("NewComment");
                }}>Comment</button>
            </div>
        );
    }


    if (!fullPost) {
        return (
            <div className="linkToPost nav-link" onClick={() => onClickPost(post._id)} style={{ cursor: "pointer" }}>
                <div className="post">
                    <div className="postHeader">
                        <p> u/{post.postedBy.displayName}
                            {showCommunityName ? ` • ${communityName} ` : " "}
                            • {generateTimeStamp(post.postedDate)}</p>
                    </div>
                    <div className="postTitle">
                        <h3>{post.title}</h3>
                    </div>
                    {linkFlair && <div className="linkFlair"><p>{linkFlair}</p></div>}
                    <div className="postTextPreview">
                        <p>{post.content.trim().substring(0, 80)}</p>
                    </div>
                    <div className="postFooter">
                        <p>{post.views} views • {numComments} comments • {votes} votes</p>
                    </div>
                    {votingSection}
                </div>
            </div>
        );
    } else {
        return (
            <div className="postPage">
                <div className="topHeader">
                    <p>{communityName} • {generateTimeStamp(post.postedDate)}</p>
                </div>
                <div className="postAuthor">
                    <p>u/{post.postedBy.displayName}</p>
                </div>
                <div className="postTitle">
                    <h3>{post.title}</h3>
                </div>
                {linkFlair && <div className="linkFlair"><p>{linkFlair}</p></div>}
                <div className="postContent">
                    <p>{post.content}</p>
                </div>
                <div className="postFooter">
                    <p>{post.views} views • {numComments} comments • {votes} votes</p>
                </div>
                {votingSection}
                {commentButton}
            </div>
        );
    }
}

export default Post;
