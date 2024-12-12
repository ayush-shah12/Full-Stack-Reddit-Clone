import { useContext, useState } from "react";
import { ViewContext } from "../context/ViewContext";
import { UserContext } from "../context/UserContext";
import axios from "axios"
import redditLogo from "../images/redditLogoTransparent.png";
import "../stylesheets/Header.css";
import "../stylesheets/index.css";

const Header = () => {
    const {view, setView, setSearchQuery, setSearchResults } = useContext(ViewContext);
    const [searchInput, setSearchInput] = useState("");
    const { authUser, setAuthUser } = useContext(UserContext);

    // if the user is logged in, clicking the logo should take them to the home page
    // if the user is not logged in, clicking the logo should take them to the welcome page
    const logoClick = () =>{
        if(authUser){
            setSearchInput("")
            setView("Home");
        }
        else{
            setSearchInput("")
            setView("WelcomePage");
        }
    }

    const handleSearchInputChange = (e) => {
        setSearchInput(e.target.value);
      };
    
      const handleSearchKeyPress = async (e) => {
        if (e.key === "Enter") {
          //trigger the search
          try {
            //send search query to the server:
            const response = await axios.get('http://localhost:8000/search', {
              params: { query: searchInput }
            });
            setSearchResults(response.data);
            setSearchQuery(searchInput);

            setView("SearchPage");
            setSearchInput(""); //clear the search input
          }
          catch(error) {
            console.error ("Search Failed: ", error);
          }
          
        }
      };

      const handleLogout = async () => {
        try {
            await axios.post("http://localhost:8000/auth/logout", {}, { withCredentials: true });
            setAuthUser(null);
            setView("WelcomePage");
        } catch (error) {
            console.error("Error logging out:", error);
            alert("Logout failed. Please try again");
        }
    };

    const handleProfileClick = () => {
      if(authUser) {
        if(authUser.role === "admin"){
          setView("AdminPage");
        }
        else{
          setView("ProfilePage");
        }
      }
      else {
        alert("Please log in to view profile.");
      }
    };

    const handleCreatePost = () => {
      if(authUser) {
        setView("NewPost");
      } else {
        alert("Please log in to create a post");
      }
    };
    
    return (
        <nav>
            <div style={{cursor: "pointer"}}
            onClick={logoClick}
              className="nav-link logo-name">
                <img src={redditLogo} alt="logo" className="logo"/>
                    <p style={{paddingLeft: "5%"}}>phreddit</p>
            </div>

            <input 
            type="text" 
            id="searchBox" 
            placeholder="Search Phreddit..." 
            className="search"
            value={searchInput}
            onChange={handleSearchInputChange}
            onKeyDown={handleSearchKeyPress}/>

        <div className="button-container">
                <button style={{backgroundColor: (view === "NewPost") ? "rgb(220, 61, 43)" : ""}} 
                className={`create nav-link ${!authUser ? 'disabled-button' : ''}`}
                onClick={handleCreatePost}
                disabled = {!authUser}>
                    Create Post
                </button>
                {/* profile button */}
                <button className="user nav-link" onClick={handleProfileClick}>
                  {authUser ? authUser.displayName : "Guest"}
                </button>

                {authUser && (
                <button className="logout nav-link" onClick={handleLogout}>
                    Logout
                </button>
            )}

            </div>
        </nav>
    );
}

export default Header;

