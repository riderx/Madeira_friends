import { renderMarkdown } from './src/utils/markdown.js';
import { performance } from 'node:perf_hooks';

// Test reference link handling (issue #996)
console.log("\nTesting reference link handling performance (issue #996):");
function testReferenceLinks(count) {
  let refLinks = "";
  for (let i = 0; i < count; i++) {
    refLinks += `[ref${i}]: https://example.com/${i}\n`;
  }
  const markdownWithRefs = `# References Test\n\nHere is [ref1] and [ref${count-1}].\n\n${refLinks}`;
  
  const start = performance.now();
  renderMarkdown(markdownWithRefs);
  const end = performance.now();
  
  return end - start;
}

// Test with increasing numbers of reference links
const refCounts = [10, 100, 500];
for (const count of refCounts) {
  const time = testReferenceLinks(count);
  console.log(`- ${count} reference links: ${time.toFixed(2)}ms`);
}

// Test table rendering (issue #1000)
console.log("\nTesting table rendering performance (issue #1000):");
function testTableRendering(columns, rows) {
  let tableHeader = "| ";
  let tableSeparator = "| ";
  let tableContent = "";
  
  for (let i = 0; i < columns; i++) {
    tableHeader += `Column ${i} | `;
    tableSeparator += "--- | ";
  }
  
  for (let i = 0; i < rows; i++) {
    let row = "| ";
    for (let j = 0; j < columns; j++) {
      row += `Cell ${i}-${j} | `;
    }
    tableContent += row + "\n";
  }
  
  const markdownWithTable = `# Table Test\n\n${tableHeader}\n${tableSeparator}\n${tableContent}`;
  
  const start = performance.now();
  renderMarkdown(markdownWithTable);
  const end = performance.now();
  
  return end - start;
}

// Test with increasing table sizes
const tableSizes = [
  { columns: 5, rows: 5 },
  { columns: 10, rows: 10 },
  { columns: 20, rows: 20 }
];

for (const size of tableSizes) {
  const time = testTableRendering(size.columns, size.rows);
  console.log(`- ${size.columns}x${size.rows} table: ${time.toFixed(2)}ms`);
}

// Test content length limits
console.log("\nTesting content length limits:");
function testContentLengthLimit(length) {
  const longContent = "a".repeat(length);
  
  const start = performance.now();
  const result = renderMarkdown(longContent);
  const end = performance.now();
  
  return {
    time: end - start,
    truncated: result.includes("truncated for security")
  };
}

const contentLengths = [1000, 10000, 60000];
for (const length of contentLengths) {
  const result = testContentLengthLimit(length);
  console.log(`- Content length ${length}: ${result.time.toFixed(2)}ms, truncated: ${result.truncated}`);
}

console.log("\nAll performance tests completed successfully!");
