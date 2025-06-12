from flask import Flask, render_template, request, jsonify, send_file
import requests
import sys
import subprocess
import os
import argparse
import io
import pickle
import matplotlib.pyplot as plt
from af.slurm_runner import slurm_runner

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

@app.route('/status')
def status():
    return render_template(f"status.html")

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

        
@app.route('/viewport/delete_pdb')
def delete_pdb():
    f = request.args.get('file','')
    try:
        fasta_file_path = f'{args.base_directory}web_pdb/{f}'
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

        
@app.route('/viewport/delete_pkl')
def delete_pkl():
    f = request.args.get('file','')
    try:
        fasta_file_path = f'{args.base_directory}web_pkl/{f}'
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

@app.route('/scripts')
def scripts():
    file_name = request.args.get('file', '')
    asset_path = os.path.join(args.base_directory, 'templates','scripts', file_name)
    if not os.path.isfile(asset_path):
        return jsonify({'message': 'File not found'}), 404
    return send_file(asset_path)

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

@app.route('/viewport/getpdb')
def getpdb():
    file_name = request.args.get('file_name', '')
    dir_path = f"{args.base_directory}web_pdb"
    file_path = os.path.join(dir_path, f"{file_name}")
    try:
        result = subprocess.run(
            ["cat", file_path],
            capture_output=True,
            text=True,
            check=True
        )
        return jsonify({'message': result.stdout.strip()})
    except Exception as e:
        return jsonify({'message': f'Unexpected error: {str(e)}'}), 500

@app.route('/viewport/list_pdb')
def list_pdb():
    directory = f"{args.base_directory}web_pdb"
    files = os.listdir(directory)
    return jsonify({'files': files})

@app.route('/viewport/list_pkl')
def list_pkl():
    directory = f"{args.base_directory}web_pkl"
    files = os.listdir(directory)
    return jsonify({'files': files})

    
@app.route('/status/list_protein_folders')
def list_protein_folders():
    directory = f"{args.base_directory}proteins"
    files = os.listdir(directory)
    return jsonify({'files': files})

# ---------- Serve PKL Heatmap Graph as PNG image ----------
@app.route('/viewport/pkl_graph')
def pkl_graph():
    file_name = request.args.get('file_name', '')
    with open(f"{args.base_directory}web_pkl/{file_name}", "rb") as f:
        result = pickle.load(f)
    pae = result["predicted_aligned_error"]
    plt.figure(figsize=(6, 5))
    plt.imshow(pae, cmap="viridis", origin="lower")
    plt.colorbar(label="PAE (Å)")
    plt.title("Predicted Aligned Error (PAE) – Model 5")
    plt.xlabel("Residue Index")
    plt.ylabel("Residue Index")
    plt.tight_layout()
    img_io = io.BytesIO()
    plt.savefig(img_io, format='png')
    plt.close()
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

# ---------- Serve PKL Line Graph as PNG image ----------
@app.route('/viewport/pkl_line')
def pkl_line():
    file_name = request.args.get('file_name', '')
    with open(f"{args.base_directory}web_pkl/{file_name}", "rb") as f:
        result = pickle.load(f)
    plddt = result["plddt"]
    plt.figure(figsize=(10, 4))
    plt.plot(plddt, label="pLDDT")
    plt.axhline(70, color='orange', linestyle='--', label="70 – Confident")
    plt.axhline(90, color='green', linestyle='--', label="90 – Very High")
    plt.xlabel("Residue Index")
    plt.ylabel("pLDDT Score")
    plt.title("Per-residue Confidence (pLDDT) – Model 5")
    plt.legend()
    plt.tight_layout()
    img_io = io.BytesIO()
    plt.savefig(img_io, format='png')
    plt.close()
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

# --- running alphafold and status page

@app.route('/run_alphafold')
def run_alphafold():
    fasta_file = request.args.get("file", "")
    sr = slurm_runner(
        protein_id = fasta_file.split(".")[0],
        sigmaFold_dir=args.base_directory,
        db_preset="reduced_dbs",
        fasta_path=f"{args.base_directory}web_dir/{fasta_file}"
    )
    return jsonify({"message": sr.run()})

@app.route("/status/get_log")
def get_log():
    protein_name = request.args.get("protein", "")
    with open(f"{args.base_directory}proteins/{protein_name}/slurm.out") as f:
        result = f.read()
    
    return jsonify({"log message": result})

@app.route("/status/move_pdb")
def move_pdb():
    protein_name = request.args.get("protein_name", "")
    sr = slurm_runner(
        protein_id=protein_name,
        sigmaFold_dir=args.base_directory
    )
    try:
        sr.movePDB(f"{args.base_directory}web_pdb")
    except Exception as e:
        return jsonify({"message": str(e)})
    return jsonify({"message": f"Moved PDB for {protein_name} to web_pdb directory."})          
 
@app.route("/status/move_pkl")
def move_pkl():
    protein_name = request.args.get("protein_name", "")
    sr = slurm_runner(
        protein_id=protein_name,
        sigmaFold_dir=args.base_directory
    )
    try:
        sr.movePKL(f"{args.base_directory}web_pkl")
    except Exception as e:
        return jsonify({"message": str(e)})

    return jsonify({"message": f"Moved PKL for {protein_name} to web_pkl directory."})          

@app.route('/asset')
def get_asset():
    file_name = request.args.get('file', '')
    asset_path = os.path.join(args.base_directory, 'assets', file_name)
    if not os.path.isfile(asset_path):
        return jsonify({'message': 'File not found'}), 404
    return send_file(asset_path)

if __name__ == '__main__':
    app.run(debug=True, port=args.port)