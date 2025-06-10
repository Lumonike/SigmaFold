import os
DIR = os.environ['BASE_DIRECTORY']
import subprocess

subprocess.run(
    [
        f"python3",
        f"{DIR}website.py",
        f"--base_directory={DIR}",
        f"--port=696942"
    ]
)
