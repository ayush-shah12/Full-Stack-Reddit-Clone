import "../stylesheets/Comments.css";
import { useContext, useState, useEffect } from "react";
import { ViewContext } from "../context/ViewContext";
import { generateTimeStamp } from "./utils";
import image from "../images/thinking-snoo.png";
import axios from "axios";

const Comments = () => {

    const { postID, setView, setCommentID } = useContext(ViewContext);
    const [post, setPost] = useState(null);
    const [renderedComments, setRenderedComments] = useState([]);


    // Fetch the post object
    useEffect(() => {
        const getPost = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/posts/${postID}`);
                setPost(response.data);
            } catch (error) {
                console.error(error);
            }
        }
        getPost();
    }, [postID]);


    // same as original, just axios
    const getAllComments = async (dict, commentIDs, postID, initialComment = null) => {
        if (!dict[postID]) {
            dict[postID] = [];
        }

        for (const commentID of commentIDs) {

            try {
                let comment = await axios.get(`http://localhost:8000/comments/${commentID}`);
                comment = comment.data;

                dict[postID].push({
                    "commentID": commentID,
                    "commentDate": comment.commentedDate,
                    "initialComment": initialComment
                });

                if (comment.commentIDs.length > 0) {
                    await getAllComments(dict, comment.commentIDs, postID, commentID);
                }
            } catch (error) {
                console.error(`Error fetching comment ${commentID}:`, error);
            }
        }

        return dict;
    };

    // run once post is fetched, sets the rendered comments state to display later
    useEffect(() => {
        const fetchComments = async () => {
            if (post && post.commentIDs) {
                let dict = {};
                try {
                    await getAllComments(dict, post.commentIDs, postID);

                    let commentsNested = transformData(dict[postID]);
                    sortTopLevelComments(commentsNested);
                    sortReplies(commentsNested);
                    if (commentsNested.length > 0) {
                        const renderedComments = await renderComments(commentsNested);
                        setRenderedComments(renderedComments);
                    }
                } catch (error) {
                    console.error("Error fetching comments:", error);
                }
            }
        };

        fetchComments();;
    }, [post]); 



    function transformData(comments) {
        const commentMap = {};

        comments.forEach(comment => {
            commentMap[comment.commentID] = { ...comment, replies: [] };
        });

        const nestedComments = [];

        comments.forEach(comment => {
            if (comment.initialComment === null) {
                nestedComments.push(commentMap[comment.commentID]);
            } else {
                const parent = commentMap[comment.initialComment];
                if (parent) {
                    parent.replies.push(commentMap[comment.commentID]);
                }
            }
        });
        return (nestedComments);
    }

    function sortTopLevelComments(comments) {
        comments.sort((a, b) => new Date(b.commentDate) - new Date(a.commentDate));
    }

    function sortReplies(comments) {
        for (const commentObject of comments) {
            if (commentObject.replies.length > 0) {
                commentObject.replies.sort((a, b) => new Date(b.commentDate) - new Date(a.commentDate));
                sortReplies(commentObject.replies);
            }
        }
    }

    // changed to return the rendered comments instead of displaying them here, bc it is async and map doesn't work with async
    const renderComments = async (comments) => {
        const renderedComments = await Promise.all(
            comments.map(async (comment) => {
                const commentDataRes = await axios.get(`http://localhost:8000/comments/${comment.commentID}`);
                const commentData = commentDataRes.data;
                return (
                    <div key={comment.commentID} className="comment">
                        <div className="commentHeader">
                            <p>u/{commentData.commentedBy} • {generateTimeStamp(commentData.commentedDate)}</p>
                        </div>
    
                        <div className="commentContent">
                            <p>{commentData.content}</p>
                        </div>
    
                        <div className="commentFooter">
                            <button onClick={() => {
                                setCommentID(comment.commentID);
                                setView("NewComment");
                            }}>Reply</button>
                        </div>
    
                        {comment.replies.length > 0 && (
                            <div className="replies">
                                {await renderComments(comment.replies)}
                            </div>
                        )}
                    </div>
                );
            })
        );
    
        return renderedComments;
    };

    return (
        <div>
            {renderedComments.length > 0 ? (
                <div>{renderedComments}</div>
            ) : (
                <div>
                    <p>No Comments yet. Be the first to comment!</p>
                    <br />
                    <img className="noCommentsImage" src={image} alt="No Comments" />
                    <br />
                    <p>Nobody's responded to this post yet. Add your thoughts and get the conversation going.</p>
                </div>
            )}
        </div>
    );
}

export default Comments;
