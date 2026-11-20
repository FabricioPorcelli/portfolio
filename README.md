# Portfolio

Portfolio personal. Hosteado en un servidor casero con Coolify.

[https://portfolio.fabricioporcelli.com.ar/](https://portfolio.fabricioporcelli.com.ar/)

La infraestructura del servidor está documentada en
[Self-Hosted Homelab](https://portfolio.fabricioporcelli.com.ar/projects/homelab.html).

## Contenido estático para LLMs

La home incluye una copia estática de los proyectos y las skills en `index.html`
para que el contenido sea legible sin ejecutar JavaScript (buscadores, lectores
de LLMs, etc.). También se publica `llms.txt` con un resumen del portfolio.

Después de cambiar `data/data.json`, regenerar ambos con:

```bash
node scripts/build-static.js
```
