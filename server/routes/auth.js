const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');

const router = express.Router();
const JWT_SECRET = 'fe95e4372bd1ad3d6a00fc0dd2d5f0743dee17247c1cbd3f9a2efafc6274f744'; // do not change 

router.post('/register', async (req, res) => {
    const { firstName, lastName, email, displayName, password } = req.body;

    if (!firstName || !lastName || !email || !displayName || !password) {
        return res.status(400).json("All fields are required.");
    }
    //email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json("invalid email format.");
    }
    //check if password contains user info
    const lowerPass = password.toLowerCase();
    if (
        lowerPass.includes(firstName.toLowerCase()) ||
        lowerPass.includes(lastName.toLowerCase()) ||
        lowerPass.includes(displayName.toLowerCase()) ||
        lowerPass.includes(email.toLowerCase())
    ) {
        return res.status(400).json("Password cannot contain your first/last name, display name, or email.");
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("User (email) already exists.");
            return res.status(409).json("User (email) already exists.");
        }

        //check if display name already exist:
        const existingUserDisplay = await User.findOne({ displayName });
        if (existingUserDisplay) {
            return res.status(409).json("Display name already taken.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            firstName,
            lastName,
            email,
            displayName,
            password: hashedPassword
        });

        await newUser.save();

        res.status(200).json("User registered successfully.");
    } catch (err) {
        console.error(err);
        res.status(500).json("Server error.");
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json("Email and password are required.");
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json("Invalid credentials.");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            
            return res.status(401).json("Invalid credentials.");
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, displayName: user.displayName, firstName: user.firstName, lastName: user.lastName },
            JWT_SECRET,
            { expiresIn: '5h' }
        );

        res.cookie("token", token, {
            httpOnly: true,
            // secure: true, might not work over localhost(http)
            sameSite: "Strict",
            maxAge: (5 * 3600000)
        });

        res.status(200).json({
            id: user._id,
            displayName: user.displayName,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
        });
    } catch (err) {
        console.error(err);
        res.status(500).json("Server error.");
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie("token");
    res.status(200).json("Logged out successfully.");
});

router.get('/token', async (req, res) => {

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json("Not authenticated (No User Logged In).");
    }
    try {
        const t = jwt.verify(token, JWT_SECRET);
        res.status(200).json(t);
    } catch (err) {
        console.error(err);
        res.status(500).json("Invalid Token.");
    }
});

module.exports = router;
