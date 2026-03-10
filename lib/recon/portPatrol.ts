import * as net from 'net';
import * as dns from 'dns/promises';

export interface PortScanResult {
  port: number;
  open: boolean;
  service: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'info';
  description: string;
}

export interface PortPatrolReport {
  target: string;
  resolvedIp: string;
  scannedAt: string;
  scanDurationMs: number;
  openPorts: PortScanResult[];
  riskSummary: string;
  overallRisk: 'clean' | 'suspicious' | 'critical';
}

const HIGH_RISK_PORTS: Record<number, {
  service: string;
  riskLevel: PortScanResult['riskLevel'];
  description: string;
}> = {
  21:    { service: 'FTP',        riskLevel: 'high',     description: 'Unencrypted file transfer — common malware exfil vector' },
  22:    { service: 'SSH',        riskLevel: 'medium',   description: 'Remote access — verify legitimacy' },
  23:    { service: 'Telnet',     riskLevel: 'critical', description: 'Unencrypted remote access — almost always malicious' },
  25:    { service: 'SMTP',       riskLevel: 'medium',   description: 'Mail server — could indicate spam infrastructure' },
  80:    { service: 'HTTP',       riskLevel: 'info',     description: 'Unencrypted web traffic' },
  443:   { service: 'HTTPS',      riskLevel: 'info',     description: 'Encrypted web traffic' },
  445:   { service: 'SMB',        riskLevel: 'critical', description: 'Windows file sharing — ransomware vector' },
  1433:  { service: 'MSSQL',      riskLevel: 'critical', description: 'Database exposed to internet' },
  3306:  { service: 'MySQL',      riskLevel: 'critical', description: 'Database exposed to internet' },
  3389:  { service: 'RDP',        riskLevel: 'critical', description: 'Remote Desktop — prime attack surface' },
  4444:  { service: 'Metasploit', riskLevel: 'critical', description: 'Known C2/backdoor port' },
  5432:  { service: 'PostgreSQL', riskLevel: 'critical', description: 'Database exposed to internet' },
  6379:  { service: 'Redis',      riskLevel: 'critical', description: 'Cache DB exposed — often unauthenticated' },
  8080:  { service: 'HTTP-Alt',   riskLevel: 'medium',   description: 'Alternative HTTP — could be C2 panel' },
  8443:  { service: 'HTTPS-Alt',  riskLevel: 'medium',   description: 'Alternative HTTPS' },
  27017: { service: 'MongoDB',    riskLevel: 'critical', description: 'Database exposed to internet' },
};

function isPrivateIp(ip: string): boolean {
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('127.')) return true;
  if (ip === '0.0.0.0') return true;
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

function checkPort(ip: string, port: number, timeout = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      resolved = true;
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      if (!resolved) { resolved = true; socket.destroy(); resolve(false); }
    });

    socket.on('error', () => {
      if (!resolved) { resolved = true; socket.destroy(); resolve(false); }
    });

    socket.connect(port, ip);
  });
}

export async function runPortPatrol(target: string): Promise<PortPatrolReport> {
  const start = Date.now();

  // 1. Resolve domain to IP
  let resolvedIp: string;
  try {
    const { address } = await dns.lookup(target);
    resolvedIp = address;
  } catch {
    throw new Error(`DNS resolution failed for ${target}`);
  }

  // 2. SSRF prevention — reject private IPs
  if (isPrivateIp(resolvedIp)) {
    throw new Error('Target resolved to a private/loopback IP address. Scan rejected for security.');
  }

  // 3. Scan all ports with 10s total timeout
  const ports = Object.keys(HIGH_RISK_PORTS).map(Number);

  const scanPromise = Promise.allSettled(
    ports.map(async (port) => {
      const isOpen = await checkPort(resolvedIp, port, 2000);
      const meta = HIGH_RISK_PORTS[port];
      return {
        port,
        open: isOpen,
        service: meta.service,
        riskLevel: meta.riskLevel,
        description: meta.description,
      } as PortScanResult;
    })
  );

  const timeoutPromise = new Promise<PromiseSettledResult<PortScanResult>[]>((resolve) => {
    setTimeout(() => resolve([]), 10000);
  });

  const results = await Promise.race([scanPromise, timeoutPromise]);

  // 4. Collect open ports
  const openPorts: PortScanResult[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.open) {
      openPorts.push(r.value);
    }
  }

  // 5. Calculate risk
  const hasCritical = openPorts.some((p) => p.riskLevel === 'critical');
  const hasHigh = openPorts.some((p) => p.riskLevel === 'high');
  const overallRisk: PortPatrolReport['overallRisk'] = hasCritical
    ? 'critical'
    : hasHigh
      ? 'suspicious'
      : 'clean';

  // 6. Risk summary
  let riskSummary: string;
  if (openPorts.length === 0) {
    riskSummary = 'No high-risk ports detected. Target appears to have a minimal attack surface.';
  } else {
    const criticalPorts = openPorts.filter((p) => p.riskLevel === 'critical');
    riskSummary = `Found ${openPorts.length} open port(s).`;
    if (criticalPorts.length > 0) {
      riskSummary += ` ${criticalPorts.length} CRITICAL: ${criticalPorts.map((p) => `${p.port} (${p.service})`).join(', ')}.`;
    }
  }

  return {
    target,
    resolvedIp,
    scannedAt: new Date().toISOString(),
    scanDurationMs: Date.now() - start,
    openPorts,
    riskSummary,
    overallRisk,
  };
}
