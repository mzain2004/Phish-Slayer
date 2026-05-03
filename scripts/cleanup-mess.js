const fs = require('fs');
const file = 'lib/agent/endpointMonitor.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix the nested console.info and the SQL mess
content = content.replace(/console\.info\(\n\s*console\.info\(`(.*?)`\);\n\s*\);/g, 'console.info(`$1`);');

// Specific fix for WSClient which has a plus
content = content.replace(/console\.info\(\n\s*console\.info\(`(.*?)` \+\);\n\s*console\.info\(`(.*?)`\);\n\s*\);/g, 'console.info(`$1` + `$2`);');

// Fix the SQL line
content = content.replace(/AND pos\.remote_address NOT LIKE '172\.%';\n\s*console\.info\(`;\);\n/g, "AND pos.remote_address NOT LIKE '172.%';\n  `;\n");

// Fix the dangling console.info calls that might have survived
content = content.replace(/console\.info\(\n\s*console\.info\(`(.*?)`\);\n\s*\);/g, 'console.info(`$1`);');

fs.writeFileSync(file, content, 'utf8');
console.log('Cleanup script executed.');
