try:
    import subprocess
    import sqlite3
    import json
    import tempfile

    print("All modules are available!")
except ImportError as e:
    print(f"Module not found: {e.name}")
