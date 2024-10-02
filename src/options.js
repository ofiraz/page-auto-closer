// Save the configuration when the "Save" button is clicked
document.getElementById('save').addEventListener('click', function() {
  var urlsToMatch = document.getElementById('urlsToMatch').value;
  var matchingTextForAutoClose = document.getElementById('matchingTextForAutoClose').value;

    // Store the config text in Chrome's local storage
    chrome.storage.sync.set(
      { 
        urlsToMatch: urlsToMatch,
        matchingTextForAutoClose: matchingTextForAutoClose
      }, 
      function() {
        alert('Configuration saved!');
      }
    );
  });
  
  // Load the saved configuration when the options page is opened
  document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get(['urlsToMatch', 'matchingTextForAutoClose'], function(data) {
      if (data) {
        document.getElementById('urlsToMatch').value = data.urlsToMatch;
        document.getElementById('matchingTextForAutoClose').value = data.matchingTextForAutoClose;
      }
    });
  });