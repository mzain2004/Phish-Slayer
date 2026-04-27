import * as tls from 'tls';

export interface SslResult {
  valid: boolean;
  issuer: string | null;
  issuerOrganization: string | null;
  subject: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
  isLetsEncrypt: boolean;
  isSelfSigned: boolean;
  isShortLived: boolean;
  riskFlags: string[];
}

function stripDomain(input: string): string {
  let d = input.trim();
  d = d.replace(/^https?:\/\//i, '');
  d = d.replace(/^www\./i, '');
  d = d.replace(/\/+$/, '');
  d = d.split('/')[0];
  return d;
}

export async function getSslProfile(domain: string): Promise<SslResult> {
  const cleanDomain = stripDomain(domain);
  const riskFlags: string[] = [];

  const fallback: SslResult = {
    valid: false,
    issuer: null,
    issuerOrganization: null,
    subject: null,
    validFrom: null,
    validTo: null,
    daysRemaining: null,
    isLetsEncrypt: false,
    isSelfSigned: false,
    isShortLived: false,
    riskFlags: ['Unable to retrieve SSL certificate'],
  };

  return new Promise<SslResult>((resolve) => {
    try {
      // This function performs SSL certificate scanning on external domains.
      // We MUST disable rejectUnauthorized to retrieve certificate info from servers
      // with self-signed certificates, which is a valid security scanning use case.
      // This is intentional for external SSL analysis only.
      const socket = tls.connect(
        {
          host: cleanDomain,
          port: 443,
          servername: cleanDomain,
          rejectUnauthorized: false, // Required for SSL certificate scanning of external domains
          timeout: 8000,
        },
        () => {
          try {
            const cert = socket.getPeerCertificate();

            if (!cert || !cert.subject) {
              socket.destroy();
              resolve(fallback);
              return;
            }

            const rawIssuerCN = cert.issuer?.CN;
            const rawIssuerO = cert.issuer?.O;
            const rawSubjectCN = cert.subject?.CN;
            const issuerCN = Array.isArray(rawIssuerCN) ? rawIssuerCN[0] : rawIssuerCN || '';
            const issuerO = Array.isArray(rawIssuerO) ? rawIssuerO[0] : rawIssuerO || '';
            const subjectCN = Array.isArray(rawSubjectCN) ? rawSubjectCN[0] : rawSubjectCN || '';
            const issuerStr = issuerCN || issuerO || 'Unknown';
            const subjectStr = subjectCN || 'Unknown';

            const validFrom = cert.valid_from || null;
            const validTo = cert.valid_to || null;

            let daysRemaining: number | null = null;
            let isShortLived = false;

            if (validTo) {
              const expiryDate = new Date(validTo);
              const now = new Date();
              daysRemaining = Math.floor(
                (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
            }

            if (validFrom && validTo) {
              const fromDate = new Date(validFrom);
              const toDate = new Date(validTo);
              const validityPeriod = Math.floor(
                (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              isShortLived = validityPeriod < 100;
            }

            const issuerFull = `${issuerO} ${issuerCN}`.toLowerCase();
            const isLetsEncrypt = issuerFull.includes("let's encrypt") || issuerFull.includes('letsencrypt');
            const isSelfSigned = issuerStr === subjectStr;
            const valid = socket.authorized;

            if (isLetsEncrypt && isShortLived) {
              riskFlags.push("Let's Encrypt cert — free, short-lived certificate");
            }

            if (isSelfSigned) {
              riskFlags.push('Self-signed certificate detected');
            }

            if (daysRemaining !== null && daysRemaining < 14) {
              riskFlags.push('Certificate expires in less than 14 days');
            }

            socket.destroy();

            resolve({
              valid,
              issuer: issuerStr,
              issuerOrganization: issuerO || null,
              subject: subjectStr,
              validFrom,
              validTo,
              daysRemaining,
              isLetsEncrypt,
              isSelfSigned,
              isShortLived,
              riskFlags,
            });
          } catch {
            socket.destroy();
            resolve(fallback);
          }
        }
      );

      socket.on('timeout', () => {
        socket.destroy();
        resolve(fallback);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(fallback);
      });
    } catch {
      resolve(fallback);
    }
  });
}
