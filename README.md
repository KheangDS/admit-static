# ADMIT UNIT Website

A static website for ADMIT UNIT’s business services, export programmes, and enquiries. Built with HTML, CSS, and JavaScript—no framework, build step, or npm installation required.

## Project files

```text
index.html        Website content and page views
css/style.css     Styles and responsive layout
js/main.js        Navigation, activities, sharing, and enquiry handling
js/config.js      Backend API configuration
assets/           Brand and partner images
*.pdf             Downloadable service-package document
```

## Run locally

From this directory:

```sh
python3 -m http.server 8000
```

Open **http://localhost:8000/**. Serve the files over HTTP instead of opening `index.html` directly.

## Configure the API

Set the backend URL in `js/config.js`. The current default is:

```js
window.ADMIT_API_BASE = 'https://flowproject.admitunit.asia/api/v1';
```

The website uses these endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/activities` | List activities |
| GET | `/activities/{slug}` | Load an activity |
| POST | `/send-enquiry` | Submit an enquiry |

The backend is maintained separately. Enquiry success requires a successful HTTP response with JSON `{ "success": true }`. If delivery cannot be confirmed, the website preserves the draft and offers manual email and copy options.

**The default API is a live service.** Use a development backend for test submissions. Never put credentials or secret keys in frontend files.

## Deploy

Upload `index.html`, `css/`, `js/`, `assets/`, and the service-package PDF to your static web host. Keep their relative paths unchanged. No build command is needed.

Navigation uses hash URLs such as `/#contact` and `/#activity?slug=example`, so normal navigation and shared links do not need server rewrites. Old clean URLs such as `/activities/example` require the host to serve `index.html` for those paths; missing assets and API errors should remain real errors, not HTML fallbacks.

Use HTTPS for clipboard support. After changing CSS or JavaScript, update the corresponding `?v=` value in `index.html` to prevent stale browser caches.

## Local tests

Playwright was used only to verify browser behavior; it is **not a website dependency**. Local tests, their npm manifests and configuration, and generated artifacts are excluded from Git through `.gitignore`.
