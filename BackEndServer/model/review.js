const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const reviewDB = {
    insertReview: async function (userid, movieID, content, rating) {
        try {
            const result = await prisma.review.create({
                data: {
                    userID: parseInt(userid, 10), // Convert to integer
                    movieID: parseInt(movieID, 10), // Convert to integer
                    content: content,
                    rating: parseInt(rating, 10), // Ensure rating is also an integer
                },
            });
            return result; // Return the created review
        } catch (err) {
            console.error("Error inserting review:", err);
            throw err; // Propagate the error
        }
    },

    getReviewByMovieID: async function (movieID) {
        try {
            const results = await prisma.review.findMany({
                where: {
                    movieID: parseInt(movieID),
                },
                include: {
                    user: {
                        select: {
                            username: true,
                            profilePicUrl: true, // Use camelCase here
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc', // Use camelCase here
                },
            });
    
            const formattedResults = results.map((review) => ({
                movieID: review.movieID,
                content: review.content,
                rating: review.rating,
                username: review.user.username,
                profile_pic_url: review.user.profilePicUrl, // Map back to snake_case if needed
                created_at: review.createdAt.toISOString(),
            }));
    
            return formattedResults;
        } catch (err) {
            console.error("Error fetching reviews:", err);
            throw err;
        }
    }
    
    
};

module.exports = reviewDB;