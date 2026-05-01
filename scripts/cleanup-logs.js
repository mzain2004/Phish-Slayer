const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            if (fullPath.endsWith('.ts')) results.push(fullPath);
        }
    });
    return results;
}

const dirs = [path.join(process.cwd(), 'lib'), path.join(process.cwd(), 'app/api')];
const files = dirs.flatMap(d => walk(d));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    const lines = content.split('\n');
    const newLines = lines.filter(line => {
        if (line.includes('// removed debug log')) return false; // Remove previously commented out ones
        return true;
    }).map(line => {
        if (line.includes('console.log')) {
            if (line.includes('[Agent]') || 
                line.includes('[EndpointMonitor]') || 
                line.includes('[FIM]') || 
                line.includes('[WSClient]') || 
                line.includes('listening on port') ||
                line.includes('[pipeline]') ||
                line.includes('[MongoDB]')) {
                return line.replace('console.log', 'console.info');
            }
            if (line.toLowerCase().includes('error') || 
                line.toLowerCase().includes('fail') || 
                line.toLowerCase().includes('invalid')) {
                return line.replace('console.log', 'console.error');
            }
            changed = true;
            return null; // Flag for removal
        }
        return line;
    }).filter(line => line !== null);

    if (changed || content.includes('console.log')) {
        fs.writeFileSync(file, newLines.join('\n'), 'utf8');
    }
});
console.log(`Log removal completed. Processed ${files.length} files.`);
