// API key configuration
setAPIkeyStatus();
$("#apiKey").change(setNewAPIkey);

// Clear text from input and output
$("#clearButton").click(clearTextBox);

// Text-to-speech
$("#synthesisButton").click(synthesisText);

// Call API for text-to-speech
async function synthesisText() {
    const API_URL = "https://api.trebesrv.com/synthesis/v1/demo/synthesize";

    // Inform user
    $("#responseBad").css("display", "none");
    $("#wait_email").css("display", "none");
    $("#loading").css("display", "block");

    // Input text
    let inputText = $("#inputText").val();

    if (inputText !== "") {
        // Model from select
        let model = $("#model").val();

        // Get API key and email (optional)
        let auth = localStorage.getItem("apiKey").split("_");
        let apiKey = auth.shift(); // Get first element
        let email = auth.join("_");

        // Define headers
        let headers = email === ""
            ? { 'Content-Type': 'application/json', 'apikey': apiKey, }
            : { 'Content-Type': 'application/json', 'apikey': apiKey, 'X-Trebe-Email-To': email, }

        // Request body (JSON)
        let jsonData = $("#output-name").val() ?
            // Output name set
            JSON.stringify({
                text: inputText,
                normalize: true,
                voice: model,
                delivery: $("input[name=email-response]:checked").val(),
                outfilename: $("#output-name").val(),
            }) :
            // Base request
            JSON.stringify({
                text: inputText,
                normalize: true,
                voice: model,
                delivery: $("input[name=email-response]:checked").val(),
            });

        // Request body
        let fetchData = {
            method: 'POST',
            headers: headers,
            body: jsonData,
        };

        // Send request
        fetch(API_URL, fetchData)
            .then(res => res.json())
            .then(data => {
                if (data.message !== undefined || data.error !== undefined) {
                    // Report error to user
                    $("#responseBad").html(data.message || data.error);
                    $("#loading").css("display", "none");
                    $("#wait_email").css("display", "none");
                    $("#responseBad").css("display", "block");
                } else {
                    // Result will be sent
                    $("#loading").css("display", "none");
                    $("#wait_email").css("display", "block");
                }
            })
            .catch((error) => {
                // Report error to user
                $("#responseBad").html(error);
                $("#loading").css("display", "none");
                $("#wait_email").css("display", "none");
                $("#responseBad").css("display", "block");
            });
    } else {
        // Nothing has been entered
        $("#responseBad").html("No text entered");
        $("#loading").css("display", "none");
        $("#wait_email").css("display", "none");
        $("#responseBad").css("display", "block");
    }
}