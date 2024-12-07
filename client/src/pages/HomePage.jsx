import { useEffect, useState } from "react"
import Header from "../components/Header"
import NavBar from "../components/Navbar"
import Post from "../components/Post"
import { sortPosts } from "../components/utils.js"
import "../stylesheets/HomePage.css"
import "../stylesheets/index.css"
import axios from "axios"

const HomePage = () => {

    const [posts, setPosts] = useState([]);
    const [numPosts, setNumPosts] = useState(0);
    const [sort, setSort] = useState("Newest"); // active sort not working for now

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get("http://localhost:8000/posts");
                const s = await sortPosts(sort, response.data); // Need to AWAIT or it will cause errors
                setPosts(s);
                setNumPosts(response.data.length);
            } catch (error) {
                console.error(error);
            }
        }
        fetchPosts();
    }, [sort]);

    return (
        <div>
            <Header />
            <div className="containerSideMain">
                <NavBar />
                <div id="main" className="main">
                    <header>
                        <h2 id="allposts">All Posts</h2>
                        <div className="buttonContainer">
                            <button onClick={() => { setSort("Newest") }}>Newest</button>
                            <button onClick={() => { setSort("Oldest") }}>Oldest</button>
                            <button onClick={() => { setSort("Active") }}>Active</button>
                        </div>
                    </header>
                    <div className="postCountDiv">
                        <h3 id="numPosts">Number of Posts: {numPosts} </h3>
                    </div>
                    <div id="postContainer" className="postContainer">
                        {posts && posts.map((post) => {
                            return (
                                <Post key={post._id} post={post}></Post>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage;