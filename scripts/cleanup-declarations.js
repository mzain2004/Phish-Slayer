const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const dashboardDir = path.join(process.cwd(), 'app/dashboard');
const files = walk(dashboardDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('const searchParams = useSearchParams();')) {
        const lines = content.split('\n');
        let count = 0;
        const newLines = lines.filter(line => {
            if (line.includes('const searchParams = useSearchParams();')) {
                count++;
                return count === 1; // Only keep the first one
            }
            return true;
        });
        
        if (count > 1) {
            console.log(`Cleaning double declaration in ${file}`);
            fs.writeFileSync(file, newLines.join('\n'), 'utf8');
        }
    }
});
