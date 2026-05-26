/**
 * POST /api/quote
 *
 * Receives quote form submissions from the SUDZ DUDE site and emails
 * them to detail@sudzdude.com via Resend.
 *
 * Env: RESEND_API_KEY (set in Vercel project settings)
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM = 'SUDZ DUDE Quotes <quotes@sudzdude.com>';
const TO = 'detail@sudzdude.com';

const REQUIRED = ['name', 'phone', 'email', 'vehicle', 'package', 'town'];

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured');
    return res.status(500).json({ error: 'Server is not configured to send mail.' });
  }

  const body = (req.body && typeof req.body === 'object') ? req.body : {};

  // Honeypot — bots fill hidden fields humans never see.
  // Quietly accept and discard to avoid telling bots they failed.
  if (body.website && String(body.website).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const fields = {
    name: String(body.name || '').trim(),
    phone: String(body.phone || '').trim(),
    email: String(body.email || '').trim(),
    vehicle: String(body.vehicle || '').trim(),
    package: String(body.package || '').trim(),
    town: String(body.town || '').trim(),
    notes: String(body.notes || '').trim(),
  };

  const missing = REQUIRED.filter(k => !fields[k]);
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // Length cap (rough anti-abuse)
  if (Object.values(fields).join('').length > 10000) {
    return res.status(400).json({ error: 'Submission too long.' });
  }

  const subject = `Quote request — ${fields.package} — ${fields.name}`;

  const textBody = [
    'New quote request from sudzdude.com',
    '',
    `Name:    ${fields.name}`,
    `Phone:   ${fields.phone}`,
    `Email:   ${fields.email}`,
    `Town:    ${fields.town}`,
    `Vehicle: ${fields.vehicle}`,
    `Package: ${fields.package}`,
    '',
    'Notes:',
    fields.notes || '(none)',
    '',
    '---',
    'Reply directly to this email to respond — Reply-To is set to the customer.',
  ].join('\n');

  const htmlBody = `<!doctype html>
<html><body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#0A1424;background:#F5F7FA;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #E2E6EE;">
    <div style="font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#FF1E7A;font-weight:700;margin-bottom:6px;">New Quote Request</div>
    <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#0A1424;line-height:1.2;">${escapeHtml(fields.name)} &mdash; ${escapeHtml(fields.package)}</h1>
    <table style="border-collapse:collapse;width:100%;font-size:14px;line-height:1.5;">
      <tr><td style="padding:8px 12px 8px 0;color:#6b7280;width:90px;vertical-align:top;">Phone</td><td style="padding:8px 0;"><a href="tel:${escapeHtml(fields.phone)}" style="color:#0A1424;text-decoration:none;font-weight:600;">${escapeHtml(fields.phone)}</a></td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#6b7280;vertical-align:top;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(fields.email)}" style="color:#0A1424;text-decoration:none;font-weight:600;">${escapeHtml(fields.email)}</a></td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#6b7280;vertical-align:top;">Town</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fields.town)}</td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#6b7280;vertical-align:top;">Vehicle</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fields.vehicle)}</td></tr>
      <tr><td style="padding:8px 12px 8px 0;color:#6b7280;vertical-align:top;">Package</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(fields.package)}</td></tr>
    </table>
    ${fields.notes ? `<div style="margin-top:24px;padding:16px;background:#F5F7FA;border-radius:8px;font-size:14px;line-height:1.55;"><div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;font-weight:700;">Notes</div>${escapeHtml(fields.notes).replace(/\n/g, '<br>')}</div>` : ''}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #E2E6EE;font-size:12px;color:#9ca3af;line-height:1.5;">Reply directly to this email to respond to the customer &mdash; Reply-To is set to <strong>${escapeHtml(fields.email)}</strong>.</div>
  </div>
</body></html>`;

  try {
    const r = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: fields.email,
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error('Resend API error', r.status, errText);
      return res.status(502).json({ error: 'Could not send your request. Please call or text instead.' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Handler exception', e);
    return res.status(500).json({ error: 'Server error. Please call or text instead.' });
  }
};
