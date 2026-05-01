const http = require('http');
const https = require('https');

const TARGET_HOST = process.env.TARGET_HOST || 'localhost';
const TARGET_PORT = process.env.TARGET_PORT || 3000;
const API_KEY = process.env.TEST_API_KEY || 'ps_test_key';
const PROTOCOL = TARGET_HOST.includes('localhost') ? http : https;

const ENDPOINTS = [
  { name: 'Health', path: '/api/health', method: 'GET' },
  { name: 'Alerts', path: '/api/alerts', method: 'GET', headers: { 'X-API-Key': API_KEY } },
  { name: 'Webhook', path: '/api/ingest/webhook', method: 'POST', body: JSON.stringify({
    vendor: 'LoadTest',
    event_type: 'test',
    severity: 'INFO',
    data: { message: 'Load test alert' }
  }), headers: { 'X-API-Key': API_KEY } }
];

async function runRequest(endpoint) {
  return new Promise((resolve) => {
    const start = Date.now();
    const options = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        ...(endpoint.headers || {})
      },
      timeout: 10000
    };

    const req = PROTOCOL.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          duration: Date.now() - start,
          success: res.statusCode === 200 || res.statusCode === 201
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        duration: Date.now() - start,
        success: false,
        error: err.message
      });
    });

    if (endpoint.body) {
      req.write(endpoint.body);
    }
    req.end();
  });
}

async function loadTest() {
  console.log(`Starting load test on ${TARGET_HOST}:${TARGET_PORT}...`);
  const results = {};

  for (const endpoint of ENDPOINTS) {
    console.log(`Testing ${endpoint.name}...`);
    const stats = {
      durations: [],
      errorCount: 0,
      min: Infinity,
      max: 0
    };

    for (let i = 0; i < 50; i++) {
      const res = await runRequest(endpoint);
      if (!res.success) {
        stats.errorCount++;
      }
      stats.durations.push(res.duration);
      stats.min = Math.min(stats.min, res.duration);
      stats.max = Math.max(stats.max, res.duration);
      
      // Brief pause to not overwhelm local dev server too fast
      await new Promise(r => setTimeout(r, 10));
    }

    const avg = stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length;
    const p95 = stats.durations.sort((a, b) => a - b)[Math.floor(stats.durations.length * 0.95)];

    results[endpoint.name] = {
      avg_ms: avg.toFixed(2),
      min_ms: stats.min,
      max_ms: stats.max,
      p95_ms: p95,
      error_count: stats.errorCount
    };
  }

  console.table(results);

  let overallFailure = false;
  for (const name in results) {
    if (results[name].avg_ms > 2000) {
        console.error(`FAILURE: ${name} average latency exceeded 2000ms`);
        overallFailure = true;
    }
    if (results[name].error_count > 5) {
        console.error(`FAILURE: ${name} error count exceeded 5`);
        overallFailure = true;
    }
  }

  if (overallFailure) {
    process.exit(1);
  }
}

loadTest().catch(err => {
  console.error(err);
  process.exit(1);
});
