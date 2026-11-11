import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Recall AI",
    description: "Quiz yourself on what you read",
    permissions: ["sidePanel", "activeTab", "storage"],
    host_permissions: ["<all_urls>"],
    action: { default_title: "Open Recall AI" },
  },
});