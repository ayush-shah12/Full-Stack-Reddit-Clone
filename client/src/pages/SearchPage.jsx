import { useContext, useEffect, useState } from "react"
import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Post from "../components/Post"
import { ViewContext } from "../context/ViewContext";
import { sortPosts } from "../components/utils.js";
import "../stylesheets/SearchPage.css"
import "../stylesheets/HomePage.css"


import NoResultsImage from "../images/NoResults.svg";
const SearchPage = () => {
    const { searchQuery, searchResults } = useContext(ViewContext);
    const [sortedResults, setSortedResults] = useState([]);
    const [sort,setSort] = useState("Newest");

    useEffect(() => {
        const sortAndSetResults = async () => {

        if(searchResults && searchResults.length > 0){
            const sorted = await sortPosts(sort, searchResults);
            setSortedResults(sorted);
        }
        else {
            setSortedResults([]);
        }
        };
        sortAndSetResults();
    }, [sort, searchResults]);
    return (
        <div>
            <Header />
            <div className = "containerSideMain">
            <Navbar />
            <div id = "main" className = "main">
                {sortedResults.length> 0 ? (
                    <>
                    <header>
                        <h2>Results for: {searchQuery}</h2>
                        <div className="buttonContainer">
                            <button onClick={() => setSort("Newest")}>Newest</button>
                            <button onClick={() => setSort("Oldest")}>Oldest</button>
                            <button onClick={() => setSort("Active")}>Active</button>
                        </div>
                    </header>
                    <div className="postCountDiv1">
                        <h3>Number of Posts: {sortedResults.length}</h3>
                    </div>
                    <div id="postContainer" className="postContainer">
                        {sortedResults.map((post) => (
                            <Post key={post._id} post={post} />
                        ))}
                    </div>
                </>
                ): (
                    <>
                    <header>
                        <h2>No results found for: {searchQuery}</h2>
                    </header>
                    <div className="postCountDiv1">
                        <h3>Number of Posts: {sortedResults.length}</h3>
                    </div>
                    <div id = "postContainer" className ="postContainer no-results-container">
                        <img src = {NoResultsImage} alt = "No results found" className = "no-results-image"></img>
                        <p>Hm... we couldn’t find any results</p>
                    </div>
                    </>
                )}
                </div>
            </div>
            </div>

                );
            };


export default SearchPage;