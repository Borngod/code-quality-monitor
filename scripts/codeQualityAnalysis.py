import subprocess
import json
import sqlite3

def analyze_code_quality(repo_path, db_path):
    # Run ESLint
    eslint_output = subprocess.check_output(['npx', 'eslint', repo_path, '-f', 'json'])
    eslint_results = json.loads(eslint_output)

    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    for result in eslint_results:
        for message in result['messages']:
            c.execute('''INSERT INTO code_quality 
                         (commit_hash, tool, issue_type, severity, file, line) 
                         VALUES (?, ?, ?, ?, ?, ?)''',
                      ('HEAD',  # Assume latest commit
                       'eslint',
                       message['ruleId'],
                       message['severity'],
                       result['filePath'],
                       message['line']))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    repo_path = '/path/to/your/repo'  # Replace with actual repo path
    db_path = '../backend/code_quality.db'
    analyze_code_quality(repo_path, db_path)