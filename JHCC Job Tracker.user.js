// ==UserScript==
// @name        JHCC Job Tracker
// @match       https://www.linkedin.com/jobs/*
// @match       https://linkedin.com/jobs/*
// @match       https://www.linkedin.com/feed/*
// @match       https://linkedin.com/feed/*
// @match       https://ph.jobstreet.com/*
// @match       https://www.jobstreet.com/*
// @match       https://www.indeed.com/*
// @match       https://ph.indeed.com/*
// @match       https://*.indeed.com/*
// @match       https://amazon.jobs/*
// @match       https://bossjob.ph/*
// @match       https://www.bossjob.ph/*
// @match       https://ph.bossjob.com/*
// @match       https://www.bossjob.com/*
// ==/UserScript==

(function () {
  if (window.self !== window.top) return;

  function q(sels) {
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el && el.innerText.trim()) return el.innerText.trim();
    }
    return '';
  }

  function extract() {
    var h = location.hostname;
    var href = location.href;
    var role = '', company = '', source = 'Other';

    if (h.includes('linkedin.com')) {
      source = 'LinkedIn';

      // Role: updated selectors for LinkedIn's 2025 DOM
      role = q([
        '[data-test-job-detail-title]',
        '.job-details-jobs-unified-top-card__job-title h1',
        '.jobs-unified-top-card__job-title h1',
        'h1.t-24',
        'h1[class*="title"]'
      ]);

      // Company: updated selectors for LinkedIn's 2025 DOM
      company = q([
        '.job-details-jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__company-name a',
        '.jobs-unified-top-card__subtitle-primary-grouping a',
        'a[href*="/company/"]'
      ]);

      // Clean URL: prefer direct job link, fall back to currentJobId
      var jl = document.querySelector('a[href*="/jobs/view/"]');
      if (jl) { if (!role) role = jl.innerText.trim(); href = jl.href.split('?')[0]; }
      if (href === location.href) {
        var m = location.search.match(/currentJobId=(\d+)/);
        if (m) href = 'https://www.linkedin.com/jobs/view/' + m[1] + '/';
      }

      // Title fallback: "Role at Company | LinkedIn" or "Role hiring at Company | LinkedIn"
      if (!role || !company) {
        var tm = document.title.match(/^(.+?)\s+(?:hiring\s+)?at\s+(.+?)\s*[|—]/);
        if (tm) { if (!role) role = tm[1].trim(); if (!company) company = tm[2].trim(); }
      }

    } else if (h.includes('jobstreet.com')) {
      source = 'JobStreet';
      role = q(['[data-automation="job-detail-title"]', 'h1']);
      company = q(['[data-automation="advertiser-name"]', '[class*="CompanyName"]']);

    } else if (h.includes('indeed.com')) {
      source = 'Indeed';
      role = q(['[data-testid="jobsearch-JobInfoHeader-title"]', '[data-testid="job-title"] span', 'h1.jobTitle', 'h2.jobTitle a span', 'h1[class*="title"]', 'h1']);
      company = q(['[data-testid="inlineHeader-companyName"] a', '[data-testid="inlineHeader-companyName"]', '[data-testid="companyName"]', '[data-company-name]', 'span.companyName', '[class*="companyName"] a', '[class*="companyName"]', '[class*="company"] a']);

    } else if (h.includes('amazon.jobs')) {
      source = 'AWS Partner Network';
      role = q(['h1.job-title', 'h1']);
      company = 'Amazon';

    } else if (h.includes('bossjob')) {
      source = 'Other';
      role = q(['h1[class*="job"]', 'h1[class*="title"]', 'h1[class*="position"]', 'h1']);
      company = q(['[class*="company-name"]', '[class*="CompanyName"]', 'a[href*="/company/"]', '[class*="employer"]']);
    }

    // Last resort: parse page title
    if (!role) {
      var pts = document.title.split(' - ');
      role = (pts[0] || document.title).trim();
      if (!company) company = (pts[1] || '').trim();
    }

    return { role: role, company: company, href: href, source: source };
  }

  function showConfirm(label) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;background:#003D5C;color:#00C8FF;border:2px solid #00C8FF;border-radius:10px;padding:10px 18px;font-size:13px;font-weight:600;font-family:-apple-system,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,0.4);pointer-events:none;transition:opacity 0.4s;';
    toast.innerText = '⚡ Tracked: ' + label;
    document.body.appendChild(toast);
    setTimeout(function () { toast.style.opacity = '0'; }, 1800);
    setTimeout(function () { toast.remove(); }, 2200);
  }

  function showPopup(d) {
    var old = document.getElementById('jhcc-popup');
    if (old) { old.remove(); return; }

    var popup = document.createElement('div');
    popup.id = 'jhcc-popup';
    popup.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:2147483647;background:#003D5C;border:2px solid #00C8FF;border-radius:12px;padding:8px;display:flex;flex-direction:column;gap:6px;box-shadow:0 8px 24px rgba(0,0,0,0.6);font-family:-apple-system,sans-serif;min-width:200px;';

    function makeBtn(label, sub) {
      var b = document.createElement('button');
      b.style.cssText = 'padding:10px 18px;border-radius:8px;border:1px solid rgba(0,200,255,0.27);background:transparent;color:#00C8FF;font-size:13px;font-weight:600;cursor:pointer;text-align:left;width:100%;';
      b.innerHTML = '<span style="display:block">' + label + '</span><span style="display:block;font-size:11px;font-weight:400;opacity:0.7;margin-top:2px">' + sub + '</span>';
      b.onmouseenter = function () { b.style.background = '#005580'; };
      b.onmouseleave = function () { b.style.background = 'transparent'; };
      return b;
    }

    var qa = makeBtn('⚡ Quick Add', 'Silently save — no tab opens');
    var ae = makeBtn('✏️ Add & Edit', 'Open JHCC to review');

    qa.onclick = function () {
      popup.remove();
      var p = new URLSearchParams({ quickAdd: '1', company: d.company, role: d.role, url: d.href, source: d.source });
      window.open(
        'http://localhost:5173/quick-add.html?' + p.toString(),
        '_blank',
        'width=1,height=1,left=0,top=0,toolbar=no,menubar=no,scrollbars=no,status=no'
      );
      showConfirm(d.role || d.company || 'Job');
    };
    ae.onclick = function () {
      popup.remove();
      var p = new URLSearchParams({ addJob: '1', company: d.company, role: d.role, url: d.href, source: d.source });
      window.open('http://localhost:5173/#' + p.toString(), '_blank');
    };

    popup.appendChild(qa);
    popup.appendChild(ae);
    document.body.appendChild(popup);

    setTimeout(function () {
      document.addEventListener('click', function handler(e) {
        if (!popup.contains(e.target) && e.target !== document.getElementById('jhcc-btn')) {
          popup.remove();
          document.removeEventListener('click', handler, true);
        }
      }, true);
    }, 0);
  }

  function addButton() {
    if (document.getElementById('jhcc-btn')) return;
    var btn = document.createElement('button');
    btn.id = 'jhcc-btn';
    btn.innerText = 'Track This Job';
    btn.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;padding:10px 18px;background:#003D5C;color:#00C8FF;border:2px solid #00C8FF;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,0.4);';
    btn.onmouseenter = function () { btn.style.background = '#005580'; };
    btn.onmouseleave = function () { btn.style.background = '#003D5C'; };
    btn.onclick = function (e) {
      e.stopPropagation();
      showPopup(extract());
    };
    document.body.appendChild(btn);
  }

  setTimeout(addButton, 1500);

  var last = location.href;
  setInterval(function () {
    if (location.href !== last) {
      last = location.href;
      var old = document.getElementById('jhcc-popup');
      if (old) old.remove();
      setTimeout(addButton, 1500);
    }
  }, 1000);
})();
