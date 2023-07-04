// API key configuration
setAPIkeyStatus();
$("#apiKey").change(setNewAPIkey);

// Validate selected file
$("#inputFile").change(validateFile(
    ["docx", "pptx", "xlsx", "txt", "odt", "html", "xml", "xliff", "xlf", "tmx"]
));

// Translate document
$("#doctransButton").click(docTranslation);

// Call API for document translation
async function docTranslation() {
    const API_URL = "https://api.trebesrv.com/translation/v1/demo/doctrans";

    // Inform user
    $("#responseBad").css("display", "none");
    $("#wait_email").css("display", "none");
    $("#loading_file").css("display", "block");

    // Input file
    let input = $("#inputFile").prop("files")[0];

    if (input != null) {
        let model = $("#model").val(); // Language from select
        let languages = model.split("2"); // Get both languages

        // Get API key and email (optional)
        let auth = localStorage.getItem("apiKey").split("_");
        let apiKey = auth.shift(); // Get first element
        let email = auth.join("_");

        // Define headers
        let headers = email === ""
            ? { 'apikey': apiKey, }
            : { 'apikey': apiKey, 'X-Trebe-Email-To': email, }

        // Request body (form-data)
        let formData = new FormData;
        formData.append("file", input);
        formData.append("sourcelanguage", languages[0]);
        formData.append("targetlanguage", languages[1]);
        formData.append("delivery", $("input[name=email-response]:checked").val())

        // Check if optional output name is set
        if ($("#output-name").val()) {
            formData.append("outfilename", $("#output-name").val());
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