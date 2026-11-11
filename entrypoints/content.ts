export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    document.addEventListener("mouseup", () => {
      const text = window.getSelection()?.toString().trim();
      if (text && text.length > 20) {
        // Fails quietly if the side panel isn't open yet
        chrome.runtime.sendMessage({ type: "SELECTION", text }).catch(() => {});
      }
    });
  },
});