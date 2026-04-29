import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file).replace(/\\/g, '/'));
    }
  });
  return arrayOfFiles;
}

const apiFiles = fs.existsSync('app/api') ? getAllFiles('app/api').filter(f => f.endsWith('.ts') || f.endsWith('.tsx')) : [];
const libFiles = fs.existsSync('lib') ? getAllFiles('lib').filter(f => f.endsWith('.ts') || f.endsWith('.tsx')) : [];
const dashFiles = fs.existsSync('app/dashboard') ? getAllFiles('app/dashboard').filter(f => f.endsWith('.ts') || f.endsWith('.tsx')) : [];

console.log("\n=== PHASE 2: SECURITY AUDIT ===");

console.log("\n[AUTH GUARDS]");
apiFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('auth()') && !content.includes('auth(') && !content.includes('verifySignature')) {
    console.log(`Missing Auth Guard: ${file}`);
  }
});

console.log("\n[ORG SCOPING]");
[...apiFiles, ...libFiles].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('supabase.from(') || content.includes('supabase.from`')) {
    if (!content.includes('organization_id') && !content.includes('org_id') && !content.includes('orgId') && !content.includes('eq(')) {
      console.log(`Possible missing org_id scope: ${file}`);
    } else {
      // Just check if it has a .eq or .filter
      if (!content.includes('organization_id') && !content.includes('org_id') && !content.includes('orgId')) {
         console.log(`Possible missing org_id scope: ${file}`);
      }
    }
  }
});

console.log("\n[INPUT VALIDATION]");
apiFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if ((content.includes('req.json()') || content.includes('request.json()')) && !content.includes('.parse(') && !content.includes('z.object')) {
    console.log(`Unvalidated input (json): ${file}`);
  }
});

console.log("\n[ENV VARS]");
const secretRegex = /"sk_[a-zA-Z0-9]+"|"pk_[a-zA-Z0-9]+"|"Bearer [a-zA-Z0-9_.-]+"/;
[...apiFiles, ...libFiles].forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (secretRegex.test(content)) {
    console.log(`Hardcoded secret found: ${file}`);
  }
});

console.log("\n[ERROR HANDLING]");
libFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if ((content.includes('fetch(') || content.includes('axios.')) && !content.includes('try {') && !content.includes('catch (')) {
    const lines = content.split('\n');
    const fetchLine = lines.findIndex(l => l.includes('fetch(') || l.includes('axios.'));
    // If it's in a Promise.all or something without try catch
    if (fetchLine > -1) {
       console.log(`Missing try/catch for fetch: ${file}:${fetchLine+1}`);
    }
  }
});

console.log("\n[RATE LIMITING]");
apiFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('ratelimit') && !content.includes('rateLimit')) {
    console.log(`No rate limiting: ${file}`);
  }
});

console.log("\n=== PHASE 3: INTEGRATION AUDIT ===");

console.log("\n[LIB TO API MAPPING]");
const mappings = {
  'lib/email': ['app/api/email', 'app/api/ingest/email'],
  'lib/sandbox': ['app/api/sandbox'],
  'lib/uba': ['app/api/uba', 'app/api/ueba'],
  'lib/detection': ['app/api/detection-rules', 'app/api/detection'],
  'lib/darkweb': ['app/api/darkweb'],
  'lib/hunting': ['app/api/hunting'],
  'lib/vuln': ['app/api/vulnerabilities', 'app/api/vuln'],
  'lib/tip': ['app/api/tip'],
  'lib/osint': ['app/api/osint'],
  'lib/l1': ['app/api/alerts', 'app/api/suppression-rules', 'app/api/watchlist'],
  'lib/l2': ['app/api/entity360', 'app/api/containment', 'app/api/l2'],
  'lib/l3': ['app/api/l3', 'app/api/pir', 'app/api/knowledge-base']
};

for (const [libFolder, apiFolders] of Object.entries(mappings)) {
  if (fs.existsSync(libFolder)) {
    let hasMatch = false;
    for (const af of apiFolders) {
      if (fs.existsSync(af)) hasMatch = true;
    }
    if (!hasMatch) console.log(`Lib module ${libFolder} has NO corresponding API route.`);
  }
}

console.log("\n[API TO UI MAPPING]");
const apiFolders = fs.readdirSync('app/api').filter(f => fs.statSync(path.join('app/api', f)).isDirectory());
apiFolders.forEach(mod => {
  if (!['webhooks', 'cron', 'health', 'ingest', 'agent', 'analysis', 'actions', 'digest', 'platform', 'metrics', 'reasoning', 'siem', 'support', 'waitlist', 'sentry-example-api', 'threat', 'v1', 'v2', 'orchestrator', 'infrastructure'].includes(mod)) {
    const dashEquivalent = `app/dashboard/${mod}`;
    if (!fs.existsSync(dashEquivalent)) {
       // check loosely
       const allDashFiles = dashFiles.join(' ');
       if (!allDashFiles.includes(`/${mod}/`)) {
          console.log(`API route app/api/${mod} has no obvious frontend page.`);
       }
    }
  }
});

console.log("\n[CRON ROUTES]");
let hasCronRoutes = fs.existsSync('app/api/cron');
if (hasCronRoutes) {
  try {
    const vercel = fs.readFileSync('vercel.json', 'utf8');
    if (vercel.includes('crons')) console.log("vercel.json configures crons.");
    else console.log("vercel.json DOES NOT configure crons!");
  } catch (e) {
    console.log("No vercel.json found!");
  }
  
  try {
    const startCron = fs.readFileSync('scripts/start-cron.sh', 'utf8');
    if (startCron.includes('curl')) console.log("scripts/start-cron.sh exists and configures curl.");
  } catch (e) {
    console.log("No scripts/start-cron.sh found!");
  }
}

