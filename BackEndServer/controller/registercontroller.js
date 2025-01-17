// controllers/userController.js
const { registerUser } = require('../model/registermodel');

const register = async (req, res) => {
    const { username, email, password, type } = req.body;
    let profilePic = null;

    // Check if a profile picture file is attached
    if (req.file) {
        profilePic = req.file.path; // Store or reference the file path or URL
    }

    // Validation for required fields
    if (!(username && email && password && type)) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const newUser = await registerUser({ username, email, password, type, profilePic });
        res.status(201).json({ message: "Registration successful", user: newUser });
    } catch (error) {
        if (error.code === 'P2002') {
            res.status(409).json({ message: "User already exists" });
        } else {
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
    }
};

module.exports = { register };
