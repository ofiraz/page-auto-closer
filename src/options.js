// Save the configuration when the "Save" button is clicked
document.getElementById('save').addEventListener('click', function() {
    var configText = document.getElementById('configText').value;
    
    // Store the config text in Chrome's local storage
    chrome.storage.sync.set({ configText: configText }, function() {
      alert('Configuration saved!');
    });
  });
  
  // Load the saved configuration when the options page is opened
  document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.sync.get('configText', function(data) {
      if (data.configText) {
        document.getElementById('configText').value = data.configText;
      }
    });
  });