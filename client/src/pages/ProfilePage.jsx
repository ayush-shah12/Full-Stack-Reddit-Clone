import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { ViewContext } from "../context/ViewContext";
import Header from "../components/Header";
import NavBar from "../components/Navbar";
import { generateTimeStamp } from "../components/utils";
import axios from "axios";
import Post from "../components/Post";
import "../stylesheets/ProfilePage.css";

const ProfilePage = () => {
    const { authUser } = useContext(UserContext);

    const [selection, setSelection] = useState("Posts");
    const [posts, setPosts] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [comments, setComments] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (selection === "Posts") {
                    const response = await axios.get(`http://localhost:8000/users/${authUser.id}/posts`);
                    setPosts(response.data);
                } else if (selection === "Communities") {
                    const response = await axios.get(`http://localhost:8000/users/${authUser.id}/communities`);
                    setCommunities(response.data);
                } else if (selection === "Comments") {
                    const response = await axios.get(`http://localhost:8000/users/${authUser.id}/comments`);
                    setComments(response.data);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [selection, authUser.id]);


    function onClickCommunity(community) {
        alert(`Clicking this will allow you to edit the community named: ${community.name}`);
        return;
    }

    function renderComments() {
        return comments && comments.map((comment) => (
            <div key={comment.comment._id} className="linkToPost nav-link" onClick={() => { onClickComment(comment) }} style={{ cursor: "pointer" }}>
                <div className="comment">
                    <h4>
                        Post Title: {comment.postTitle}
                    </h4>
                    <h4>
                        Comment: {comment.comment.content.trim().substring(0, 20)}
                    </h4>
                </div>
            </div>
        ));
    }
    function onClickComment(comment) {
        alert(`Clicking this will allow you to edit the comment ID: ${comment.comment._id}`);
        return;
    }

    return (
        <div>
            <Header />
            <div className="containerSideMain">
                <NavBar />
                <div id="main" className="main">
                    <header>
                        <h2 id="allposts">u/{authUser.displayName}'s Profile</h2>
                        <div className="buttonContainer">
                            <button
                                className={selection === "Posts" ? "selected" : ""}
                                onClick={() => { setSelection("Posts") }}
                            >
                                Posts
                            </button>
                            <button
                                className={selection === "Communities" ? "selected" : ""}
                                onClick={() => { setSelection("Communities") }}
                            >
                                Communities
                            </button>
                            <button
                                className={selection === "Comments" ? "selected" : ""}
                                onClick={() => { setSelection("Comments") }}
                            >
                                Comments
                            </button>
                        </div>
                    </header>
                    <div className="postCountDiv">
                        <h4 id="numPosts">Email: {authUser.email}  </h4>
                        <h4 id="numPosts">Member Since: {generateTimeStamp(authUser.dateJoined)}  </h4>
                        <h4 id="numPosts">Reputation: {authUser.reputation}  </h4>
                    </div>

                    <div id="postContainer" className="postContainer">
                        {selection === "Posts" && (
                            posts.length > 0 ? (
                                posts.map((post) => (
                                    <Post key={post._id} post={post} profilePost={true} />
                                ))
                            ) : (
                                <p>No posts available.</p>
                            )
                        )}

                        {selection === "Communities" && (
                            communities.length > 0 ? (
                                communities.map((community) => (
                                    <div key={community._id} className="linkToPost nav-link" onClick={() => { onClickCommunity(community) }} style={{ cursor: "pointer" }}>
                                        <div className="profilePost">
                                            <div className="postTitle">
                                                <h3>{community.name}</h3>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No communities available.</p>
                            )
                        )}

                        {selection === "Comments" && (
                            comments.length > 0 ? (
                                renderComments()
                            ) : (
                                <p>No comments available.</p>
                            )
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default ProfilePage;


