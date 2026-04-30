import dgram from 'dgram';
import net from 'net';
import { createClient } from '@supabase/supabase-js';
import { IngestionPipeline } from './pipeline';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const pipeline = new IngestionPipeline(supabase);

const CONNECTOR_ID = process.env.SYSLOG_CONNECTOR_ID || '00000000-0000-0000-0000-000000000000';
const ORG_ID = process.env.SYSTEM_ORG_ID || '00000000-0000-0000-0000-000000000000';

async function handleMessage(msg: Buffer) {
  try {
    await pipeline.ingestEvent(msg, CONNECTOR_ID, ORG_ID, 'syslog');
  } catch (e) {
    console.error("Syslog processing error:", e);
  }
}

// UDP Server
const udpServer = dgram.createSocket('udp4');
udpServer.on('error', (err) => {
  console.error(`UDP server error:\n${err.stack}`);
  udpServer.close();
});
udpServer.on('message', (msg) => {
  handleMessage(msg);
});
udpServer.bind(514, () => console.log('Syslog UDP listening on port 514'));

// TCP Server
const tcpServer = net.createServer((socket) => {
  socket.on('data', (data) => {
    // Naive split by newline for TCP streams
    const messages = data.toString().split('\n').filter(Boolean);
    messages.forEach(m => handleMessage(Buffer.from(m)));
  });
});
tcpServer.listen(601, () => console.log('Syslog TCP listening on port 601'));
