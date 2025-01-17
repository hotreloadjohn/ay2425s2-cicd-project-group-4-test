const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config.js');
// const sendConfirmationEmail = require('../utils/sendConfirmationEmail'); // Assuming this is implemented

const prisma = new PrismaClient();

// function validateEmailAndPassword(email, password) {
//     const emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     const passwordRE = /^(?=.[a-z])(?=.[A-Z])(?=.\d)(?=.[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/;
//     return emailRE.test(email) && passwordRE.test(password);
// }

function validateEmailAndPassword(email, password) {
    const emailRE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/;
    return emailRE.test(email) && passwordRE.test(password);
}

const userDB = {
    // Get all users
    getAllUsers : async () => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    userID: true,
                    username: true,
                    email: true,
                    type: true,
                    profilePicUrl: true,
                    createdAt: true,
                },
            });
            return users;
        } catch (err) {
            throw new Error('Failed to fetch users.');
        }
    },

    // insertUser: async function (username, email, password, type, profile_pic_url) {
    //     console.error('Validation failed for email or password');

    //     if (!validateEmailAndPassword(email, password)) {
    //         throw new Error('Invalid email or password');
    //     }
    //     console.log(`Validating email: ${email} and password length: ${password.length}`);

    //     try {
    //         // Save the password directly without hashing
    //         const user = await prisma.user.create({
    //             data: {
    //                 username,
    //                 email,
    //                 password, // Save plaintext password
    //                 type,
    //                 profilePicUrl: profile_pic_url,
    //             },
    //         });
            
    //         return user;
    //     } catch (err) {
    //         throw new Error('Failed to add user.');
    //     }
    // },    
    // Improved error handling
    registerUser: async function(username, email, password, type, profilePicUrl) {
        if (!validateEmailAndPassword(email, password)) {
            throw new Error('Invalid email or password.');
        }

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ username }, { email }] }
        });

        if (existingUser) {
            throw new Error('Username or Email already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            const newUser = await prisma.user.create({
                data: {
                    username,
                    email,
                    password: hashedPassword,
                    type,
                    profilePicUrl
                }
            });
            return newUser;
        } catch (error) {
            console.error("Error creating user:", error);
            throw new Error('Failed to add user: ' + error.message);
        }
    },

    // Get user by user ID
    getUserByUserid: async function (userid) {
        try {
            const parsedID = parseInt(userid, 10);
            if (isNaN(parsedID)) {
                throw new Error('Invalid userID provided');
            }

            const user = await prisma.user.findUnique({
                where: { userID: parsedID },
                select: {
                    userID: true,
                    username: true,
                    email: true,
                    type: true,
                    profilePicUrl: true,
                    createdAt: true,
                },
            });

            if (!user) {
                throw new Error(`User with ID ${parsedID} not found.`);
            }

            return user;
        } catch (err) {
            throw new Error('Failed to fetch user.');
        }
    },

    loginUser: async function (email, password) {
        try {
            console.log('Attempting to log in with email:', email);
            const user = await prisma.user.findFirst({
                where: { email },
            });
    
            if (!user) {
                console.error('User not found for email:', email);
                throw new Error('Invalid email or password.');
            }
    
            console.log('User found:', user);
    
            // Directly compare plaintext passwords
            if (password !== user.password) {
                console.error('Password does not match for email:', email);
                throw new Error('Invalid email or password.');
            }
    
            console.log('Password matches! Generating token...');
            const token = jwt.sign({ userID: user.userID, type: user.type }, config.jwtSecret, {
                expiresIn: '24h',
            });
    
            return { token, user };
        } catch (err) {
            console.error('Login error:', err.message);
            throw new Error(err.message || 'Login failed.');
        }
    }
    
};

module.exports = userDB;