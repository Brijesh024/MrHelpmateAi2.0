function showAlert() {
    document.getElementById('customAlert').classList.remove('hidden');
    // if we want to automatically restart after some time (e.g., 5 seconds)
    //setTimeout(restartConversation, 5000);
}

function restartConversation() {
    $("#restartConversation").click();
    document.getElementById('customAlert').classList.add('hidden');
    
}
