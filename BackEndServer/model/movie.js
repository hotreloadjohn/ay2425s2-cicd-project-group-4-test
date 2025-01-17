const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const movieDB = {
    async getSearchMovie(input, theatreID, genreID) {
        try {
          // Convert theatreID and genreID to integers if they are provided
          const parsedTheatreID = theatreID ? parseInt(theatreID) : undefined;
          const parsedGenreID = genreID ? parseInt(genreID) : undefined;
      
          // Log the inputs for debugging
          console.log("Searching for:", input);
          console.log("TheatreID:", parsedTheatreID);
          console.log("GenreID:", parsedGenreID);
      
          // Perform the Prisma query to fetch movies
          const results = await prisma.movie.findMany({
            where: {
              title: {
                contains: input, // Use the input from the request
                mode: "insensitive", // Case-insensitive matching
              },
              // Apply filters for theatreID if provided
              theatres: parsedTheatreID
                ? {
                    some: {
                      theatre: {
                        theatreID: parsedTheatreID, // Filter movies by theatreID
                      },
                    },
                  }
                : undefined,
              // Apply filters for genreID if provided
              genres: parsedGenreID
                ? {
                    some: {
                      genre: {
                        genreID: parsedGenreID, // Filter movies by genreID
                      },
                    },
                  }
                : undefined,
            },
            include: {
              theatres: {
                include: {
                  theatre: true, // Include the theatre details for each movie
                },
              },
              genres: {
                include: {
                  genre: true, // Include the genre details for each movie
                },
              },
            },
          });
      
          // Convert movie images to base64 if present
          results.forEach((result) => {
            if (result.movieImage) {
              result.movieImage = Buffer.from(result.movieImage).toString("base64");
            }
          });
      
          // Return the filtered results
          return results;
        } catch (err) {
          console.error("Error fetching movies:", err);
          throw err; // Re-throw the error to be caught by the controller
        }
      },

    // Get the ID for movie theatre
    get_Theatre_ID: async function (movieID, callback) {
        try {
            const results = await prisma.movieTheatre.findMany({
                where: { movieID: parseInt(movieID) },
                select: { movie_theatreID: true },
            });

            const Theatre_IDs = results.map((result) => result.movie_theatreID);
            callback(null, Theatre_IDs);
        } catch (err) {
            callback(err, null);
        }
    },

    // Update theatre id and price of movie
    updateTheatre: async function (movieID, theatreID, price, Theatre_IDs, callback) {
        try {
            const priceArr = price.split(',');
            const theatreArr = theatreID.split(',');

            for (let i = 0; i < theatreArr.length; i++) {
                if (i < Theatre_IDs.length) {
                    await prisma.movie_theatre.update({
                        where: { movie_theatreID: Theatre_IDs[i] },
                        data: {
                            theatreID: parseInt(theatreArr[i]),
                            price: parseFloat(priceArr[i]),
                        },
                    });
                } else {
                    await prisma.movie_theatre.create({
                        data: {
                            movieID: parseInt(movieID),
                            theatreID: parseInt(theatreArr[i]),
                            price: parseFloat(priceArr[i]),
                        },
                    });
                }
            }

            callback(null, { message: "Updated successfully" });
        } catch (err) {
            callback(err, null);
        }
    },

    insertMovie_Theatre: function (movieID, price, theatreID, callback) {
        try {
            // Assuming price and theatreID are strings, you can pass arrays of price and theatreID
            const priceArr = price.split(',');
            const theatreArr = theatreID.split(',');
    
            // Insert multiple records in one go (bulk insert)
            const theatreData = priceArr.map((price, index) => ({
                movieID: movieID,
                theatreID: parseInt(theatreArr[index]),
                price: price,
            }));
    
            prisma.movieTheatre.createMany({
                data: theatreData,
            }).then(() => {
                callback(null);
            }).catch((err) => {
                callback(err, null);
            });
        } catch (err) {
            callback(err, null);
        }
    },

    insertMovie_Genre: function (movieID, genreID, callback) {
        try {
            // Split genreID if multiple genres are passed
            const genreArr = genreID.split(',');
    
            // Map genreID array to the structure expected by Prisma
            const genreData = genreArr.map((genre) => ({
                movieID: movieID,
                genreID: parseInt(genre),
            }));
    
            // Use Prisma to create many movie_genre entries
            prisma.movieGenre.createMany({
                data: genreData,
            }).then(() => {
                callback(null);
            }).catch((err) => {
                callback(err, null);
            });
        } catch (err) {
            callback(err, null);
        }
    },

    insertMovie: function (title, movie_description, year, movie_image, callback) {
        try {
            // Assuming the movie image is uploaded and contains a buffer
            const imagePath = movie_image ? movie_image.path : null;
    
            // Insert the movie into the database using Prisma
            prisma.movie.create({
                data: {
                    title,
                    movie_description: movie_description,
                    year: parseInt(year),  // Ensure year is stored as an integer
                    movie_image: imagePath, // Store the image path instead of the buffer
                }
            }).then((results) => {
                callback(null, results);
            }).catch((err) => {
                callback(err, null);
            });
        } catch (err) {
            callback(err, null);
        }
    },

    // Get all Movies Available
    getAllMovie: async function () {
        try {
            const results = await prisma.movie.findMany();
            return results; // Return the result instead of using a callback
        } catch (err) {
            console.error("Error fetching movies:", err);
            throw new Error('Error fetching movies'); // Throw error for handling at a higher level
        }
    },

    // Get Movie By Id
    async getMovieByMovieId(movieID) {
        try {
            // Validate movieID
            const id = parseInt(movieID);
            if (isNaN(id)) {
                throw new Error("Invalid movieID provided.");
            }
    
            // Fetch the movie by ID
            const result = await prisma.movie.findUnique({
                where: { movieID: id },
                include: {
                    theatres: {  // Use 'theatres' instead of 'movie_theatre'
                        include: { theatre: true }, // Include associated theatre details
                    },
                    genres: {  // Use 'genres' instead of 'movie_genre'
                        include: { genre: true }, // Include associated genre details
                    },
                },
            });
    
            // Convert image to base64 if it exists
            if (result && result.movieImage) {
                result.movieImage = Buffer.from(result.movieImage).toString('base64');
            }
    
            // Return the result
            return result;
        } catch (err) {
            console.error("Error fetching movie by ID:", err);
            throw err; // Rethrow the error for the caller to handle
        }
    },

    getSearchMovieDetail: function (movieID, callback) {

        var dbConn = db.getConnection();

        dbConn.connect(function (err) {

            if (err) {

                return callback(err, null);
            }

            else {

                var getMovieInfoSql = `SELECT m.movieID, m.title, m.movie_image, m.year, m.movie_description,
                                            GROUP_CONCAT(DISTINCT theatre_name) AS theatres,
                                            GROUP_CONCAT(DISTINCT genrename) AS genres,
                                            GROUP_CONCAT(DISTINCT price) AS prices
                                        FROM cicd_ca1.movie m
                                        JOIN movie_theatre mt ON m.movieID = mt.movieID
                                        JOIN cicd_ca1.theatre t ON mt.fk_theatre = t.theatreID
                                        JOIN movie_genre mg ON m.movieID = mg.movieID
                                        JOIN cicd_ca1.genre g ON mg.fk_genre = g.genreID
                                        WHERE movieID = ?
                                        GROUP BY m.movieID, m.title`;

                dbConn.query(getMovieInfoSql, [movieID], function (err, results) {

                    if (err) {

                        dbConn.end();
                        return callback(err, null);
                    }

                    else {

                        dbConn.end();

                        results.forEach((result) => {
                            const imageBuffer = result.movie_image;
                            const base64Image = imageBuffer.toString('base64');
                            result.movie_image = base64Image;
                        });

                        return callback(err, results);
                    }
                });
            }
        });
    },

    getSearchMovieDetail: async function (movieID) {
        try {
            const results = await prisma.movie.findMany({
                where: {
                    movieID: parseInt(movieID),
                },
                include: {
                    theatres: {
                        include: {
                            theatre: true, // Fetch the related theatre details
                        },
                    },
                    genres: {
                        include: {
                            genre: true, // Fetch the related genre details
                        },
                    },
                },
            });
    
            // Process the results to match your output format
            const processedResults = results.map((result) => {
                const theatres = result.theatres.map((mt) => mt.theatre.theatre).join(',');
                const genres = result.genres.map((mg) => mg.genre.genreName).join(',');
                const prices = result.theatres.map((mt) => mt.price).join(',');
    
                const base64Image = result.movieImage.toString('base64');
    
                return {
                    movieID: result.movieID,
                    title: result.title,
                    movie_image: base64Image,
                    year: result.year,
                    movie_description: result.movieDescription,
                    theatres,
                    genres,
                    prices,
                };
            });
    
            return processedResults; // Return the processed results
        } catch (err) {
            throw err; // Pass the error to the controller for handling
        }
    },

    // Delete a movie
    deleteMovie: async function (movieID, callback) {
        try {
            await prisma.movie.delete({
                where: { movieID: parseInt(movieID) },
            });

            callback(null, { message: "Deleted successfully" });
        } catch (err) {
            callback(err, null);
        }
    },

    // Update a movie
    updateMovie: async function (title, movie_description, year, movie_image, movieID, callback) {
        try {
            const result = await prisma.movie.update({
                where: { movieID: parseInt(movieID) },
                data: {
                    title,
                    movie_description,
                    year: parseInt(year),
                    movie_image: movie_image.buffer,
                },
            });

            callback(null, result);
        } catch (err) {
            callback(err, null);
        }
    },
};

module.exports = movieDB;