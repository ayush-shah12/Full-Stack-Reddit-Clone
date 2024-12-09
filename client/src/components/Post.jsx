import { useContext, useEffect, useState } from 'react';
import { ViewContext } from '../context/ViewContext';
import { generateTimeStamp } from './utils';
import axios from 'axios';
import '../stylesheets/Post.css';

function Post({ post, fullPost = false, showCommunityName = true }) {
    const { setView, setPostID, setCommentID } = useContext(ViewContext);
    const [communityName, setCommunityName] = useState('');
    const [linkFlair, setLinkFlair] = useState(null);
    const [numComments, setNumComments] = useState(0);

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

    },);

    function onClickPost(postID) {
        setView("PostPage");
        setPostID(postID);

        axios.put(`http://localhost:8000/posts/${postID}/incrementViews`)
            .catch(error => console.error("Error updating views:", error));
    }

    if (!fullPost) {
        return (
            <div className="linkToPost nav-link" onClick={() => onClickPost(post._id)} style={{ cursor: "pointer" }}>
                <div className="post">
                    <div className="postHeader">
                        <p> u/{post.postedBy}
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
                        <p>{post.views} views • {numComments} comments • {post.votes} votes</p>
                    </div>
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
                    <p>u/{post.postedBy}</p>
                </div>
                <div className="postTitle">
                    <h3>{post.title}</h3>
                </div>
                {linkFlair && <div className="linkFlair"><p>{linkFlair}</p></div>}
                <div className="postContent">
                    <p>{post.content}</p>
                </div>
                <div className="postFooter">
                    <p>{post.views} views • {numComments} comments • {post.votes} votes</p>
                </div>
                <div className="addCommentButtonContainer">
                    <button onClick={() => {
                        setCommentID(null);
                        setView("NewComment");
                    }}>Comment</button>
                </div>
            </div>
        );
    }
}

export default Post;
