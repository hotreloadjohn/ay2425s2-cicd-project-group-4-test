const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const genreDB = {
    // Add a new genre
    async insertGenre(genreName, genreDescription) {
        try {
            const result = await prisma.genre.create({
                data: {
                    genreName,         // Ensure this matches the Prisma schema
                    genreDescription,  // Ensure this matches the Prisma schema
                },
            });
            return result;
        } catch (err) {
            console.error(err);
            throw err;
        }
    },
    
    // Get all genres
    async getAllGenre() {
        try {
            const genres = await prisma.genre.findMany();
            return genres; // Return all genres
        } catch (err) {
            console.error('Error fetching genres:', err);
            throw err; // Handle errors
        }
    }
};

module.exports = genreDB;
