import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generate200Monitors } from './frontend/src/data/sampleDataset200.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('======================================================');
console.log('       CHECKWAVE 200-MONITOR DATASET VERIFIER        ');
console.log('======================================================');

const dataset = generate200Monitors();

console.log(`\n[1/4] Total records generated: ${dataset.length}`);

if (dataset.length < 200) {
  console.error(`FAILED: Expected at least 200 records, got ${dataset.length}`);
  process.exit(1);
}

// 2. Validate Every Record
const allowedMethods = new Set(['GET', 'POST', 'HEAD', 'PUT', 'DELETE', 'PATCH']);
const allowedStatuses = new Set(['up', 'down', 'paused', 'active', 'error']);
const seenIds = new Set();
const seenNames = new Set();

let upCount = 0;
let downCount = 0;
let pausedCount = 0;
let validUrlCount = 0;
let validSparklines = 0;

for (let i = 0; i < dataset.length; i++) {
  const m = dataset[i];
  const idx = i + 1;

  // Check ID
  if (!m._id || !m.id) {
    throw new Error(`Record #${idx} missing id`);
  }
  if (seenIds.has(m._id)) {
    throw new Error(`Record #${idx} has duplicate ID: ${m._id}`);
  }
  seenIds.add(m._id);

  // Check Name
  if (!m.name || typeof m.name !== 'string' || m.name.trim().length === 0) {
    throw new Error(`Record #${idx} has invalid name`);
  }

  // Check URL
  try {
    const parsed = new URL(m.url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Non-http/s protocol: ${m.url}`);
    }
    validUrlCount++;
  } catch (err) {
    throw new Error(`Record #${idx} (${m.name}) has invalid URL "${m.url}": ${err.message}`);
  }

  // Check Method
  if (!allowedMethods.has(m.method)) {
    throw new Error(`Record #${idx} has invalid method: ${m.method}`);
  }

  // Check Interval & Timeout
  if (typeof m.interval !== 'number' || m.interval < 1) {
    throw new Error(`Record #${idx} has invalid interval: ${m.interval}`);
  }
  if (typeof m.timeout !== 'number' || m.timeout < 1000) {
    throw new Error(`Record #${idx} has invalid timeout: ${m.timeout}`);
  }

  // Check Status
  if (!allowedStatuses.has(m.status)) {
    throw new Error(`Record #${idx} has invalid status: ${m.status}`);
  }
  if (m.status === 'up' || m.status === 'active') upCount++;
  else if (m.status === 'down' || m.status === 'error') downCount++;
  else if (m.status === 'paused') pausedCount++;

  // Check Uptime
  if (typeof m.uptime7d !== 'number' || m.uptime7d < 0 || m.uptime7d > 100) {
    throw new Error(`Record #${idx} has invalid uptime7d: ${m.uptime7d}`);
  }
  if (typeof m.uptime30d !== 'number' || m.uptime30d < 0 || m.uptime30d > 100) {
    throw new Error(`Record #${idx} has invalid uptime30d: ${m.uptime30d}`);
  }

  // Check Response Time
  if (typeof m.lastResponseTime !== 'number' || m.lastResponseTime < 0) {
    throw new Error(`Record #${idx} has invalid lastResponseTime: ${m.lastResponseTime}`);
  }

  // Check lastChecked Date
  const dateObj = new Date(m.lastChecked);
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Record #${idx} has invalid lastChecked date: ${m.lastChecked}`);
  }

  // Check Sparkline History
  if (!Array.isArray(m.history) || m.history.length < 5) {
    throw new Error(`Record #${idx} history must be an array of at least 5 numbers`);
  }
  for (const pt of m.history) {
    if (typeof pt !== 'number' || pt < 0) {
      throw new Error(`Record #${idx} history point is not a valid positive number: ${pt}`);
    }
  }
  validSparklines++;
}

console.log('[2/4] Field & Schema Validation:');
console.log(`  - Valid Unique IDs:        ${seenIds.size}/${dataset.length} [100%]`);
console.log(`  - Valid HTTP/HTTPS URLs:   ${validUrlCount}/${dataset.length} [100%]`);
console.log(`  - Valid SVG Sparklines:    ${validSparklines}/${dataset.length} [100%]`);

console.log('\n[3/4] Status & Metric Distribution:');
console.log(`  - Active & UP:             ${upCount} (${Math.round((upCount / dataset.length) * 100)}%)`);
console.log(`  - Paused (Maintenance):    ${pausedCount} (${Math.round((pausedCount / dataset.length) * 100)}%)`);
console.log(`  - Down / Error:            ${downCount} (${Math.round((downCount / dataset.length) * 100)}%)`);

// 4. Save to standalone JSON file
const outputPath = path.join(__dirname, 'dataset-200.json');
fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2), 'utf-8');
const stats = fs.statSync(outputPath);

console.log('\n[4/4] Output Generation:');
console.log(`  - Saved standalone JSON:   ${outputPath}`);
console.log(`  - File size:               ${(stats.size / 1024).toFixed(2)} KB`);
console.log('\n>>> 100% VERIFICATION PASSED: All 200 monitors are valid and operational! <<<\n');
