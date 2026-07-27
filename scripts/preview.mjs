// Renders the SVGs from synthetic data so the layout and animation can be checked
// without a GitHub token. Not used in CI — this is a local design harness.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { renderHeatmap } from "./generate-heatmap.mjs";

const LEVEL_NAMES = [
  "NONE",
  "FIRST_QUARTILE",
  "SECOND_QUARTILE",
  "THIRD_QUARTILE",
  "FOURTH_QUARTILE",
];

function syntheticUser() {
  const weeks = [];
  const start = new Date();
  start.setDate(start.getDate() - 364);

  let total = 0;
  for (let w = 0; w < 53; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + w * 7 + d);
      if (date > new Date()) break;

      // Weekends quieter, a ramp-up over the year, plus noise — looks like a real profile.
      const seasonal = w / 53;
      const weekend = d === 0 || d === 6 ? 0.35 : 1;
      const roll = Math.random() * seasonal * weekend * 1.9;
      const count = roll < 0.35 ? 0 : Math.ceil(roll * 6);
      const level = count === 0 ? 0 : Math.min(4, Math.ceil(count / 3));

      total += count;
      days.push({
        date: date.toISOString().slice(0, 10),
        contributionCount: count,
        contributionLevel: LEVEL_NAMES[level],
      });
    }
    if (days.length) weeks.push({ contributionDays: days });
  }

  return {
    name: "Rishabh Sharma",
    login: "iamcharizar-ai",
    contributionsCollection: {
      contributionCalendar: { totalContributions: total, weeks },
    },
  };
}

const outDir = resolve("preview");
mkdirSync(outDir, { recursive: true });

const user = syntheticUser();
const heatmap = renderHeatmap(user);
writeFileSync(resolve(outDir, "contrib-heatmap.svg"), heatmap, "utf8");

writeFileSync(
  resolve(outDir, "index.html"),
  `<!doctype html>
<meta charset="utf-8">
<title>Profile art preview</title>
<style>
  body { background:#0d1117; color:#e6edf3; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; margin:0; padding:40px 24px; }
  main { max-width:960px; margin:0 auto; display:flex; flex-direction:column; gap:28px; }
  h1 { font-size:18px; font-weight:600; margin:0; }
  p { color:#7d8590; font-size:13px; margin:0; }
  .stage { border:1px solid #30363d; border-radius:10px; padding:20px; background:#010409; overflow-x:auto; }
  button { background:#21262d; color:#e6edf3; border:1px solid #30363d; border-radius:6px; padding:7px 14px; font-size:13px; cursor:pointer; }
  button:hover { background:#30363d; }
  img { display:block; max-width:100%; }
</style>
<main>
  <div>
    <h1>Animated contribution heatmap</h1>
    <p>Synthetic data. Reload to replay the cascade.</p>
  </div>
  <button onclick="document.getElementById('hm').src='contrib-heatmap.svg?'+Date.now()">Replay animation</button>
  <div class="stage"><img id="hm" src="contrib-heatmap.svg" alt="Contribution heatmap"></div>
</main>
`,
  "utf8"
);

console.log(`preview written to ${outDir}`);
