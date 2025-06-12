
    const viewer = $3Dmol.createViewer("container-01", {});
    var default_url = window.location;

    async function get_pdb() {
      const inputValue = document.getElementById("pdb_name").value;
      const resultBox = document.getElementById("result");

      resultBox.textContent = "";
      viewer.clear();
      viewer.render();

      if (!inputValue) {
        resultBox.textContent = "Please select a PDB file.";
        return;
      }

      try {
        const save_response = await fetch(`${default_url}/getpdb?file_name=${encodeURIComponent(inputValue)}`);
        if (!save_response.ok) throw new Error(`HTTP error! status: ${save_response.status}`);
        const data = await save_response.json();

        const pdbText = data.message;
        viewer.addModel(pdbText, "pdb");
        viewer.setStyle({}, {
          cartoon: {
            colorfunc: function(atom) {
              const plddt = atom.b;
              if (plddt > 90) return "blue";
              else if (plddt > 70) return "cyan";
              else if (plddt > 50) return "yellow";
              else return "orange";
            }
          }
        });
        viewer.zoomTo();
        viewer.render();
        viewer.zoom(1.2, 1000);

      } catch (error) {
        resultBox.textContent = `Error getting pdb: ${error.message}`;
      }
    }

    async function delete_pdb() {
      const fastaSelect = document.getElementById("pdb_name");
      const selectedFile = fastaSelect.value;

      try {
        const response = await fetch(`${default_url}/delete_pdb?file=${encodeURIComponent(selectedFile)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        populateFileSelectPDB();
      } catch (error) {
        console.error('Error in delete_fasta:', error);
      }
    }

    async function delete_pkl() {
      const fastaSelect = document.getElementById("pkl_name");
      const selectedFile = fastaSelect.value;
      try {
        const response = await fetch(`${default_url}/delete_pkl?file=${encodeURIComponent(selectedFile)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        populateFileSelectPKL();
      } catch (error) {
        console.error('Error in delete_pkl:', error);
      }
    }


    
    // Shows PKL heatmap in container-02 and line graph in container-03
    async function get_pkl_graphs() {
  const inputValue = document.getElementById("pkl_name").value;
  const resultBox = document.getElementById("result");
  const containerHeat = document.getElementById("container-02");
  const containerLine = document.getElementById("container-03");

  resultBox.textContent = "";
  containerHeat.innerHTML = "";
  containerLine.innerHTML = "";

  if (!inputValue) {
    resultBox.textContent = "Please select a PKL file.";
    return;
  }

  // Heatmap
  const imgHeat = document.createElement("img");
  imgHeat.style.width = "100%";
  imgHeat.style.height = "100%";
  imgHeat.style.objectFit = "contain";
  imgHeat.src = `${default_url}/pkl_graph?file_name=${encodeURIComponent(inputValue)}`;
  imgHeat.alt = "PAE Heatmap";
  containerHeat.appendChild(imgHeat);

  try {
    await waitForImageToLoad(imgHeat);
  } catch {
    imgHeat.alt = "Could not load heatmap image.";
    imgHeat.src = "";
  }

  // Line chart
  const imgLine = document.createElement("img");
  imgLine.style.width = "100%";
  imgLine.style.height = "100%";
  imgLine.style.objectFit = "contain";
  imgLine.src = `${default_url}/pkl_line?file_name=${encodeURIComponent(inputValue)}`;
  imgLine.alt = "pLDDT Line Chart";
  containerLine.appendChild(imgLine);

  try {
    await waitForImageToLoad(imgLine);
  } catch {
    imgLine.alt = "Could not load line chart image.";
    imgLine.src = "";
  }
}

function waitForImageToLoad(img) {
  return new Promise((resolve, reject) => {
    if (img.complete && img.naturalHeight !== 0) {
      // Already loaded
      resolve(img);
    } else {
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    }
  });
}

    async function populateFileSelectPDB() {
      const select = document.getElementById("pdb_name");
      try {
        const response = await fetch(`${default_url}/list_pdb`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        select.innerHTML = "";
        if (data.files && Array.isArray(data.files) && data.files.length > 0) {
          data.files.forEach(filename => {
            const option = document.createElement("option");
            option.value = filename;
            option.textContent = filename;
            select.appendChild(option);
          });
        } else {
          const option = document.createElement("option");
          option.value = "";
          option.textContent = "No files found";
          select.appendChild(option);
        }
      } catch (error) {
        console.error('Error populating file select:', error);
        select.innerHTML = "<option value=''>Error loading files</option>";
      }
    }

    async function populateFileSelectPKL() {
      const select = document.getElementById("pkl_name");
      try {
        const response = await fetch(`${default_url}/list_pkl`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        select.innerHTML = "";
        if (data.files && Array.isArray(data.files) && data.files.length > 0) {
          data.files.forEach(filename => {
            const option = document.createElement("option");
            option.value = filename;
            option.textContent = filename;
            select.appendChild(option);
          });
        } else {
          const option = document.createElement("option");
          option.value = "";
          option.textContent = "No files found";
          select.appendChild(option);
        }
      } catch (error) {
        console.error('Error populating PKL file select:', error);
        select.innerHTML = "<option value=''>Error loading files</option>";
      }
    }

    window.onload = function() {
      populateFileSelectPDB();
      populateFileSelectPKL();
    };