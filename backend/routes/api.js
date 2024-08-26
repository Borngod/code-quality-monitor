
const express = require("express");
const router = express.Router();
const db = require("../models/db");
const axios = require("axios");
const { exec } = require("child_process");
const path = require("path");

router.get("/commits", (req, res) => {
  console.log('GET /api/commits route hit');
  db.all("SELECT * FROM commits ORDER BY date DESC LIMIT 100", (err, rows) => {
    if (err) {
      console.error('Error fetching commits:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`Fetched ${rows.length} commits`);
    res.json(rows);
  });
});

router.get("/quality", (req, res) => {
  console.log('GET /api/quality route hit');
  db.all(`
    SELECT 
      commit_hash,
      tool,
      issue_type,
      severity,
      file,
      line
    FROM code_quality 
    ORDER BY file, line
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching code quality data:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (rows.length === 0) {
      res.status(404).json({ message: "No code quality data found" });
      return;
    }
    console.log(`Fetched ${rows.length} code quality entries`);
    res.json(rows);
  });
});

router.post("/fetch-repo", async (req, res) => {
  console.log('route has been hit')
  const { owner, repo } = req.body;
  try {
    const commits = await fetchGithubData(owner, repo);
    await storeCommits(commits, owner, repo);

    // Run ESLint analysis
    const analysisOutput = await analyzeCodeQuality(owner, repo);
    console.log("Analysis completed:", analysisOutput);
    res.json({ message: "Data fetched, stored, and analyzed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function fetchGithubData(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits`;
  const response = await axios.get(url);
  return response.data;
}

function storeCommits(commits, owner, repo) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO commits (hash, author, date, message, repo_owner, repo_name) VALUES (?, ?, ?, ?, ?, ?)"
    );
    commits.forEach((commit) => {
      stmt.run(
        commit.sha,
        commit.commit.author.name,
        commit.commit.author.date,
        commit.commit.message,
        owner,
        repo
      );
    });
    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function analyzeCodeQuality(owner, repo) {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, "..", "db", "code_quality.db");
    const scriptPath = path.join(
      __dirname,
      "..",
      "scripts",
      "codeQualityAnalysis.py"
    );

    const child = exec(
      `python ${scriptPath} ${owner} ${repo} ${dbPath}`,
      {
        maxBuffer: 1024 * 1024 * 100, // Further increased buffer size
        timeout: 300000,
      }, // Increased buffer size and added timeout
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Execution Error: ${error}`);
          reject(error);
        } else {
          if (stderr) {
            console.error(`Script stderr: ${stderr}`);
          }
          console.log(`Analysis output: ${stdout}`);
          resolve(stdout);
        }
      }
    );

    child.on("exit", (code) => {
      console.log(`Child process exited with code ${code}`);
      if (code !== 0) {
        reject(new Error(`Analysis script exited with code ${code}`));
      }
    });
  });
}

module.exports = router;
