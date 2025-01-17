import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed Genres with `upsert` to avoid duplicates
const action = await prisma.genre.upsert({
  where: { genreName: 'Action' },
  update: {},
  create: {
    genreName: 'Action',
    genreDescription: 'Action-packed movies with intense sequences.',
  },
});

const drama = await prisma.genre.upsert({
  where: { genreName: 'Drama' },
  update: {},
  create: {
    genreName: 'Drama',
    genreDescription: 'Emotionally rich storytelling.',
  },
});

const comedy = await prisma.genre.upsert({
  where: { genreName: 'Comedy' },
  update: {},
  create: {
    genreName: 'Comedy',
    genreDescription: 'Light-hearted movies for a good laugh.',
  },
});

  // Seed Movies
  const movie1 = await prisma.movie.create({
    data: {
      title: 'The Dark Knight',
      movieDescription: 'A tale of a superhero who fights crime in Gotham City.',
      movieImage: 'https://example.com/dark-knight.jpg',
      rating: 9,
      year: 2008,
      genres: {
        create: [
          { genreID: action.genreID },
        ],
      },
    },
  });

  const movie2 = await prisma.movie.create({
    data: {
      title: 'Forrest Gump',
      movieDescription: 'A touching story of a man with an extraordinary life.',
      movieImage: 'https://example.com/forrest-gump.jpg',
      rating: 8,
      year: 1994,
      genres: {
        create: [
          { genreID: drama.genreID },
        ],
      },
    },
  });

  const movie3 = await prisma.movie.create({
    data: {
      title: 'The Hangover',
      movieDescription: 'A hilarious journey of a group of friends after a wild night.',
      movieImage: 'https://example.com/hangover.jpg',
      rating: 7,
      year: 2009,
      genres: {
        create: [
          { genreID: comedy.genreID },
        ],
      },
    },
  });

  // Seed Theatres
  const theatre1 = await prisma.theatre.create({
    data: {
      theatre: 'Cinema XXI',
      description: 'High-end cinema experience.',
      movies: {
        create: [
          { movieID: movie1.movieID, price: '12.50' },
          { movieID: movie2.movieID, price: '10.00' },
        ],
      },
    },
  });

  const theatre2 = await prisma.theatre.create({
    data: {
      theatre: 'Grand Cineplex',
      description: 'Premium movie experience.',
      movies: {
        create: [
          { movieID: movie3.movieID, price: '9.00' },
        ],
      },
    },
  });

  // Seed Users
  // Seed Users with `upsert` to avoid duplicates
const user1 = await prisma.user.upsert({
  where: { username: 'john_doe' },
  update: {},
  create: {
    username: 'john_doe',
    email: 'john.doe@example.com',
    password: 'securepassword',
    type: 'regular',
    profilePicUrl: 'https://example.com/john.jpg',
  },
});

const user2 = await prisma.user.upsert({
  where: { username: 'jane_smith' },
  update: {},
  create: {
    username: 'jane_smith',
    email: 'jane.smith@example.com',
    password: 'securepassword',
    type: 'admin',
    profilePicUrl: 'https://example.com/jane.jpg',
  },
});

  // Seed Reviews
  await prisma.review.createMany({
    data: [
      { userID: user1.userID, movieID: movie1.movieID, content: 'Amazing movie!', rating: 10 },
      { userID: user2.userID, movieID: movie2.movieID, content: 'Heartwarming and beautiful.', rating: 9 },
    ],
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


