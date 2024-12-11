import React, { useContext, useEffect, useState } from "react";
import Header from "../components/Header";
import NavBar from "../components/Navbar";
import axios from "axios";
import { ViewContext } from "../context/ViewContext.jsx";
import "../stylesheets/NewComment.css";

const EditComment = () => {
    const { setView, commentID } = useContext(ViewContext);

    //state forms
    const [commentContent, setCommentContent] = useState("");

    //error states
    const [errors, setErrors] = useState({
        commentContent: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/comments/alldata/${commentID}`);
                setCommentContent(response.data.content);
            } catch (error) {
                console.error("Failed to fetch comment data", error);
                setErrors({
                    commentContent: "Failed to fetch original comment data",
                });
            }
        };

        fetchData();
    }, [commentID]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        let isValid = true;
        const validationErrors = {
            commentContent: "",
        };

        if (commentContent.trim() === "") {
            validationErrors.commentContent = "Comment content is required.";
            isValid = false;
        }
        else if (commentContent.length > 500) {
            validationErrors.commentContent = "Comment should not exceed 500 characters.";
            isValid = false;
        }

        setErrors(validationErrors);

        if (isValid) {
            try {
                const newCommentData = {
                    content: commentContent.trim(),
                };
                await axios.put(`http://localhost:8000/comments/update/${commentID}`, newCommentData);

                //reset
                setCommentContent("");
                setErrors({
                    commentContent: "",
                });
                setView("ProfilePage");
            }
            catch (error) {
                setErrors({
                    commentContent: "Failed to submit comment",
                });
                console.error("Failed to submit comment", error);
            }
        }
        else {
            setCommentContent(commentContent.trim());
        }
    };

    const handleDelete = async () => {
    //     try {
    //         await deleteCommentAndReplies(commentID);
    //         console.log("Comment and replies deleted successfully");
    //         setView("ProfilePage");
    //     } catch (error) {
    //         setErrors({
    //             server: "Failed to delete comment",
    //         });
    //         console.error("Failed to delete comment", error);
    //     }
    };

    // const deleteCommentAndReplies = async (commentID) => {
    //     try {
    //         const response = await axios.get(`http://localhost:8000/comments/${commentID}/replies`);
    //         const replies = response.data;

    //         console.log("replies", replies);
    //         for (const reply of replies) {
    //             await deleteCommentAndReplies(reply);
    //         }

    //         await axios.delete(`http://localhost:8000/comments/delete/${commentID}`);
    //         return;
    //     } catch (error) {
    //         console.error("Error deleting comment or its replies:", error);
    //         throw error;
    //     }
    // };

    return (
        <div>
            <Header />
            <div className="containerSideMain">
                <NavBar />
                <div id="main" className="main">
                    <div className="new-comment-container">
                        <h2>Add a Comment </h2>
                        <form onSubmit={handleSubmit} className="new-comment-form">
                            {/* comment content */}
                            <div className="form-group">
                                <label htmlFor="commentContent">
                                    Comment Content <span className="required">*</span>
                                </label>
                                <textarea
                                    id="commentContent"
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    maxLength="500"
                                    required></textarea>
                                {errors.commentContent && (
                                    <span className="error-message">{errors.commentContent}</span>

                                )}
                                <small>{commentContent.length}/500 chars</small>
                            </div>

                            <button type="submit" className="submit-comment-button">
                                Submit Comment
                            </button>
                        </form>
                        <button onClick={handleDelete} className="delete-comment-button">Delete Comment</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditComment;

