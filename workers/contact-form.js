// Cloudflare Worker: proxy para el formulario de contacto.
// La access key de Web3Forms vive en el secreto WEB3FORMS_KEY (nunca en el cliente).
//
// Deploy: ver workers/README.md

const MAX_LENGTH = { name: 100, email: 254, message: 5000 };

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

    if (!env.WEB3FORMS_KEY) {
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

    const payload = new FormData();
    payload.set('access_key', env.WEB3FORMS_KEY);
    payload.set('subject', 'Nuevo mensaje desde el portfolio');
    payload.set('from_name', 'Portfolio - Fabricio Porcelli');
    payload.set('name', name);
    payload.set('email', email);
    payload.set('message', message);

    let upstream;
    try {
      upstream = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: payload,
        headers: { Accept: 'application/json' },
      });
    } catch {
      return jsonResponse({ success: false, message: 'Provider unavailable' }, 502, cors);
    }

    const data = await upstream.json().catch(() => ({}));
    const ok = upstream.ok && data.success === true;

    return jsonResponse(
      { success: ok, message: ok ? 'Sent' : 'Delivery failed' },
      ok ? 200 : 502,
      cors
    );
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
