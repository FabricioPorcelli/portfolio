# Contact form proxy (Cloudflare Worker)

El sitio es estático, así que la access key de Web3Forms no puede "ocultarse" en el
cliente: cualquier cosa que llegue al navegador es visible. Este Worker hace de
proxy y guarda la key como **secreto** en Cloudflare.

```
Visitante -> POST /  (Worker)  -> Web3Forms  -> email
                 ^ key en env.WEB3FORMS_KEY
```

## Deploy desde el dashboard de Cloudflare

1. Cloudflare Dashboard -> **Workers & Pages** -> **Create** -> **Worker**.
2. Nombre: `portfolio-contact` -> **Deploy**.
3. **Edit code**: pegar el contenido de `workers/contact-form.js` -> **Deploy**.
4. **Settings** -> **Variables and Secrets** -> **Add**:
   - Tipo: **Secret**
   - Nombre: `WEB3FORMS_KEY`
   - Valor: tu access key de Web3Forms (la que te enviaron por email).
5. Copiar la URL del Worker: `https://portfolio-contact.<tu-subdominio>.workers.dev`.
6. En `index.html`, reemplazar la action del form:
   ```html
   <form ... action="https://portfolio-contact.<tu-subdominio>.workers.dev" ...>
   ```
7. Probar el formulario en producción.

### Dominio propio (opcional)

Workers -> tu Worker -> **Settings** -> **Triggers** -> **Custom Domains** ->
`contact.fabricioporcelli.com.ar`. Después usá esa URL como action del form
(y agregala al `connect-src` / `form-action` del CSP en `index.html` y
`projects/homelab.html`).

## Deploy con Wrangler (alternativa)

```bash
npm install -g wrangler
wrangler login
wrangler deploy workers/contact-form.js --name portfolio-contact
wrangler secret put WEB3FORMS_KEY --name portfolio-contact
```

## Seguridad

- La key no viaja al navegador ni se commitea en el repo.
- CORS restringido a los orígenes del portfolio (ver `ALLOWED_ORIGINS`).
- Solo `POST`; se validan campos, largo y formato de email.
- Honeypot `botcheck` descartado en silencio.
- Recomendado: agregar una regla de **rate limiting** en Cloudflare
  (Security -> WAF -> Rate limiting rules) sobre la ruta del Worker.
- Si la key se filtró alguna vez, generá una nueva en Web3Forms y actualizá el secreto.

## Variables

| Nombre | Tipo | Descripción |
|---|---|---|
| `WEB3FORMS_KEY` | Secret | Access key de Web3Forms |
