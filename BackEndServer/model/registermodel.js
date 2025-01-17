// models/userModel.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function registerUser(userData) {
    const { username, email, password, type, profilePic } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user in the database
    const newUser = await prisma.user.create({
        data: {
            username,
            email,
            password: hashedPassword,
            type,
            profilePic
        }
    });
    
    return newUser;
}

module.exports = { registerUser };
