// API key configuration
setAPIkeyStatus();
$("#apiKey").change(setNewAPIkey);

// Clear text from input and output
$("#clearButton").click(clearTextBox);

// Copy to clipboard
$("#clipboard-tkonline").click(copyToClipboard);

// Control buttons
const recordStart = document.querySelector("#recordStartButton");
const recordStop = document.querySelector("#stopRecordingButton");
const resumeButton = document.querySelector("#continueRecordingButton");
const recordEnd = document.querySelector("#recordEndButton");
const cancelButton = document.querySelector("#cancelRecordingButton");
const newRecordingButton = document.querySelector("#newRecordingButton");
const audioPlayer = document.querySelector("#audioPlayer");
const durationDisplay = document.getElementById('duration');

let mediaRecorder = null; // Recorder
let chunks = []; // Data chunks
let startTime, durationInterval, totalDuration = 0;

// Función para reiniciar el contador de tiempo
function resetTimer() {
    startTime = null;
    durationInterval = null;
    totalDuration = 0;
    durationDisplay.textContent = "0 s";
}

// Start recording
recordStart.onclick = () => {
    // Require access to microphone
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            // Recorder not set
            if (mediaRecorder === null) {
                // Create recorder
                mediaRecorder = new MediaRecorder(stream, { audioBitsPerSecond: 16000 });

                // Event listener when stopped
                mediaRecorder.onstop = () => {
                    // Process chunks
                    const blob = new Blob(chunks, { "type": "audio/wav; codecs=0" });

                    // Reset chunks
                    chunks = [];

                    // Set audio source
                    document.querySelector("audio").src = URL.createObjectURL(blob);

                    // Transfer audio to inputFile
                    transferAudioToInputFile(blob);

                    // Call the API for transcription
                    mediaTranslation();
                }

                // Event listener when data is sent
                mediaRecorder.ondataavailable = (e) => {
                    chunks.push(e.data);
                }
            }

            mediaRecorder.start(); // Start recording
            resetTimer(); // Reiniciar el contador de tiempo

            startTime = Date.now();
            durationInterval = setInterval(updateDuration, 1000);

            // Enable/disable control buttons
            recordStart.disabled = true;
            recordStop.disabled = false;
            resumeButton.disabled = true;
            cancelButton.disabled = true;
            newRecordingButton.disabled = true;
        }, (err) => console.error("Error: " + err));
}

// Stop recording
recordStop.onclick = () => {
    mediaRecorder.pause(); // Pause recording

    clearInterval(durationInterval);
    totalDuration += Math.round((Date.now() - startTime) / 1000);

    // Enable/disable control buttons
    recordStart.disabled = true;
    recordStop.disabled = true;
    resumeButton.disabled = false;
    recordEnd.disabled = false;
    cancelButton.disabled = false;
    newRecordingButton.disabled = true;
}

// Resume recording
resumeButton.onclick = () => {
    mediaRecorder.resume(); // Resume recording

    startTime = Date.now();
    durationInterval = setInterval(updateDuration, 1000);

    // Enable/disable control buttons
    recordStart.disabled = true;
    recordStop.disabled = false;
    recordEnd.disabled = false;
    resumeButton.disabled = true;
    cancelButton.disabled = false;
    newRecordingButton.disabled = true;
}

// End recording
recordEnd.onclick = () => {
    mediaRecorder.stop(); // Stop recording

    clearInterval(durationInterval);
    totalDuration += Math.round((Date.now() - startTime) / 1000);

    // Enable/disable control buttons
    recordStart.disabled = false;
    recordStop.disabled = true;
    recordEnd.disabled = true;
    resumeButton.disabled = true;
    cancelButton.disabled = false;
    newRecordingButton.disabled = true;
}

// Cancel recording
cancelButton.onclick = () => {
    mediaRecorder = null; // Reset recorder
    chunks = [];          // Reset chunks

    // Reset audio source
    document.querySelector("audio").src = "";

    // Enable/disable control buttons
    recordStart.disabled = false;
    recordStop.disabled = true;
    resumeButton.disabled = true;
    cancelButton.disabled = true;
    newRecordingButton.disabled = false;

    // Reload the page
    location.reload();
}

// Actualizar el contador de tiempo
function updateDuration() {
    const currentTime = totalDuration + Math.round((Date.now() - startTime) / 1000);
    durationDisplay.textContent = `${currentTime} s`;
}

// New recording
newRecordingButton.onclick = () => {
    mediaRecorder = null; // Reset recorder
    chunks = [];          // Reset chunks

    // Reset audio source
    document.querySelector("audio").src = "";

    // Enable/disable control buttons
    recordStart.disabled = false;
    recordStop.disabled = true;
    resumeButton.disabled = true;
    cancelButton.disabled = false;
    newRecordingButton.disabled = true;
}

// Transfer audio to inputFile
function transferAudioToInputFile(blob) {
    const inputFile = document.getElementById("inputFile");

    // Convert blob to File object
    const file = new File([blob], "recording.wav");

    // Create a new DataTransfer object
    const dataTransfer = new DataTransfer();

    // Add the file to the DataTransfer object
    dataTransfer.items.add(file);

    // Assign the DataTransfer object to the inputFile element
    inputFile.files = dataTransfer.files;
}


// Copy output text to clipboard
function copyToClipboard() {
    let text = $("#outputTranscription");
    text.select();
    navigator.clipboard.writeText(text.val());
}

//Mostrar al Arrastrar
// Obtener el elemento inputFile
let inputFile = document.getElementById("inputFile");

// Agregar un event listener al cambio de inputFile
inputFile.addEventListener("change", function () {
    // Obtener el archivo seleccionado
    let selectedFile = inputFile.files[0];

    if (selectedFile) {
        // Mostrar en Consola
        console.log("Archivo seleccionado:", selectedFile.name);
        // Mostrar al usuario
        $("#filename").text("Archivo seleccionado: " + selectedFile.name);
    }
});

// Transcription of file
$("#transcribeButton").click(mediaTranslation);

// Call API for transcription
async function mediaTranslation() {
    const API_URL = "https://api.trebesrv.com/transcription/v1/demo/transcribe";

    // Inform user
    $("#responseBad").css("display", "none");
    $("#wait_email").css("display", "none");
    $("#loading_file").css("display", "block");

    // Input file
    let input = $("#inputFile").prop("files")[0];

    if (input != null) {
        // Selected model
        let model = $("#model").val();

        // Get API key and email (optional)
        let auth = localStorage.getItem("apiKey").split("_");
        let apiKey = auth.shift(); // Get first element
        let email = auth.join("_");

        // Define headers
        let headers = email === ""
            ? { 'apikey': apiKey }
            : { 'apikey': apiKey, 'X-Trebe-Email-To': email };

             // Request body (form-data)
             let formData = new FormData();
             formData.append("file", input);
             formData.append("apikey", localStorage.getItem("apiKey"));
             formData.append("delivery", $("input[name=email-response]:checked").val());
     
             // Set language model
             formData.append("languagemodel", model);
     
             // Set diarization if selected
             if ($("#diarization").is(":checked")) {
                 formData.append("diarization", "auto");
             }
     
             // Check if optional output name is set
             if ($("#output-name").val()) {
                 formData.append("outfilename", $("#output-name").val());
             }
     
             // Check output formats
             if ($("#format-srt").is(":checked")) {
                 formData.append("formats", "srt");
             }
             if ($("#format-rtf").is(":checked")) {
                 formData.append("formats", "rtf");
             }
             if ($("#format-stl").is(":checked")) {
                 formData.append("formats", "stl");
             }
             if ($("#format-vtt").is(":checked")) {
                 formData.append("formats", "vtt");
             }
             if ($("#format-txt").is(":checked")) {
                 formData.append("formats", "txt");
             }
             if ($("#format-xml").is(":checked")) {
                 formData.append("formats", "xml");
             }
             if ($("#format-json").is(":checked")) {
                 formData.append("formats", "json");
             }
             if ($("#format-mjson").is(":checked")) {
                 formData.append("formats", "mjson");
             }
     
             // Request body
             let fetchData = {
                 method: 'POST',
                 headers: headers,
                 body: formData,
             };
     
             // Send request
             fetch(API_URL, fetchData)
                 .then(res => res.json())
                 .then(data => {
                     if (data.message !== undefined || data.error !== undefined) {
                         // Report error to user
                         $("#responseBad").html(data.message || data.error);
                         $("#loading_file").css("display", "none");
                         $("#wait_email").css("display", "none");
                         $("#responseBad").css("display", "block");
                     } else {
                         // Result will be sent
                         $("#loading_file").css("display", "none");
                         $("#wait_email").css("display", "block");
                         // Mostrar mensaje en la consola
                         console.log("Correo enviado con el archivo: ", input.name);
                         $("#filename").text("Archivo Mandado: " + input.name);
                         let outputName = $("#output-name").val();
                        alert("Trancripción mandada: " + outputName);
                        formData.append("outfilename", outputName);
                     }
                 })
                 .catch((error) => {
                     // Report error to user
                     $("#responseBad").html(error);
                     $("#loading_file").css("display", "none");
                     $("#wait_email").css("display", "none");
                     $("#responseBad").css("display", "block");
                 });
         } else {
             // Nothing has been selected
             $("#responseBad").html("No file selected");
             $("#loading_file").css("display", "none");
             $("#wait_email").css("display", "none");
             $("#responseBad").css("display", "block");
         }
     }
     
