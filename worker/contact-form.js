/**
 * Contact form handler for verifiedrcm.com — replaces Formspree.
 *
 * Runs as a Cloudflare Worker on a route at this site's own domain
 * (www.verifiedrcm.com/api/contact), so the browser POST is same-origin:
 * no CORS preflight, no third-party domain in the page, and nothing for an
 * ad-blocker to object to. The form posts multipart FormData and expects JSON
 * back, which is exactly the shape js/main.js already used for Formspree — so
 * the front end changed by one attribute rather than being rewritten.
 *
 * Mail goes out through Resend, sending From noreply@verifiedrcm.com to
 * info@verifiedrcm.com — the same domain at both ends, on purpose.
 *
 * It sent from stanzas.tech at first, reasoning that the prospect never sees
 * the envelope so the domain did not matter. That was wrong: Gmail put every
 * notification straight in spam. A message from a domain with no DMARC policy
 * arriving at a mailbox on an unrelated domain, with no history between them,
 * is close to a textbook spam profile. Sending from verifiedrcm.com makes it
 * same-domain and DKIM-aligned under a domain that already publishes SPF and
 * DMARC, which is what actually gets it into the inbox.
 *
 * Reply-To still carries the prospect's address, so hitting Reply in Gmail
 * answers THEM, not the robot.
 *
 * Required secrets (Workers dashboard -> Settings -> Variables):
 *   RESEND_API_KEY    — a send-only key, separate from the one SAMS uses, so
 *                       it can be revoked without taking transactional mail
 *                       down with it
 *   TURNSTILE_SECRET  — the secret half of the Turnstile widget
 *
 * Optional plain variables (defaults below are the live ones):
 *   TO_EMAIL, FROM_EMAIL
 */

const DEFAULT_TO = 'info@verifiedrcm.com';
const DEFAULT_FROM = 'Verified RCM Website <noreply@verifiedrcm.com>';

/** Fields we accept. Anything else in the payload is ignored rather than forwarded. */
const FIELDS = ['name', 'email', 'phone', 'practice', 'specialty', 'message'];

const REQUIRED = ['name', 'email', 'practice', 'message'];

/** Longest value we will accept per field. A form post is not a file upload. */
const MAX_LEN = 5000;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(request, env) });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed.' }, 405, request, env);
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return json({ ok: false, error: 'Could not read the submission.' }, 400, request, env);
    }

    // Honeypot. A field no human sees and no human fills; bots fill everything.
    // Answered with a 200 on purpose — telling a bot it was caught only teaches
    // it to try again without the field.
    if ((form.get('company_website') || '').toString().trim() !== '') {
      return json({ ok: true }, 200, request, env);
    }

    const turnstile = await verifyTurnstile(form.get('cf-turnstile-response'), request, env);
    if (!turnstile.ok) {
      return json(
        { ok: false, error: 'We could not verify that you are human. Please reload and try again.' },
        403, request, env,
      );
    }

    const data = {};
    for (const key of FIELDS) {
      const raw = (form.get(key) || '').toString().trim();
      if (raw.length > MAX_LEN) {
        return json({ ok: false, error: `That ${key} is too long.` }, 400, request, env);
      }
      data[key] = raw;
    }

    const missing = REQUIRED.filter((key) => data[key] === '');
    if (missing.length > 0) {
      return json({ ok: false, error: 'Please fill in every required field.' }, 400, request, env);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
      return json({ ok: false, error: 'That email address does not look right.' }, 400, request, env);
    }

    const sent = await sendViaResend(data, request, env);

    if (!sent.ok) {
      // The prospect gets a recovery path, not a stack trace. The detail goes
      // to the Worker log, where it is useful and not public.
      console.error('Resend rejected the message:', sent.detail);
      return json(
        { ok: false, error: 'We could not send that just now. Please email info@verifiedrcm.com instead.' },
        502, request, env,
      );
    }

    return json({ ok: true }, 200, request, env);
  },
};

/**
 * Turnstile is not optional, and the Worker refuses rather than degrading if
 * the secret is missing. A public form endpoint with no bot check is scraped
 * and hammered within days — "temporarily unprotected" becomes permanent, and
 * the failure mode is a mailbox full of junk rather than an obvious outage.
 */
async function verifyTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET) {
    console.error('TURNSTILE_SECRET is not set — refusing every submission until it is.');
    return { ok: false };
  }

  if (!token) return { ok: false };

  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token.toString());

  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const out = await res.json();

    if (out.success !== true) {
      // siteverify says WHY it refused — invalid-input-secret means the wrong
      // key is in TURNSTILE_SECRET, timeout-or-duplicate means the token was
      // already spent or is stale. Without logging this the Worker just
      // returns 403 and every cause looks identical from the outside.
      console.error('Turnstile refused the token:', JSON.stringify(out['error-codes'] || out));
    }

    return { ok: out.success === true };
  } catch (e) {
    console.error('Turnstile verification failed to complete:', e);
    return { ok: false };
  }
}

async function sendViaResend(data, request, env) {
  if (!env.RESEND_API_KEY) {
    return { ok: false, detail: 'RESEND_API_KEY is not set' };
  }

  const country = request.headers.get('CF-IPCountry') || 'unknown';

  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Phone', data.phone || '—'],
    ['Practice', data.practice],
    ['Specialty', data.specialty || '—'],
  ];

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1a1f2b;max-width:640px">
      <h2 style="margin:0 0 4px;font-size:18px">New practice review request</h2>
      <p style="margin:0 0 20px;color:#6b7488;font-size:13px">
        Submitted from verifiedrcm.com/about.html${country !== 'unknown' ? ` · ${escapeHtml(country)}` : ''}
      </p>
      <table style="border-collapse:collapse;font-size:14px;width:100%">
        ${rows.map(([label, value]) => `
          <tr>
            <td style="padding:7px 14px 7px 0;color:#6b7488;white-space:nowrap;vertical-align:top">${label}</td>
            <td style="padding:7px 0"><strong>${escapeHtml(value)}</strong></td>
          </tr>`).join('')}
      </table>
      <p style="margin:22px 0 6px;color:#6b7488;font-size:13px">What they need help with</p>
      <div style="white-space:pre-wrap;background:#f6f7f9;border-radius:6px;padding:14px;font-size:14px;line-height:1.6">${escapeHtml(data.message)}</div>
      <p style="margin:22px 0 0;color:#6b7488;font-size:12px">
        Reply to this email and it goes straight to ${escapeHtml(data.email)}.
      </p>
    </div>`;

  const text = [
    'New practice review request — verifiedrcm.com',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'What they need help with:',
    data.message,
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || DEFAULT_FROM,
        to: [env.TO_EMAIL || DEFAULT_TO],
        // The whole point: Reply in Gmail answers the prospect, not the Worker.
        reply_to: data.email,
        subject: `Practice review request — ${data.practice}`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      return { ok: false, detail: `${res.status} ${await res.text()}` };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, detail: String(e) };
  }
}

/**
 * Same-origin is the expected case, so the allow-list exists to stop the
 * endpoint being used as a free mail relay from somebody else's page.
 */
function cors(request, env) {
  const allowed = (env.ALLOWED_ORIGINS || 'https://www.verifiedrcm.com,https://verifiedrcm.com')
    .split(',')
    .map((s) => s.trim());

  const origin = request.headers.get('Origin') || '';
  const headers = {
    'Content-Type': 'application/json',
    Vary: 'Origin',
  };

  if (allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept';
  }

  return headers;
}

function json(body, status, request, env) {
  return new Response(JSON.stringify(body), { status, headers: cors(request, env) });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
