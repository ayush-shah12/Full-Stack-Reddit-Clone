import { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/UserContext";
import axios from "axios";
import { ViewContext } from "../context/ViewContext";
import "../stylesheets/Navbar.css";

const NavBar = () => {

  const [communities, setCommunities] = useState([]);
  const { view, setView, communityID, setCommunityID } = useContext(ViewContext);
  const { authUser } = useContext(UserContext); 

  
  const handleNavigation = (targetView, params = {}) => {
    setView(targetView);
    if(params.communityID) {
      setCommunityID(params.communityID);
    }
    else{
      setCommunityID(null);
    }
  };

  useEffect(() => {
    const fetchCommunities = async () => {
        try {
            const response = await axios.get("http://localhost:8000/communities");
<<<<<<< Updated upstream
            setCommunities(response.data);
=======
           let allCommunities = response.data;
           if(authUser){
            //sort comms so that the ones joined by the user appear first
            const joinedCommunities = allCommunities.filter(c => c.members && c.members.includes(authUser.id));
            const otherCommunities = allCommunities.filter(c=>!c.members || !c.members.includes(authUser.id));
            allCommunities = [...joinedCommunities, ...otherCommunities];
           }
           setCommunities(allCommunities);
>>>>>>> Stashed changes
            
        } catch (error) {
            console.error(error);
        }
    }
    fetchCommunities();
}, []);

  const handleCreateCommunity = () => {
    if (authUser) {
      handleNavigation("CreateCommunity");
   } else {
      // guest user scenario
      alert("Please log in to create a community.");
   }
  };
  return (
    <div className="sidebar">
      <ul>
        <div style={{ cursor: "pointer" }} 
        onClick={() => { setView("Home"); setCommunityID(null); }} className="nav-link active">
          <li style={{backgroundColor: (view === "Home") ? "rgb(220, 61, 43)" : ""}}
          className="home-link">
            Home
          </li>
        </div>
        <hr className="nav-divider" />
        <h3 className="communities-header" style={{ marginLeft: "5px", marginBottom: "5px" }}>
          Communities
        </h3>
        <div className="create-community-link">
          <li className={`createCommunity${view ==="CreateCommunity" ? "active" : ""}
          ${!authUser? "disabled-community" : ""}`}
           style={{ cursor: authUser? "pointer" : "not-allowed", paddingLeft: "40px", backgroundColor: (view === "CreateCommunity") ? "rgb(220, 61, 43)" : "", opacity: !authUser ? 0.5 : 1 }}
           onClick= {handleCreateCommunity}>
            Create Community
          </li>
        </div>
        <li className="list-communities-li">
          <ol id="list-communities-ol" className="list-communities-ol">
            {communities.map((community) => (
              <li key={community._id}>
                <div 
                  className="nav-link"
                  style={{cursor: "pointer"}}
                  onClick = {() => {
                    setView("CommunityPage"); 
                    setCommunityID(community._id);
                  }}
                >
                  <p style={{color: (view === "CommunityPage" && community._id === communityID) ? "rgb(220, 61, 43)" : "", fontWeight: (view === "CommunityPage" && community._id === communityID) ? "bold" : ""}}>p/{community.name}</p>
                </div>
              </li>
            ))}
          </ol>
        </li>
      </ul>
    </div>
  );
}

export default NavBar;