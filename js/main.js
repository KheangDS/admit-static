/**
 * ADMIT UNIT Website — Client-side Navigation & Enquiry Builder
 */

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

    link.addEventListener('click', () => {
      setActiveLink(link, null, false);
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
    let targetLink = typeof target === 'string' ? nav.querySelector(target) : target;
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

  // Handle clicking "Home" or Brand when on home to smoothly scroll to top
  const brandLinks = Array.from(document.querySelectorAll('a.brand'));
  [...brandLinks, ...navLinks].forEach(link => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href') || '';
      if (href === '#home' || href === 'index.html' || href === '#') {
        const homeView = document.querySelector('#view-home');
        if (homeView && homeView.classList.contains('active')) {
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (menuButton && navElement && navElement.classList.contains('open')) {
              menuButton.setAttribute('aria-expanded', 'false');
              navElement.classList.remove('open');
            }
          }
        }
      }
    });
  });

  // Services page scrollspy for packages (#costing, #follow-up, #buyer-pack)
  const servicesView = document.querySelector('#view-services');
  const serviceSections = [
    { id: 'costing', element: document.querySelector('#costing') },
    { id: 'follow-up', element: document.querySelector('#follow-up') },
    { id: 'buyer-pack', element: document.querySelector('#buyer-pack') }
  ].filter(s => s.element);

  if (serviceSections.length) {
    window.addEventListener('scroll', () => {
      if (!servicesView || !servicesView.classList.contains('active')) return;
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY < 150) {
        if (window.location.hash && window.location.hash !== '#services') {
          window.history.replaceState(null, '', '#services');
        }
        return;
      }

      const detectLine = scrollY + window.innerHeight * 0.35;
      let activeSec = null;
      for (let i = 0; i < serviceSections.length; i++) {
        const s = serviceSections[i];
        const top = s.element.getBoundingClientRect().top + scrollY;
        if (top <= detectLine) {
          activeSec = s;
        }
      }
      if (activeSec && window.location.hash !== '#' + activeSec.id) {
        window.history.replaceState(null, '', '#' + activeSec.id);
      }
    }, { passive: true });
  }
})();

const enquiryForm = document.querySelector('#enquiry');

if (enquiryForm) {
  const routeSelect = document.querySelector('#route');
  const exportFields = document.querySelector('#exportfields');
  const programmeFields = document.querySelector('#programmefields');
  const emailCopyInput = document.querySelector('#emailcopy');
  const emailOpenLink = document.querySelector('#emailopen');
  const emailResultBox = document.querySelector('#emailresult');
  const copyButton = document.querySelector('#copy');
  const copyStatus = document.querySelector('#copystatus');

  const queryParams = new URLSearchParams( window.location.search );
  const requestedRoute = queryParams.get('route');
  const requestedPackage = queryParams.get('package');

  if (['BUSINESS', 'EXPORT', 'PROGRAMME'].includes(requestedRoute)) {
    routeSelect.value = requestedRoute;
  }

  const packageNames = {
    'costing': 'Product Cost and Quotation Setup',
    'follow-up': 'Customer Follow-up Setup',
    'buyer-pack': 'Buyer Information Pack',
    'packaging-design': 'Export Packaging Design and Labeling Compliance',
    'label-compliance': 'Export Labeling Compliance for Existing Packaging',
  };

  if (packageNames[requestedPackage]) {
    enquiryForm.elements.objective.value = `I would like to discuss ${packageNames[requestedPackage]}.`;
  }

  function updateConditionalFields() {
    exportFields.hidden = routeSelect.value !== 'EXPORT';
    programmeFields.hidden = routeSelect.value !== 'PROGRAMME';
  }

  routeSelect.addEventListener('change', updateConditionalFields);
  updateConditionalFields();

  // Listen for clicks on internal CTA buttons with data-route or data-package
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('a[data-route], a[data-package]');
    if (trigger) {
      const r = trigger.getAttribute('data-route');
      const p = trigger.getAttribute('data-package');
      if (r && ['BUSINESS', 'EXPORT', 'PROGRAMME'].includes(r)) {
        routeSelect.value = r;
        updateConditionalFields();
      }
      if (p && packageNames[p] && enquiryForm.elements.objective) {
        enquiryForm.elements.objective.value = `I would like to discuss ${packageNames[p]}.`;
      }
    }
  });

  enquiryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!enquiryForm.reportValidity()) {
      return;
    }

    const formData = new FormData(enquiryForm);
    const routeVal = routeSelect.value;
    const routeLabel = routeSelect.selectedOptions[0] ? routeSelect.selectedOptions[0].text : routeVal;
    const name = (formData.get('name') || '').trim();
    const organization = (formData.get('organization') || '').trim();
    const contact = (formData.get('contact') || '').trim();
    const objective = (formData.get('objective') || '').trim();
    const product = (formData.get('product') || '').trim();
    const timing = (formData.get('timing') || '').trim();
    const market = (formData.get('market') || '').trim();
    const cohort = (formData.get('cohort') || '').trim();

    const lines = [
      'Hello ADMIT UNIT,',
      'I would like to request a free 20-minute fit call.',
      '',
      `Service: ${routeLabel}`,
      `Name: ${name}`,
      `Organization: ${organization}`,
      `Contact: ${contact}`,
      `Objective: ${objective}`,
      `Product or sector: ${product || 'Not specified'}`,
      `Timing: ${timing || 'Flexible'}`,
    ];

    if (routeVal === 'EXPORT' && market) {
      lines.push(`Market and buyer status: ${market}`);
    }

    if (routeVal === 'PROGRAMME' && cohort) {
      lines.push(`Cohort, locations and budget: ${cohort}`);
    }

    const bodyText = lines.join('\n');
    const subject = `${routeVal} enquiry - ${organization}`;
    const fullClipboardText = `To: om@admitunit.asia\nSubject: ${subject}\n\n${bodyText}`;

    const submitBtn = enquiryForm.querySelector('button[type="submit"]');
    const statusNote = document.querySelector('#contact-submit-status');
    const originalHtml = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Sending email to ADMIT UNIT...</span>`;
    }

    const payload = {
      route: routeVal,
      route_label: routeLabel,
      routeLabel: routeLabel,
      name: name,
      organization: organization,
      contact: contact,
      objective: objective,
      product: product,
      timing: timing,
      market: market,
      cohort: cohort,
      subject: subject,
      body_text: bodyText,
      bodyText: bodyText
    };

    const apiBase = (typeof window !== 'undefined' && (window.ADMIT_API_BASE || window.__ADMIT_API_BASE__)) || '/api';
    const endpoint = (typeof window !== 'undefined' && window.ADMIT_API_ENDPOINT)
      ? window.ADMIT_API_ENDPOINT
      : `${apiBase.replace(/\/$/, '')}/send-enquiry`;

    let emailSentDirectly = false;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resData = await response.json().catch(() => ({}));
        if (resData.success !== false) {
          emailSentDirectly = true;
        }
      }
    } catch (err) {
      console.warn('[ADMIT UNIT] Direct email API failed, falling back to mail client:', err);
    }

    if (emailSentDirectly) {
      // 1. Success feedback
      if (submitBtn) {
        submitBtn.innerHTML = `<span>Email sent to om@admitunit.asia!</span> <span aria-hidden="true">✓</span>`;
        setTimeout(() => {
          submitBtn.innerHTML = originalHtml;
          submitBtn.disabled = false;
        }, 5000);
      }

      if (statusNote) {
        statusNote.innerHTML = `
          <p>
            <strong>Email successfully sent!</strong> Your enquiry has been delivered directly to <a href="mailto:om@admitunit.asia">om@admitunit.asia</a>. We will confirm fit, required inputs, and clear next steps within two business days.
          </p>
        `;
        statusNote.hidden = false;
      }

      if (typeof showShareToast === 'function') {
        showShareToast('Email sent directly to om@admitunit.asia!');
      }

      enquiryForm.reset();
      updateConditionalFields();
    } else {
      // 2. Fallback: Copy to clipboard & open mailto client
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(fullClipboardText);
        }
      } catch (err) {
        console.warn('Clipboard write error:', err);
      }

      const mailtoUrl = `mailto:om@admitunit.asia?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      window.location.href = mailtoUrl;

      if (submitBtn) {
        submitBtn.innerHTML = `<span>Opening email app &amp; message copied!</span> <span aria-hidden="true">✓</span>`;
        setTimeout(() => {
          submitBtn.innerHTML = originalHtml;
          submitBtn.disabled = false;
        }, 5000);
      }

      if (statusNote) {
        statusNote.innerHTML = `
          <p>
            <strong>Opening your email app...</strong> We’ve copied your formatted message to your clipboard. If your email app didn’t launch automatically, simply paste into a new email to <a href="mailto:om@admitunit.asia">om@admitunit.asia</a>.
          </p>
        `;
        statusNote.hidden = false;
      }

      if (typeof showShareToast === 'function') {
        showShareToast('Message copied to clipboard! Opening email app...');
      }
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
  baseUrl: (typeof window !== 'undefined' && (window.ADMIT_API_BASE || window.__ADMIT_API_BASE__)) || '/api',
  endpoints: {
    activities: '/activities',
    activityDetail: (slug) => `/activities/${encodeURIComponent(slug)}`
  }
};

const ACTIVITIES_REGISTRY = {};

function renderSlideItemHTML(img, activity, index, total) {
  if (typeof img === 'string') {
    return `<div class="carousel-slide"><img src="${escapeHtml(img)}" alt="${escapeHtml(activity.title)} — photo ${index + 1}" loading="lazy"></div>`;
  }
  if (img && (img.url || img.src)) {
    const src = img.url || img.src;
    return `<div class="carousel-slide"><img src="${escapeHtml(src)}" alt="${escapeHtml(img.title || activity.title)} — photo ${index + 1}" loading="lazy"></div>`;
  }
  const color = (img && img.color) || '#087ba7';
  const slideTitle = (img && img.title) || activity.title;
  const slideSub = (img && img.subtitle) || activity.partner || '';
  const partnerName = activity.partner || 'ADMIT UNIT';
  const actId = activity.id || 'act';

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
  const trackImgs = multi ? [...imgs, imgs[0]] : imgs;

  const slidesHtml = trackImgs.map((img, i) => renderSlideItemHTML(img, activity, i % slideCount, slideCount)).join('');
  const dotsHtml = multi ? imgs.map((_, i) => `<button class="carousel-dot ${i === 0 ? 'active' : ''}" aria-label="Go to slide ${i + 1}"></button>`).join('') : '';

  const shareSlugEscaped = escapeHtml(activity.slug);
  const detailHref = `activities/${shareSlugEscaped}`;

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
          <button type="button" onclick="openShareModal('${shareSlugEscaped}')" class="activity-share-btn">
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
      <h3>No Activities Published Yet</h3>
      <p>Our upcoming trade development programmes and cohort activities will appear here once officially scheduled.</p>
    </div>
  `;
  containers.forEach(container => {
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
    container.innerHTML = html;
    container.querySelectorAll('.carousel-container').forEach(initCarousel);
  });
}

async function loadActivitiesFromAPI() {
  const apiBase = (typeof window !== 'undefined' && (window.ADMIT_API_BASE || window.__ADMIT_API_BASE__)) || API_CONFIG.baseUrl;
  const endpoint = `${apiBase.replace(/\/$/, '')}/activities`;

  try {
    const res = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`API responded with HTTP ${res.status}`);
    }
    const data = await res.json();
    const activitiesList = Array.isArray(data) ? data : (data.activities || data.data || []);

    if (Array.isArray(activitiesList) && activitiesList.length > 0) {
      activitiesList.forEach(act => {
        if (act && act.slug) {
          ACTIVITIES_REGISTRY[act.slug] = act;
        }
      });
      renderActivitiesGrid(activitiesList);
      console.log(`[ADMIT UNIT] Loaded ${activitiesList.length} dynamic activities from API`);
      return activitiesList;
    } else {
      renderActivitiesEmptyState();
      return [];
    }
  } catch (err) {
    console.info('[ADMIT UNIT] API not reachable or error:', err.message);
    const currentRegistered = Object.values(ACTIVITIES_REGISTRY);
    if (currentRegistered.length > 0) {
      renderActivitiesGrid(currentRegistered);
      return currentRegistered;
    } else {
      renderActivitiesEmptyState();
      return [];
    }
  }
}

async function fetchActivityDetailFromAPI(slug) {
  if (!slug) return null;
  if (ACTIVITIES_REGISTRY[slug]) return ACTIVITIES_REGISTRY[slug];

  const apiBase = (typeof window !== 'undefined' && (window.ADMIT_API_BASE || window.__ADMIT_API_BASE__)) || API_CONFIG.baseUrl;
  const endpoint = `${apiBase.replace(/\/$/, '')}/activities/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const activity = data.activity || data.data || data;
    if (activity && activity.slug) {
      ACTIVITIES_REGISTRY[activity.slug] = activity;
      return activity;
    }
  } catch (err) {
    console.warn(`[ADMIT UNIT] Could not fetch detail for activity slug "${slug}":`, err.message);
  }
  return null;
}

function updateMetaTags({ title, description, image, url }) {
  document.title = 'ADMIT UNIT · The Standard Implementer';

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

function initCarousel(container) {
  const track = container.querySelector('.carousel-track');
  if (!track) return;
  const slideCount = parseInt(container.dataset.slideCount || track.children.length, 10);
  if (slideCount <= 1) return;

  const dotsContainer = container.querySelector('.carousel-dots');
  const counterEl = container.querySelector('.carousel-counter-badge, .carousel-counter');
  const prevBtn = container.querySelector('.carousel-arrow.prev');
  const nextBtn = container.querySelector('.carousel-arrow.next');

  let trackIndex = 0;
  let timer = null;
  let resetTimeout = null;
  let isPaused = false;
  const TRANSITION_CSS = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)';

  function setPos(idx, animate = true) {
    track.style.transition = animate ? TRANSITION_CSS : 'none';
    track.style.transform = `translateX(-${idx * 100}%)`;
    if (!animate) void track.offsetWidth;
  }

  function updateDots(realIdx) {
    if (counterEl) {
      counterEl.textContent = `${realIdx + 1} / ${slideCount}`;
    }
    if (dotsContainer) {
      Array.from(dotsContainer.children).forEach((dot, idx) => {
        dot.classList.toggle('active', idx === realIdx);
      });
    }
  }

  function next() {
    clearTimeout(resetTimeout);
    if (trackIndex >= slideCount) {
      trackIndex = 0;
      setPos(0, false);
    }
    trackIndex++;
    setPos(trackIndex, true);
    const realIdx = trackIndex % slideCount;
    updateDots(realIdx);

    if (trackIndex === slideCount) {
      resetTimeout = setTimeout(() => {
        trackIndex = 0;
        setPos(0, false);
      }, 560);
    }
  }

  function prev() {
    clearTimeout(resetTimeout);
    if (trackIndex === 0) {
      trackIndex = slideCount;
      setPos(trackIndex, false);
    }
    trackIndex--;
    setPos(trackIndex, true);
    updateDots(trackIndex % slideCount);
    restartTimer();
  }

  function start() {
    clearInterval(timer);
    timer = setInterval(() => {
      if (!isPaused) next();
    }, 2000);
  }

  function restartTimer() {
    start();
  }

  container.addEventListener('mouseenter', () => { isPaused = true; });
  container.addEventListener('mouseleave', () => { isPaused = false; });
  container.addEventListener('touchstart', () => { isPaused = true; }, { passive: true });
  container.addEventListener('touchend', () => { isPaused = false; }, { passive: true });

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restartTimer(); });
  if (prevBtn) prevBtn.addEventListener('click', prev);

  if (dotsContainer) {
    Array.from(dotsContainer.children).forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        clearTimeout(resetTimeout);
        if (trackIndex === slideCount) setPos(0, false);
        trackIndex = idx;
        setPos(trackIndex, true);
        updateDots(idx);
        restartTimer();
      });
    });
  }

  start();
}

// Share Modal Controller
let currentShareSlug = '';

function getActivityShareUrl(slug) {
  const targetSlug = slug || currentShareSlug;
  if (!targetSlug) return 'https://admitunit.asia/activities';

  if (typeof window !== 'undefined' && window.location) {
    const loc = window.location;
    if (loc.protocol.startsWith('http') && !['localhost', '127.0.0.1'].includes(loc.hostname)) {
      return `${loc.origin}/activities/${targetSlug}`;
    }
  }

  // Clean, modern enterprise URL without .html
  return `https://admitunit.asia/activities/${targetSlug}`;
}

function openShareModal(slug) {
  if (slug && ACTIVITIES_REGISTRY[slug]) {
    currentShareSlug = slug;
  }
  const activity = currentShareSlug ? ACTIVITIES_REGISTRY[currentShareSlug] : null;
  if (!activity) return;

  const modal = document.querySelector('#share-modal');
  if (!modal) return;

  const titleEl = modal.querySelector('[data-share-title]');
  if (titleEl) titleEl.textContent = activity.title;

  const urlInput = modal.querySelector('#share-modal-url');
  const shareUrl = getActivityShareUrl(activity.slug);
  if (urlInput) {
    urlInput.value = shareUrl;
    urlInput.title = shareUrl;
  }

  modal.classList.remove('hidden');
}

function closeShareModal() {
  const modal = document.querySelector('#share-modal');
  if (modal) modal.classList.add('hidden');
}

function handleShareApp(platform) {
  const activity = currentShareSlug ? ACTIVITIES_REGISTRY[currentShareSlug] : null;
  if (!activity) return;

  const shareUrl = getActivityShareUrl(activity.slug);
  const shareText = `${activity.title} — ADMIT UNIT & ${activity.partner || 'ADMIT UNIT'}`;

  // Always copy share link to clipboard for convenience
  navigator.clipboard?.writeText(shareUrl);

  const urls = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
  };

  if (urls[platform]) {
    window.open(urls[platform], '_blank', 'noopener,noreferrer,width=640,height=560');
    showShareToast(`Opening ${platform.charAt(0).toUpperCase() + platform.slice(1)}...`);
    closeShareModal();
  } else if (platform === 'tiktok') {
    window.open('https://www.tiktok.com', '_blank', 'noopener,noreferrer');
    showShareToast('Link copied! Opening TikTok...');
    closeShareModal();
  } else if (platform === 'instagram') {
    window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
    showShareToast('Link copied! Opening Instagram...');
    closeShareModal();
  } else {
    showShareToast(`Link copied: ${shareUrl}`);
    closeShareModal();
  }
}

function copyShareUrl() {
  const activity = currentShareSlug ? ACTIVITIES_REGISTRY[currentShareSlug] : null;
  if (!activity) return;

  const shareUrl = getActivityShareUrl(activity.slug);
  const btnLabel = document.querySelector('#share-copy-label');

  navigator.clipboard?.writeText(shareUrl);
  if (btnLabel) {
    btnLabel.textContent = 'Copied!';
    setTimeout(() => { btnLabel.textContent = 'Copy Link'; }, 2000);
  }
  showShareToast('Link copied to clipboard!');
}

function showShareToast(message) {
  let toast = document.querySelector('#share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'share-toast';
    toast.className = 'share-toast';
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
  if (e.key === 'Escape') closeShareModal();
});

const modalBackdrop = document.querySelector('#share-modal');
if (modalBackdrop) {
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeShareModal();
  });
}

// Initialize carousels & load activities on page load
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.carousel-container').forEach(initCarousel);

  // If on activity.html standalone detail page
  const detailContainer = document.querySelector('[data-activity-detail-page]');
  if (detailContainer) {
    const contentEl = detailContainer.querySelector('#activity-detail-content');
    const notFoundEl = detailContainer.querySelector('#activity-detail-not-found');
    const params = new URLSearchParams(window.location.search);
    const requestedSlug = params.get('slug');

    (async () => {
      let activity = (requestedSlug && ACTIVITIES_REGISTRY[requestedSlug]) ? ACTIVITIES_REGISTRY[requestedSlug] : null;
      if (!activity && requestedSlug) {
        activity = await fetchActivityDetailFromAPI(requestedSlug);
      }

      if (!activity) {
        if (contentEl) contentEl.style.display = 'none';
        if (notFoundEl) notFoundEl.style.display = 'block';
        return;
      }

      if (contentEl) contentEl.style.display = 'block';
      if (notFoundEl) notFoundEl.style.display = 'none';

      document.title = 'ADMIT UNIT · The Standard Implementer';

      const titleEl = detailContainer.querySelector('[data-field="title"]');
      if (titleEl) titleEl.textContent = activity.title;

      const slugEl = detailContainer.querySelector('[data-field="slug"]');
      if (slugEl) slugEl.textContent = `/activities/${activity.slug}`;

      const partnerLogo = detailContainer.querySelector('[data-field="partnerLogo"]');
      if (partnerLogo) {
        partnerLogo.src = activity.partnerLogo || 'assets/admit-unit-logo.png';
        partnerLogo.alt = activity.partner || 'Partner';
      }

      const partnerName = detailContainer.querySelector('[data-field="partner"]');
      if (partnerName) partnerName.textContent = activity.partner || '';

      const focusEl = detailContainer.querySelector('[data-field="focus"]');
      if (focusEl) focusEl.textContent = activity.focus || '';

      const dateRangeEl = detailContainer.querySelector('[data-field="dateRange"]');
      if (dateRangeEl) {
        const dates = [activity.startDate, activity.endDate].filter(Boolean).join(' – ');
        dateRangeEl.textContent = dates || 'Ongoing';
      }

      const descEl = detailContainer.querySelector('[data-field="description"]');
      if (descEl) descEl.textContent = activity.description || '';

      const heroContainer = detailContainer.querySelector('.carousel-container');
      const heroTrack = heroContainer ? heroContainer.querySelector('.carousel-track') : null;
      const heroDots = heroContainer ? heroContainer.querySelector('.carousel-dots') : null;

      if (heroContainer && heroTrack) {
        const imgs = activity.images || [];
        const multi = imgs.length > 1;
        const trackImgs = multi ? [...imgs, imgs[0]] : imgs;

        heroTrack.innerHTML = trackImgs.map((img, i) => renderSlideItemHTML(img, activity, i % imgs.length, imgs.length)).join('');
        heroContainer.dataset.slideCount = imgs.length;

        if (heroDots) {
          heroDots.innerHTML = imgs.map((_, i) => `<button class="carousel-dot ${i === 0 ? 'active' : ''}" aria-label="Go to slide ${i + 1}"></button>`).join('');
        }

        const arrows = heroContainer.querySelectorAll('.carousel-arrow');
        arrows.forEach(arr => { arr.style.display = multi ? 'flex' : 'none'; });

        initCarousel(heroContainer);
      }

      currentShareSlug = activity.slug;
      updateMetaTags({
        title: activity.title,
        description: activity.description,
        image: (activity.images && activity.images[0] && typeof activity.images[0] === 'string') 
                 ? activity.images[0] 
                 : (activity.partnerLogo || 'https://admitunit.asia/assets/admit-unit-light.png'),
        url: getActivityShareUrl(activity.slug)
      });
    })();
  }

  const shareInput = document.querySelector('#share-modal-url');
  if (shareInput && currentShareSlug) {
    shareInput.value = getActivityShareUrl(currentShareSlug);
    shareInput.title = shareInput.value;
  }

  // Load dynamic activities from API in background
  loadActivitiesFromAPI();
});



/* ==========================================================================
   Single-File Bundle Router Engine (admit-unit SPA Hash Router)
   ========================================================================== */

(function initBundleRouter() {
  const pageViews = Array.from(document.querySelectorAll('.page-view'));
  const navLinks = Array.from(document.querySelectorAll('header nav a'));

  const PAGE_MAP = {
    '': 'view-home',
    '/': 'view-home',
    'home': 'view-home',
    '#home': 'view-home',
    'index.html': 'view-home',
    'admit-unit': 'view-home',
    'services': 'view-services',
    '#services': 'view-services',
    'services.html': 'view-services',
    'export': 'view-export',
    '#export': 'view-export',
    'export.html': 'view-export',
    'export-labeling': 'view-export-labeling',
    '#export-labeling': 'view-export-labeling',
    'export-labeling.html': 'view-export-labeling',
    'programmes': 'view-programmes',
    '#programmes': 'view-programmes',
    'programmes.html': 'view-programmes',
    'about': 'view-about',
    '#about': 'view-about',
    'about.html': 'view-about',
    'activities': 'view-activities',
    '#activities': 'view-activities',
    'activities.html': 'view-activities',
    'contact': 'view-contact',
    '#contact': 'view-contact',
    'contact.html': 'view-contact',
    'activity': 'view-activity',
    '#activity': 'view-activity',
    'activity.html': 'view-activity',
    'terms': 'view-terms',
    '#terms': 'view-terms',
    'terms.html': 'view-terms'
  };

  const NAV_PAGE_MAP = {
    'view-home': '#home',
    'view-services': '#services',
    'view-export': '#export',
    'view-export-labeling': '#export-labeling',
    'view-programmes': '#programmes',
    'view-about': '#about',
    'view-activities': '#activities',
    'view-contact': '#contact',
    'view-activity': '#activities',
    'view-terms': '#terms'
  };

  const VIEW_TITLES = {
    'view-home': 'ADMIT UNIT · The Standard Implementer',
    'view-services': 'ADMIT UNIT · Business Implementation',
    'view-export': 'ADMIT UNIT · Export Market Development',
    'view-export-labeling': 'ADMIT UNIT · Export Labeling & Packaging',
    'view-programmes': 'ADMIT UNIT · Institutional Programmes',
    'view-about': 'ADMIT UNIT · Our Role & Ecosystem',
    'view-activities': 'ADMIT UNIT · Activities & Updates',
    'view-contact': 'ADMIT UNIT · Contact & Brief Builder',
    'view-terms': 'ADMIT UNIT · Service Terms & Privacy'
  };

  function getCleanUrlForView(viewId, slug = '', hash = '', route = '', packageKey = '') {
    if (viewId === 'view-activity') {
      const targetSlug = slug || currentShareSlug;
      return targetSlug ? `#activity?slug=${encodeURIComponent(targetSlug)}` : '#activities';
    }

    const shortId = viewId.replace('view-', '');
    let queryParts = [];
    if (viewId === 'view-contact') {
      if (route) queryParts.push(`route=${encodeURIComponent(route)}`);
      if (packageKey) queryParts.push(`package=${encodeURIComponent(packageKey)}`);
    }
    const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';
    const hashString = hash ? (queryString ? `&scroll=${hash}` : `#${hash}`) : '';

    if (shortId === 'home' && !queryString && !hashString) {
      return '#home';
    }
    return `#${shortId}${queryString}${hashString}`;
  }

  window.loadActivityInBundle = async function(slug) {
    const detailContainer = document.querySelector('#view-activity [data-activity-detail-page]');
    if (!detailContainer) return;

    const contentEl = detailContainer.querySelector('#activity-detail-content');
    const notFoundEl = detailContainer.querySelector('#activity-detail-not-found');

    let activity = (slug && ACTIVITIES_REGISTRY[slug]) ? ACTIVITIES_REGISTRY[slug] : null;
    if (!activity && slug && typeof fetchActivityDetailFromAPI === 'function') {
      activity = await fetchActivityDetailFromAPI(slug);
    }

    if (!activity) {
      if (contentEl) contentEl.style.display = 'none';
      if (notFoundEl) notFoundEl.style.display = 'block';
      currentShareSlug = '';
      return;
    }

    if (contentEl) contentEl.style.display = 'block';
    if (notFoundEl) notFoundEl.style.display = 'none';

    const titleEl = detailContainer.querySelector('[data-field="title"]');
    if (titleEl) titleEl.textContent = activity.title;

    const slugEl = detailContainer.querySelector('[data-field="slug"]');
    if (slugEl) slugEl.textContent = `/activities/${activity.slug}`;

    const partnerLogo = detailContainer.querySelector('[data-field="partnerLogo"]');
    if (partnerLogo) {
      partnerLogo.src = activity.partnerLogo || 'assets/admit-unit-logo.png';
      partnerLogo.alt = activity.partner || 'Partner';
    }

    const partnerName = detailContainer.querySelector('[data-field="partner"]');
    if (partnerName) partnerName.textContent = activity.partner || '';

    const focusEl = detailContainer.querySelector('[data-field="focus"]');
    if (focusEl) focusEl.textContent = activity.focus || '';

    const dateRangeEl = detailContainer.querySelector('[data-field="dateRange"]');
    if (dateRangeEl) {
      const dates = [activity.startDate, activity.endDate].filter(Boolean).join(' – ');
      dateRangeEl.textContent = dates || 'Ongoing';
    }

    const descEl = detailContainer.querySelector('[data-field="description"]');
    if (descEl) descEl.textContent = activity.description || '';

    const heroContainer = detailContainer.querySelector('.carousel-container');
    const heroTrack = heroContainer ? heroContainer.querySelector('.carousel-track') : null;
    const heroDots = heroContainer ? heroContainer.querySelector('.carousel-dots') : null;

    if (heroContainer && heroTrack) {
      const imgs = (activity.images && activity.images.length > 0) ? activity.images : [
        { title: activity.title, subtitle: activity.partner, color: '#087ba7' }
      ];
      const multi = imgs.length > 1;
      const trackImgs = multi ? [...imgs, imgs[0]] : imgs;

      heroTrack.innerHTML = trackImgs.map((img, i) => renderSlideItemHTML(img, activity, i % imgs.length, imgs.length)).join('');
      heroContainer.dataset.slideCount = imgs.length;

      if (heroDots) {
        heroDots.innerHTML = multi ? imgs.map((_, i) => `<button class="carousel-dot ${i === 0 ? 'active' : ''}" aria-label="Go to slide ${i + 1}"></button>`).join('') : '';
      }

      const arrows = heroContainer.querySelectorAll('.carousel-arrow');
      arrows.forEach(arr => { arr.style.display = multi ? 'flex' : 'none'; });

      initCarousel(heroContainer);
    }

    currentShareSlug = activity.slug;
    const shareInput = document.querySelector('#share-modal-url');
    if (shareInput && typeof getActivityShareUrl === 'function') {
      shareInput.value = getActivityShareUrl(currentShareSlug);
      shareInput.title = shareInput.value;
    }

    if (typeof updateMetaTags === 'function') {
      updateMetaTags({
        title: activity.title,
        description: activity.description,
        image: (activity.images && activity.images[0] && typeof activity.images[0] === 'string') 
                 ? activity.images[0] 
                 : (activity.partnerLogo || 'https://admitunit.asia/assets/admit-unit-light.png'),
        url: getActivityShareUrl(activity.slug)
      });
    }
  };

  window.switchPageView = function(target, options = {}) {
    const { scrollToTop = true, hash = '', route = '', packageKey = '', slug = '', updateUrl = true } = options;
    
    let cleanTarget = (target || '').split('?')[0].split('#')[0];
    cleanTarget = cleanTarget.replace(/^\.\//, '').replace(/^\/+/, '').replace(/\.html$/, '');
    
    let viewId = PAGE_MAP[cleanTarget] || PAGE_MAP[target] || PAGE_MAP['#' + cleanTarget] || 'view-home';
    let activitySlug = slug;

    if (cleanTarget === 'khmer-enterprise-2025') {
      viewId = 'view-activity';
      activitySlug = 'export-market-development-program-2025';
    } else if (cleanTarget === 'usaid-2024-2025') {
      viewId = 'view-activity';
      activitySlug = 'usaid-export-market-development-2024-2025';
    } else if (cleanTarget === 'giz-export-packaging') {
      viewId = 'view-activity';
      activitySlug = 'export-labeling-and-packaging-for-market-entry';
    } else if (cleanTarget.startsWith('activities/')) {
      viewId = 'view-activity';
      activitySlug = cleanTarget.replace(/^activities\//, '').replace(/\/$/, '');
    }

    if (viewId === 'view-activity') {
      const finalSlug = activitySlug || currentShareSlug || '';
      loadActivityInBundle(finalSlug);
    } else {
      if (typeof updateMetaTags === 'function') {
        updateMetaTags({
          title: VIEW_TITLES[viewId] || 'ADMIT UNIT',
          url: getActivityShareUrl ? getActivityShareUrl('') : 'https://admitunit.asia/'
        });
      }
    }

    // Activate target view in DOM
    pageViews.forEach(v => {
      if (v.id === viewId) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    // Update Header Navigation Indicator & aria-current
    const activeHash = NAV_PAGE_MAP[viewId] || '';
    navLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').split('?')[0];
      if (activeHash && href === activeHash) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('nav-active');
        if (typeof window.__setGlobalActiveNav === 'function') {
          window.__setGlobalActiveNav(link);
        } else if (typeof window.__moveHeaderIndicator === 'function') {
          window.__moveHeaderIndicator(link);
        }
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('nav-active');
      }
    });

    // Hash & History Synchronization
    if (updateUrl) {
      const cleanUrl = getCleanUrlForView(viewId, activitySlug, hash, route, packageKey);
      if (window.location.hash !== cleanUrl) {
        if (window.history && window.history.pushState) {
          window.history.pushState({ viewId, slug: activitySlug, hash, route, packageKey }, '', cleanUrl);
        } else {
          window.location.hash = cleanUrl;
        }
      }
    }

    // Handle Contact Route preselection if provided
    if (viewId === 'view-contact' && route) {
      const routeSelect = document.querySelector('#route');
      if (routeSelect) {
        routeSelect.value = route;
        routeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Close mobile menu if open
    const menuButton = document.querySelector('.menu');
    const navElement = document.querySelector('nav');
    if (menuButton && navElement && navElement.classList.contains('open')) {
      menuButton.setAttribute('aria-expanded', 'false');
      navElement.classList.remove('open');
      const txt = menuButton.querySelector('.menu-text');
      if (txt) txt.textContent = 'Menu';
    }

    // Scroll handling
    if (hash) {
      setTimeout(() => {
        const hashEl = document.querySelector('#' + hash);
        if (hashEl) {
          hashEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (scrollToTop) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 60);
    } else if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Listen to browser Back / Forward buttons & Hash changes
  window.addEventListener('popstate', () => parseRouteFromLocation(false));
  window.addEventListener('hashchange', () => parseRouteFromLocation(false));

  function parseRouteFromLocation(updateUrl = false) {
    const loc = window.location;
    let rawHash = (loc.hash || '').replace(/^#/, '');

    let hashRoute = rawHash;
    let hashQuery = '';
    if (hashRoute.includes('?')) {
      const parts = hashRoute.split('?');
      hashRoute = parts[0];
      hashQuery = parts[1] || '';
    }

    const hashParams = new URLSearchParams(hashQuery);
    const searchParams = new URLSearchParams(loc.search);
    const getParam = (k) => hashParams.get(k) || searchParams.get(k) || '';

    // 1. Direct path or hash for activity
    if (hashRoute.startsWith('activity-')) {
      const slug = hashRoute.replace(/^activity-/, '');
      window.switchPageView('activity', { slug, updateUrl });
      return;
    }
    if (hashRoute === 'activity' || hashRoute === 'activity.html') {
      const slug = getParam('slug');
      window.switchPageView('activity', { slug, updateUrl });
      return;
    }

    // 2. Query string ?slug=<slug>
    if (getParam('slug')) {
      window.switchPageView('activity', { slug: getParam('slug'), updateUrl });
      return;
    }

    // 3. Hash route (e.g. contact, services, export, export-labeling, programmes, about, activities, terms, home)
    const cleanKey = hashRoute.replace(/^\/+/, '').replace(/\/+$/, '');
    if (cleanKey && (PAGE_MAP[cleanKey] || PAGE_MAP['#' + cleanKey] || PAGE_MAP[cleanKey + '.html'])) {
      window.switchPageView(cleanKey, {
        route: getParam('route'),
        packageKey: getParam('package'),
        hash: getParam('scroll'),
        updateUrl
      });
      return;
    }

    // 4. In-page anchor on current or child page (e.g. #costing, #routes, #follow-up)
    if (cleanKey) {
      const el = document.querySelector('#' + cleanKey);
      if (el) {
        const parentView = el.closest('.page-view');
        if (parentView) {
          const vKey = parentView.id.replace('view-', '');
          window.switchPageView(vKey, { hash: cleanKey, updateUrl });
          return;
        }
      }
    }

    // Default to home
    window.switchPageView('home', { updateUrl });
  }

  // Intercept all link clicks across the entire document
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Allow browser default for mailto, tel, downloads
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
    if (link.hasAttribute('download') || href.includes('.pdf')) return;

    // External URLs (except admitunit.asia internal links)
    if (href.startsWith('http://') || href.startsWith('https://')) {
      if (!href.includes('admitunit.asia') && (typeof window === 'undefined' || !href.includes(window.location.host))) {
        return;
      }
    }

    // Activity hash or path links
    if (href.startsWith('#activity-') || href.startsWith('activities/') || href.startsWith('/activities/')) {
      const actSlug = href.replace(/^#activity-/, '').replace(/^\/?activities\//, '').replace(/\/$/, '').split('?')[0].split('#')[0];
      e.preventDefault();
      window.switchPageView('activity', { slug: actSlug });
      return;
    }

    // In-page hash or hash route (e.g. #contact, #services, #home, #costing)
    if (href.startsWith('#')) {
      const raw = href.replace(/^#/, '');
      if (raw === 'home' || raw === 'main' || raw === '') {
        e.preventDefault();
        window.switchPageView('home');
        return;
      }

      // Check if it has query params like #contact?route=BUSINESS
      let targetName = raw;
      let targetQuery = '';
      if (raw.includes('?')) {
        const parts = raw.split('?');
        targetName = parts[0];
        targetQuery = parts[1] || '';
      }
      const qParams = new URLSearchParams(targetQuery);

      if (PAGE_MAP[targetName] || PAGE_MAP['#' + targetName]) {
        e.preventDefault();
        window.switchPageView(targetName, {
          route: qParams.get('route') || '',
          packageKey: qParams.get('package') || '',
          hash: qParams.get('scroll') || ''
        });
        return;
      }

      // Check if it's an in-page section ID like #costing
      const el = document.querySelector('#' + targetName);
      if (el) {
        const parentView = el.closest('.page-view');
        if (parentView && !parentView.classList.contains('active')) {
          e.preventDefault();
          const vKey = parentView.id.replace('view-', '');
          window.switchPageView(vKey, { hash: targetName });
          return;
        }
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    // Relative links fallback (e.g. contact.html?route=BUSINESS, services.html#costing, etc.)
    e.preventDefault();
    const [pathPart, queryHash] = href.split('?');
    let query = '';
    let hash = '';
    if (queryHash) {
      const parts = queryHash.split('#');
      query = parts[0] || '';
      hash = parts[1] || '';
    } else if (pathPart.includes('#')) {
      const parts = pathPart.split('#');
      hash = parts[1] || '';
    }

    const cleanPath = pathPart.split('#')[0].replace(/^\.\//, '').replace(/\.html$/, '');
    const params = new URLSearchParams(query);
    window.switchPageView(cleanPath || 'home', {
      route: params.get('route') || '',
      packageKey: params.get('package') || '',
      slug: params.get('slug') || '',
      hash: hash
    });
  });

  // Initial page load routing
  setTimeout(() => {
    parseRouteFromLocation(false);
  }, 30);
})();
