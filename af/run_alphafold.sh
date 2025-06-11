#!/bin/bash

#SBATCH -A PZS1152 
#SBATCH --job-name=SigmaFold
#SBATCH --partition=gpu 
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --gpus=1 
#SBATCH --cpus-per-task=4
#SBATCH --mem=64G 
#SBATCH --time=69:42:00

# Usage example:
# ./run_alphafold.sh --protein_id P99999 --output_dir /my/output --db_preset full_dbs --model_preset monomer --fasta_path /my/path.fasta --singularity_image /my/alphafold.sif --database_dir /my/dbdir --alphafold_path /my/alphafold.py

set -euo pipefail

# Default values
protein_id=""
sigmaFold_dir=""
output_dir="/fs/scratch/PZS1152/alphafold/robin_alphafold/msas/rob2"
db_preset="full_dbs"
model_preset="monomer"
fasta_path=""
singularity_image="/apps/alphafold/2.3.2/alphafold.sif"
database_dir="/fs/scratch/PZS1152/alphafold/alphafold"
alphafold_path="/fs/scratch/PZS1152/alphafold/robin_alphafold/scripts/alphafold/robins_devious_run_alphafold_patched.py"

# Parse flags
while [[ $# -gt 0 ]]; do
    case "$1" in
        --*=*)
            key="${1%%=*}"   # Extract part before '='
            value="${1#*=}"  # Extract part after '='
            ;;
        *)
            echo "Invalid argument format: $1. Use --key=value."
            exit 1
            ;;
    esac

    case "$key" in
        --protein_id)
            protein_id="$value"
            ;;
        --output_dir)
            output_dir="$value"
            ;;
        --db_preset)
            db_preset="$value"
            ;;
        --model_preset)
            model_preset="$value"
            ;;
        --fasta_path)
            fasta_path="$value"
            ;;
        --singularity_image)
            singularity_image="$value"
            ;;
        --database_dir)
            database_dir="$value"
            ;;
        --alphafold_path)
            alphafold_path="$value"
            ;;
        --sigmaFold_dir)
            sigmaFold_dir="$value"
            ;;
        *)
            echo "Unknown argument: $key"
            exit 1
            ;;
    esac
    shift
done

if [[ -z "$protein_id" ]]; then
    echo "ERROR: --protein_id is required."
    exit 1
fi

if [[ -z "$sigmaFold_dir" ]]; then
    echo "ERROR: --sigmaFold_dir is required."
    exit 1
fi

if [[ -z "$fasta_path" ]]; then
    fasta_path="$sigmaFold_dir/web_dir/$protein_id.fasta"
fi

python "$sigmaFold_dir/af/run_alphafold.py" \
    "$protein_id" \
    --output_dir "$output_dir" \
    --db_preset "$db_preset" \
    --model_preset "$model_preset" \
    --fasta_path "$fasta_path" \
    --singularity_image "$singularity_image" \
    --database_dir "$database_dir" \
    --alphafold_path "$alphafold_path"