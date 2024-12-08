import "../stylesheets/LoginPage.css";
import { useContext, useState } from "react";
import { ViewContext } from "../context/ViewContext";
import axios from "axios";

const Register = () => {
    const { setView } = useContext(ViewContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [displayName, setDisplayName] = useState("")

    const handleLogin = () => {
        setView("Login");
    };

    const handleRegister = async () => {
        try {
            const response = await axios.post("http://localhost:8000/auth/register", {
                email: email,
                password: password,
                firstName: firstName,
                lastName: lastName,
                displayName: displayName
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true,
                validateStatus: () => true
            });

            if (response.status === 200) {
                console.log("User registered successfully");
                setView("WelcomePage");
            }
            else if (response.status === 409) {
                alert("Email already exists");
                console.error("User already exists");
            }
            else {
                alert("A server error occurred. Please try again.");
                console.error("An error occurred");
            }

        } catch (error) {
            alert("A server error occurred. Please try again.");
            console.error("There was an error registering!", error);
        }
    };

    const handleGuest = () => {
        setView("Home");
    };

    return (
        <div className="welcome-container">
            <div className="welcome-content">
                <h1>Register!</h1>
                <input
                    type="firstName"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                    type="lastName"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                />
                 <input
                    type="displayName"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
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
                <button onClick={handleRegister}>Register</button>
                <button onClick={handleLogin}>To Login Page</button>
                <button onClick={handleGuest}>Continue as Guest</button>
            </div>
        </div>
    );
};

export default Register;