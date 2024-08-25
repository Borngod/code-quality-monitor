import git
import sqlite3
from datetime import datetime

def analyze_repo(repo_path, db_path):
    repo = git.Repo(repo_path)
    commits = list(repo.iter_commits('master'))
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    for commit in commits:
        c.execute('''INSERT OR REPLACE INTO commits 
                     (hash, author, date, files_changed, insertions, deletions) 
                     VALUES (?, ?, ?, ?, ?, ?)''',
                  (commit.hexsha, 
                   commit.author.name, 
                   commit.committed_datetime.isoformat(), 
                   len(commit.stats.files), 
                   commit.stats.total['insertions'], 
                   commit.stats.total['deletions']))
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    repo_path = '/path/to/your/repo'  # Replace with actual repo path
    db_path = '../backend/code_quality.db'
    analyze_repo(repo_path, db_path)