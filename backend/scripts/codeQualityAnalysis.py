import subprocess
import json
import sqlite3
import os
import sys
import tempfile
import git
import shutil

def clone_repository(owner, repo, temp_dir):
    repo_url = f"https://github.com/{owner}/{repo}.git"
    subprocess.check_call(['git', 'clone', repo_url, temp_dir])

def get_latest_commit_info(repo_path):
    repo = git.Repo(repo_path)
    commit = repo.head.commit
    return {
        'hash': commit.hexsha,
        'author': commit.author.name,
        'date': commit.authored_datetime.isoformat(),
        'message': commit.message.strip(),
    }

def analyze_code_quality(repo_path, db_path, owner, repo):
    npm_path = r"C:\Program Files\nodejs\npm.cmd"  # Adjust if necessary
    npx_path = r"C:\Program Files\nodejs\npx.cmd"  # Add this line
    
    if not os.path.exists(npm_path):
        raise FileNotFoundError(f"npm not found at {npm_path}. Please check the path or ensure npm is installed and added to your PATH.")

    if not os.path.exists(npx_path):
        raise FileNotFoundError(f"npx not found at {npx_path}. Please check the path or ensure npx is installed and added to your PATH.")

    # Ensure the repository path exists
    if not os.path.exists(repo_path):
        raise FileNotFoundError(f"Repository path {repo_path} does not exist.")
    
    print(f"Running npm init in {repo_path}")

    # Check if package.json exists
    package_json_path = os.path.join(repo_path, "package.json")
    if not os.path.exists(package_json_path):
        print(f"package.json not found at {package_json_path}. Initializing npm project.")
        subprocess.check_call([npm_path, 'init', '-y'], cwd=repo_path)
    
    # Install necessary packages
    try:
        print(f"Installing ESLint and TypeScript dependencies in {repo_path}")
        subprocess.check_call([
        npm_path, 'install', 
        'eslint', 
        '@typescript-eslint/parser', 
        '@typescript-eslint/eslint-plugin', 
        'typescript',
        'eslint-plugin-react',
        '--legacy-peer-deps'
        ], cwd=repo_path)
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        print(f"Command output: {e.output}")
        return

    # Create a comprehensive ESLint configuration
    eslint_config = {
        "parser": "@typescript-eslint/parser",
        "plugins": ["@typescript-eslint", "react"],
        "extends": [
            "eslint:recommended",
            "plugin:@typescript-eslint/recommended",
            "plugin:react/recommended"
        ],
        "settings": {
            "react": {
                "version": "detect"
            }
        },
        "rules": {
            "react/react-in-jsx-scope": "off"  # Turn off the rule requiring React to be in scope
        },
        "env": {
            "browser": True,
            "node": True,
            "es6": True
        }
    }
    
    with open(os.path.join(repo_path, '.eslintrc.json'), 'w') as f:
        json.dump(eslint_config, f)

    # Run ESLint on all relevant file types
    try:
        print(f"Running ESLint in {repo_path}")
        eslint_output = subprocess.check_output([
            npx_path, 'eslint', 
            '.', 
            '--ext', '.js,.jsx,.ts,.tsx', 
            '-f', 'json'
        ], cwd=repo_path, text=True, stderr=subprocess.STDOUT)
        
        eslint_results = json.loads(eslint_output)
        print("ESLint Results: ", eslint_results)
    except subprocess.CalledProcessError as e:
        print(f"Error running ESLint: {e}")
        print(f"Command output: {e.output}")
        eslint_results = json.loads(e.output) 
        # Parse the output even if there are linting errors
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # Get commit info
    commit_info = get_latest_commit_info(repo_path)

    # Insert commit info
    c.execute('''INSERT OR REPLACE INTO commits 
                 (hash, author, date, message, repo_owner, repo_name) 
                 VALUES (?, ?, ?, ?, ?, ?)''',
              (commit_info['hash'], commit_info['author'], commit_info['date'], 
               commit_info['message'], owner, repo))

    # Insert code quality issues
    for result in eslint_results:
        if not result.get('messages'):
            c.execute('''INSERT INTO code_quality 
                        (commit_hash, tool, issue_type, severity, file, line) 
                        VALUES (?, ?, ?, ?, ?, ?)''',
                    (commit_info['hash'], 'eslint', 'no_issues', 'none',
                    result.get('filePath', ''), 0))
        else:
            for message in result.get('messages', []):
                c.execute('''INSERT INTO code_quality 
                            (commit_hash, tool, issue_type, severity, file, line) 
                            VALUES (?, ?, ?, ?, ?, ?)''',
                        (commit_info['hash'], 'eslint', message.get('ruleId', 'unknown'),
                        'high' if message.get('severity', 0) == 2 else 'medium' if message.get('severity', 0) == 1 else 'low',
                        result.get('filePath', ''), message.get('line', 0)))

    conn.commit()
    conn.close()

    print(f"Analyzed {len(eslint_results)} files in {repo}")
    print("Code quality data has been inserted into the database.")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python codeQualityAnalysis.py <owner> <repo> <db_path>")
        sys.exit(1)
    
    owner = sys.argv[1]
    repo = sys.argv[2]
    db_path = sys.argv[3]
    
    temp_dir = tempfile.mkdtemp()
    try:
        clone_repository(owner, repo, temp_dir)
        print(f"Repository cloned successfully to {temp_dir}")
        
        analyze_code_quality(temp_dir, db_path, owner, repo)
        print("Code quality analysis completed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Subprocess error: {e}")
        print(f"Command: {e.cmd}")
        print(f"Output: {e.output}")
    except FileNotFoundError as e:
        print(f"FileNotFoundError: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
    finally:
        # Attempt to clean up the temporary directory
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            print(f"Error cleaning up temporary directory: {e}")
            print("You may need to manually delete the temporary directory.")
        print(f"Temporary directory path: {temp_dir}")