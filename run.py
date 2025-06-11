from dotenv import load_dotenv
import os
import subprocess

# Load the .env file
load_dotenv()

DIR = os.getenv('BASE_DIRECTORY')

print(f"running SigmaFold from directory '{DIR}'")

subprocess.run(
    [
        f"python3",
        f"{DIR}website.py",
        f"--base_directory={DIR}",
        f"--port=6960"
    ]
)
