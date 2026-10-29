// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js



const fs = require("fs");

let total = 0;
let count = 0;
const failures = [];

const raw = fs.readFileSync("payments.jsonl", "utf8");

const cleaned = raw
  .replace(/^\.\.\. \d+ more items\s*$/m, "")  
  .trim()
  .replace(/^\[/, "")
  .replace(/\]\s*$/, "");

const lines = cleaned
  .split(/\r?\n/)
  .map(l => l.trim())
  .filter(l => l.length > 0 && l !== ",")
  .map(l => l.replace(/,$/, ""))               
  .map(l => l.replace(/^'/, "").replace(/'$/, "")); 

console.log(`Parsed ${lines.length} candidate lines`);

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  try {
    const event = JSON.parse(line);
    if (event.status === "success" && event.txn_id) {
      total += Number(event.amount);
      count += 1;
    }
  } catch (e) {
    failures.push({ i, line, error: e.message });
  }
}

if (failures.length) {
  // console.log(`\n${failures.length} parse failures:`);
  for (const f of failures.slice(0, 5)) {
    // console.log(`  line ${f.i}: ${f.error}`);
    // console.log(`    content: ${JSON.stringify(f.line.slice(0, 120))}`);
  }
}

console.log(`\ncount=${count}`);

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);
if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}