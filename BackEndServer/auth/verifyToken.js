// var jwt = require('jsonwebtoken');

// var config = require('../model/databaseConfig');
// const { log } = require('console');

// function verifyToken(req, res, next) {
//     console.log(req.headers);

//     var token = req.headers['authorization']; //retrieve authorization header's content
//     console.log(token);

//     if (!token || !token.includes('Bearer')) { //process the token

//         res.status(403);
//         return res.send({ auth: 'false', message: 'Not authorized!' });
//     }

//     else {
//         token = token.split('Bearer ')[1]; //obtain the token's value
//         console.log("after if" + token);
//         console.log(config.key);
        
//         jwt.verify(token, "Assignment2key", function (err, decoded) { //verify token
//             if (err) {
//                 res.status(403);
//                 return res.send({ auth: false, message: 'Not authorized!' });
//             }
            
//             else {
//                 console.log("ssss");
//                 req.userid = decoded.userid; //decode the userid and store in req for use
//                 req.type = decoded.type; //decode the role and store in req for use
//                 next();
//             }
//         });
//     }
// }

// module.exports = verifyToken;
// const jwt = require('jsonwebtoken');
// const config = require('../model/databaseConfig');

// function verifyToken(req, res, next) {
//     console.log(req.headers);

//     var token = req.headers['authorization'];
//     console.log("Received token: " + token);

//     if (!token || !token.includes('Bearer ')) {
//         res.status(403);
//         return res.send({ auth: 'false', message: 'Not authorized!' });
//     }

//     token = token.split('Bearer ')[1]; // Extract token
//     console.log("Processed token: " + token);
    
//     jwt.verify(token, "Assignment2key", function (err, decoded) {
//         if (err) {
//             console.log("Error verifying token: ", err);
//             res.status(403);
//             return res.send({ auth: false, message: 'Not authorized!' });
//         }

//         console.log("Decoded Token: ", decoded);
//         req.userid = decoded.userID; // Use the correct field name as per your token structure
//         req.type = decoded.type;     // This seems correctly used

//         if (!req.userid || !req.type) {
//             console.log("Missing data in token!");
//             res.status(403);
//             return res.send({ auth: false, message: 'Token does not contain required data' });
//         }

//         console.log("User ID: " + req.userid); // Logging for debugging
//         console.log("User Type: " + req.type); // Logging for debugging
//         next();
//     });
// }

// module.exports = verifyToken;

const jwt = require('jsonwebtoken');
const config = require('../model/databaseConfig');

function verifyToken(req, res, next) {
    console.log("Headers:", req.headers);  // Debugging to see all headers

    var token = req.headers['authorization'];
    console.log("Received token:", token);

    // Check if the token is present and properly formatted
    if (!token || !token.includes('Bearer ')) {
        console.log("No valid token provided.");  // More informative debugging
        res.status(403);
        return res.json({ auth: 'false', message: 'Not authorized! Token missing or malformed.' });
    }

    // Extract the token from the header
    token = token.split('Bearer ')[1];
    console.log("Processed token:", token);

    // Verify the token
    jwt.verify(token, "Assignment2key", function (err, decoded) {
        if (err) {
            console.log("Error verifying token:", err);  // Detailed error logging
            res.status(403);
            return res.json({ auth: false, message: 'Not authorized! Invalid token.' });
        }

        // Log decoded token for debugging
        console.log("Decoded Token:", decoded);
        if (decoded) {
            req.userid = decoded.userID;  // Adjust according to your token structure
            req.type = decoded.type;

            if (!req.userid || !req.type) {
                console.log("Missing data in token!");
                res.status(403);
                return res.json({ auth: false, message: 'Token does not contain required user data' });
            }

            console.log("User ID:", req.userid);  // Logging user ID for debugging
            console.log("User Type:", req.type);  // Logging user type for debugging
            next();
        } else {
            res.status(403).json({ auth: false, message: "Token decoded but does not contain any data" });
        }
    });
}

module.exports = verifyToken;
