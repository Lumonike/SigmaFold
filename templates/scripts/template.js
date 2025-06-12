
    let default_url = window.location;

    // Keep a queue of all active alerts
    let alertQueue = [];

    let alertCnt = 0;

    function updateAlert3DStack() {
      const alerts = Array.from(document.querySelectorAll("#alert-container .alert"));
      const total = alerts.length;
      const visibleStack = 5;
      // oldest at i=0, newest at i=n-1
      alerts.forEach((alert, i) => {
        const yOffset = -18;
        const z = -i * 24;
        const scale = 1 - i * 0.04;
        const rotate = i * 2.5;
        const translateY = Math.max(i, 0) * yOffset;
        alert.style.transform =
          `translateY(${translateY}px) scale(${scale}) rotateX(${rotate}deg) translateZ(${z}px)`;
        alert.style.zIndex = 100 + total - i;
        alert.style.filter = i > 2 ? 'blur(0.8px)' : '';
        alert.style.opacity = i < visibleStack ? '1' : '0.5';
        alert.style.pointerEvents = i === total - 1 ? 'auto' : 'none'; // Only newest/front is clickable
      });
    }

    // Remove the oldest alert in the queue, fade it out, then remove from DOM and queue
    function removeOldestAlert() {
      if (alertQueue.length === 0) return;
      const oldest = alertQueue[0]; // FIFO
      if (!oldest) return;
      // Prevent multiple removals
      if (oldest._removing) return;
      oldest._removing = true;
      oldest.style.opacity = '0';
      setTimeout(() => {
        if (oldest.parentElement) {
          oldest.remove();
          alertQueue = alertQueue.filter(a => a !== oldest);
          updateAlert3DStack();
        }
      }, 100);
    }

    function showAlert(message, type = 'info') {
      const alertContainer = document.getElementById('alert-container');
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert p-4 flex items-center justify-between font-mono shadow-lg`;

      let bgColor, textColor;
      switch (type) {
        case 'success':
          bgColor = 'bg-green-700';
          textColor = 'text-green-100';
          break;
        case 'error':
          bgColor = 'bg-red-700';
          textColor = 'text-red-100';
          break;
        case 'info':
        default:
          bgColor = 'bg-blue-700';
          textColor = 'text-blue-100';
          break;
      }
      alertDiv.classList.add(bgColor, textColor);
      alertDiv.innerHTML = `
        <span class="font-semibold">${message}</span>
        <button class="ml-4 w-10 h-10 flex items-center justify-center text-2xl opacity-75 hover:opacity-100 focus:outline-none"
          onclick="closeAlert(this.parentElement); return false;"
          style="pointer-events:auto;">&times;</button>
      `;

      alertContainer.appendChild(alertDiv);
      alertQueue.push(alertDiv);

      requestAnimationFrame(() => {
        alertDiv.style.opacity = '1';
      });
      updateAlert3DStack();

      // Remove after timeout, but for oldest banner, not this one
      // Only trigger a removal if this is the first alert or if there's more than one
      if (alertQueue.length === 1) {
        setTimeout(function processQueue() {
          removeOldestAlert();
          if (alertQueue.length > 0) {
            setTimeout(processQueue, 500); // show each alert for 700ms before removing the next
          }
        }, 1000); // initial delay for first alert
      }

      // Also allow removal via button
      alertDiv.__removeAlert = function() {
        // Remove from queue and DOM immediately, then update stack
        if (alertDiv.parentElement) {
          alertDiv.style.opacity = '0';
          setTimeout(() => {
            if (alertDiv.parentElement) {
              alertDiv.remove();
              alertQueue = alertQueue.filter(a => a !== alertDiv);
              updateAlert3DStack();
            }
          }, 400);
        }
      };
    }

    // Helper for close button
    function closeAlert(alertDiv) {
      if (alertDiv && typeof alertDiv.__removeAlert === "function") {
        alertDiv.__removeAlert();
      }
    }

    async function return_fasta() {
      const inputValue = document.getElementById("protein_name").value;
      const resultDiv = document.getElementById("result");
      if (!inputValue) {
        showAlert('Please enter a UniProt ID for the protein.', 'info');
        return;
      }

      const baseUrl = `https://rest.uniprot.org/uniprotkb/${encodeURIComponent(inputValue)}`;
      try {
        const response = await fetch(baseUrl, {
          method: "GET",
          headers: { "Accept": "application/json" }
        });

        if (!response.ok) {
          if (response.status === 404) {
            showAlert(`Protein with ID "${inputValue}" not found. Please check the UniProt ID.`, 'error');
          } else {
            showAlert(`Error fetching FASTA: ${response.statusText}`, 'error');
          }
          resultDiv.textContent = '';
          return;
        }

        const data = await response.json();

        const source_database = data.entryType === "Reviewed" ? "sp" : "tr";
        const accession_number = data.primaryAccession;
        const entry_name = data.uniProtkbId;
        const fullname = data.proteinDescription?.recommendedName?.fullName?.value || "Unknown Protein";
        const og_species = data.organism?.scientificName || "Unknown Species";
        const taxon_id = data.organism?.taxonId || "0000";
        const geneName = data.genes?.[0]?.geneName?.value || "UNKNOWN";
        const pExistence = data.proteinExistence?.type?.match(/\d+/)?.[0] || "1";
        const SV = data.entryAudit?.sequenceVersion || "1";

        const fastaHeader = `>${source_database}|${accession_number}|${entry_name} ${fullname} OS=${og_species} OX=${taxon_id} GN=${geneName} PE=${pExistence} SV=${SV}`;
        const AAS = data.sequence.value;
        let formattedAAS = '';
        for (let i = 0; i < AAS.length; i += 60) {
          formattedAAS += AAS.slice(i, i + 60) + '\n';
        }

        resultDiv.textContent = fastaHeader + "\n" + formattedAAS.trim();
        showAlert('FASTA returned successfully!', 'success');

      } catch (error) {
        console.error('Error in return_fasta:', error);
        showAlert(`An unexpected error occurred: ${error.message}`, 'error');
        resultDiv.textContent = '';
      }
    }

    async function save_fasta() {
      const inputValue = document.getElementById("protein_name").value;
      const textContent = document.getElementById("result").textContent;

      if (!textContent) {
        showAlert('No FASTA data to save. Please "Return FASTA" first.', 'info');
        return;
      }
      if (!inputValue) {
        showAlert('Please enter a UniProt ID to name the file.', 'info');
        return;
      }
      try {
        const save_response = await fetch(`${default_url}/save_fasta?file_number=${encodeURIComponent(inputValue)}&bruh=${encodeURIComponent(textContent)}`);
        if (!save_response.ok) throw new Error(`HTTP error! status: ${save_response.status}`);
        const data = await save_response.json();

        populateFileSelect();
        showAlert(data.message, 'success');

      } catch (error) {
        console.error('Error in save_fasta:', error);
        showAlert(`Error saving FASTA: ${error.message}`, 'error');
      }
    }

    async function view_fasta() {
      const fastaSelect = document.getElementById("files");
      const selectedFile = fastaSelect.value;
      const resultDiv = document.getElementById("result3");

      if (!selectedFile) {
        showAlert('Please select a FASTA file to view.', 'info');
        resultDiv.textContent = '';
        return;
      }

      try {
        const response = await fetch(`${default_url}/return_fasta2?file=${encodeURIComponent(selectedFile)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        resultDiv.textContent = data.message;
        showAlert(`Viewing file: ${selectedFile}`, 'info');
      } catch (error) {
        console.error('Error in view_fasta:', error);
        showAlert(`Error viewing FASTA file: ${error.message}`, 'error');
        resultDiv.textContent = '';
      }
    }

    async function delete_fasta() {
      const fastaSelect = document.getElementById("files");
      const selectedFile = fastaSelect.value;
      if (!selectedFile) {
        showAlert('Please select a FASTA file to delete.', 'info');
        return;
      }
      try {
        const response = await fetch(`${default_url}/delete_fasta?file=${encodeURIComponent(selectedFile)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        showAlert(`Deleted file: ${selectedFile}`, 'info');
        populateFileSelect();
      } catch (error) {
        console.error('Error in delete_fasta:', error);
        showAlert(`Error deleting FASTA file: ${error.message}`, 'error');
      }
    }

    async function populateFileSelect() {
      const select = document.getElementById("files");
      try {
        const response = await fetch(`${default_url}/list_files`);
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
          if (alertCnt == 0) {
            alertCnt++;
            return;
          }
          showAlert('Files loaded successfully!', 'success');
        } else {
          const option = document.createElement("option");
          option.value = "";
          option.textContent = "No files found";
          select.appendChild(option);
          
          if (alertCnt == 0) {
            alertCnt++;
            return;
          }
          showAlert('No saved FASTA files found.', 'info');
        }
      } catch (error) {
        console.error('Error populating file select:', error);
        select.innerHTML = "<option value=''>Error loading files</option>";
        
        if (alertCnt == 0) {
          alertCnt++;
          return;
        }
        showAlert(`Error loading files: ${error.message}`, 'error');
      }
    }


    async function run_alphafold() {
      const fastaSelect = document.getElementById("files");
      const selectedFile = fastaSelect.value;
      if (!selectedFile) {
        showAlert('Please select a FASTA file to view.', 'info');
        resultDiv.textContent = '';
        return;
      }

      try {
        const response = await fetch(`${default_url}run_alphafold?file=${encodeURIComponent(selectedFile)}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log(data);
        showAlert("Successfully began alphafold process")
      } catch (error) {
        showAlert(`Error running Alphafold: ${error.message}`, 'error')
      }
    }

    window.onload = populateFileSelect;