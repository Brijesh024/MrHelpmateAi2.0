
export function intializeClientID(intializeClientID_RequestAttempt) {
    $.ajax({
        type: "POST",
        url: "/get_client_id", // Replace with your actual Flask route
        data: {}, // Send user input to server
        async: false,
        success: function (response) {
            try {
                // var data = JSON.parse(response);
                clientID = response.client_id;                
            }
            catch (err) {
                console.log(err + " - Attempt:" + intializeClientID_RequestAttempt);
                if (intializeClientID_RequestAttempt <= 3) {
                    intializeClientID_RequestAttempt++;
                    intializeClientID(intializeClientID_RequestAttempt);
                    return;
                }
                appendMessage(_systemError, 'bot');
                $('#typingIndicator').hide();
                $('#inputtextbox').focus();
                $('#submitbutton').prop('disabled', true);
            }
        },
        error: function (xhr, status, error) {
            debugger;
            console.log(error);
            appendMessage(_systemError, 'bot');

            $('#typingIndicator').hide();
            $('#submitbutton').prop('disabled', true);
        }
    });
    // $('#restartConversation').click();
}

export function intitiateInitialConversation() {
    $.ajax({
        type: "POST",
        url: "/restart_conv", // Replace with your actual Flask route
        data:{ 'client_id': clientID }, // Send user input to server
        // async: false,
        success: function (response) {
            clientID = response.data;
            $('#typingIndicator').hide(); // Hide the typing indicator
            scrollToBottom(); // Scroll to the bottom of the chat container
            $('#inputtextbox').focus(); // Set focus back to the input textbox
            $('#submitbutton').prop('disabled', false); // Enable the submit button
            $('#restartConversation').prop('disabled', false); // Enable the submit button
            
        },
        error: function (xhr, status, error) {
            debugger;
            console.log(error);
            appendMessage(_systemError, 'bot');

            $('#typingIndicator').hide();
            $('#submitbutton').prop('disabled', true);
        }
    });
}

export  function ProcessUserInputRequest(userInput, requestAttept) {
    $('#typingIndicator').show(); // Show the typing indicator
    $('#inputtextbox').val(""); // Clear the input field
    debugger;
    $.ajax({
        type: "POST",
        url: "/conversation", // Replace with your actual Flask route
        contentType: "application/json",
        // async: false,
        data: JSON.stringify({ user_input_message: userInput, client_id: clientID }), // Send user input to server

        success: function (response) {
            try {
                if (Array.isArray(response)) {
                    response.forEach(handleBotResponse);
                } else {
                    handleBotResponse(JSON.parse(response));
                }
                $('#typingIndicator').hide(); // Hide the typing indicator
                $('#inputtextbox').val(''); // Clear the input field
                scrollToBottom(); // Scroll to the bottom of the chat container
                $('#inputtextbox').focus(); // Set focus back to the input textbox
                $('#submitbutton').prop('disabled', false); // Enable the submit    
            }
            catch (err) {
                console.log(err + " - Attempt:" + requestAttept);
                if (requestAttept <= 3) {
                    requestAttept++;
                    ProcessUserInputRequest(userInput, requestAttept);
                    return;
                }
                appendMessage(_systemError, 'bot');
                $('#typingIndicator').hide();
                $('#inputtextbox').focus();
                $('#submitbutton').prop('disabled', true);
            }
        },
        error: function (xhr, status, error) {
            console.log(error + " - Attempt:" + requestAttept);
            if (requestAttept <= 3) {
                requestAttept++;
                ProcessUserInputRequest(userInput, requestAttept);
                return;
            }

            appendMessage(_systemError, 'bot');
            $('#typingIndicator').hide();
            $('#inputtextbox').focus();
            $('#submitbutton').prop('disabled', true);
        }
    });
}


export function ProcessUploadedFiles(clientID){
    $.ajax({
        type: "POST",
        url: "/processFiles", // Replace with your actual Flask route
        data: { clientID: clientID},
        success: function (response) {
            // Process the response
            if (Array.isArray(response)) {
                response.forEach(handleBotResponse);
            } else {
                handleBotResponse(JSON.parse(response));
            }
            $('#typingIndicator').hide(); // Hide the typing indicator
            $('#inputtextbox').val(''); // Clear the input field
            scrollToBottom(); // Scroll to the bottom of the chat container
            $('#inputtextbox').focus(); // Set focus back to the input textbox
            $('#submitbutton').prop('disabled', false); // Enable the submit    
            CloseFileUploadPopup();
            HideLoadingPanel('#dvUploadMain');
            $('#btnStartConversation').prop('disabled', false);
            $('#fileInput').prop('disabled', false);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert('Error uploading files: ' + errorThrown);
        }
    });
    
}