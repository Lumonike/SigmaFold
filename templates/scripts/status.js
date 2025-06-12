
    let default_url = window.location;

    // Keep a queue of all active alerts
    let alertQueue = [];

    let last_file = null;

    async function move_pdb() {
        
        let protein_name = document.getElementById("folders").value;

        try {
            const response = await fetch(`${default_url}/move_pdb?protein_name=${encodeURIComponent(protein_name)}`)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            console.log(data);
            showAlert(`${data.message}`);
        } catch (error) {
            showAlert(`Error running Alphafold: ${error.message}`, 'error')
        }
    }
    async function move_pkl() {
        
        let protein_name = document.getElementById("folders").value;

        try {
            const response = await fetch(`${default_url}/move_pkl?protein_name=${encodeURIComponent(protein_name)}`)
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            console.log(data);
            showAlert(`${data.message}`);
        } catch (error) {
            showAlert(`Error running Alphafold: ${error.message}`, 'error')
        }
    }

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
    async function populateProteinSelect() {
    const select = document.getElementById("folders");
    try {
        const response = await fetch(`${default_url}/list_protein_folders`);
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
        select.appendChild(option);
        }
    } catch (error) {
        console.error('Error populating PKL file select:', error);
        select.innerHTML = "<option value=''>Error loading files</option>";
    }
    }

    async function loadLog() {
        if (document.getElementById("logCheckbox").checked){
            document.getElementById("time").textContent = new Date();
            let resultBox = document.getElementById("result");
            let protein_name = document.getElementById("folders").value;
            try {
                const response = await fetch(`${default_url}/get_log?protein=${encodeURIComponent(protein_name)}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                resultBox.value = data["log message"];
                // Scroll to bottom after setting value
                if (last_file !== protein_name) {
                    resultBox.scrollTop = resultBox.scrollHeight;
                }
                last_file = protein_name;
            } catch (error) {
                showAlert(`Error running Alphafold: ${error.message}`, 'error')
            }
        }
        setTimeout(loadLog, 1000);
    }
    window.onload = function () {
        populateProteinSelect();
        setTimeout(loadLog, 1000);
    }

    // Zoom functionality for the textarea
    let currentFontSize = 1.0; // rem
    const minFontSize = 0.5;
    const maxFontSize = 3;

    function setTextareaFontSize(sizeRem) {
        const textarea = document.getElementById('result');
        textarea.style.fontSize = sizeRem + 'rem';
    }

    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('zoomInBtn').addEventListener('click', function() {
            if (currentFontSize < maxFontSize) {
                currentFontSize += 0.1;
                setTextareaFontSize(currentFontSize);
            }
        });
        document.getElementById('zoomOutBtn').addEventListener('click', function() {
            if (currentFontSize > minFontSize) {
                currentFontSize -= 0.1;
                setTextareaFontSize(currentFontSize);
            }
        });
    });