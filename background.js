let isActiveTab = false;
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const activeTab = tabs[0];
      isActiveTab = !isActiveTab;
      const action = isActiveTab ? "startSpying" : "stopSpying";
      chrome.tabs
        .sendMessage(activeTab.id, { action: action })
        .then((response) => {
          console.log("Message sent to content script.");
        })
        .catch((error) => {
          console.error(
            "Erreur lors de l'envoi du message au contenu de la page :",
            error.message
          );
        });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "stopExtension") {
    console.log("L'extension AutomIA a été arrêtée.");
  }
});
