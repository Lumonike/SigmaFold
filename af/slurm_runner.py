import subprocess

class slurm_runner:
    def __init__(self,
        protein_id="",
        sigmaFold_dir="",
        output_dir="",
        db_preset="",
        model_preset="",
        fasta_path="",
        singularity_image="",
        database_dir="",
        alphafold_path="",
    ):
        self.protein_id = protein_id
        self.sigmaFold_dir = sigmaFold_dir
        if (not protein_id or  not sigmaFold_dir):
            raise Exception("Need a protein id or sigmaFold_dir for slurm")
        
        self.output_dir= output_dir
        self.db_preset= db_preset
        self.model_preset= model_preset
        self.fasta_path= fasta_path
        self.singularity_image= singularity_image
        self.database_dir= database_dir
        self.alphafold_path= alphafold_path
    
    def run(self):
        if not self.output_dir:
            self.output_dir = self.sigmaFold_dir + "/proteins/"
        slurm_out = f"{self.output_dir}/{self.protein_id}/slurm.out"
            
        command = f"sbatch --output={slurm_out} {self.sigmaFold_dir}/af/run_alphafold.sh"
        command += f" --protein_id={self.protein_id} --sigmaFold_dir={self.sigmaFold_dir}"
        command += " --output_dir=" + self.output_dir

        if self.db_preset:
            command += " --db_preset=" + self.db_preset
        if self.model_preset:
            command += " --model_preset=" + self.model_preset
        if self.fasta_path:
            command += " --fasta_path=" + self.fasta_path
        if self.singularity_image:
            command += " --singularity_image=" + self.singularity_image
        if self.database_dir:
            command += " --database_dir=" + self.database_dir
        if self.alphafold_path:
            command += " --alphafold_path=" + self.alphafold_path

        
        print(command)
        
        subprocess.run(command, shell=True)


s = slurm_runner(protein_id="P10145", sigmaFold_dir="/fs/scratch/PZS1152/alphafold/robin_alphafold/sigmaFold", db_preset="reduced_dbs", fasta_path="/fs/scratch/PZS1152/alphafold/robin_alphafold/sigmaFold/web_dir/P10145.fasta", model_preset="monomer")

s.run()
        
