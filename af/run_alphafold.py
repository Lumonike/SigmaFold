# #!/usr/bin/env python3
# import subprocess
# import sys

# protein_id = sys.argv[1]

# dir="/fs/scratch/PZS1152/alphafold/robin_alphafold"

# command = f"""
# {dir}/scripts/structures/AF_structure_SI2025.sh \
#   --fasta_paths={dir}/fastas/{protein_id}.fasta \
#   --output_dir={dir}/msas/rob1_filteredtax \
#   --model_preset=multimer \
#   --max_template_date=2023-01-01 \
#   --db_preset=full_dbs \
#   --models_to_relax=best \
#   --use_gpu_relax=true 
# """
# subprocess.run(command, shell=True)
import subprocess
import sys
import argparse
from typing import List, Optional

class AlphafoldRunner:
    def __init__(
        self,
        protein_id: str,
        output_dir: str = "/fs/scratch/PZS1152/alphafold/robin_alphafold/msas/rob2",
        db_preset: str = "full_dbs",
        model_preset: str = "monomer",
        fasta_path: str = "/fs/scratch/PZS1152/alphafold/robin_alphafold/sigmaFold/web_dir/p99999.fasta",
        singularity_image: str = "/apps/alphafold/2.3.2/alphafold.sif",
        database_dir: str = "/fs/scratch/PZS1152/alphafold/alphafold",
        alphafold_path: str = "/fs/scratch/PZS1152/alphafold/robin_alphafold/scripts/alphafold/robins_devious_run_alphafold_patched.py"
    ):
        self.protein_id = protein_id
        self.output_dir = output_dir
        self.db_preset = db_preset
        self.model_preset = model_preset
        self.fasta_path = fasta_path
        self.singularity_image = singularity_image
        self.database_dir = database_dir
        self.alphafold_path = alphafold_path

    def _generate_database_paths(self) -> List[str]:
        db = self.database_dir
        database_paths = [
            f"--data_dir={db}/data/2.3.2",
            f"--mgnify_database_path={db}/mgnify/mgy_clusters_2022_05.fa",
            f"--obsolete_pdbs_path={db}/pdb_mmcif/obsolete.dat",
            f"--template_mmcif_dir={db}/pdb_mmcif/mmcif_files",
            f"--uniref90_database_path={db}/uniref90/uniref90.fasta",
        ]

        if self.db_preset == "reduced_dbs":
            database_paths.append(f"--small_bfd_database_path={db}/small_bfd/bfd-first_non_consensus_sequences.fasta")
        else:
            database_paths.append(f"--bfd_database_path={db}/bfd/bfd_metaclust_clu_complete_id30_c90_final_seq.sorted_opt")
            database_paths.append(f"--uniref30_database_path={db}/uniref30/UniRef30_2021_03")

        if self.model_preset == "multimer":
            database_paths.append(f"--pdb_seqres_database_path={db}/pdb_seqres/pdb_seqres.txt")
            database_paths.append(f"--uniprot_database_path={db}/uniprot/uniprot.fasta")
        else:
            database_paths.append(f"--pdb70_database_path={db}/pdb70/pdb70")


        return database_paths

    def build_command(self) -> str:
        database_paths = self._generate_database_paths()
        model_preset_option = f"--model_preset={self.model_preset}"
        db_preset_option = f"--db_preset={self.db_preset}"
        fasta_option = f"--fasta_paths={self.fasta_path}"
        output_option = f"--output_dir={self.output_dir}"

        env_exports = (
            "export TF_FORCE_UNIFIED_MEMORY=${TF_FORCE_UNIFIED_MEMORY:-0};"
            "export XLA_PYTHON_CLIENT_MEM_FRACTION=${XLA_PYTHON_CLIENT_MEM_FRACTION:-4.0};"
        )

        database_paths_str = " ".join(database_paths)
        cmd = (
            f"{env_exports} "
            f"singularity exec --nv {self.singularity_image} "
            f"python {self.alphafold_path} "
            f"{database_paths_str} "
            f"{model_preset_option} {db_preset_option} "
            f"{fasta_option} {output_option} --max_template_date=2024-01-01 --use_gpu_relax=true"
        )

        return cmd

    def run(self):
        command = self.build_command()
        print(f"Running Alphafold with command:\n{command}\n")
        result = subprocess.run(command, shell=True)
        if result.returncode != 0:
            raise RuntimeError(f"Alphafold run failed with exit code {result.returncode}")

def main():
    parser = argparse.ArgumentParser(description="Run Alphafold with custom settings.")
    parser.add_argument("protein_id", help="Protein ID (used to find FASTA file)")
    parser.add_argument("--output_dir", default="/fs/scratch/PZS1152/alphafold/robin_alphafold/msas/rob1_filteredtax", help="Output directory")
    parser.add_argument("--db_preset", default="full_dbs", choices=["full_dbs", "reduced_dbs"], help="Database preset option")
    parser.add_argument("--model_preset", default="monomer", choices=["monomer", "monomer_casp14", "monomer_ptm", "multimer"], help="Model preset")
    parser.add_argument("--fasta_path", default="/fs/scratch/PZS1152/alphafold/robin_alphafold/sigmaFold/web_dir/p12345.fasta", help="Path to the input FASTA file")
    parser.add_argument("--singularity_image", default="/apps/alphafold/2.3.2/alphafold.sif", help="Path to the Singularity image")
    parser.add_argument("--database_dir", default="/fs/scratch/PZS1152/alphafold/alphafold", help="Base directory for databases")
    parser.add_argument("--alphafold_path", default="/fs/scratch/PZS1152/alphafold/robin_alphafold/scripts/alphafold/robins_devious_run_alphafold_patched.py", help="Path to Alphafold Python script")

    args = parser.parse_args()

    runner = AlphafoldRunner(
        protein_id=args.protein_id,
        output_dir=args.output_dir,
        db_preset=args.db_preset,
        model_preset=args.model_preset,
        fasta_path=args.fasta_path,
        singularity_image=args.singularity_image,
        database_dir=args.database_dir,
        alphafold_path=args.alphafold_path,
    )
    runner.run()
    print("Alphafold run completed successfully. PDB and PKL files ready to copy.")

if __name__ == "__main__":
    main()