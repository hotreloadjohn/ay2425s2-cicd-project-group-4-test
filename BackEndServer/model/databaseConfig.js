module.exports = {
    client: 'pg', // PostgreSQL is the underlying DB engine for NeonDB
    connection: {
      connectionString: process.env.DATABASE_URL, // Connection string from NeonDB
      ssl: {
        rejectUnauthorized: false, // Required for SSL connections in NeonDB
      },
    },
  };