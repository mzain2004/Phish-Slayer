const fs = require('fs');
const file = 'lib/agent/endpointMonitor.ts';
let content = fs.readFileSync(file, 'utf8');

// List of strings that were likely broken console.logs
const patterns = [
    {
        search: /([ \t]*)`\[EndpointMonitor\] 🔍 \${isBeaconing \? "⚠️ BEACONING " : ""}.*?`/,
        replace: (match, indent) => `${indent}console.info(${match.trim()});`
    },
    {
        search: /([ \t]*)`\[EndpointMonitor\] 🛡️ Flagged \${anomalies\.length}.*?`/,
        replace: (match, indent) => `${indent}console.info(${match.trim()});`
    },
    {
        search: /([ \t]*)`\[FIM\] Baseline established\. Monitoring \${this\.baselineHashes\.size} files\.`/,
        replace: (match, indent) => `${indent}console.info(${match.trim()});`
    },
    {
        search: /([ \t]*)`\[ProcMon\] Baseline: \${this\.knownPids\.size} processes tracked\.`/,
        replace: (match, indent) => `${indent}console.info(${match.trim()});`
    },
    {
        search: /([ \t]*)`\[WSClient\] Connecting to \${this\.serverUrl} ` \+ \n([ \t]*)`\(attempt \${this\.reconnectAttempts \+ 1}\)`/,
        replace: (match, indent1, indent2) => `${indent1}console.info(${match.trim()});`
    }
];

// Actually, I'll just look for the specific lines reported and fix them if they don't have console.
const lines = content.split('\n');
const fixedLines = lines.map((line, i) => {
    const ln = i + 1;
    const trimmed = line.trim();
    if ([160, 194, 195, 337, 474, 475, 570, 571].includes(ln) || (trimmed.startsWith('`') && !line.includes('console') && !line.includes('return') && !line.includes('='))) {
        if (trimmed.startsWith('`') && !line.includes('console')) {
            const indent = line.match(/^\s*/)[0];
            return `${indent}console.info(${trimmed});`;
        }
    }
    return line;
});

fs.writeFileSync(file, fixedLines.join('\n'), 'utf8');
console.log('Surgical fix applied.');
