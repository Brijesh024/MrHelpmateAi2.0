

$(document).ready(function () {
    function uploadFilesList() {
        var files = $('#fileInput').prop('files'); // Get selected files
        if (files.length === 0) {
            alert('Please select files to upload.');
            return;
        }

        // Send files to Flask backend:
        var formData = new FormData();
        for (var i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        formData.append('clientID', clientID); // Include clientID in the request

        $.ajax({
            url: '/uploadfiles',
            type: 'POST',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            success: function (response) {
                // Process the response
                $.each(response, function (index, file) {
                    addList(file);
                });
                if ($('#ulUploadedFiles li').length > 0) {
                    $('#listfilewrapper').show();
                    $('#nofiles').hide();

                }
                else {
                    $('#listfilewrapper').hide();
                    $('#nofiles').show();
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert('Error uploading files: ' + errorThrown);
            }
        });
    }
    OpenFileUploadPopup();
    
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', uploadFilesList);
    $('#btnUploadFiles').on('click', function () {
        $('#dvUploadMain').hide(); // Show file upload dialog by default
        $('#dvUploadMain').removeClass('active'); // Highlight the file upload dialog
    });

    function OpenFileUploadPopup() {
        $('#dvUploadMain').show(); // Show file upload dialog by default
        $('#dvUploadMain').addClass('active'); // Highlight the file upload dialog
        $('#nofiles').show();
        $('#listfilewrapper').hide();
        $('#ulUploadedFiles').empty();
    }

    function addList(fileName) {
        // Create a new list item with the provided file name and delete button
        var listItem = $('<li>').addClass('added');
        var filenameSpan = $('<span>').addClass('filename').attr('filename', fileName).text(fileName);
        var deleteBtnSpan = $('<span>').addClass('delete-btn').text('\u00D7');
        listItem.append(filenameSpan, deleteBtnSpan);

        // Append the new list item to the ulUploadFiles list
        $('#ulUploadedFiles').append(listItem);
        // Bind click event handler to the delete button
        deleteBtnSpan.on('click', function () {
            // Extract the file name from the parent list item
           deleteFile($(this).siblings('.filename').text());
        });
    }
    function deleteFile(FileName) {
        $.ajax({
            type: "POST",
            url: "/deletefile", // Replace with your actual Flask route
            data: { file_name: FileName, clientID: clientID }, // Send user input to server
            success: function (response) {
                // Process the response
                if (response === 'true') {
                    $('#ulUploadedFiles li').each(function (index, li) {
                        var fileNameSpan = $(li).find('span:first'); // Select the first span element within the current li
                        var fileName = fileNameSpan.attr('filename'); // Retrieve the filename attribute value
                        if (fileName === FileName) {
                            $(li).remove();
                        }
                    });
                }
                if ($('#ulUploadedFiles li').length > 0) {
                    $('#listfilewrapper').show();
                    $('#nofiles').hide();
                }
                else {
                    $('#listfilewrapper').hide();
                    $('#nofiles').show();
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                alert('Error deleting file: ' + errorThrown);
            }
        });
    }

});

