import "../stylesheets/LoginPage.css";
import { useContext, useState } from "react";
import { ViewContext } from "../context/ViewContext";
import { UserContext } from "../context/UserContext";
import axios from "axios";

const Login = () => {
    const { setView } = useContext(ViewContext);
    const { setAuthUser } = useContext(UserContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const response = await axios.post("http://localhost:8000/auth/login", {
                email: email,
                password: password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true,
                validateStatus: () => true
            });

            if (response.status === 200) {
                setAuthUser(response.data);
                setView("Home");
            }
            else if (response.status === 401) {
                alert("Email and/or password is incorrect");
                console.error("Invalid credentials");
            }
            else {
                alert("A server error occurred. Please try again.");
                console.error("An error occurred");
            }

        } catch (error) {
            alert("A server error occurred. Please try again.");
            console.error("There was an error logging in!", error);
        }
    };
    const handleRegister = () => {
        setView("Register");
    };

    const handleGuest = () => {
        setView("Home");
    };

    return (
        <div className="welcome-container">
            <div className="welcome-content">
                <h1>Login!</h1>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={handleLogin}>Login</button>
                <button onClick={handleRegister}>To Register Page</button>
                <button onClick={handleGuest}>Continue as Guest</button>
            </div>
        </div>
    );
};

export default Login;