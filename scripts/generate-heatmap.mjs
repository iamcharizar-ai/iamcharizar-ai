import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { fetchProfile, toWeeks, streaks } from "./lib/github.mjs";
import { theme, MONTHS, DAY_LABELS, escapeXml } from "./lib/theme.mjs";

const CELL = 13;
const GAP = 3;
const PITCH = CELL + GAP;

const PAD_X = 16;
const GUTTER = 30; // room for the Mon/Wed/Fri labels
const GRID_X = PAD_X + GUTTER;
const MONTH_ROW_Y = 22;
const GRID_Y = 34;

// Diagonal sweep: later weeks and later weekdays both push the delay out, so the
// cascade runs top-left to bottom-right instead of column-by-column.
const WEEK_STEP = 0.055;
const DAY_STEP = 0.036;

function monthLabels(weeks) {
  const labels = [];
  let lastMonth = -1;
  let lastLabelledWeek = -Infinity;

  weeks.forEach((week, index) => {
    const first = week[0];
    if (!first) return;
    const month = new Date(first.date).getUTCMonth();
    if (month === lastMonth) return;
    lastMonth = month;

    // Week 0 is a partial month. Labelling it would both sit flush against the
    // grid edge and crowd out the next month, so note the month and move on.
    if (index === 0) return;

    // Keep a real gap between labels, and don't run off the right edge.
    if (index - lastLabelledWeek < 3) return;
    if (index > weeks.length - 3) return;

    lastLabelledWeek = index;
    labels.push({ x: GRID_X + index * PITCH, text: MONTHS[month] });
  });

  return labels;
}

export function renderHeatmap(user) {
  const weeks = toWeeks(user);
  const { longest, current } = streaks(weeks);
  const calendar = user.contributionsCollection.contributionCalendar;
  const total = calendar.totalContributions;

  const width = GRID_X + weeks.length * PITCH + PAD_X;
  const height = GRID_Y + 7 * PITCH + 34;

  const cells = [];
  weeks.forEach((week, w) => {
    week.forEach((day, d) => {
      const delay = (w * WEEK_STEP + d * DAY_STEP).toFixed(3);
      const x = GRID_X + w * PITCH;
      const y = GRID_Y + d * PITCH;
      // Only cells with activity get the brightness flash; empty cells just pop in.
      const cls = day.level > 0 ? "c g" : "c";
      const title = `${day.count} contribution${day.count === 1 ? "" : "s"} on ${day.date}`;
      cells.push(
        `<rect class="${cls}" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" ` +
          `fill="${theme.ramp[day.level]}" style="animation-delay:${delay}s"><title>${escapeXml(title)}</title></rect>`
      );
    });
  });

  const months = monthLabels(weeks)
    .map((m) => `<text class="lbl" x="${m.x}" y="${MONTH_ROW_Y}">${m.text}</text>`)
    .join("");

  const days = DAY_LABELS.map((label, i) =>
    label
      ? `<text class="lbl" x="${PAD_X}" y="${GRID_Y + i * PITCH + CELL - 2}">${label}</text>`
      : ""
  ).join("");

  const footerY = GRID_Y + 7 * PITCH + 22;
  const legendX = width - PAD_X - 5 * PITCH - 60;
  const legend = theme.ramp
    .map(
      (color, i) =>
        `<rect x="${legendX + 30 + i * PITCH}" y="${footerY - 10}" width="${CELL}" height="${CELL}" rx="2.5" fill="${color}"/>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(
    `${total} contributions in the last year`
  )}">
<style>
  text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
  text.lbl { fill: ${theme.muted}; font-size: 11px; font-weight: 600; }
  text.total { fill: ${theme.text}; font-size: 14px; font-weight: 700; }
  text.meta { fill: ${theme.muted}; font-size: 11px; font-weight: 600; }
  .c { transform-box: fill-box; transform-origin: center; opacity: 0; animation: pop 0.55s ease-out both; }
  .g { animation: pop 0.55s ease-out both, flash 0.7s ease-out both; }
  @keyframes pop {
    0%   { opacity: 0; transform: scale(0.2); }
    60%  { opacity: 1; transform: scale(1.12); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes flash {
    0%   { filter: brightness(2.4); }
    45%  { filter: brightness(2.4); }
    100% { filter: brightness(1); }
  }
  @media (prefers-reduced-motion: reduce) {
    .c, .g { animation: none; opacity: 1; }
  }
</style>
<rect width="${width}" height="${height}" rx="8" fill="${theme.canvas}" stroke="${theme.border}"/>
${months}
${days}
${cells.join("\n")}
<text class="total" x="${PAD_X}" y="${footerY}">${total.toLocaleString("en-US")} contributions in the last year</text>
<text class="meta" x="${legendX - 8}" y="${footerY}" text-anchor="end">${current}d current · ${longest}d best</text>
<text class="lbl" x="${legendX}" y="${footerY}">Less</text>
${legend}
<text class="lbl" x="${legendX + 30 + 5 * PITCH + 4}" y="${footerY}">More</text>
</svg>
`;
}

// Only fetch when run directly — importing this module (e.g. from preview.mjs)
// must not require a token or hit the network.
const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (entry && import.meta.url === entry) {
  const login = process.env.PROFILE_LOGIN || "iamcharizar-ai";
  const token = process.env.PROFILE_TOKEN || process.env.GITHUB_TOKEN;
  const out = resolve(process.argv[2] || "contrib-heatmap.svg");

  const user = await fetchProfile({ login, token });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderHeatmap(user), "utf8");
  console.log(`wrote ${out}`);
}
