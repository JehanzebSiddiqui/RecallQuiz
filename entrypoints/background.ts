export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "SNIP_REGION") {
      const windowId = sender.tab?.windowId;
      if (windowId === undefined) return;

      chrome.tabs
        .captureVisibleTab(windowId, { format: "png" })
        .then((dataUrl) => {
          chrome.runtime
            .sendMessage({
              type: "SNIP_CAPTURED",
              dataUrl,
              rect: message.rect,
              viewportWidth: message.viewportWidth,
            })
            .catch(() => {});
        })
        .catch(console.error);
    }
  });
});