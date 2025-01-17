    const express = require('express');
    const bodyParser = require('body-parser');
    const cors = require('cors');
    const morgan = require('morgan');
    const path = require('path');
    const multer = require('multer');
    const jwt = require('jsonwebtoken');

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Import refactored models
    const userDB = require('../model/users');
    const genreDB = require('../model/genre');
    const theatreDB = require('../model/theatre');
    const movieDB = require('../model/movie');
    const reviewDB = require('../model/review');

    // Authentication middleware
    const verifyToken = require('../auth/verifyToken.js');

    const app = express();

    // CORS configuration
    app.use(cors());
    app.options('*', cors());

    // Body parsers
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    // Logging configuration
    const rfs = require('rotating-file-stream');
    const logDirectory = path.join(__dirname, '../log');
    const appLogStream = rfs.createStream('app.log', {
        interval: '1d', // rotate daily
        path: logDirectory,
    });

    morgan.token('exception', (req, res) => res.locals.err || '-');
    app.use(
        morgan(
            '{"exception": ":exception", "method": ":method", "url": ":url", "ip": ":remote-addr", "date": ":date[clf]"}',
            { stream: appLogStream }
        )
    );

    // Multer for file uploads
    const storage = multer.memoryStorage();
    const upload = multer({
        storage: storage,
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'image/jpeg') {
                cb(null, true);
            } else {
                cb(new Error('Only JPEG images are allowed'));
            }
        },
    });
// Check Role Endpoint
app.get('/CheckRole', verifyToken, (req, res) => {
    // Only use 'req' inside this function
    const user = req.user; // This should work fine inside the route handler
    if (user && user.role) {
        res.status(200).json({ role: user.role });
    } else {
        res.status(403).json({ message: 'Unauthorized access.' });
    }
});


// Login Endpoint
app.post('/users/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const { token, user } = await userDB.loginUser(email, password);
        const response = { success: true, token, user, message: 'You are successfully logged in!' };

        res.status(200).json(response);
    } catch (err) {
        res.status(401).json({ message: 'Invalid email or password.' });
    }
});


// Logout endpoint
app.post('/users/logout', (req, res) => {
    res.clearCookie('rememberMeToken');
    res.status(200).json({ success: true, message: 'Log out successful!' });
});

// Register endpoint
app.post('/users/register', async (req, res) => {
    const { username, email, password, type, profilePicUrl } = req.body;

    try {
        const response = await userDB.registerUser(username, email, password, type, profilePicUrl);
        res.status(201).json(response);
    } catch (err) {
        res.status(400).json({ error: err.message || 'Registration failed.' });
    }
});

    // Get all users
app.get('/users', async (req, res) => {
    try {
        // Fetch all users from the database using Prisma
        const users = await userDB.findMany();

        // If no users are found
        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found.' });
        }

        // Return the list of users
        res.status(200).json({ users });
    } catch (err) {
        // Handle any errors that occur during the database query
        console.error(err);  // Optionally log the error for debugging
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
});

// GET /users/:userid
// GET /users/:userid
app.get('/users/:userid', async (req, res) => {
    const userID = req.params.userid;

    try {
        console.log(`Fetching user with ID: ${userID}`);
        const user = await userDB.getUserByUserid(userID); // Call the model function
        res.status(200).json(user);
    } catch (err) {
        console.error(`Error in /users/:userid:, err.message`);
        res.status(500).json({ message: err.message });
    }
});
    // Genre endpoints
    app.get('/genre', async (req, res) => {
        try {
            const genres = await genreDB.getAllGenre();
            res.status(200).json(genres);
        } catch (err) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    app.post('/genre', async (req, res) => {
        console.log(req.body); // Log the incoming data

        const { genreName, genreDescription } = req.body;

        if (!genreName || !genreDescription) {
            return res.status(400).json({ message: 'Genre name and description are required' });
        }

        try {
            const result = await genreDB.insertGenre(genreName, genreDescription);
            res.status(201).json({ message: 'Genre added successfully', result });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: err.message || 'Internal Server Error' });
        }
    });
    app.get('/theatre', async (req, res) => {
        try {
            const theatres = await theatreDB.getAllTheatre();
            res.status(200).json(theatres);
        } catch (err) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    app.post('/theatre', async (req, res) => {
        const { theatreName, theatreDescription } = req.body;

        // Validate required fields
        if (!theatreName || !theatreDescription) {
            return res.status(400).json({ message: 'Both theatreName and theatreDescription are required.' });
        }

        try {
            // Call the insertTheatre function
            const result = await theatreDB.insertTheatre(theatreName, theatreDescription);
            res.status(201).json({ message: 'Theatre added successfully', result });
        } catch (err) {
            console.log(err)
            // Handle unique constraint errors (P2002) or other errors
            if (err.code === 'P2002') {
                res.status(422).json({ message: 'Duplicate theatre name. Please use a unique name.', error: err.message });
            } else {
                res.status(500).json({ message: 'Internal Server Error', error: err.message });
            }
        }
    });
    // Movie endpoints
    app.get('/movie/:id', async (req, res) => {
        const { id } = req.params; // Extract the movie ID from the URL parameters
        try {
            const movie = await movieDB.getMovieByMovieId(id); // Fetch the movie from the database
            if (!movie) {
                res.status(404).json({ message: 'Movie not found' }); // If no movie is found, return a 404 error
            } else {
                res.status(200).json(movie); // If movie is found, return it with a 200 status
            }
        } catch (err) {
            res.status(500).json({ message: 'Internal Server Error' }); // Catch any errors and return a 500 status
        }
    });

    app.get('/movie', async (req, res) => {
        try {
            const movies = await movieDB.getAllMovie();
            res.status(200).json(movies);
        } catch (err) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // function for changing url to base64 for database to accept
// async function convertImageUrlToBase64(url) {
//     const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });
//     const buffer = Buffer.from(response.data, 'binary');
//     return buffer.toString('base64');
// }

app.post('/movie', upload.single('movie_image'), async function (req, res) {
    try {
        const { title, movie_description, price, theatreID, genreID, year, movie_image, rating} = req.body;
        //Change imageBuffer in line 166 to movieImageData below command is for converting
        // url to base64 for adding to database
        //const movieImageData = await convertImageUrlToBase64(req.body.movie_image);
        //console.log(movieImageData);
        let imageBuffer = req.body.movie_image;

        // Insert movie into the database
        const movie = await prisma.movie.create({
            data: {
                title,
                movieDescription: movie_description,
                year: parseInt(year),  // Convert year to integer
                movieImage: imageBuffer,
                rating: rating || 0,
            },
        });

        const movieID = movie.id;

        // Insert into movie_theatre
        const priceArr = price.split(',');
        const theatreArr = theatreID.split(',');
        const theatreData = priceArr.map((price, index) => ({
            movieID: movie.movieID,
            theatreID: parseInt(theatreArr[index]),
            price,
        }));

        await prisma.movieTheatre.createMany({
            data: theatreData,
        });

        // Insert into movie_genre
        const genreArr = genreID.split(',');
        const genreData = genreArr.map((genre) => ({
            movieID: movie.movieID,
            genreID: parseInt(genre),
        }));

        await prisma.movieGenre.createMany({
            data: genreData,
        });

        res.status(201).json({ message: `Movie ${movieID} created successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

    app.delete('/movie/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await movieDB.deleteMovie(id);
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // Review endpoints
    app.post('/users/:uid/movie/:mid/review', async (req, res) => {
        const { uid, mid } = req.params;
        const { content, rating } = req.body;
        try {
            const review = await reviewDB.insertReview(uid, mid, content, rating);
            res.status(201).json({ reviewID: review.id });
        } catch (err) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    app.get('/movie/:id/review', async (req, res) => {
        const { id } = req.params;
        try {
            const reviews = await reviewDB.getReviewByMovieID(id);
            res.status(200).json(reviews);
        } catch (err) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    // Search Movie Details
    app.get('/searchmoviedetails/:movieID', async function (req, res) {
        const movieID = req.params.movieID;

        try {
            const results = await movieDB.getSearchMovieDetail(movieID); // Await the updated function
            res.status(200).json(results); // Send the results as JSON with status 200
        } catch (err) {
            console.error(err);
            res.status(500).json({ Message: "Some error encountered!" }); // Send error response
        }
    });

    // Search Movie
    app.post('/searchmovie', async (req, res) => {
        const { input, theatreID, genreID } = req.body;
        try {
            const results = await movieDB.getSearchMovie(input, theatreID, genreID);
            res.status(200).json(results);
        } catch (err) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    });

    app.post('/users/:uid/movie/:mid/review', async (req, res) => {
        const { uid, mid } = req.params;
        const { content, rating } = req.body;

        try {
            const review = await reviewDB.insertReview(uid, mid, content, rating);
            res.status(201).json({ reviewID: review.reviewID });
        } catch (err) {
            console.error("Error in POST /review:", err);
            res.status(500).json({ message: 'Internal Server Error', error: err.message });
        }
    });

    app.get('/movie/:id/review', async (req, res) => {
        const { id } = req.params;

        try {
            const reviews = await reviewDB.getReviewByMovieID(id);
            res.status(200).json(reviews);
        } catch (err) {
            console.error("Error in GET /review:", err);
            res.status(500).json({ message: 'Internal Server Error', error: err.message });
        }
    });

    module.exports = app;