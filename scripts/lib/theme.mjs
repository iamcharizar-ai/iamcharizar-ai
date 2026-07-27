// GitHub's own dark-mode tokens. Nothing here is invented — these are the values
// GitHub ships, which is what makes the generated art read as native to the page.
export const theme = {
  canvas: "#0d1117",
  inset: "#010409",
  border: "#30363d",
  borderMuted: "#21262d",
  text: "#e6edf3",
  muted: "#7d8590",
  accent: "#39d353",
  link: "#2f81f7",
  // Contribution ramp, level 0 through 4.
  ramp: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
};

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
