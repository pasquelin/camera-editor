import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "intro",
    {
      type: "category",
      label: "Prise en main",
      items: ["getting-started/installation", "getting-started/quick-start"],
    },
    { type: "category", label: "Guides", items: ["guides/custom-plugin"] },
  ],
};

export default sidebars;
