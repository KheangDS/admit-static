/**
 * ADMIT UNIT Website — Client-side Navigation & Enquiry Builder
 */

const DEFAULT_META = {
  title: document.title,
  description: document.querySelector('meta[name="description"]').content,
  image: document.querySelector('meta[property="og:image"]').content
};
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollBehavior = () => prefersReducedMotion.matches ? 'auto' : 'smooth';
const appUrl = hash => new URL(hash || '#home', new URL('.', document.baseURI)).href;

async function fetchJSON(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('Expected application/json response');
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function copyText(text) {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const menuButton = document.querySelector('.menu');
const navElement = document.querySelector('nav');

if (menuButton && navElement) {
  const menuText = menuButton.querySelector('.menu-text');

  function setMobileMenuState(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    navElement.classList.toggle('open', open);
    if (menuText) {
      menuText.textContent = open ? 'Close' : 'Menu';
    }
  }

  menuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = menuButton.getAttribute('aria-expanded') === 'true';
    setMobileMenuState(!isExpanded);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMobileMenuState(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (navElement.classList.contains('open') && !navElement.contains(event.target) && !menuButton.contains(event.target)) {
      setMobileMenuState(false);
    }
  });

  navElement.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      setMobileMenuState(false);
    }
  });
}

/* ==========================================================================
   Header Navigation Indicator & Dynamic Scrollspy URL Engine
   ========================================================================== */

(function initHeaderNavEngine() {
  const nav = document.querySelector('header nav');
  if (!nav) return;

  nav.classList.add('has-indicator');

  // Create or select the animated moving indicator element
  let indicator = nav.querySelector('.nav-indicator');
  if (!indicator) {
    indicator = document.createElement('span');
    indicator.className = 'nav-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    nav.appendChild(indicator);
  }

  const navLinks = Array.from(nav.querySelectorAll('a'));
  if (!navLinks.length) return;

  // Determine current page hash
  const currentHash = (window.location.hash || '').split('?')[0];

  // Find initial active link (by aria-current="page" or by matching href)
  let activeLink = nav.querySelector('a[aria-current="page"]');
  if (!activeLink && currentHash) {
    activeLink = navLinks.find(link => {
      const href = (link.getAttribute('href') || '').split('?')[0];
      return href === currentHash;
    });
  }
  if (!activeLink) {
    activeLink = navLinks[0];
  }

  let hoveredLink = null;

  // Function to smoothly position the indicator under a target link
  function moveIndicator(targetLink, instant = false) {
    if (!targetLink || window.innerWidth <= 1000) {
      indicator.style.opacity = '0';
      return;
    }

    const offsetLeft = targetLink.offsetLeft;
    const width = targetLink.offsetWidth;

    if (instant) {
      indicator.style.transition = 'none';
    }

    indicator.style.width = `${width}px`;
    indicator.style.transform = `translateX(${offsetLeft}px)`;
    indicator.style.opacity = '1';

    if (instant) {
      void indicator.offsetHeight;
      indicator.style.transition = '';
    }
  }

  function getActiveLink() {
    return nav.querySelector('a[aria-current="page"]') ||
           nav.querySelector('a.nav-active') ||
           activeLink ||
           navLinks[0];
  }

  // Hover animations: follow cursor smoothly, return to active link on leave
  navLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      hoveredLink = link;
      moveIndicator(link);
    });

  });

  nav.addEventListener('mouseleave', () => {
    hoveredLink = null;
    activeLink = getActiveLink();
    moveIndicator(activeLink);
  });

  // Handle window resizing and font loading
  window.addEventListener('resize', () => {
    activeLink = getActiveLink();
    moveIndicator(hoveredLink || activeLink, true);
  });
  window.addEventListener('load', () => {
    activeLink = getActiveLink();
    moveIndicator(activeLink, true);
  });

  // Helper to activate a nav link and update indicator
  function setActiveLink(link, sectionHash = null, updateUrl = true) {
    if (!link) return;

    navLinks.forEach(l => {
      l.classList.remove('nav-active');
      if (l !== link) l.removeAttribute('aria-current');
    });
    link.classList.add('nav-active');
    link.setAttribute('aria-current', 'page');
    activeLink = link;

    if (!hoveredLink) {
      moveIndicator(link);
    }
  }

  // Expose global indicator controllers
  window.__setGlobalActiveNav = function(target) {
    if (!target) return;
    let targetLink = typeof target === 'string' ? null : target;
    if (!targetLink) {
      targetLink = navLinks.find(l => {
        const h = (l.getAttribute('href') || '').split('?')[0];
        return h === target || target.startsWith(h);
      });
    }
    if (targetLink) {
      setActiveLink(targetLink, null, false);
      moveIndicator(targetLink);
    }
  };

  window.__moveHeaderIndicator = function(targetLink) {
    if (targetLink) {
      setActiveLink(targetLink, null, false);
      moveIndicator(targetLink);
    }
  };

  // Initial indicator placement
  setActiveLink(activeLink, null, false);
  requestAnimationFrame(() => moveIndicator(activeLink, true));


})();

const enquiryForm = document.querySelector('#enquiry');
const PACKAGE_NAMES = {
  'costing': 'Product Cost and Quotation Setup',
  'follow-up': 'Customer Follow-up Setup',
  'buyer-pack': 'Buyer Information Pack',
  'packaging-design': 'Export Packaging Design and Labeling Compliance',
  'label-compliance': 'Export Labeling Compliance for Existing Packaging'
};

window.applyEnquiryOptions = function(route = '', packageKey = '') {
  if (!enquiryForm) return;
  if (['BUSINESS', 'EXPORT', 'PROGRAMME'].includes(route)) {
    enquiryForm.elements.route.value = route;
  }
  if (Object.hasOwn(PACKAGE_NAMES, packageKey)) {
    enquiryForm.elements.objective.value = `I would like to discuss ${PACKAGE_NAMES[packageKey]}.`;
  }
  const selected = enquiryForm.elements.route.value;
  for (const [id, enabled] of [['exportfields', selected === 'EXPORT'], ['programmefields', selected === 'PROGRAMME']]) {
    const group = document.getElementById(id);
    group.hidden = !enabled;
    group.querySelectorAll('input').forEach(input => { input.disabled = !enabled; });
  }
};

if (enquiryForm) {
  let sending = false;
  const status = document.getElementById('contact-submit-status');
  const preview = document.getElementById('emailresult');
  const message = document.getElementById('emailcopy');
  const copyStatus = document.getElementById('copystatus');
  enquiryForm.elements.route.addEventListener('change', () => window.applyEnquiryOptions());
  window.applyEnquiryOptions();

  document.getElementById('copy').addEventListener('click', async () => {
    const copied = await copyText(message.value);
    copyStatus.textContent = copied ? 'Message copied.' : 'Copy unavailable. Select and copy the message below.';
    if (!copied) { message.focus(); message.select(); }
  });

  enquiryForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !enquiryForm.reportValidity()) return;
    for (const field of ['name', 'organization', 'contact', 'objective']) {
      const input = enquiryForm.elements[field];
      input.setCustomValidity(input.value.trim() ? '' : 'Please enter a value, not only spaces.');
      if (!input.reportValidity()) {
        input.addEventListener('input', () => input.setCustomValidity(''), { once: true });
        return;
      }
    }

    sending = true;
    const submit = enquiryForm.querySelector('button[type="submit"]');
    const original = submit.innerHTML;
    submit.disabled = true;
    submit.textContent = 'Sending enquiry…';
    enquiryForm.setAttribute('aria-busy', 'true');
    status.hidden = false;
    status.textContent = 'Sending your enquiry…';
    preview.hidden = true;
    copyStatus.textContent = '';

    const data = new FormData(enquiryForm);
    const value = key => String(data.get(key) || '').trim();
    const route = value('route');
    const routeLabel = enquiryForm.elements.route.selectedOptions[0].text;
    const payload = {
      route, route_label: routeLabel, routeLabel,
      name: value('name'), organization: value('organization'),
      contact: value('contact'), objective: value('objective'),
      product: value('product'), timing: value('timing'),
      market: route === 'EXPORT' ? value('market') : '',
      cohort: route === 'PROGRAMME' ? value('cohort') : ''
    };
    const lines = [
      'Hello ADMIT UNIT,', 'I would like to request a free 20-minute fit call.', '',
      `Service: ${routeLabel}`, `Name: ${payload.name}`,
      `Organization: ${payload.organization}`, `Contact: ${payload.contact}`,
      `Objective: ${payload.objective}`,
      `Product or sector: ${payload.product || 'Not specified'}`,
      `Timing: ${payload.timing || 'Flexible'}`
    ];
    if (payload.market) lines.push(`Market and buyer status: ${payload.market}`);
    if (payload.cohort) lines.push(`Cohort, locations and budget: ${payload.cohort}`);
    payload.subject = `${route} enquiry - ${payload.organization}`;
    payload.body_text = payload.bodyText = lines.join('\n');

    try {
      const endpoint = window.ADMIT_API_ENDPOINT || `${API_CONFIG.baseUrl}/send-enquiry`;
      const result = await fetchJSON(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      // An HTML fallback page, 204, or unrecognized JSON is NOT confirmation.
      if (!result || result.success !== true) throw new Error('No explicit success acknowledgement');
      status.textContent = 'Your enquiry was accepted by ADMIT UNIT. We aim to respond within two business days.';
      enquiryForm.reset();
      window.applyEnquiryOptions();
    } catch (error) {
      status.textContent = 'We could not confirm delivery. Your draft is preserved. You can retry, or send it yourself using the options below. If delivery was interrupted after acceptance, retrying may create a duplicate.';
      message.value = `To: om@admitunit.asia\nSubject: ${payload.subject}\n\n${payload.body_text}`;
      document.getElementById('emailopen').href = `mailto:om@admitunit.asia?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(payload.body_text)}`;
      preview.hidden = false;
    } finally {
      sending = false;
      submit.disabled = false;
      submit.innerHTML = original;
      enquiryForm.removeAttribute('aria-busy');
    }
  });
}

/* ==========================================================================
   Activity Dynamic Registry, API Engine, Carousel & Share Modal
   ========================================================================== */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const API_CONFIG = {
  baseUrl: (window.ADMIT_API_BASE || window.__ADMIT_API_BASE__ || '/api').replace(/\/$/, '')
};

const ACTIVITIES_REGISTRY = Object.create(null);

function safeImageUrl(value, fallback = '') {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    const url = new URL(value, document.baseURI);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
  } catch { return fallback; }
}

function normalizeActivity(value) {
  if (!value || typeof value !== 'object' || typeof value.slug !== 'string' ||
      !value.slug.trim() || typeof value.title !== 'string' || !value.title.trim()) return null;
  const result = { slug: value.slug.trim(), title: value.title };
  for (const field of ['description', 'partner', 'partnerLogo', 'focus', 'startDate', 'endDate']) {
    result[field] = typeof value[field] === 'string' ? value[field] : '';
  }
  result.images = Array.isArray(value.images) ? value.images.slice(0, 30).map(image => {
    if (typeof image === 'string') return image;
    const clean = {};
    for (const field of ['url', 'src', 'title', 'subtitle', 'color']) {
      if (image && typeof image[field] === 'string') clean[field] = image[field];
    }
    return clean;
  }) : [];
  return result;
}

function disposeCarousels(root) {
  root.querySelectorAll('.carousel-container').forEach(container => container.__destroyCarousel?.());
}

function activityMeta(activity) {
  const first = activity.images[0];
  return {
    title: activity.title,
    description: activity.description || DEFAULT_META.description,
    image: safeImageUrl(typeof first === 'string' ? first : first?.url || first?.src,
      safeImageUrl(activity.partnerLogo, DEFAULT_META.image)),
    url: getActivityShareUrl(activity.slug)
  };
}

let slideGradientId = 0;
function renderSlideItemHTML(img, activity, index, total) {
  if (typeof img === 'string' && safeImageUrl(img)) {
    return `<div class="carousel-slide"><img src="${escapeHtml(safeImageUrl(img))}" alt="${escapeHtml(activity.title)} — photo ${index + 1}" loading="lazy"></div>`;
  }
  if (img && safeImageUrl(img.url || img.src)) {
    const src = safeImageUrl(img.url || img.src);
    return `<div class="carousel-slide"><img src="${escapeHtml(src)}" alt="${escapeHtml(img.title || activity.title)} — photo ${index + 1}" loading="lazy"></div>`;
  }
  const color = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(img?.color || '') ? img.color : '#087ba7';
  const slideTitle = (img && img.title) || activity.title;
  const slideSub = (img && img.subtitle) || activity.partner || '';
  const partnerName = activity.partner || 'ADMIT UNIT';
  const actId = `slide-${++slideGradientId}`;

  return `<div class="carousel-slide">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" class="activity-slide-svg" style="width:100%;height:100%;display:block;">
      <defs>
        <linearGradient id="act-grad-${actId}-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#160d50"/>
          <stop offset="55%" stop-color="#1e295b"/>
          <stop offset="100%" stop-color="${color}"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill="url(#act-grad-${actId}-${index})"/>
      <circle cx="710" cy="80" r="200" fill="#ffffff" fill-opacity="0.04"/>
      <circle cx="100" cy="380" r="220" fill="#1c9ed2" fill-opacity="0.09"/>
      <text x="70" y="132" fill="#7dd3fc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" letter-spacing="2">ACTIVITY PHOTO 0${index + 1} / 0${total}</text>
      <text x="70" y="186" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="27" font-weight="800">${escapeHtml(slideTitle)}</text>
      <text x="70" y="232" fill="#cbd5e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17">${escapeHtml(slideSub)}</text>
      <rect x="70" y="268" width="220" height="36" rx="18" fill="#1c9ed2" fill-opacity="0.32" stroke="#38bdf8" stroke-opacity="0.4"/>
      <text x="92" y="291" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700">${escapeHtml(partnerName)}</text>
    </svg>
  </div>`;
}

function renderActivityCardHTML(activity) {
  const imgs = (activity.images && activity.images.length > 0) ? activity.images : [
    { title: activity.title, subtitle: activity.partner, color: '#087ba7' }
  ];
  const slideCount = imgs.length;
  const multi = slideCount > 1;
  const slidesHtml = imgs.map((img, i) => renderSlideItemHTML(img, activity, i, slideCount)).join('');
  const dotsHtml = multi ? imgs.map((_, i) => `<button class="carousel-dot ${i === 0 ? 'active' : ''}" aria-label="Go to slide ${i + 1}"></button>`).join('') : '';

  const shareSlugEscaped = escapeHtml(activity.slug);
  const detailHref = `#activity?slug=${escapeHtml(encodeURIComponent(activity.slug))}`;

  return `
    <article class="activity-card" data-slug="${shareSlugEscaped}">
      <div class="carousel-container" data-slide-count="${slideCount}">
        <span class="carousel-counter-badge">1 / ${slideCount}</span>
        <div class="carousel-track">
          ${slidesHtml}
        </div>
        ${multi ? `
        <div class="carousel-overlay-bottom">
          <div class="carousel-dots">
            ${dotsHtml}
          </div>
        </div>
        <div class="carousel-progress">
          <div class="carousel-timer-bar"></div>
        </div>
        ` : ''}
      </div>

      <div class="activity-card-body">
        <a href="${detailHref}" class="activity-card-title">
          ${escapeHtml(activity.title)}
        </a>
        <p class="activity-card-desc">
          ${escapeHtml(activity.description)}
        </p>
        <div class="activity-card-footer">
          <a href="${detailHref}" class="activity-details-link">
            <span>View activity details</span>
            <span>→</span>
          </a>
          <button type="button" data-share-slug="${shareSlugEscaped}" class="activity-share-btn">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderActivitiesEmptyState() {
  const containers = document.querySelectorAll('.activity-cards-grid');
  if (!containers.length) return;
  const emptyHtml = `
    <div class="activity-empty-banner">
      <div class="activity-empty-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <h3>Not Found</h3>
      <p>No activities are available at the moment.</p>
    </div>
  `;
  containers.forEach(container => {
    disposeCarousels(container);
    container.innerHTML = emptyHtml;
  });
}

function renderActivitiesGrid(list) {
  const containers = document.querySelectorAll('.activity-cards-grid');
  if (!containers.length) return;

  if (!list || !list.length) {
    renderActivitiesEmptyState();
    return;
  }

  const html = list.map(act => renderActivityCardHTML(act)).join('');
  containers.forEach(container => {
    disposeCarousels(container);
    container.innerHTML = html;
    container.querySelectorAll('.carousel-container').forEach(initCarousel);
  });
}

async function loadActivitiesFromAPI() {
  try {
    const data = await fetchJSON(`${API_CONFIG.baseUrl}/activities`, {
      headers: { 'Accept': 'application/json' }
    });
    const list = Array.isArray(data) ? data : data?.activities ?? data?.data;
    if (!Array.isArray(list)) throw new Error('Invalid activity list');
    const activities = list.map(normalizeActivity).filter(Boolean);
    if (list.length && !activities.length) throw new Error('No valid activities in response');
    activities.forEach(activity => { ACTIVITIES_REGISTRY[activity.slug] = activity; });
    renderActivitiesGrid(activities);
    return activities;
  } catch (error) {
    document.querySelectorAll('.activity-cards-grid').forEach(container => {
      disposeCarousels(container);
      container.innerHTML = '<div class="activity-empty-banner" role="status"><h3>Not Found</h3><p>Unable to load activities. Please try again shortly.</p><button type="button" class="button secondary" data-retry-activities>Try again</button></div>';
    });
    return [];
  }
}

async function fetchActivityDetailFromAPI(slug) {
  if (!slug) return null;
  try {
    const data = await fetchJSON(`${API_CONFIG.baseUrl}/activities/${encodeURIComponent(slug)}`, {
      headers: { 'Accept': 'application/json' }
    });
    const activity = normalizeActivity(data?.activity || data?.data || data);
    if (!activity || activity.slug !== slug) throw new Error('Invalid activity detail');
    ACTIVITIES_REGISTRY[slug] = activity;
    return activity;
  } catch (error) {
    // Do not mistake a failed request for a successful detail response.
    return null;
  }
}

document.addEventListener('click', event => {
  const share = event.target.closest('[data-share-slug]');
  if (share) openShareModal(share.dataset.shareSlug);
  if (event.target.closest('[data-retry-activities]')) loadActivitiesFromAPI();
});

function updateMetaTags({ title, description, image, url }) {
  document.title = title ? (title.includes('ADMIT UNIT') ? title : `${title} — ADMIT UNIT`) : DEFAULT_META.title;

  function setMeta(selector, attr, value) {
    if (!value) return;
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      const isProp = selector.startsWith('meta[property=');
      if (isProp) {
        const propName = selector.match(/meta\[property="([^"]+)"\]/)[1];
        el.setAttribute('property', propName);
      } else {
        const nameMatch = selector.match(/meta\[name="([^"]+)"\]/)[1];
        el.setAttribute('name', nameMatch);
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  }

  if (description) {
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[name="twitter:description"]', 'content', description);
  }
  if (title) {
    const fullTitle = title.includes('ADMIT UNIT') ? title : `${title} — ADMIT UNIT`;
    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
  }
  if (url) {
    setMeta('meta[property="og:url"]', 'content', url);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }
  if (image) {
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[name="twitter:image"]', 'content', image);
  }
}

const carouselControllers = new Set();
function syncCarousels() {
  carouselControllers.forEach(controller => controller.sync());
}
document.addEventListener('visibilitychange', syncCarousels);
prefersReducedMotion.addEventListener('change', syncCarousels);
window.addEventListener('pagehide', () => {
  carouselControllers.forEach(controller => controller.destroy());
});
window.addEventListener('pageshow', event => {
  if (event.persisted) document.querySelectorAll('.carousel-container').forEach(initCarousel);
});

function initCarousel(container) {
  container.__destroyCarousel?.();
  const track = container.querySelector('.carousel-track');
  const count = Number(container.dataset.slideCount);
  if (!track || !Number.isInteger(count) || count <= 1) {
    const counter = container.querySelector('.carousel-counter-badge');
    if (counter) counter.textContent = '1 / 1';
    return;
  }

  const events = new AbortController();
  let index = 0;
  let timer = null;
  let paused = prefersReducedMotion.matches;
  let hovered = false;
  let focused = false;
  let visible = true;
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'carousel-pause';
  container.appendChild(pause);
  const on = (element, type, handler) => element?.addEventListener(type, handler, { signal: events.signal });

  function show(next) {
    index = (next + count) % count;
    track.style.transition = prefersReducedMotion.matches ? 'none' : 'transform 0.55s ease';
    track.style.transform = `translateX(-${index * 100}%)`;
    container.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-pressed', String(i === index));
    });
    const counter = container.querySelector('.carousel-counter-badge, .carousel-counter');
    if (counter) counter.textContent = `${index + 1} / ${count}`;
    Array.from(track.children).forEach((slide, i) => {
      slide.setAttribute('aria-hidden', String(i !== index));
    });
  }

  const controller = {
    sync() {
      clearInterval(timer);
      timer = null;
      const view = container.closest('.page-view');
      const playing = container.isConnected && (!view || view.classList.contains('active')) &&
        visible && !document.hidden && !prefersReducedMotion.matches && !paused && !hovered && !focused;
      container.dataset.playing = String(playing);
      pause.textContent = paused ? 'Play slides' : 'Pause slides';
      pause.setAttribute('aria-pressed', String(paused));
      if (playing) timer = setInterval(() => show(index + 1), 5000);
    },
    destroy() {
      clearInterval(timer);
      observer?.disconnect();
      events.abort();
      pause.remove();
      carouselControllers.delete(controller);
      delete container.__destroyCarousel;
    }
  };
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    controller.sync();
  }) : null;
  observer?.observe(container);
  container.__destroyCarousel = controller.destroy;
  carouselControllers.add(controller);

  on(pause, 'click', () => { paused = !paused; controller.sync(); });
  on(container, 'mouseenter', () => { hovered = true; controller.sync(); });
  on(container, 'mouseleave', () => { hovered = false; controller.sync(); });
  on(container, 'focusin', () => { focused = true; controller.sync(); });
  on(container, 'focusout', event => {
    focused = container.contains(event.relatedTarget);
    controller.sync();
  });
  on(container.querySelector('.carousel-arrow.next'), 'click', () => { show(index + 1); controller.sync(); });
  on(container.querySelector('.carousel-arrow.prev'), 'click', () => { show(index - 1); controller.sync(); });
  container.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    on(dot, 'click', () => { show(i); controller.sync(); });
  });
  show(0);
  controller.sync();
}

// Share Modal Controller
let currentShareSlug = '';

function getActivityShareUrl(slug = '') {
  return appUrl(slug ? `#activity?slug=${encodeURIComponent(slug)}` : '#activities');
}

let modalReturnFocus = null;
let modalBackground = [];
let modalOverflow = '';

function openShareModal(slug = currentShareSlug) {
  const activity = ACTIVITIES_REGISTRY[slug];
  const modal = document.getElementById('share-modal');
  if (!activity || !modal) return;
  currentShareSlug = slug;
  modal.querySelector('[data-share-title]').textContent = activity.title;
  const input = document.getElementById('share-modal-url');
  input.value = input.title = getActivityShareUrl(slug);
  document.getElementById('share-copy-label').textContent = 'Copy Link';
  if (!modal.classList.contains('hidden')) return;
  modalReturnFocus = document.activeElement;
  modalBackground = Array.from(document.body.children)
    .filter(element => element !== modal && element.id !== 'share-toast' && !['SCRIPT', 'STYLE'].includes(element.tagName))
    .map(element => [element, element.inert]);
  modalBackground.forEach(([element]) => { element.inert = true; });
  modalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  modal.classList.remove('hidden');
  modal.querySelector('button').focus();
}

function closeShareModal() {
  const modal = document.getElementById('share-modal');
  if (!modal || modal.classList.contains('hidden')) return;
  modal.classList.add('hidden');
  document.body.style.overflow = modalOverflow;
  modalBackground.forEach(([element, inert]) => { element.inert = inert; });
  modalBackground = [];
  if (modalReturnFocus?.isConnected && !modalReturnFocus.closest('.page-view:not(.active)')) {
    modalReturnFocus.focus();
  }
}

async function handleShareApp(platform) {
  const activity = ACTIVITIES_REGISTRY[currentShareSlug];
  if (!activity) return;
  const shareUrl = getActivityShareUrl(activity.slug);
  const shareText = `${activity.title} — ADMIT UNIT & ${activity.partner || 'ADMIT UNIT'}`;
  const urls = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
  };
  if (Object.hasOwn(urls, platform)) {
    window.open(urls[platform], '_blank', 'noopener,noreferrer,width=640,height=560');
    closeShareModal();
    return;
  }
  if (platform === 'tiktok' || platform === 'instagram') {
    window.open(platform === 'tiktok' ? 'https://www.tiktok.com' : 'https://www.instagram.com', '_blank', 'noopener,noreferrer');
    // These platforms have no web URL-sharing endpoint.
    await copyShareUrl();
  }
}

async function copyShareUrl() {
  const input = document.getElementById('share-modal-url');
  const label = document.getElementById('share-copy-label');
  if (!input || !currentShareSlug) return;
  const copied = await copyText(getActivityShareUrl(currentShareSlug));
  label.textContent = copied ? 'Copied!' : 'Select & copy';
  showShareToast(copied ? 'Link copied to clipboard!' : 'Clipboard unavailable. Select and copy the link.');
  if (!copied) { input.focus(); input.select(); }
}

function showShareToast(message) {
  let toast = document.querySelector('#share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    toast.className = 'share-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `<span class="share-toast-dot"></span><span id="share-toast-text">${escapeHtml(message)}</span>`;
    document.body.appendChild(toast);
  } else {
    const textEl = toast.querySelector('#share-toast-text');
    if (textEl) textEl.textContent = message;
    toast.classList.remove('hidden');
  }

  clearTimeout(window.__shareToastTimer);
  window.__shareToastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

// Global modal background close & Escape key
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('share-modal');
  if (!modal || modal.classList.contains('hidden')) return;
  if (e.key === 'Escape') closeShareModal();
  if (e.key === 'Tab') {
    const controls = Array.from(modal.querySelectorAll('button, input, a[href], [tabindex="0"]'));
    const first = controls[0], last = controls[controls.length - 1];
    if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
      e.preventDefault(); first.focus();
    }
  }
});

const modalBackdrop = document.querySelector('#share-modal');
if (modalBackdrop) {
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeShareModal();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadActivitiesFromAPI();
});


/* ==========================================================================
   Single-File Bundle Router Engine (admit-unit SPA Hash Router)
   ========================================================================== */

(function initBundleRouter() {
  const views = Array.from(document.querySelectorAll('.page-view'));
  const pages = new Set(views.map(view => view.id.replace('view-', '')));
  const aliases = {
    'khmer-enterprise-2025': 'export-market-development-program-2025',
    'usaid-2024-2025': 'usaid-export-market-development-2024-2025',
    'giz-export-packaging': 'export-labeling-and-packaging-for-market-entry'
  };
  const titles = {
    home: DEFAULT_META.title, services: 'Business Implementation — ADMIT UNIT',
    export: 'Export Market Development — ADMIT UNIT',
    'export-labeling': 'Export Labeling & Packaging — ADMIT UNIT',
    programmes: 'Institutional Programmes — ADMIT UNIT', about: 'Our Role & Ecosystem — ADMIT UNIT',
    activities: 'Activities & Updates — ADMIT UNIT', activity: 'Activity — ADMIT UNIT',
    contact: 'Contact & Brief Builder — ADMIT UNIT', terms: 'Service Terms & Privacy — ADMIT UNIT'
  };
  let navigationId = 0;
  let lastLocation = '';
  function decode(value) {
    try { return decodeURIComponent(value); } catch { return value; }
  }
  function resolveRoute(url) {
    const raw = url.hash.slice(1);
    const [namePart, query = ''] = raw.split('?');
    const [name, section = ''] = namePart.split('#');
    const hashParams = new URLSearchParams(query);
    const search = new URLSearchParams(url.search);
    const param = key => hashParams.get(key) || search.get(key) || '';
    const basePath = new URL('.', document.baseURI).pathname;
    let target = name || url.pathname.slice(basePath.length);
    target = decode(target).replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
    if (!target || target === 'index') target = 'home';
    if (Object.hasOwn(aliases, target)) return { page: 'activity', slug: aliases[target] };
    if (target.startsWith('activity-')) return { page: 'activity', slug: target.slice(9) };
    if (target.startsWith('activities/')) return { page: 'activity', slug: target.slice(11) };
    if (!raw && search.get('slug')) return { page: 'activity', slug: search.get('slug') };
    if (pages.has(target)) return {
      page: target, slug: target === 'activity' ? param('slug') : '',
      route: target === 'contact' ? param('route') : '',
      packageKey: target === 'contact' ? param('package') : '',
      section: section || hashParams.get('scroll') || ''
    };
    const element = document.getElementById(target);
    const view = element?.closest('.page-view');
    return view ? { page: view.id.replace('view-', ''), section: target } : null;
  }
  function routeHash(route) {
    const params = new URLSearchParams();
    if (route.page === 'activity' && route.slug) params.set('slug', route.slug);
    if (route.page === 'contact') {
      if (route.route) params.set('route', route.route);
      if (route.packageKey) params.set('package', route.packageKey);
    }
    if (route.section) params.set('scroll', route.section);
    return `#${route.page}${params.size ? '?' + params.toString() : ''}`;
  }

  async function renderDetail(slug, id) {
    const root = document.querySelector('#view-activity [data-activity-detail-page]');
    const content = root.querySelector('#activity-detail-content');
    const unavailable = root.querySelector('#activity-detail-not-found');
    const loading = document.getElementById('activity-detail-loading');
    disposeCarousels(root);
    content.style.display = 'none';
    unavailable.style.display = 'none';
    loading.hidden = false;
    currentShareSlug = '';
    const activity = await fetchActivityDetailFromAPI(slug);
    if (id !== navigationId) return;
    loading.hidden = true;
    if (!activity) { unavailable.style.display = 'block'; return; }
    for (const field of ['title', 'partner', 'focus', 'description']) {
      const element = root.querySelector(`[data-field="${field}"]`);
      if (element) element.textContent = activity[field] || '';
    }
    const slugLabel = root.querySelector('[data-field="slug"]');
    if (slugLabel) slugLabel.textContent = `/activities/${activity.slug}`;
    const logo = root.querySelector('[data-field="partnerLogo"]');
    logo.src = safeImageUrl(activity.partnerLogo, new URL('assets/admit-unit-logo.png', document.baseURI).href);
    logo.alt = activity.partner || 'ADMIT UNIT';
    root.querySelector('[data-field="dateRange"]').textContent =
      [activity.startDate, activity.endDate].filter(Boolean).join(' – ') || 'Ongoing';
    const hero = root.querySelector('.carousel-container');
    const images = activity.images.length ? activity.images : [{ title: activity.title, subtitle: activity.partner }];
    const multiple = images.length > 1;
    hero.dataset.slideCount = images.length;
    hero.querySelector('.carousel-track').innerHTML =
      images.map((image, i) => renderSlideItemHTML(image, activity, i, images.length)).join('');
    hero.querySelector('.carousel-dots').innerHTML = multiple ? images.map((_, i) =>
      `<button type="button" class="carousel-dot" aria-label="Go to slide ${i + 1}"></button>`).join('') : '';
    hero.querySelectorAll('.carousel-arrow').forEach(arrow => { arrow.hidden = !multiple; });
    content.style.display = 'block';
    currentShareSlug = slug;
    initCarousel(hero);
    updateMetaTags(activityMeta(activity));
  }

  function navigate(route, { updateUrl = true, focus = true } = {}) {
    if (!route || !pages.has(route.page)) return;
    const id = ++navigationId;
    closeShareModal();
    const active = document.getElementById(`view-${route.page}`);
    views.forEach(view => {
      const selected = view === active;
      view.classList.toggle('active', selected);
      view.hidden = !selected;
      view.inert = !selected;
    });
    const hash = routeHash(route);
    if (updateUrl && window.location.hash !== hash) history.pushState(null, '', appUrl(hash));
    lastLocation = location.href;
    updateMetaTags({
      title: titles[route.page], description: DEFAULT_META.description,
      image: DEFAULT_META.image, url: appUrl(hash)
    });
    if (route.page === 'activity') renderDetail(route.slug, id);
    else { currentShareSlug = ''; disposeCarousels(document.getElementById('view-activity')); }
    if (route.page === 'contact') window.applyEnquiryOptions(route.route, route.packageKey);
    const navHash = route.page === 'activity' ? '#activities' : `#${route.page}`;
    document.querySelectorAll('header nav a').forEach(link => {
      const selected = link.getAttribute('href') === navHash;
      link.classList.toggle('nav-active', selected);
      if (selected) {
        link.setAttribute('aria-current', 'page');
        window.__setGlobalActiveNav?.(link);
      } else link.removeAttribute('aria-current');
    });
    menuButton?.setAttribute('aria-expanded', 'false');
    navElement?.classList.remove('open');
    const menuText = menuButton?.querySelector('.menu-text');
    if (menuText) menuText.textContent = 'Menu';
    syncCarousels();
    requestAnimationFrame(() => {
      if (id !== navigationId) return;
      const section = route.section && document.getElementById(route.section);
      const target = section && active.contains(section) ? section :
        route.page === 'activity' ? active : active.querySelector('h1') || active;
      if (focus) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
      if (section && active.contains(section)) target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      else window.scrollTo({ top: 0, behavior: scrollBehavior() });
    });
  }
  window.switchPageView = (target, options = {}) => {
    const route = resolveRoute(new URL(target.startsWith('#') ? target : '#' + target, document.baseURI));
    if (route) navigate({ ...route, ...options, section: options.hash || route.section }, options);
  };
  function routeLocation(focus = true) {
    if (lastLocation === location.href) return;
    navigate(resolveRoute(new URL(location.href)) || { page: 'home' }, { updateUrl: false, focus });
  }
  window.addEventListener('popstate', () => routeLocation());
  window.addEventListener('hashchange', () => routeLocation());

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const href = link.getAttribute('href');
    if (href === '#main') {
      event.preventDefault();
      const main = document.getElementById('main');
      main.focus({ preventScroll: true });
      main.scrollIntoView({ behavior: scrollBehavior() });
      return;
    }
    const url = new URL(href, document.baseURI);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== location.origin) return;
    const basePath = new URL('.', document.baseURI).pathname;
    if (!url.pathname.startsWith(basePath)) return;
    const path = url.pathname.slice(basePath.length);
    if (path && !/^(?:index\.html|(?:home|services|export|export-labeling|programmes|about|activities|activity|contact|terms)(?:\.html)?\/?|activities\/[^/]+\/?|khmer-enterprise-2025|usaid-2024-2025|giz-export-packaging)$/.test(path)) return;
    const route = resolveRoute(url);
    if (!route) return;
    event.preventDefault();
    if (route.page === 'contact') {
      route.route = link.dataset.route || route.route;
      route.packageKey = link.dataset.package || route.packageKey;
    }
    navigate(route);
  });
  routeLocation(false);
})();
