const fs = require('fs');
const file = 'lib/agent/endpointMonitor.ts';
let content = fs.readFileSync(file, 'utf8');

// Helper to fix nested console.info
function fixNested(text) {
    // Replace console.info(\n  console.info(`...`);\n); with console.info(`...`);
    return text.replace(/console\.info\(\s*console\.info\(`(.*?)`\);\s*\);/gs, 'console.info(`$1`);');
}

// 1. Fix SQL line
content = content.replace(/      AND pos\.remote_address NOT LIKE '172\.%';\n\s*console\.info\(`;\);\n/g, "      AND pos.remote_address NOT LIKE '172.%';\n  `;\n");

// 2. Fix nested calls (standard)
content = fixNested(content);

// 3. Fix WSClient special case
content = content.replace(/console\.info\(\s*console\.info\(`(.*?)` \+\);\s*console\.info\(`(.*?)`\);\s*\);/gs, 'console.info(`$1` + `$2`);');

// 4. Fix potential stray ); after my previous failed fixes
// I'll look for strings that are wrapped in console.info but followed by a dangling );
// Actually, fixNested should have handled the standard ones.

// 5. Check if there are any remaining dangling template literals
// (Starting with backtick, ending with backtick, no semicolon, not in a function)
const lines = content.split('\n');
const cleanedLines = [];
let skipNext = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i+1] || "";
    
    // Fix the specific case of:
    // console.info(
    //   `...`
    // );
    // being turned into:
    // console.info(
    //   console.info(`...`);
    // );
    
    cleanedLines.push(line);
}

fs.writeFileSync(file, cleanedLines.join('\n'), 'utf8');
console.log('Final cleanup attempt.');
