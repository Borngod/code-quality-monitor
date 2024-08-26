

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "..", "db", "code_quality.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    console.log("Database connected at:", dbPath);
    db.run(
      `CREATE TABLE IF NOT EXISTS commits
            (hash TEXT PRIMARY KEY, author TEXT, date TEXT, 
             message TEXT, repo_owner TEXT, repo_name TEXT)`,
      (err) => {
        if (err) {
          console.error("Error creating commits table", err);
        }
      }
    );
    db.run(
      `CREATE TABLE IF NOT EXISTS code_quality
            (commit_hash TEXT, tool TEXT, issue_type TEXT, 
             severity TEXT, file TEXT, line INTEGER)`,
      (err) => {
        if (err) {
          console.error("Error creating code_quality table", err);
        }
      }
    );
  }
});

module.exports = db;
