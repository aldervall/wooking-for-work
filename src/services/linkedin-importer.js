import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '../../scripts/linkedin-mcp.sh');
const TIMEOUT = 60000;

function extractUsername(url) {
  const m = url.match(/linkedin\.com\/in\/([^/?#]+)/);
  if (!m) throw new Error('Invalid LinkedIn URL — must contain linkedin.com/in/<username>');
  return m[1].replace(/\/$/, '');
}

function buildPayload(id, method, params) {
  return JSON.stringify({ jsonrpc: '2.0', id, method, params });
}

export async function importLinkedInProfile(linkedinUrl) {
  const username = extractUsername(linkedinUrl);
  if (!fs.existsSync(SCRIPT)) {
    return { ok: false, error: `LinkedIn MCP script not found at ${SCRIPT}. Is this a dev environment?`, username };
  }

  return new Promise((resolve) => {
    let sessionId = null;
    let profileData = null;
    let errorMsg = null;
    let buf = '';
    let proc = null;
    const pending = new Map();
    let nextId = 1;
    let killed = false;
    const timer = setTimeout(() => {
      if (!killed) {
        killed = true;
        proc?.kill();
        resolve({ ok: false, error: 'LinkedIn MCP timed out after 60s', username });
      }
    }, TIMEOUT);

    function send(line) {
      if (killed || !proc?.stdin?.writable) return;
      const msg = `Content-Length: ${Buffer.byteLength(line, 'utf-8')}\r\n\r\n${line}`;
      proc.stdin.write(msg);
    }

    function onChunk(chunk) {
      buf += chunk.toString();
      while (true) {
        const hl = buf.indexOf('Content-Length: ');
        if (hl === -1) break;
        const colon = buf.indexOf(':', hl + 16);
        const nl = buf.indexOf('\r\n', colon);
        if (nl === -1) break;
        const len = parseInt(buf.slice(colon + 1, nl).trim(), 10);
        const sep = buf.indexOf('\r\n\r\n', nl);
        if (sep === -1) break;
        const body = buf.slice(sep + 4, sep + 4 + len);
        buf = buf.slice(sep + 4 + len);
        if (body.length < len) {
          buf = body + buf;
          break;
        }
        try {
          const msg = JSON.parse(body);
          handleMessage(msg);
        } catch (err) { console.error('LinkedIn import parse error:', err.message); }
      }
    }

    function handleMessage(msg) {
      if (msg.id != null) {
        const resolvePending = pending.get(msg.id);
        if (resolvePending) {
          pending.delete(msg.id);
          resolvePending(msg);
        }
      }
    }

    async function call(method, params) {
      const id = nextId++;
      return new Promise((res) => {
        pending.set(id, res);
        send(buildPayload(id, method, params));
      });
    }

    proc = spawn('bash', [SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PATH: process.env.PATH },
    });

    proc.stdout.on('data', onChunk);
    proc.stderr.on('data', (d) => {
      if (!errorMsg) errorMsg = d.toString().trim();
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (!killed && !profileData) {
        resolve({ ok: false, error: errorMsg || `LinkedIn MCP exited with code ${code}`, username });
      }
    });

    (async () => {
      try {
        const init = await call('initialize', {
          protocolVersion: '0.1.0',
          capabilities: {},
          clientInfo: { name: 'wooking-for-work', version: '1.0.0' },
        });
        if (init?.result?.meta?.['mcp-session-id']) {
          sessionId = init.result.meta['mcp-session-id'];
        }

        send(buildPayload(0, 'notifications/initialized', {}));

        const profile = await call('tools/call', {
          name: 'get_person_profile',
          arguments: { linkedin_username: username, sections: 'experience,education,skills' },
        });

        const content = profile?.result?.content?.[0]?.text;
        if (content) {
          profileData = typeof content === 'string' ? JSON.parse(content) : content;
        } else if (profile?.result) {
          profileData = profile.result;
        }

        await call('tools/call', { name: 'close_session', arguments: {} }).catch(err => { console.error('LinkedIn close_session error:', err.message); });
        killed = true;
        proc.kill();
        clearTimeout(timer);

        if (!profileData) {
          resolve({ ok: false, error: 'No profile data returned from LinkedIn', username });
          return;
        }

        const parsed = {
          name: profileData.name || profileData.displayName || profileData.fullName || '',
          headline: profileData.headline || '',
          location: profileData.location || '',
          avatarUrl: profileData.profilePicture || profileData.avatar || '',
          experience: Array.isArray(profileData.experience) ? profileData.experience.map(e => ({
            title: e.title || e.position || '',
            company: e.company || e.companyName || '',
            description: e.description || '',
            duration: e.duration || e.dateRange || '',
          })) : [],
          education: Array.isArray(profileData.education) ? profileData.education.map(e => ({
            school: e.school || e.schoolName || '',
            degree: e.degree || '',
            field: e.field || e.fieldOfStudy || '',
          })) : [],
          skills: Array.isArray(profileData.skills) ? profileData.skills.map(s => typeof s === 'string' ? s : s.name || s.skill || '') : [],
        };
        resolve({ ok: true, data: parsed, username });
      } catch (err) {
        killed = true;
        proc?.kill();
        clearTimeout(timer);
        resolve({ ok: false, error: err.message, username });
      }
    })();
  });
}
