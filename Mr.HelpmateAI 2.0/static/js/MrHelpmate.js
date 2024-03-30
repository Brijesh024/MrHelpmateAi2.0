import { ProcessUploadedFiles, ProcessUserInputRequest, intializeClientID, intitiateInitialConversation } from './MrHelpmate_AjaxCalls.js';
$(document).ready(function () {
    window.intializeClientID_RequestAttempt = 1;
    window.failedModeration = false;
    window.clientID = 0;
    window._systemError = "Error: An unexpected error occurred. Please restart the conversation.\nTo restart <a href='#' onclick='window.location.href=\"/\";'>click here.</a>";
    window._moderationError = "We're sorry, but your recent input didn't comply with our community standards. \n\nPlease ensure your messages are respectful and appropriate in future conversation.\nTo restart the conversation <a href='#' onclick='window.location.href=\"/\";'>click here.</a>";

    // Execute a function when the user releases a key on the keyboard
    intializeClientID(intializeClientID_RequestAttempt);
    window.appendMessage = function (message, sender) {
        $('#chatcontainer').append('<div class="' + sender + '">' + message.trim() + '</div>'); // Append the response to the chatbox if it's not an array

    }
    window.appendSuccessMessage = function (message, sender, top3_Result, top_3_ReRanked_Result) {

        // Create a button to show top3_Result
        var showTop3Button = $('<button>Show Top 3 Result</button>');

        // Create a button to show Top3_ReRanked_Result
        var showTop3ReRankedButton = $('<button>Show Top 3 ReRanked Result</button>');

        var buttonDiv = document.createElement('div');
        buttonDiv.classList.add('buttonDiv');
        var jQbuttonDiv = $(buttonDiv);
        jQbuttonDiv.append(showTop3Button).append(showTop3ReRankedButton);

        // Append the buttons to the chat container
        // create div with class sender and message as content
        var botDiv = document.createElement('div'); // Create a new div element
        botDiv.classList.add(sender); // Add the specified class to the div
        botDiv.innerHTML  = message.trim(); // Set the content of the div
        
        // Convert botDiv to a jQuery object
        var $botDiv = $(botDiv);
        
        // Use jQuery's append method
        $botDiv.append('<br/>').append(jQbuttonDiv).append('<br/>');
        
        // Append the jQuery object to the desired container
        $('#chatcontainer').append($botDiv);
        // Click event handler for showing top3_Result
        showTop3Button.on('click', function () {
            showPopup(generateTableFromDictionary(top3_Result), 'Top 3 Result');
        });

        // Click event handler for showing Top3_ReRanked_Result
        showTop3ReRankedButton.on('click', function () {
            showPopup(generateTableFromDictionary(top_3_ReRanked_Result), 'Top 3 ReRanked Result');
        });
    }


    window.handleBotResponse = function (message) {
        if (message.exit === '1') { // Moderation error
            appendMessage(_moderationError, 'bot');
            failedModeration = true;
            showAlert();
        }
        else if (message.exit === '2') { //System exeption
            appendMessage(_systemError, 'bot');
            console.log(message.conversation);
            console.log(message.data);
        }
        else {
            if (message.hasOwnProperty('top3_Result')) {
                appendSuccessMessage(message.data, 'bot', message.top3_Result, message.top_3_ReRanked_Result);
            }
            else {
                appendMessage(message.data, 'bot');
                console.log(message.data);
            }
            // console.log(message.conversation);
        }
    }
    $("#chatBoxForm").submit(function (event) {
        event.preventDefault(); // Prevent the default fo submissionrm
        if (!failedModeration) {
            $('#submitbutton').prop('disabled', true); // Disable the submit button
            var userInput = $('#inputtextbox').val();
            if (userInput == '') { // Check if the user input is empty
                $('#submitbutton').prop('disabled', false); // Enable the submit button
                return; // Don't do anything else
            }
            debugger;
            appendMessage(userInput, 'user'); // Append the user message to the chatbox
            scrollToBottom(); // Scroll to the bottom of the chat container
            ProcessUserInputRequest(userInput, 1);// Process the user input
        }

    });

    $("#restartConversationForm").submit(function (event) {

        event.preventDefault(); // Prevent the default form submission
        failedModeration = false;
        $('#restartConversation').prop('disabled', true); // Disable the restart button
        $('#submitbutton').prop('disabled', true); // Disable the submit button
        $('#chatcontainer').empty(); // Clear the chat container
        $('#inputtextbox').val("");
        $('#typingIndicator').show(); // Show the typing indicator       
        intitiateInitialConversation();
        $('#chatcontainer').empty(); // Clear the chat container
        OpenFileUploadPopup(); // Show the file upload dialog
    });

    window.scrollToBottom = function () {
        $('#chatcontainer').scrollTop($('#chatcontainer')[0].scrollHeight);
    }

    $('#inputtextbox').keyup(function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            $('#submitbutton').click();
        }
    });
    $('#btnStartConversation').click(function () {
        $('#btnStartConversation').prop('disabled', true);
        $('#fileInput').prop('disabled', true);
        ShowLoadingPanel('#dvUploadMain');
        ProcessUploadedFiles(clientID);

    });

    window.ShowLoadingPanel = function (targetElement) {
        $(targetElement).append('<div class="loadingPanel"><div class="loadingIcon"></div><div class="loadingText">Processing...</div></div>');
    }
    window.HideLoadingPanel = function (targetElement) {
        $(targetElement).find('.loadingPanel').remove();
    }


    window.OpenFileUploadPopup = function () {
        $('#dvUploadMain').show(); // Show file upload dialog by default
        $('#dvUploadMain').addClass('active'); // Highlight the file upload dialog
        $('#nofiles').show();
        $('#listfilewrapper').hide();
        $('#ulUploadedFiles').empty();
    }
    window.CloseFileUploadPopup = function () {
        $('#dvUploadMain').hide(); // Show file upload dialog by default
        $('#dvUploadMain').removeClass('active'); // Highlight the file upload dialog
    }
    window.showPopup = function (content, title) {
        var popupContent = '<div id="popupContent"><p>' + content + '</p></div>';

        $(popupContent).dialog({
            modal: true,
            title: title,
            width: 800,
            height: 'calc(100vh - 20vh)',
            buttons: {
                Ok: function () {
                    $(this).dialog('close');
                }
            },
            open: function (event, ui) {
                $(this).closest('.ui-dialog').css('background-color', 'lightblue'); // Set background color
            }
        });
    }
    window.generateTableFromDictionary = function (dataArray,title) {
        // var tableTitle=title=="Top 3 Result"?"Top 3 Result":"Top 3 ReRanked Result";
        //create heading with title and center align
        // var heading = '<h2 style="text-align:center;">'+tableTitle+'</h2>';
        var parentDiv = document.createElement('div');
        parentDiv.classList.add('tableContainer');
        // parentDiv.innerHTML = heading;

        var html = '<table id="tblResuts">';
        html += '<thead><tr>';

        // Extract column names from the keys of the first dictionary entry
        var columnNames = Object.keys(dataArray);

        // Add column headers based on the extracted column names
        columnNames.forEach(function (columnName) {
            html += '<th>' + columnName + '</th>';
        });

        html += '</tr></thead>';
        html += '<tbody>';
        var OneColumnName = Object.keys(dataArray)[0];
        var totalRowsKeyList = Object.keys(dataArray[OneColumnName]);
        // Add row values based on the dictionary values

        totalRowsKeyList.forEach(function (rowKey) {
            html += '<tr>';

            columnNames.forEach(function (columnName) {
                html += '<td>' + JSON.stringify(dataArray[columnName][rowKey]) + '</td>';
            });
            html += '</tr>';
        });


        html += '</tbody>';
        html += '</table>';

        parentDiv.innerHTML += html;

        var parentHTML = parentDiv.outerHTML;
        return parentHTML
    }

    var btnStartConversation = $("#btnStartConversation");
    var ulUploadedFiles = $("#ulUploadedFiles");

    // Check if there are any <li> elements inside the <ul>
    window.EnableFileProcessButton = function () {
        var lis = ulUploadedFiles.find("li");
        if (lis.length > 0) {
            // Enable the button
            btnStartConversation.prop('disabled', false);
        } else {
            btnStartConversation.prop('disabled', true);
        }
    }

    // Call the checkList function initially
    EnableFileProcessButton();

    // Add an event listener to the UL to check for changes
    ulUploadedFiles.on("DOMNodeInserted", EnableFileProcessButton);

    ulUploadedFiles.on("DOMNodeRemoved", function () {
        // Call the EnableFileProcessButton function after the <li> elements are removed
        setTimeout(EnableFileProcessButton, 0);
    });
});

