// Cloudflare Worker: proxy para el formulario de contacto.
// Envía los mensajes con Resend. La API key vive en el secreto RESEND_API_KEY
// (nunca en el cliente).
//
// Deploy: Cloudflare -> Workers & Pages -> portfolio-contact -> Edit code.

const MAX_LENGTH = { name: 100, email: 254, message: 5000 };

const DEFAULT_TO = 'fabricioporcelli@gmail.com';
const DEFAULT_FROM = 'Portfolio <onboarding@resend.dev>';

function isAllowedOrigin(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();

    const isLocal =
      url.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1');

    const isProduction =
      url.protocol === 'https:' &&
      (host === 'fabricioporcelli.com.ar' ||
        host.endsWith('.fabricioporcelli.com.ar') ||
        host === 'fabricioporcelli.github.io');

    return isLocal || isProduction;
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ success: false, message: 'Method not allowed' }, 405, cors);
    }

    if (!isAllowedOrigin(origin)) {
      return jsonResponse({ success: false, message: 'Origin not allowed' }, 403, cors);
    }

    if (!env.RESEND_API_KEY) {
      return jsonResponse({ success: false, message: 'Server not configured' }, 500, cors);
    }

    let form;
    try {
      form = await request.formData();
    } catch {
      return jsonResponse({ success: false, message: 'Invalid payload' }, 400, cors);
    }

    // Honeypot: los bots completan este campo; se descarta en silencio.
    if (form.get('botcheck')) {
      return jsonResponse({ success: true, message: 'OK' }, 200, cors);
    }

    const name = String(form.get('name') || '').trim();
    const email = String(form.get('email') || '').trim();
    const message = String(form.get('message') || '').trim();

    if (!name || !email || !message) {
      return jsonResponse({ success: false, message: 'Missing fields' }, 422, cors);
    }

    if (
      name.length > MAX_LENGTH.name ||
      email.length > MAX_LENGTH.email ||
      message.length > MAX_LENGTH.message
    ) {
      return jsonResponse({ success: false, message: 'Payload too large' }, 413, cors);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return jsonResponse({ success: false, message: 'Invalid email' }, 422, cors);
    }

    const payload = {
      from: env.CONTACT_FROM || DEFAULT_FROM,
      to: [env.CONTACT_TO || DEFAULT_TO],
      reply_to: email,
      subject: `Nuevo mensaje desde el portfolio - ${name}`,
      text: `Nombre: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    };

    let upstream;
    try {
      upstream = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch {
      return jsonResponse({ success: false, message: 'Provider unavailable' }, 502, cors);
    }

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      console.error('Resend delivery failed', upstream.status, data.message || '');
      return jsonResponse({ success: false, message: 'Delivery failed' }, 502, cors);
    }

    return jsonResponse({ success: true, message: 'Sent' }, 200, cors);
  },
};

function corsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function jsonResponse(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
