from flask import Flask, render_template, request, jsonify
import requests
import sys
import subprocess
from flask import request
from flask import jsonify
import os
import argparse

parser = argparse.ArgumentParser(description="Process some flags.")
parser.add_argument('--base_directory', required=True, type=str, help='Enable verbose mode')
parser.add_argument('--port', default=8080, type=int, help='Enable verbose mode')

args = parser.parse_args()

app = Flask(__name__, template_folder = args.base_directory + "templates/")

@app.route('/')
def index():
    return render_template(f"template.html")

    
@app.route('/viewport')
def vp():
    return render_template(f"viewport.html")

@app.route('/return_fasta')
def return_fasta():
    protein_id = request.args.get('protein_id', '')
    num_lines = request.args.get('num_lines', default='0')
    try:
        num_lines = str(int(num_lines))
        fasta_file_path = "/fs/scratch/PZS1152/alphafold/alphafold/uniref90/uniref90.fasta"
        result = subprocess.run(
            ["grep", "-A", num_lines, protein_id, fasta_file_path],
            capture_output=True,
            text=True,
            check=True
        )
        return jsonify({'message': result.stdout.strip()})
    except subprocess.CalledProcessError as e:
        return jsonify({'message': f'Error during grep: {e.stderr or str(e)}'}), 500
    except Exception as e:
        return jsonify({'message': f'Unexpected error: {str(e)}'}), 500



@app.route('/delete_fasta')
def delete_fasta():
    f = request.args.get('file','')
    try:
        fasta_file_path = f'{args.base_directory}web_dir/{f}'
        result = subprocess.run(
            ["rm", fasta_file_path],
            capture_output=True,
            text=True,
            check=True
        )
        return jsonify({'message': result.stdout.strip()})
    except subprocess.CalledProcessError as e:
        return jsonify({'message': f'Error during rm: {e.stderr or str(e)}'}), 500
    except Exception as e:
        return jsonify({'message': f'Unexpected error: {str(e)}'}), 500


@app.route('/return_fasta2')
def return_fasta2():
    f = request.args.get('file', '')
    try:
        fasta_file_path = f'{args.base_directory}web_dir/{f}'
        result = subprocess.run(
            ["cat", fasta_file_path],
            capture_output=True,
            text=True,
            check=True
        )
        return jsonify({'message': result.stdout.strip()})
    except subprocess.CalledProcessError as e:
        return jsonify({'message': f'Error during grep: {e.stderr or str(e)}'}), 500
    except Exception as e:
        return jsonify({'message': f'Unexpected error: {str(e)}'}), 500


@app.route('/save_fasta')
def save_fasta():
    file_name = request.args.get('file_number','')
    bruh = request.args.get('bruh','')
    dir_path = f"{args.base_directory}web_dir"
    file_path = os.path.join(dir_path, f"{file_name}.fasta")
    result = subprocess.run(
        ["touch", file_path],
        capture_output=True,
        text=True,
        check=True
    )
    subprocess.run(
        f"echo '{bruh}' | cat > {file_path}",
        shell=True,
        check=True,
        capture_output=True,
        text=True
    )
    return jsonify({'message': "File Created"})


@app.route('/list_files')
def list_files():
    directory = f"{args.base_directory}web_dir"
    files = os.listdir(directory)
    return jsonify({'files': files})

if __name__ == '__main__':
    app.run(debug=True, port=1111)

