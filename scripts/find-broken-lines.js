const fs = require('fs');
const file = 'lib/agent/endpointMonitor.ts';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('`') && !trimmed.endsWith(';')) {
        console.log(`Line ${index + 1}: ${line}`);
    }
});
