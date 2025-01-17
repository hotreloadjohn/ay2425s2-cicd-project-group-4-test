const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const theatreDB = {
    // Get all theatres
    async getAllTheatre() {
        try {
          const results = await prisma.theatre.findMany();
          return results; // Return the fetched theatres
        } catch (err) {
          console.error("Error fetching theatres:", err);
          throw err; // Rethrow the error for the caller to handle
        }
      },

    // Add a new theatre
insertTheatre: async function (theatreName, theatreDescription) {
  try {
      // Ensure the correct field names from the Prisma schema are used
      const result = await prisma.theatre.create({
          data: {
              theatre: theatreName, // 'theatre' field should match the schema
              description: theatreDescription, // 'description' field should match the schema
          },
      });
      return result; // Return the result
  } catch (err) {
      throw err; // Ensure errors propagate correctly
      
  }
},

    // Get movies based on theatre name
    async getMovieByTheatreName(theatre_name, callback) {
        try {
          // Validate theatre_name input
          if (!theatre_name || typeof theatre_name !== "string") {
            return callback(new Error("Invalid theatre name provided."), null);
          }
    
          // Fetch movies with the specified theatre name
          const results = await prisma.movie.findMany({
            where: {
              movie_theatre: {
                some: {
                  theatre: {
                    theatre_name: theatre_name,
                  },
                },
              },
            },
            include: {
              movie_theatre: {
                include: {
                  theatre: true, // Include related theatre details
                },
              },
              movie_genre: {
                include: {
                  genre: true, // Include related genre details
                },
              },
            },
          });
    
          // Format the results into the desired structure
          const formattedResults = results.map((movie) => ({
            movieid: movie.id,
            title: movie.title,
            description: movie.movie_description,
            year: movie.year,
            created_at: movie.created_at.toISOString(),
            theatre: movie.movie_theatre.map((mt) => mt.theatre.theatre_name).join(", "),
            genres: movie.movie_genre.map((mg) => ({
              genreid: mg.genre.id,
              genrename: mg.genre.genrename,
            })),
            prices: movie.movie_theatre.map((mt) => mt.price),
          }));
    
          // Pass formatted results to the callback
          callback(null, formattedResults);
        } catch (err) {
          console.error("Error fetching movies by theatre name:", err);
          callback(err, null); // Pass the error to the callback
        }
      },
    };

module.exports = theatreDB;