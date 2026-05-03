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

const cookieHelper = `
// Helper to get client-side cookie
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const value = \`; \${document.cookie}\`;
  const parts = value.split(\`; \${name}=\`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}
`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('Select an organization to view') || content.includes('select an organization to view')) {
        console.log(`Fixing ${file}`);

        // Add imports if missing
        if (!content.includes('useSearchParams')) {
            content = content.replace(/import {([^}]*)} from "@clerk\/nextjs";/, 'import {$1} from "@clerk/nextjs";\nimport { useSearchParams } from "next/navigation";');
            // If the above regex failed, try a different one
            if (!content.includes('useSearchParams')) {
                content = content.replace(/import {([^}]*)} from '@clerk\/nextjs';/, "import {$1} from '@clerk/nextjs';\nimport { useSearchParams } from 'next/navigation';");
            }
        }

        // Add cookie helper if missing
        if (!content.includes('function getCookie')) {
            const lines = content.split('\n');
            let lastImportIndex = 0;
            lines.forEach((line, i) => {
                if (line.startsWith('import ')) lastImportIndex = i;
            });
            lines.splice(lastImportIndex + 1, 0, cookieHelper);
            content = lines.join('\n');
        }

        // Fix orgId resolution
        if (!content.includes('searchParams.get("orgId")')) {
            content = content.replace(/const orgId = organization\?.id \|\| null;/, 'const searchParams = useSearchParams();\n  const orgId = searchParams.get("orgId") || organization?.id || getCookie("ps_org_id") || null;');
            content = content.replace(/const { organization, isLoaded: orgLoaded } = useOrganization\(\);/, 'const { organization, isLoaded: orgLoaded } = useOrganization();\n  const searchParams = useSearchParams();');
            content = content.replace(/const orgId = organization\?.id;/, 'const searchParams = useSearchParams();\n  const orgId = searchParams.get("orgId") || organization?.id || getCookie("ps_org_id") || null;');
        }

        // Fix the message
        content = content.replace(/Select an organization to view[^<]*/gi, 'Initializing organization context...');

        fs.writeFileSync(file, content, 'utf8');
    }
});
