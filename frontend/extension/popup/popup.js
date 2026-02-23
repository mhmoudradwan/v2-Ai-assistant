// Baseera Security Scanner - Popup Script
// Configuration - update these URLs for your deployment environment
const API_BASE_URL = 'http://localhost:5000/api';
const APP_BASE_URL = 'http://localhost:5173';

let scanResults = null;
let currentURL = '';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await initPopup();
});

async function initPopup() {
  // Get current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentURL = tab?.url || '';
  document.getElementById('current-url').textContent = currentURL || 'Unknown';

  // Check auth status
  await checkAuthStatus();

  // Bind scan button
  document.getElementById('scan-btn').addEventListener('click', runScan);

  // Bind submit button
  document.getElementById('submit-btn').addEventListener('click', submitToBackend);

  // Bind open app link
  document.getElementById('open-app-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: APP_BASE_URL });
  });

  // Bind login link
  document.getElementById('login-link').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: `${APP_BASE_URL}/login` });
  });
}

async function checkAuthStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken', 'userName'], (result) => {
      const badge = document.getElementById('auth-status');
      if (result.authToken) {
        badge.textContent = result.userName ? `Hi, ${result.userName}` : 'Logged in';
        badge.className = 'auth-badge auth-badge--logged-in';
      } else {
        badge.textContent = 'Not logged in';
        badge.className = 'auth-badge auth-badge--guest';
      }
      resolve(result.authToken);
    });
  });
}

async function runScan() {
  const scanBtn = document.getElementById('scan-btn');
  const scanSection = document.getElementById('scanning-section');
  const riskSection = document.getElementById('risk-section');
  const resultsSection = document.getElementById('results-section');
  const noIssues = document.getElementById('no-issues');
  const submitSection = document.getElementById('submit-section');

  // Reset UI
  scanBtn.disabled = true;
  scanSection.style.display = 'flex';
  riskSection.style.display = 'none';
  resultsSection.style.display = 'none';
  noIssues.style.display = 'none';
  submitSection.style.display = 'none';

  try {
    // Execute scanner in page context
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: runPageScanners,
      args: [currentURL]
    });

    scanResults = results[0]?.result || { vulnerabilities: [], riskScore: 0 };
  } catch (err) {
    console.error('Scan error:', err);
    scanResults = { vulnerabilities: [], riskScore: 0, error: err.message };
  }

  scanSection.style.display = 'none';
  scanBtn.disabled = false;

  displayResults(scanResults);
}

function displayResults(results) {
  const riskSection = document.getElementById('risk-section');
  const resultsSection = document.getElementById('results-section');
  const noIssues = document.getElementById('no-issues');
  const submitSection = document.getElementById('submit-section');

  const vulns = results.vulnerabilities || [];
  const riskScore = results.riskScore || 0;

  // Update risk score
  document.getElementById('risk-score').textContent = riskScore;
  document.getElementById('risk-bar-fill').style.width = `${riskScore}%`;

  const level = riskScore >= 70 ? 'High Risk' : riskScore >= 40 ? 'Medium Risk' : riskScore >= 10 ? 'Low Risk' : 'Safe';
  document.getElementById('risk-level').textContent = level;

  // Update counts
  const critical = vulns.filter(v => v.severity === 'Critical').length;
  const high = vulns.filter(v => v.severity === 'High').length;
  const medium = vulns.filter(v => v.severity === 'Medium').length;
  const low = vulns.filter(v => v.severity === 'Low').length;

  document.getElementById('count-critical').textContent = critical;
  document.getElementById('count-high').textContent = high;
  document.getElementById('count-medium').textContent = medium;
  document.getElementById('count-low').textContent = low;

  riskSection.style.display = 'block';

  if (vulns.length === 0) {
    noIssues.style.display = 'block';
    resultsSection.style.display = 'none';
  } else {
    noIssues.style.display = 'none';
    resultsSection.style.display = 'block';
    document.getElementById('total-count').textContent = vulns.length;
    renderResults(vulns);
    submitSection.style.display = 'block';
  }
}

function renderResults(vulns) {
  const list = document.getElementById('results-list');
  list.innerHTML = '';

  // Sort by severity
  const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  vulns.sort((a, b) => (order[a.severity] || 99) - (order[b.severity] || 99));

  vulns.forEach(v => {
    const item = document.createElement('div');
    item.className = `result-item ${v.severity.toLowerCase()}`;
    item.innerHTML = `
      <span class="severity-badge ${v.severity.toLowerCase()}">${v.severity}</span>
      <div class="result-info">
        <div class="result-type">${escapeHtml(v.type)}</div>
        <div class="result-desc">${escapeHtml(v.description)}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

async function submitToBackend() {
  const submitBtn = document.getElementById('submit-btn');
  const submitStatus = document.getElementById('submit-status');

  const token = await new Promise(resolve => {
    chrome.storage.local.get(['authToken'], r => resolve(r.authToken));
  });

  if (!token) {
    submitStatus.textContent = 'Please login first to save results.';
    submitStatus.className = 'submit-status error';
    return;
  }

  if (!scanResults) return;

  submitBtn.disabled = true;
  submitStatus.textContent = 'Saving...';
  submitStatus.className = 'submit-status';

  try {
    const response = await fetch(`${API_BASE_URL}/scans/extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        targetURL: currentURL,
        riskScore: scanResults.riskScore || 0,
        vulnerabilities: (scanResults.vulnerabilities || []).map(v => ({
          type: v.type,
          severity: v.severity,
          description: v.description,
          location: v.location || currentURL,
          recommendation: v.recommendation || null
        }))
      })
    });

    const data = await response.json();
    if (data.success) {
      submitStatus.textContent = '✓ Results saved to your account!';
      submitStatus.className = 'submit-status success';
      submitBtn.disabled = true;
    } else {
      submitStatus.textContent = data.message || 'Failed to save results.';
      submitStatus.className = 'submit-status error';
      submitBtn.disabled = false;
    }
  } catch (err) {
    submitStatus.textContent = 'Error connecting to Baseera API.';
    submitStatus.className = 'submit-status error';
    submitBtn.disabled = false;
  }
}

// This function runs in the page context
function runPageScanners(pageUrl) {
  const vulnerabilities = [];

  function addVuln(type, severity, description, location, recommendation) {
    vulnerabilities.push({ type, severity, description, location: location || pageUrl, recommendation });
  }

  // 1. XSS - Check for inline scripts, eval(), innerHTML usage
  try {
    const scripts = document.querySelectorAll('script:not([src])');
    const dangerousPatterns = /eval\s*\(|innerHTML\s*=|document\.write\s*\(|javascript:/i;
    scripts.forEach(s => {
      if (dangerousPatterns.test(s.textContent)) {
        addVuln('XSS', 'Critical', 'Potentially unsafe inline JavaScript detected (eval/innerHTML/document.write).', pageUrl, 'Avoid eval(), use textContent instead of innerHTML, and remove document.write().');
      }
    });
    const allElements = document.querySelectorAll('[onclick],[onmouseover],[onerror],[onload]');
    if (allElements.length > 0) {
      addVuln('XSS', 'High', `Found ${allElements.length} element(s) with inline event handlers.`, pageUrl, 'Use addEventListener instead of inline event handlers.');
    }
    const links = document.querySelectorAll('a[href^="javascript:"]');
    if (links.length > 0) {
      addVuln('XSS', 'Critical', `Found ${links.length} link(s) using javascript: URLs.`, pageUrl, 'Avoid javascript: URLs in href attributes.');
    }
  } catch (e) {}

  // 2. SQL Injection - Check for SQL error messages
  try {
    const body = document.body?.textContent || '';
    const sqlErrors = /SQL syntax|mysql_fetch|ORA-\d+|syntax error.*SQL|ODBC.*Error|Warning.*mysql|Microsoft.*ODBC/i;
    if (sqlErrors.test(body)) {
      addVuln('SQL Injection', 'Critical', 'SQL error messages found in page response.', pageUrl, 'Hide database errors from end users and use parameterized queries.');
    }
  } catch (e) {}

  // 3. Command Injection - Check for system error patterns
  try {
    const body = document.body?.textContent || '';
    const cmdErrors = /sh:\s+\d+:|permission denied|command not found|bash:/i;
    if (cmdErrors.test(body)) {
      addVuln('Command Injection', 'Critical', 'System command error output detected in page.', pageUrl, 'Never expose command output to users. Sanitize inputs thoroughly.');
    }
  } catch (e) {}

  // 4. API Keys Exposure
  try {
    const html = document.documentElement.innerHTML;
    const patterns = [
      { regex: /AIza[0-9A-Za-z-_]{35}/g, name: 'Google API Key' },
      { regex: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key' },
      { regex: /sk-[a-zA-Z0-9]{32,}/g, name: 'OpenAI/Stripe Secret Key' },
      { regex: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Personal Access Token' },
      { regex: /firebase.*apiKey.*['"]\w{20,}/i, name: 'Firebase API Key' }
    ];
    patterns.forEach(p => {
      if (p.regex.test(html)) {
        addVuln('API Keys Exposure', 'Critical', `Exposed ${p.name} detected in page source.`, pageUrl, 'Move API keys to server-side environment variables.');
      }
    });
  } catch (e) {}

  // 5. Insecure Forms
  try {
    if (pageUrl.startsWith('http://')) {
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      if (passwordInputs.length > 0) {
        addVuln('Insecure Forms', 'Critical', 'Password input found on HTTP (non-HTTPS) page.', pageUrl, 'Always serve forms with password fields over HTTPS.');
      }
    }
  } catch (e) {}

  // 6. Missing CSP
  try {
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!metaCSP) {
      addVuln('Missing CSP', 'High', 'No Content-Security-Policy meta tag found.', pageUrl, 'Add a Content-Security-Policy header or meta tag to prevent XSS attacks.');
    }
  } catch (e) {}

  // 7. Mixed Content
  try {
    if (pageUrl.startsWith('https://')) {
      const httpImages = document.querySelectorAll('img[src^="http://"]');
      const httpScripts = document.querySelectorAll('script[src^="http://"]');
      const httpLinks = document.querySelectorAll('link[href^="http://"]');
      const total = httpImages.length + httpScripts.length + httpLinks.length;
      if (total > 0) {
        addVuln('Mixed Content', 'Medium', `${total} resource(s) loaded over HTTP on an HTTPS page.`, pageUrl, 'Ensure all resources are loaded over HTTPS.');
      }
    }
  } catch (e) {}

  // 8. Clickjacking
  try {
    const metaFrame = document.querySelector('meta[http-equiv="X-Frame-Options"]');
    if (!metaFrame) {
      addVuln('Clickjacking', 'Medium', 'No X-Frame-Options meta tag found.', pageUrl, 'Add X-Frame-Options: DENY or SAMEORIGIN header to prevent clickjacking.');
    }
  } catch (e) {}

  // 9. Insecure Cookies (detected via JS-accessible cookies)
  try {
    if (document.cookie) {
      const cookies = document.cookie.split(';');
      if (cookies.length > 0) {
        addVuln('Insecure Cookies', 'Medium', `${cookies.length} cookie(s) accessible via JavaScript (missing HttpOnly flag).`, pageUrl, 'Set the HttpOnly flag on sensitive cookies to prevent JavaScript access.');
      }
    }
  } catch (e) {}

  // 10. Missing SRI
  try {
    const externalScripts = document.querySelectorAll('script[src]:not([integrity])');
    let externalCount = 0;
    externalScripts.forEach(s => {
      const src = s.getAttribute('src') || '';
      if (src.startsWith('http') && !src.includes(window.location.hostname)) externalCount++;
    });
    if (externalCount > 0) {
      addVuln('Missing SRI', 'Medium', `${externalCount} external script(s) loaded without Subresource Integrity (SRI).`, pageUrl, 'Add integrity and crossorigin attributes to external scripts.');
    }
  } catch (e) {}

  // 11. Deprecated HTML
  try {
    const deprecated = ['font', 'center', 'marquee', 'blink', 'strike', 'big', 'tt'];
    let found = [];
    deprecated.forEach(tag => {
      if (document.querySelector(tag)) found.push(`<${tag}>`);
    });
    if (found.length > 0) {
      addVuln('Deprecated HTML', 'Low', `Deprecated HTML tags found: ${found.join(', ')}.`, pageUrl, 'Replace deprecated HTML tags with modern CSS equivalents.');
    }
  } catch (e) {}

  // 12. Open Redirect
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParams = ['redirect', 'url', 'next', 'return', 'returnUrl', 'goto', 'destination'];
    redirectParams.forEach(param => {
      const val = urlParams.get(param);
      if (val && (val.startsWith('http') || val.startsWith('//'))) {
        addVuln('Open Redirect', 'Medium', `URL parameter "${param}" may allow open redirect: ${val}`, pageUrl, 'Validate and whitelist redirect URLs on the server side.');
      }
    });
  } catch (e) {}

  // 13. CSRF - Forms without tokens
  try {
    const forms = document.querySelectorAll('form[method="post"], form[method="POST"]');
    let unsafeForms = 0;
    forms.forEach(form => {
      const hasToken = form.querySelector('input[name*="csrf"], input[name*="token"], input[name*="_token"]');
      if (!hasToken) unsafeForms++;
    });
    if (unsafeForms > 0) {
      addVuln('CSRF', 'Medium', `${unsafeForms} POST form(s) found without visible CSRF tokens.`, pageUrl, 'Include CSRF tokens in all state-changing forms.');
    }
  } catch (e) {}

  // 14. Sensitive File Paths (admin, .git, .env in links)
  try {
    const allLinks = Array.from(document.querySelectorAll('a[href]')).map(a => a.href);
    const sensitivePatterns = /\/(\.git|\.env|\.htaccess|wp-admin|phpmyadmin|admin|backup|config)/i;
    const sensitiveLinks = allLinks.filter(href => sensitivePatterns.test(href));
    if (sensitiveLinks.length > 0) {
      addVuln('Sensitive Files', 'High', `Found ${sensitiveLinks.length} link(s) to potentially sensitive paths.`, sensitiveLinks[0], 'Restrict access to sensitive directories and files.');
    }
  } catch (e) {}

  // 15. Excessive Trackers
  try {
    const trackerDomains = ['google-analytics.com', 'googletagmanager.com', 'facebook.net', 'hotjar.com', 'mixpanel.com', 'segment.com'];
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    const foundTrackers = trackerDomains.filter(t => scripts.some(s => s.includes(t)));
    if (foundTrackers.length >= 3) {
      addVuln('Excessive Trackers', 'Low', `${foundTrackers.length} analytics/tracking scripts detected: ${foundTrackers.join(', ')}.`, pageUrl, 'Review third-party tracking scripts for privacy compliance (GDPR/CCPA).');
    }
  } catch (e) {}

  // 16. Debug Pages
  try {
    const urlLower = pageUrl.toLowerCase();
    const debugPaths = ['/debug', '/test', '/trace', '/phpinfo', '/server-info', '/_debug'];
    const isDebugPage = debugPaths.some(p => urlLower.includes(p));
    if (isDebugPage) {
      addVuln('Debug Pages', 'Medium', 'Current page may be a debug/test endpoint exposed to the public.', pageUrl, 'Disable and restrict access to debug endpoints in production.');
    }
  } catch (e) {}

  // 17. CORS Issues
  try {
    const metaTags = document.querySelectorAll('meta[name]');
    // Check for wildcard CORS hints in meta (limited passive check)
    const html = document.documentElement.outerHTML;
    if (html.includes('Access-Control-Allow-Origin: *') || html.includes("'Access-Control-Allow-Origin', '*'")) {
      addVuln('CORS Issues', 'Medium', 'Wildcard CORS policy detected in page source.', pageUrl, 'Restrict CORS to specific trusted origins instead of using wildcards.');
    }
  } catch (e) {}

  // 18. Missing HSTS (passive check via meta)
  try {
    if (pageUrl.startsWith('https://')) {
      const metaHSTS = document.querySelector('meta[http-equiv="Strict-Transport-Security"]');
      if (!metaHSTS) {
        addVuln('Missing HSTS', 'Medium', 'No Strict-Transport-Security meta tag found.', pageUrl, 'Enable HSTS to prevent protocol downgrade attacks.');
      }
    }
  } catch (e) {}

  // 19. Insecure localStorage usage (sensitive data)
  try {
    const lsKeys = Object.keys(localStorage);
    const sensitiveKeys = lsKeys.filter(k => /password|secret|token|api_key|credit|ssn/i.test(k));
    if (sensitiveKeys.length > 0) {
      addVuln('Insecure Storage', 'High', `Potentially sensitive data stored in localStorage: ${sensitiveKeys.join(', ')}.`, pageUrl, 'Avoid storing sensitive data in localStorage. Use secure server-side sessions instead.');
    }
  } catch (e) {}

  // 20. Weak CSP (unsafe-inline, unsafe-eval)
  try {
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (metaCSP) {
      const content = metaCSP.getAttribute('content') || '';
      if (content.includes("'unsafe-inline'") || content.includes("'unsafe-eval'") || content.includes('*')) {
        addVuln('Weak CSP', 'High', "Content-Security-Policy contains unsafe directives ('unsafe-inline', 'unsafe-eval', or wildcards).", pageUrl, "Remove 'unsafe-inline' and 'unsafe-eval' from CSP and use nonces or hashes instead.");
      }
    }
  } catch (e) {}

  // Calculate risk score
  const weights = { Critical: 25, High: 15, Medium: 8, Low: 3 };
  let rawScore = 0;
  vulnerabilities.forEach(v => { rawScore += weights[v.severity] || 0; });
  const riskScore = Math.min(100, rawScore);

  return { vulnerabilities, riskScore };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
