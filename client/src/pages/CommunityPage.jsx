import { useContext, useState, useEffect } from "react";
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Post from "../components/Post";
import { generateTimeStamp } from "../components/utils";
import { sortPosts } from "../components/utils.js";
import { ViewContext } from "../context/ViewContext";
import "../stylesheets/CommunityPage.css";
import "../stylesheets/index.css";
import axios from "axios";


const CommunityPage = () => {
    const { communityID } = useContext(ViewContext);
    const [sortOption, setSortOption] = useState("Newest");
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get("http://localhost:8000/communities/" + communityID);
                setCommunity(response.data);
                const response2 = await axios.get("http://localhost:8000/postsbycommunity/" + communityID);
                const s = await sortPosts(sortOption, response2.data); // Need to AWAIT or it will cause errors
                setPosts(s);
                
            } catch (error) {
                console.error(error);
            }
        }
        fetchPosts();

    }, [communityID, sortOption]);

    return (
        <div>
            <Header />
            <div className="containerSideMain">
                <Navbar />
                <div id="main" className="main">
                    <header className="communityHeader">
                        <div className="communityInfo">
                            <h2>p/{community && community.name}</h2>
                            <p>{community && community.description}</p>
                            <p>Created {generateTimeStamp(community && community.startDate)}</p>
                            <h4>Posts: {community && community.postIDs.length} | Members: {community && community.members.length}
                            </h4>
                        </div>

                        <div className="buttonContainer">
                            <button onClick={() => setSortOption("Newest")}>Newest</button>
                            <button onClick={() => setSortOption("Oldest")}>Oldest</button>
                            <button onClick={() => setSortOption("Active")}>Active</button>
                        </div>
                    </header>
                    <div id="postContainer" className="postContainer">
                        {posts.map((post) => (
                            <Post key={post._id} post={post} showCommunityName={false} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPage;