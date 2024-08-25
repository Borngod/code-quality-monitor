const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./code_quality.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Database connected');
    db.run(`CREATE TABLE IF NOT EXISTS commits
            (hash TEXT PRIMARY KEY, author TEXT, date TEXT, 
             files_changed INTEGER, insertions INTEGER, deletions INTEGER)`);
    db.run(`CREATE TABLE IF NOT EXISTS code_quality
            (commit_hash TEXT, tool TEXT, issue_type TEXT, 
             severity TEXT, file TEXT, line INTEGER)`);
  }
});

module.exports = db;