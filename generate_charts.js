const fs = require('fs');
const path = require('path');

const outDir = 'screenshotoutput';

// ─── Chart 1: MST Small Graph (6 villages) ───────────────────────────────────
// Villages: Alpha(0,0), Beta(3,4), Gamma(6,0), Delta(4,6), Epsilon(8,3), Zeta(2,8)
// MST edges from Kruskal's on these coords (Euclidean distances)
const villages = [
  { name: 'Alpha',   x: 0, y: 0 },
  { name: 'Beta',    x: 3, y: 4 },
  { name: 'Gamma',   x: 6, y: 0 },
  { name: 'Delta',   x: 4, y: 6 },
  { name: 'Epsilon', x: 8, y: 3 },
  { name: 'Zeta',    x: 2, y: 8 },
];

// All edges sorted by weight — run Kruskal's manually
function dist(a, b) {
  return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2);
}
let allEdges = [];
for (let i = 0; i < villages.length; i++)
  for (let j = i+1; j < villages.length; j++)
    allEdges.push({ i, j, w: dist(villages[i], villages[j]) });
allEdges.sort((a,b) => a.w - b.w);

// Union-Find
const parent = villages.map((_,i) => i);
function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
function union(x, y) {
  let rx = find(x), ry = find(y);
  if (rx === ry) return false;
  parent[rx] = ry; return true;
}
const mstEdges = [];
for (const e of allEdges) {
  if (union(e.i, e.j)) mstEdges.push(e);
  if (mstEdges.length === villages.length - 1) break;
}

// SVG scale
const PAD = 60, W = 500, H = 420;
const maxX = Math.max(...villages.map(v=>v.x));
const maxY = Math.max(...villages.map(v=>v.y));
function sx(x) { return PAD + (x/maxX)*(W-2*PAD); }
function sy(y) { return H - PAD - (y/maxY)*(H-2*PAD); }

let svg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:#f8fafc;font-family:Arial,sans-serif">
  <text x="${W/2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e293b">MST — Small Graph Demo (6 Villages)</text>
  <text x="${W/2}" y="46" text-anchor="middle" font-size="11" fill="#64748b">Kruskal's Algorithm · Green = MST edges</text>\n`;

// All non-MST edges (faint)
const mstSet = new Set(mstEdges.map(e=>`${e.i}-${e.j}`));
for (const e of allEdges) {
  if (!mstSet.has(`${e.i}-${e.j}`)) {
    svg1 += `  <line x1="${sx(villages[e.i].x)}" y1="${sy(villages[e.i].y)}" x2="${sx(villages[e.j].x)}" y2="${sy(villages[e.j].y)}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4"/>\n`;
  }
}
// MST edges
for (const e of mstEdges) {
  const mx = (sx(villages[e.i].x)+sx(villages[e.j].x))/2;
  const my = (sy(villages[e.i].y)+sy(villages[e.j].y))/2;
  svg1 += `  <line x1="${sx(villages[e.i].x)}" y1="${sy(villages[e.i].y)}" x2="${sx(villages[e.j].x)}" y2="${sy(villages[e.j].y)}" stroke="#16a34a" stroke-width="2.5"/>\n`;
  svg1 += `  <text x="${mx}" y="${my-5}" text-anchor="middle" font-size="10" fill="#15803d">${e.w.toFixed(2)}</text>\n`;
}
// Nodes
for (const v of villages) {
  svg1 += `  <circle cx="${sx(v.x)}" cy="${sy(v.y)}" r="18" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>\n`;
  svg1 += `  <text x="${sx(v.x)}" y="${sy(v.y)+4}" text-anchor="middle" font-size="10" fill="white" font-weight="bold">${v.name}</text>\n`;
}
// Legend
svg1 += `  <line x1="30" y1="${H-20}" x2="60" y2="${H-20}" stroke="#16a34a" stroke-width="2.5"/>
  <text x="65" y="${H-16}" font-size="11" fill="#374151">MST Edge</text>
  <line x1="140" y1="${H-20}" x2="170" y2="${H-20}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4"/>
  <text x="175" y="${H-16}" font-size="11" fill="#374151">Skipped Edge</text>
</svg>`;
fs.writeFileSync(path.join(outDir, 'chart_small_graph.svg'), svg1);
console.log('✓ chart_small_graph.svg');

// ─── Chart 2: MST Edge Weight Distribution (bar chart from mst_results.csv) ──
const csv = fs.readFileSync('mst_results.csv', 'utf8').split('\n');
const weights = [];
for (const line of csv) {
  const parts = line.split(',');
  if (parts.length === 3) {
    const w = parseFloat(parts[2]);
    if (!isNaN(w)) weights.push(w);
  }
}
weights.sort((a,b)=>a-b);

// Bucket into ranges
const buckets = 10;
const minW = weights[0], maxW = weights[weights.length-1];
const step = (maxW - minW) / buckets;
const counts = Array(buckets).fill(0);
const labels = [];
for (let i = 0; i < buckets; i++) labels.push(`${(minW+i*step).toFixed(1)}-${(minW+(i+1)*step).toFixed(1)}`);
for (const w of weights) {
  let b = Math.floor((w - minW) / step);
  if (b >= buckets) b = buckets - 1;
  counts[b]++;
}

const BW = 600, BH = 380, BPAD = 60;
const barW = (BW - 2*BPAD) / buckets - 4;
const maxCount = Math.max(...counts);
function bx(i) { return BPAD + i * ((BW-2*BPAD)/buckets) + 2; }
function by(c) { return BH - BPAD - (c/maxCount)*(BH-2*BPAD-30); }

let svg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}" style="background:#f8fafc;font-family:Arial,sans-serif">
  <text x="${BW/2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e293b">MST Edge Weight Distribution</text>
  <text x="${BW/2}" y="46" text-anchor="middle" font-size="11" fill="#64748b">100-Village Network · Frequency of cable lengths (km)</text>
  <line x1="${BPAD}" y1="${BH-BPAD}" x2="${BW-BPAD+10}" y2="${BH-BPAD}" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="${BPAD}" y1="${BH-BPAD}" x2="${BPAD}" y2="55" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="${BW/2}" y="${BH-8}" text-anchor="middle" font-size="11" fill="#64748b">Distance Range (km)</text>
  <text x="14" y="${BH/2}" text-anchor="middle" font-size="11" fill="#64748b" transform="rotate(-90,14,${BH/2})">Frequency</text>\n`;

const colors = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6'];
for (let i = 0; i < buckets; i++) {
  const x = bx(i), y = by(counts[i]), h = (BH-BPAD) - y;
  svg2 += `  <rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="${colors[i]}" rx="3" opacity="0.85"/>\n`;
  svg2 += `  <text x="${x+barW/2}" y="${y-4}" text-anchor="middle" font-size="10" fill="#374151">${counts[i]}</text>\n`;
  svg2 += `  <text x="${x+barW/2}" y="${BH-BPAD+14}" text-anchor="middle" font-size="8" fill="#64748b" transform="rotate(-35,${x+barW/2},${BH-BPAD+14})">${(minW+i*step).toFixed(1)}</text>\n`;
}
svg2 += `</svg>`;
fs.writeFileSync(path.join(outDir, 'chart_weight_distribution.svg'), svg2);
console.log('✓ chart_weight_distribution.svg');

// ─── Chart 3: Complexity Growth O(E log E) ────────────────────────────────────
const CW = 560, CH = 380, CPAD = 65;
const nVals = [10,20,30,40,50,60,70,80,90,100];
// E = V*(V-1)/2, cost = E * log2(E)
const costs = nVals.map(v => { const e = v*(v-1)/2; return e * Math.log2(e||1); });
const maxCost = Math.max(...costs);
function cx2(i) { return CPAD + i*(CW-2*CPAD)/(nVals.length-1); }
function cy2(c) { return CH - CPAD - (c/maxCost)*(CH-2*CPAD-20); }

let svg3 = `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}" style="background:#f8fafc;font-family:Arial,sans-serif">
  <text x="${CW/2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e293b">Time Complexity Growth — O(E log E)</text>
  <text x="${CW/2}" y="46" text-anchor="middle" font-size="11" fill="#64748b">Operations vs Number of Villages (V)</text>
  <line x1="${CPAD}" y1="${CH-CPAD}" x2="${CW-CPAD+10}" y2="${CH-CPAD}" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="${CPAD}" y1="${CH-CPAD}" x2="${CPAD}" y2="55" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="${CW/2}" y="${CH-8}" text-anchor="middle" font-size="11" fill="#64748b">Number of Villages (V)</text>
  <text x="14" y="${CH/2}" text-anchor="middle" font-size="11" fill="#64748b" transform="rotate(-90,14,${CH/2})">Operations (E·log E)</text>\n`;

// Grid lines
for (let g = 1; g <= 4; g++) {
  const gy = CH - CPAD - g*(CH-2*CPAD-20)/4;
  svg3 += `  <line x1="${CPAD}" y1="${gy}" x2="${CW-CPAD}" y2="${gy}" stroke="#e2e8f0" stroke-width="1"/>\n`;
}
// Area fill
let areaPath = `M ${cx2(0)} ${CH-CPAD}`;
for (let i = 0; i < nVals.length; i++) areaPath += ` L ${cx2(i)} ${cy2(costs[i])}`;
areaPath += ` L ${cx2(nVals.length-1)} ${CH-CPAD} Z`;
svg3 += `  <path d="${areaPath}" fill="#3b82f6" opacity="0.15"/>\n`;

// Line
let linePath = `M ${cx2(0)} ${cy2(costs[0])}`;
for (let i = 1; i < nVals.length; i++) linePath += ` L ${cx2(i)} ${cy2(costs[i])}`;
svg3 += `  <path d="${linePath}" fill="none" stroke="#3b82f6" stroke-width="2.5"/>\n`;

// Points + labels
for (let i = 0; i < nVals.length; i++) {
  svg3 += `  <circle cx="${cx2(i)}" cy="${cy2(costs[i])}" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>\n`;
  svg3 += `  <text x="${cx2(i)}" y="${CH-CPAD+14}" text-anchor="middle" font-size="10" fill="#64748b">${nVals[i]}</text>\n`;
}
svg3 += `</svg>`;
fs.writeFileSync(path.join(outDir, 'chart_complexity.svg'), svg3);
console.log('✓ chart_complexity.svg');

// ─── Chart 4: Kruskal Steps — edges added vs skipped ─────────────────────────
// From the small graph demo: simulate step tracking
const stepVillages = villages;
const stepParent = stepVillages.map((_,i)=>i);
function sfind(x) { return stepParent[x]===x?x:(stepParent[x]=sfind(stepParent[x])); }
function sunion(x,y){ let rx=sfind(x),ry=sfind(y); if(rx===ry)return false; stepParent[rx]=ry; return true; }

const stepData = [];
for (const e of allEdges) {
  const added = sunion(e.i, e.j);
  stepData.push({ label: `${villages[e.i].name[0]}-${villages[e.j].name[0]}`, w: e.w, added });
  if (stepData.filter(s=>s.added).length === villages.length-1 && !added) break;
}
// show first 12 steps
const shown = stepData.slice(0, 12);

const SW = 580, SH = 360, SPAD = 55;
const sBarW = (SW - 2*SPAD) / shown.length - 5;
const maxW2 = Math.max(...shown.map(s=>s.w));
function sbx(i) { return SPAD + i*((SW-2*SPAD)/shown.length)+2; }
function sby(w) { return SH - SPAD - (w/maxW2)*(SH-2*SPAD-30); }

let svg4 = `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" style="background:#f8fafc;font-family:Arial,sans-serif">
  <text x="${SW/2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e293b">Kruskal's Steps — Edge Processing</text>
  <text x="${SW/2}" y="46" text-anchor="middle" font-size="11" fill="#64748b">Green = Added to MST · Red = Skipped (cycle)</text>
  <line x1="${SPAD}" y1="${SH-SPAD}" x2="${SW-SPAD+10}" y2="${SH-SPAD}" stroke="#94a3b8" stroke-width="1.5"/>
  <line x1="${SPAD}" y1="${SH-SPAD}" x2="${SPAD}" y2="55" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="${SW/2}" y="${SH-8}" text-anchor="middle" font-size="11" fill="#64748b">Edge (Village Pair)</text>
  <text x="14" y="${SH/2}" text-anchor="middle" font-size="11" fill="#64748b" transform="rotate(-90,14,${SH/2})">Distance (km)</text>\n`;

for (let i = 0; i < shown.length; i++) {
  const s = shown[i];
  const x = sbx(i), y = sby(s.w), h = (SH-SPAD)-y;
  const col = s.added ? '#16a34a' : '#ef4444';
  svg4 += `  <rect x="${x}" y="${y}" width="${sBarW}" height="${h}" fill="${col}" rx="3" opacity="0.85"/>\n`;
  svg4 += `  <text x="${x+sBarW/2}" y="${y-4}" text-anchor="middle" font-size="9" fill="#374151">${s.w.toFixed(1)}</text>\n`;
  svg4 += `  <text x="${x+sBarW/2}" y="${SH-SPAD+13}" text-anchor="middle" font-size="9" fill="#374151">${s.label}</text>\n`;
  svg4 += `  <text x="${x+sBarW/2}" y="${SH-SPAD+24}" text-anchor="middle" font-size="8" fill="${col}">${s.added?'✓':'✗'}</text>\n`;
}
// Legend
svg4 += `  <rect x="${SPAD}" y="${SH-18}" width="12" height="12" fill="#16a34a" rx="2"/>
  <text x="${SPAD+16}" y="${SH-8}" font-size="11" fill="#374151">Added to MST</text>
  <rect x="${SPAD+120}" y="${SH-18}" width="12" height="12" fill="#ef4444" rx="2"/>
  <text x="${SPAD+136}" y="${SH-8}" font-size="11" fill="#374151">Skipped (cycle)</text>
</svg>`;
fs.writeFileSync(path.join(outDir, 'chart_kruskal_steps.svg'), svg4);
console.log('✓ chart_kruskal_steps.svg');

// ─── Chart 5: Union-Find structure diagram ────────────────────────────────────
const UW = 560, UH = 340;
let svg5 = `<svg xmlns="http://www.w3.org/2000/svg" width="${UW}" height="${UH}" style="background:#f8fafc;font-family:Arial,sans-serif">
  <text x="${UW/2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e293b">Union-Find (Disjoint Set) — How It Works</text>
  <text x="${UW/2}" y="50" text-anchor="middle" font-size="11" fill="#64748b">Path Compression + Union by Rank · Prevents cycles in MST</text>\n`;

// Before union — 3 separate sets
const sets = [
  { label: 'Set A', nodes: ['Alpha','Beta'], cx: 120, cy: 130 },
  { label: 'Set B', nodes: ['Gamma','Epsilon'], cx: 280, cy: 130 },
  { label: 'Set C', nodes: ['Delta','Zeta'], cx: 440, cy: 130 },
];
svg5 += `  <text x="${UW/2}" y="80" text-anchor="middle" font-size="12" fill="#7c3aed" font-weight="bold">Before Union</text>\n`;
for (const s of sets) {
  svg5 += `  <ellipse cx="${s.cx}" cy="${s.cy}" rx="70" ry="38" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>\n`;
  svg5 += `  <text x="${s.cx}" y="${s.cy-18}" text-anchor="middle" font-size="10" fill="#7c3aed" font-weight="bold">${s.label}</text>\n`;
  svg5 += `  <text x="${s.cx}" y="${s.cy+2}" text-anchor="middle" font-size="10" fill="#374151">${s.nodes[0]}</text>\n`;
  svg5 += `  <text x="${s.cx}" y="${s.cy+16}" text-anchor="middle" font-size="10" fill="#374151">${s.nodes[1]}</text>\n`;
}

// Arrow
svg5 += `  <text x="${UW/2}" y="195" text-anchor="middle" font-size="20" fill="#94a3b8">↓</text>\n`;
svg5 += `  <text x="${UW/2}" y="215" text-anchor="middle" font-size="11" fill="#64748b">unionSets() merges components</text>\n`;

// After union — one big set
svg5 += `  <text x="${UW/2}" y="240" text-anchor="middle" font-size="12" fill="#16a34a" font-weight="bold">After Union (MST Complete)</text>\n`;
svg5 += `  <ellipse cx="${UW/2}" cy="${UH-45}" rx="220" ry="38" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>\n`;
svg5 += `  <text x="${UW/2}" y="${UH-50}" text-anchor="middle" font-size="10" fill="#15803d" font-weight="bold">Single Connected Component</text>\n`;
svg5 += `  <text x="${UW/2}" y="${UH-32}" text-anchor="middle" font-size="10" fill="#374151">Alpha · Beta · Gamma · Delta · Epsilon · Zeta</text>\n`;
svg5 += `</svg>`;
fs.writeFileSync(path.join(outDir, 'chart_union_find.svg'), svg5);
console.log('✓ chart_union_find.svg');

console.log('\nAll charts generated in screenshotoutput/');
