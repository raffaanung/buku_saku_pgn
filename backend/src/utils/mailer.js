import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  FROM_EMAIL,
  RESEND_API_KEY,
  RESEND_FROM
} = process.env;

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;
  if (SMTP_USER && SMTP_PASS) {
    const host = SMTP_HOST || 'smtp.gmail.com';
    transporter = nodemailer.createTransport({
      host,
      port: Number(SMTP_PORT || 587),
      secure: String(SMTP_SECURE || 'false') === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    return transporter;
  }
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
  return transporter;
}

async function sendViaResend({ to, subject, text, html }) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }
  const from = RESEND_FROM || FROM_EMAIL || 'no-reply@buku-saku.local';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html, text })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || `Resend API error: ${res.status}`;
    throw new Error(msg);
  }
  return { messageId: data?.id || null, previewUrl: null };
}

async function sendViaSendGrid({ to, subject, text, html }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM || FROM_EMAIL || 'no-reply@buku-saku.local';
  if (!apiKey) throw new Error('SENDGRID_API_KEY not configured');
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [
        html ? { type: 'text/html', value: html } : null,
        text ? { type: 'text/plain', value: text } : null
      ].filter(Boolean)
    })
  });
  const data = await res.text();
  if (!res.ok) throw new Error(`SendGrid API error: ${res.status} ${data}`);
  return { messageId: null, previewUrl: null };
}

async function sendViaMailgun({ to, subject, text, html }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.MAILGUN_FROM || FROM_EMAIL || 'no-reply@buku-saku.local';
  if (!apiKey || !domain) throw new Error('MAILGUN_API_KEY/MAILGUN_DOMAIN not configured');
  const body = new URLSearchParams();
  body.append('from', from);
  body.append('to', to);
  body.append('subject', subject);
  if (text) body.append('text', text);
  if (html) body.append('html', html);
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`api:${apiKey}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Mailgun API error: ${res.status} ${data?.message || ''}`);
  return { messageId: data?.id || null, previewUrl: null };
}

export async function sendMail({ to, subject, text, html }) {
  // Jika admin ingin memaksa SMTP Gmail, lewati HTTP provider
  const forceSmtp = String(process.env.SMTP_ONLY || 'false') === 'true';
  if (!forceSmtp) {
    if (RESEND_API_KEY) {
      try {
        return await sendViaResend({ to, subject, text, html });
      } catch (e) {
        console.warn('[MAIL HTTP API FAILED] Falling back to SMTP:', e.message);
      }
    }
    if (process.env.SENDGRID_API_KEY) {
      try {
        return await sendViaSendGrid({ to, subject, text, html });
      } catch (e) {
        console.warn('[MAIL SENDGRID API FAILED] Falling back:', e.message);
      }
    }
    if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
      try {
        return await sendViaMailgun({ to, subject, text, html });
      } catch (e) {
        console.warn('[MAIL MAILGUN API FAILED] Falling back:', e.message);
      }
    }
  }

  // SMTP dengan timeout dan fallback otomatis 587 -> 465 untuk Gmail
  const host = SMTP_HOST || 'smtp.gmail.com';
  const baseOptions = {
    host,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE || 'false') === 'true',
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: 10000,
    socketTimeout: 10000
  };
  let info;
  try {
    const smtp1 = nodemailer.createTransport(baseOptions);
    info = await smtp1.sendMail({
      from: FROM_EMAIL || RESEND_FROM || 'no-reply@buku-saku.local',
      to,
      subject,
      text,
      html
    });
  } catch (e) {
    const isGmail = /gmail\.com$/i.test(host);
    const timedOut = /ETIMEDOUT|ECONNECTION|ESOCKET/i.test(e?.code || '') || /timed out/i.test(e?.message || '');
    if (isGmail && timedOut) {
      console.warn('[SMTP Gmail Timeout] mencoba fallback ke 465/SSL');
      const smtp2 = nodemailer.createTransport({
        ...baseOptions,
        port: 465,
        secure: true
      });
      info = await smtp2.sendMail({
        from: FROM_EMAIL || RESEND_FROM || 'no-reply@buku-saku.local',
        to,
        subject,
        text,
        html
      });
    } else {
      throw e;
    }
  }
  if (info && info.message) {
    console.log('[MAIL STREAM]', info.message.toString());
  }
  return { messageId: info.messageId, previewUrl: null };
}
