export default defineBackground(() => {
  // Clicking the extension icon opens the side panel
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});