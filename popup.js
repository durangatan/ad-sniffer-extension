document.addEventListener('DOMContentLoaded', function() {
  const preserveLog = document.getElementById('preserve-log');
  chrome.storage.local.get(['preserveLog'], function(result) {
    if (result.preserveLog) {
      if (preserveLog) {
        preserveLog.checked = result.preserveLog;
      }
    }
  });

  if (preserveLog) {
    preserveLog.addEventListener('change', function(event) {
      chrome.storage.local.set({
        preserveLog: event.target.checked
      });
    });
  }
});
