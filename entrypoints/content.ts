export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    let snipping = false;

    // Part 1: highlighted text (from Day 1)
    document.addEventListener("mouseup", () => {
      if (snipping) return;
      const text = window.getSelection()?.toString().trim();
      if (text && text.length > 20) {
        chrome.runtime.sendMessage({ type: "SELECTION", text }).catch(() => {});
      }
    });

    // Part 2: drag-to-select overlay
    function startSnip() {
      if (snipping) return;
      snipping = true;
      window.getSelection()?.removeAllRanges();

      const overlay = document.createElement("div");
      Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        zIndex: "2147483647",
        cursor: "crosshair",
        background: "rgba(0, 0, 0, 0.3)",
      });

      const box = document.createElement("div");
      Object.assign(box.style, {
        position: "fixed",
        border: "2px solid #4f8cff",
        display: "none",
      });
      overlay.appendChild(box);
      document.body.appendChild(overlay);

      let startX = 0;
      let startY = 0;
      let dragging = false;

      const cleanup = () => {
        overlay.remove();
        document.removeEventListener("keydown", onKey, true);
        snipping = false;
      };

      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") cleanup();
      };
      document.addEventListener("keydown", onKey, true);

      const draw = (x: number, y: number) => {
        box.style.left = `${Math.min(startX, x)}px`;
        box.style.top = `${Math.min(startY, y)}px`;
        box.style.width = `${Math.abs(x - startX)}px`;
        box.style.height = `${Math.abs(y - startY)}px`;
      };

      overlay.addEventListener("mousedown", (e) => {
        e.preventDefault();
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        box.style.display = "block";
        draw(e.clientX, e.clientY);
      });

      overlay.addEventListener("mousemove", (e) => {
        if (dragging) draw(e.clientX, e.clientY);
      });

      overlay.addEventListener("mouseup", async (e) => {
        e.stopPropagation();
        if (!dragging) return;
        dragging = false;

        const rect = {
          x: Math.min(startX, e.clientX),
          y: Math.min(startY, e.clientY),
          width: Math.abs(e.clientX - startX),
          height: Math.abs(e.clientY - startY),
        };
        cleanup();
        if (rect.width < 10 || rect.height < 10) return;

        // Let the overlay disappear before the screenshot is taken
        await new Promise((r) => setTimeout(r, 100));
        chrome.runtime
          .sendMessage({
            type: "SNIP_REGION",
            rect,
            viewportWidth: window.innerWidth,
          })
          .catch(() => {});
      });
    }

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === "START_SNIP") {
        startSnip();
        sendResponse({ ok: true });
      }
    });
  },
});