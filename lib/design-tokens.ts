import type { ColorToken } from "@/components/design-system/TokenSwatch";

// Values mirror app/globals.css (the source of truth).
export const TOKENS: { group: string; description: string; tokens: ColorToken[] }[] = [
  {
    group: "Brand",
    description: "One primary blue for action and focus, one secondary teal for success and accepted changes.",
    tokens: [
      { name: "primary", light: "#0b63ce", dark: "#4c9aff", usage: "Primary actions, focus rings" },
      { name: "primary-hover", light: "#0a56b3", dark: "#6aabff", usage: "Primary hover" },
      { name: "on-primary", light: "#ffffff", dark: "#0b1220", usage: "Text on primary", utility: "text" },
      { name: "primary-subtle", light: "#e8f1fc", dark: "#13294a", usage: "Info tints, ring track" },
      { name: "primary-text", light: "#0a56b3", dark: "#8cc2ff", usage: "Links, active tab", utility: "text" },
      { name: "secondary", light: "#0d7a70", dark: "#2cc3b0", usage: "Accepted, success actions" },
      { name: "secondary-hover", light: "#0a665e", dark: "#4fd3c2", usage: "Secondary hover" },
      { name: "on-secondary", light: "#ffffff", dark: "#0b1220", usage: "Text on secondary", utility: "text" },
      { name: "secondary-subtle", light: "#d9f3ef", dark: "#0f2f30", usage: "Insertions, success tints" },
      { name: "secondary-text", light: "#08594f", dark: "#8ce8db", usage: "Success text", utility: "text" },
    ],
  },
  {
    group: "Neutrals",
    description: "Surfaces step up from canvas; ink steps down in emphasis. Borders separate, inputs outline.",
    tokens: [
      { name: "canvas", light: "#f7f8fa", dark: "#0b1220", usage: "Page background" },
      { name: "surface", light: "#ffffff", dark: "#0f1829", usage: "Cards, header" },
      { name: "surface-muted", light: "#f2f4f7", dark: "#141f33", usage: "Hover, wells" },
      { name: "band", light: "#e8f1fc", dark: "#0f2340", usage: "Hero band" },
      { name: "ink", light: "#0d1b2a", dark: "#e6ebf2", usage: "Body text, headings", utility: "text" },
      { name: "ink-2", light: "#475467", dark: "#a3b0c2", usage: "Secondary text", utility: "text" },
      { name: "ink-3", light: "#5d6b7e", dark: "#8b99ad", usage: "Captions, labels", utility: "text" },
      { name: "border", light: "#e4e7ec", dark: "#1f2b40", usage: "Dividers, card edges", utility: "border" },
      { name: "border-strong", light: "#d0d5dd", dark: "#2b3a55", usage: "Secondary buttons", utility: "border" },
      { name: "input", light: "#7d8799", dark: "#62738f", usage: "Form control outline (3:1)", utility: "border" },
    ],
  },
  {
    group: "Meaning",
    description: "Reserved for state. Danger for errors and deletions, warning for things to double-check.",
    tokens: [
      { name: "danger", light: "#b42318", dark: "#ff8a80", usage: "Errors, deletions", utility: "text" },
      { name: "danger-subtle", light: "#fef3f2", dark: "#3a1414", usage: "Error backgrounds" },
      { name: "warning-text", light: "#8a4b00", dark: "#ffc97a", usage: "Warning text", utility: "text" },
      { name: "warning-subtle", light: "#fff4e0", dark: "#33270f", usage: "Warning backgrounds" },
    ],
  },
];
