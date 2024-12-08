import React, { useContext } from 'react';
import { ViewContext } from "../context/ViewContext"; 
import { UserContext } from "../context/UserContext"; 
import "../stylesheets/WelcomePage.css";
import axios from 'axios';

const WelcomePage = () => {
    const { setView } = useContext(ViewContext);
    const { authUser, setAuthUser } = useContext(UserContext);

    // check if a valid token is stored currently
    const checkUser = async () => {
        const response = await axios.get("http://localhost:8000/auth/token", {
            withCredentials: true,
            validateStatus: () => true
        });

        if (response.status === 200) {
            setAuthUser(response.data);
        }
        else {
            console.log("No valid token found");
        }
        };


    const handleLoginClick = () => {
        setView('Login');
    };

    const handleRegisterClick = () => {
        setView('Register');
    };

    const handleGuestClick = () => {
        setView('Home');
    };

    if (authUser) {
        setView('Home');
    }
    else{
        checkUser();
    }

    return (
        <div className="welcome-container">
            <div className="welcome-content">
                <h1>Welcome to Phreddit!</h1>
                <h2>Please choose an option below:</h2>
                <button onClick={handleLoginClick}>Login</button>
                <button onClick={handleRegisterClick}>Register</button>
                <button onClick={handleGuestClick}>Continue as Guest</button>
            </div>
        </div>
    );
};

export default WelcomePage;
