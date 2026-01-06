// const sql = require("mssql");

// // Use environment variables for security, fallback to defaults for testing
// const config = {
//   user: process.env.DB_USER || "tushar",
//   password: process.env.DB_PASSWORD || "your_password",
//   server: process.env.DB_SERVER || "tushar.database.windows.net",
//   database: process.env.DB_NAME || "quizraiderx",
//   options: {
//     encrypt: true, // Required for Azure SQL
//     trustServerCertificate: false,
//   },
//   pool: {
//     max: 10,
//     min: 0,
//     idleTimeoutMillis: 30000,
//   },
// };

// // Create connection pool promise
// const poolPromise = new sql.ConnectionPool(config)
//   .connect()
//   .then(pool => {
//     console.log("Connected to MSSQL");
//     return pool;
//   })
//   .catch(err => {
//     console.error("Database Connection Failed! ", err);
//     throw err; // propagate error
//   });

// // Wrap in a function for clearer use
// async function connectDb() {
//   return poolPromise;
// }

// module.exports = {
//   // sql,
//   // poolPromise,
//   connectDb,
// };
