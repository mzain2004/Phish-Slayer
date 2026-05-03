const fs = require('fs');
const file = 'lib/agent/endpointMonitor.ts';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    const trimmed = line.trim();
    // Look for lines that look like template literals or log messages but aren't in a function call
    if ((trimmed.startsWith('`') || trimmed.startsWith('"[') || trimmed.startsWith("'[")) && 
        !line.includes('console.') && 
        !line.includes('return') && 
        !line.includes('throw') && 
        !line.includes('=') &&
        !line.includes(':') && // Avoid object properties
        !line.includes('(')) {
        console.log(`Line ${index + 1}: ${line}`);
    }
});
