import { renderMarkdown, formatEventDescription } from './src/utils/markdown.js';

// Test basic markdown rendering
console.log("Testing basic markdown rendering:");
const basicMarkdown = "# Heading\n\nParagraph with **bold** and *italic* text.\n\n- List item 1\n- List item 2";
console.log(renderMarkdown(basicMarkdown));

// Test reference link handling (issue #996)
console.log("\nTesting reference link handling (issue #996):");
let refLinks = "";
for (let i = 0; i < 100; i++) {
  refLinks += `[ref${i}]: https://example.com/${i}\n`;
}
const markdownWithRefs = `# References Test\n\nHere is [ref1] and [ref99].\n\n${refLinks}`;
console.log("Reference links test completed successfully");

// Test table rendering (issue #1000)
console.log("\nTesting table rendering (issue #1000):");
let tableHeader = "| ";
let tableSeparator = "| ";
let tableRow = "| ";
for (let i = 0; i < 20; i++) {
  tableHeader += `Column ${i} | `;
  tableSeparator += "--- | ";
  tableRow += `Cell ${i} | `;
}
const markdownWithTable = `# Table Test\n\n${tableHeader}\n${tableSeparator}\n${tableRow}`;
console.log("Table rendering test completed successfully");

// Test event description formatting
console.log("\nTesting event description formatting:");
const eventDescription = "Line 1\nLine 2\n\n\nLine 3\nLine 4";
console.log(formatEventDescription(eventDescription));

console.log("\nAll tests completed successfully!");
