import { t, type Locale } from "./i18n.ts";

const ICONS = {
  link: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  sun: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  globe: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  externalLink: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  trash: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  arrowLeft: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  copy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
};

const CSS = `
@import url("https://fontsapi.zeoseven.com/69/main/result.css");

:root {
  --bg: #f5f7fa;
  --surface: #ffffff;
  --surface-hover: #f8f9fb;
  --text: #111827;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --primary: #6366f1;
  --primary-hover: #4f46e5;
  --primary-light: #eef2ff;
  --danger: #ef4444;
  --danger-hover: #dc2626;
  --danger-light: #fef2f2;
  --success: #10b981;
  --success-light: #ecfdf5;
  --warning: #f59e0b;
  --warning-light: #fffbeb;
  --border: #e5e7eb;
  --border-light: #f3f4f6;
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
  --font: 'Noto Sans CJK', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
  --transition: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dark {
  --bg: #0f172a;
  --surface: #1e293b;
  --surface-hover: #334155;
  --text: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --border: #334155;
  --border-light: #1e293b;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.3);
}

@media (prefers-color-scheme: dark) {
  html:not(.light) {
    --bg: #0f172a;
    --surface: #1e293b;
    --surface-hover: #334155;
    --text: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-tertiary: #64748b;
    --border: #334155;
    --border-light: #1e293b;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
    --shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.3);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font);
  font-weight: normal;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a { color: var(--primary); text-decoration: none; transition: color var(--transition); }
a:hover { color: var(--primary-hover); }

button, input, select { font-family: var(--font); }

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px;
  padding-top: 88px;
}

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-logo {
  display: flex;
  align-items: center;
  color: var(--primary);
}

.header-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font);
  line-height: 1.4;
  white-space: nowrap;
}

.btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(99,102,241,0.3);
  outline: none;
}

.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-hover); }

.btn-danger { background: var(--danger); color: #fff; }
.btn-danger:hover { background: var(--danger-hover); }

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-ghost:hover { background: var(--surface-hover); color: var(--text); }

.btn-sm { padding: 6px 12px; font-size: 0.8125rem; }

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition);
}

.btn-icon:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.btn-icon:focus-visible {
  box-shadow: 0 0 0 3px rgba(99,102,241,0.3);
  outline: none;
}

/* Cards */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 24px;
  margin-bottom: 24px;
}

.card h2 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text);
}

/* Forms */
.form-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 200px;
}

.form-group label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
}

input[type="text"],
input[type="url"],
input[type="password"] {
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-family: var(--font);
  color: var(--text);
  background: var(--surface);
  outline: none;
  transition: all var(--transition);
  width: 100%;
}

input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.3);
  outline: none;
}

input::placeholder {
  color: var(--text-tertiary);
}

/* Table */
.table-wrapper { overflow-x: auto; }

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-light);
  font-size: 0.875rem;
}

th {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

tbody tr { transition: background var(--transition); }
tbody tr:hover td { background: var(--surface-hover); }
tbody tr:last-child td { border-bottom: none; }

.code-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 6px;
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
  text-decoration: none;
}

.code-badge:hover { background: var(--primary); color: #fff; text-decoration: none; }

.url-cell {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
}

.clicks {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-active { background: var(--success-light); color: var(--success); }
.badge-expired { background: var(--danger-light); color: var(--danger); }
.badge-deleted { background: var(--danger-light); color: var(--danger); }
.badge-never { background: var(--success-light); color: var(--success); }

/* Messages */
.msg {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.msg-error { background: var(--danger-light); color: var(--danger); border: 1px solid color-mix(in srgb, var(--danger) 20%, transparent); }
.msg-success { background: var(--success-light); color: var(--success); border: 1px solid color-mix(in srgb, var(--success) 20%, transparent); }

/* Search */
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-bar .search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-bar .search-input-wrapper .search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-bar input {
  padding-left: 36px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

/* Detail page */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.breadcrumb a { color: var(--text-secondary); }
.breadcrumb a:hover { color: var(--primary); }
.breadcrumb .separator { color: var(--text-tertiary); }
.breadcrumb .current { color: var(--text); font-weight: 500; }

.detail-field {
  display: flex;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-light);
  align-items: flex-start;
  gap: 16px;
}

.detail-field:last-child { border-bottom: none; }

.detail-label {
  width: 130px;
  font-weight: 500;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  padding-top: 2px;
}

.detail-value {
  font-size: 0.875rem;
  word-break: break-all;
  flex: 1;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
}

.copy-text {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.copy-btn:hover { background: var(--surface-hover); color: var(--text); }

.copy-btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(99,102,241,0.3);
  outline: none;
}

/* Theme toggle icon visibility */
.theme-sun { display: none; }
.theme-moon { display: inline-flex; }
.dark .theme-sun { display: inline-flex; }
.dark .theme-moon { display: none; }

@media (prefers-color-scheme: dark) {
  html:not(.light) .theme-sun { display: inline-flex; }
  html:not(.light) .theme-moon { display: none; }
}

/* Login */
.login-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg) 50%, var(--primary-light) 100%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 40px 32px;
  border: 1px solid var(--border);
}

.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  color: var(--primary);
}

.login-card h1 {
  font-size: 1.375rem;
  margin-bottom: 6px;
  text-align: center;
  font-weight: 700;
}

.login-card p {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 28px;
}

.login-card input {
  width: 100%;
  margin-bottom: 16px;
}

.login-card .btn { width: 100%; justify-content: center; padding: 10px 16px; }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--text-tertiary);
  font-size: 0.875rem;
}

/* 404 page */
.not-found-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--bg) 50%, var(--primary-light) 100%);
}

.not-found-card {
  text-align: center;
  max-width: 440px;
  width: 100%;
}

.not-found-code {
  font-size: 6rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary) 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 16px;
}

.not-found-card h2 {
  font-size: 1.375rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.not-found-card p {
  color: var(--text-secondary);
  font-size: 0.9375rem;
  margin-bottom: 28px;
}

/* Toast */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(20px);
  background: var(--text); color: var(--bg); padding: 10px 20px;
  border-radius: var(--radius); font-size: 0.875rem; font-weight: 500;
  opacity: 0; transition: opacity 0.3s, transform 0.3s; z-index: 1000;
  box-shadow: var(--shadow-lg);
}
.toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

/* Mobile cards for links */
.mobile-cards { display: none; }

.mobile-link-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px;
  margin-bottom: 10px;
  transition: all var(--transition);
}

.mobile-link-card:hover { box-shadow: var(--shadow); }

.mobile-link-card .m-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.mobile-link-card .m-url {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 8px;
}

.mobile-link-card .m-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Responsive */
@media (max-width: 768px) {
  .container { padding-top: 80px; }
  .form-row { flex-direction: column; }
  .form-group { min-width: 100%; }

  .detail-field { flex-direction: column; gap: 4px; }
  .detail-label { width: auto; }
}

@media (max-width: 640px) {
  .header { padding: 10px 16px; }
  .header-title { font-size: 1rem; }
  .table-wrapper { display: none; }
  .mobile-cards { display: block; }
  .pagination { flex-direction: column; gap: 8px; text-align: center; }
  .card { padding: 16px; }
}
`;

// --------------- Layout ---------------

function layout(content: string, lang: Locale = "zh"): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>${escapeHtml(t("site_title", lang))}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
${content}
<script>
(function(){
  var html=document.documentElement;
  var saved=localStorage.getItem('theme');
  if(saved==='dark')html.classList.add('dark');
  else if(saved==='light')html.classList.add('light');
})();
function toggleTheme(){
  var html=document.documentElement;
  var isDark=html.classList.contains('dark');
  if(isDark){html.classList.remove('dark');html.classList.add('light');localStorage.setItem('theme','light');}
  else{html.classList.remove('light');html.classList.add('dark');localStorage.setItem('theme','dark');}
}
function showToast(msg){
  var t=document.createElement('div');t.className='toast';t.textContent=msg;
  document.body.appendChild(t);
  requestAnimationFrame(function(){t.classList.add('show');});
  setTimeout(function(){t.classList.remove('show');setTimeout(function(){t.remove();},300);},2000);
}
</script>
</body>
</html>`;
}

// --------------- Escape HTML ---------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --------------- Login Page ---------------

export function loginPage(error?: string, lang: Locale = "zh"): string {
  return layout(`
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-logo">${ICONS.link}</div>
        <h1>${escapeHtml(t("login_title", lang))}</h1>
        <p>${escapeHtml(t("login_subtitle", lang))}</p>
        ${error ? `<div class="msg msg-error">${escapeHtml(error)}</div>` : ""}
        <form method="POST" action="/login">
          <input type="password" name="apiKey" placeholder="${escapeHtml(t("api_key_placeholder", lang))}" required autofocus />
          <button type="submit" class="btn btn-primary">${escapeHtml(t("sign_in", lang))}</button>
        </form>
        <div style="text-align:center;margin-top:16px;">
          <a href="/lang/${lang === "zh" ? "en" : "zh"}" class="btn btn-ghost btn-sm" style="border:none;color:var(--text-tertiary);">${ICONS.globe} ${escapeHtml(t("lang_switch", lang))}</a>
        </div>
      </div>
    </div>
  `, lang);
}

// --------------- Public Page ---------------

export interface PublicPageData {
  lang: Locale;
  baseUrl: string;
  isLoggedIn?: boolean;
}

export function publicPage(data: PublicPageData): string {
  const { lang, isLoggedIn } = data;

  const headerRight = isLoggedIn
    ? `<span class="badge badge-active" style="font-size:0.8125rem;">${escapeHtml(t("logged_in", lang))}</span>
        <a href="/dashboard" class="btn btn-ghost btn-sm">${escapeHtml(t("go_dashboard", lang))}</a>
        <a href="/" onclick="document.cookie='api_key=;path=/;max-age=0';return true;" class="btn btn-ghost btn-sm">${escapeHtml(t("logout", lang))}</a>`
    : `<a href="/dashboard" class="btn btn-ghost btn-sm">${escapeHtml(t("management_entry", lang))}</a>`;

  const permanentOption = isLoggedIn
    ? `<option value="permanent">${escapeHtml(t("permanent", lang))}</option>`
    : "";

  const customCodeField = isLoggedIn
    ? `<div>
              <label style="display:block;font-size:0.8125rem;font-weight:500;color:var(--text-secondary);margin-bottom:6px;">${escapeHtml(t("custom_code", lang))}</label>
              <input type="text" id="createCode" placeholder="${escapeHtml(t("custom_code_placeholder", lang))}" style="width:100%;" />
            </div>`
    : "";

  const formEndpoint = isLoggedIn ? "/api/links" : "/api/public/links";
  const submitButtonText = escapeHtml(t("create_button", lang));

  return layout(`
    <div class="header">
      <div class="header-left">
        <span class="header-logo">${ICONS.link}</span>
        <span class="header-title">${escapeHtml(t("site_title", lang))}</span>
      </div>
      <div class="header-right">
        <button class="btn-icon" onclick="toggleTheme()" title="${escapeHtml(t("dark_mode", lang))}"><span class="theme-sun">${ICONS.sun}</span><span class="theme-moon">${ICONS.moon}</span></button>
        <a href="/lang/${lang === "zh" ? "en" : "zh"}" class="btn-icon" title="${escapeHtml(t("lang_switch", lang))}" style="text-decoration:none;">${ICONS.globe}</a>
        ${headerRight}
      </div>
    </div>

    <div class="container" style="max-width:640px;padding-top:120px;">
      <div style="text-align:center;margin-bottom:40px;">
        <div style="display:flex;justify-content:center;margin-bottom:16px;color:var(--primary);">${ICONS.link}</div>
        <h1 style="font-size:1.75rem;font-weight:800;margin-bottom:8px;">${escapeHtml(t("public_title", lang))}</h1>
        <p style="color:var(--text-secondary);font-size:0.9375rem;">${escapeHtml(t("public_subtitle", lang))}</p>
      </div>

      <div class="card">
        <form id="createForm" onsubmit="return createLink(event);">
          <div style="display:flex;flex-direction:column;gap:16px;">
            <div>
              <label style="display:block;font-size:0.8125rem;font-weight:500;color:var(--text-secondary);margin-bottom:6px;">${escapeHtml(t("target_url", lang))}</label>
              <input type="url" id="createUrl" placeholder="${escapeHtml(t("url_placeholder", lang))}" required style="width:100%;" />
            </div>
            ${customCodeField}
            <div>
              <label style="display:block;font-size:0.8125rem;font-weight:500;color:var(--text-secondary);margin-bottom:6px;">${escapeHtml(t("expiry_label", lang))}</label>
              <select id="createTtl" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.875rem;font-family:var(--font);color:var(--text);background:var(--surface);outline:none;transition:all var(--transition);cursor:pointer;">
                <option value="1d">${escapeHtml(t("expiry_1d", lang))}</option>
                <option value="7d" selected>${escapeHtml(t("expiry_7d", lang))}</option>
                <option value="14d">${escapeHtml(t("expiry_14d", lang))}</option>
                <option value="30d">${escapeHtml(t("expiry_30d", lang))}</option>
                ${permanentOption}
              </select>
            </div>
            <button type="submit" id="createBtn" class="btn btn-primary" style="width:100%;padding:12px 16px;font-size:0.9375rem;">${submitButtonText}</button>
          </div>
        </form>
      </div>

      <div id="resultArea" style="display:none;">
        <div class="card" style="border-color:var(--success);">
          <h2 style="color:var(--success);margin-bottom:16px;">${escapeHtml(t("result_title", lang))}</h2>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${escapeHtml(t("short_url", lang))}</div>
              <div class="copy-text" style="width:100%;">
                <span id="resultUrl" style="word-break:break-all;flex:1;"></span>
                <button class="copy-btn" onclick="copyResult()">${ICONS.copy} ${escapeHtml(t("copy", lang))}</button>
              </div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${escapeHtml(t("target_url", lang))}</div>
              <div style="font-size:0.875rem;word-break:break-all;color:var(--text-secondary);" id="resultTarget"></div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${escapeHtml(t("expires", lang))}</div>
              <div style="font-size:0.875rem;" id="resultExpiry"></div>
            </div>
          </div>
        </div>
      </div>

      <div id="errorArea" style="display:none;">
        <div class="msg msg-error" id="errorMessage"></div>
      </div>
    </div>

    <script>
    var _isLoggedIn = ${isLoggedIn ? "true" : "false"};
    var _formEndpoint = '${formEndpoint}';
    var _btnText = '${submitButtonText}';
    function createLink(e) {
      e.preventDefault();
      var url = document.getElementById('createUrl').value;
      var ttl = document.getElementById('createTtl').value;
      var btn = document.getElementById('createBtn');
      var errorArea = document.getElementById('errorArea');
      var resultArea = document.getElementById('resultArea');

      btn.disabled = true;
      btn.textContent = '...';
      errorArea.style.display = 'none';

      var fetchOpts;
      if (_isLoggedIn) {
        var codeEl = document.getElementById('createCode');
        var code = codeEl ? codeEl.value.trim() : '';
        var formData = new URLSearchParams();
        formData.append('url', url);
        formData.append('ttl', ttl);
        if (code) formData.append('code', code);
        fetchOpts = {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        };
      } else {
        fetchOpts = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url, ttl: ttl })
        };
      }

      fetch(_formEndpoint, fetchOpts).then(function(r) {
        return r.json().then(function(data) { return { ok: r.ok, data: data }; });
      }).then(function(res) {
        btn.disabled = false;
        btn.textContent = _btnText;
        if (res.ok) {
          document.getElementById('resultUrl').textContent = res.data.shortUrl;
          document.getElementById('resultTarget').textContent = res.data.url;
          var expiryEl = document.getElementById('resultExpiry');
          if (res.data.expiresAt) {
            expiryEl.textContent = new Date(res.data.expiresAt).toLocaleString();
          } else {
            expiryEl.textContent = '${escapeHtml(t("never", lang))}';
          }
          resultArea.style.display = 'block';
        } else {
          document.getElementById('errorMessage').textContent = res.data.error || 'Error';
          errorArea.style.display = 'block';
        }
      }).catch(function() {
        btn.disabled = false;
        btn.textContent = _btnText;
        document.getElementById('errorMessage').textContent = 'Network error';
        errorArea.style.display = 'block';
      });

      return false;
    }
    function copyResult() {
      var url = document.getElementById('resultUrl').textContent;
      navigator.clipboard.writeText(url).then(function() {
        showToast('${escapeHtml(t("copied", lang))}');
      });
    }
    </script>
  `, lang);
}

// --------------- Dashboard Page ---------------

export interface DashboardData {
  links: {
    data: Array<{
      code: string;
      url: string;
      clicks: number;
      createdAt: number;
      expiresAt: number | null;
      source?: "admin" | "public";
    }>;
    total: number;
    page: number;
    limit: number;
  };
  search: string;
  error?: string;
  success?: string;
  baseUrl: string;
  lang: Locale;
  stats?: {
    total: number;
    active: number;
    expired: number;
  };
}

export function dashboardPage(data: DashboardData): string {
  const { links, search, error, success, baseUrl, lang, stats } = data;

  const rows = links.data.map((l) => {
    const isExpired = l.expiresAt !== null && l.expiresAt < Date.now();
    const expiryLabel = l.expiresAt === null
      ? `<span class="badge badge-never">${escapeHtml(t("never", lang))}</span>`
      : isExpired
      ? `<span class="badge badge-expired">${escapeHtml(t("expired", lang))}</span>`
      : `<span class="badge badge-active">${new Date(l.expiresAt).toLocaleDateString()}</span>`;

    const sourceLabel = l.source === "public"
      ? `<span class="badge" style="background:var(--warning-light);color:var(--warning);">${escapeHtml(t("source_public", lang))}</span>`
      : `<span class="badge" style="background:var(--primary-light);color:var(--primary);">${escapeHtml(t("source_admin", lang))}</span>`;

    return `<tr>
      <td><input type="checkbox" class="link-checkbox" value="${escapeHtml(l.code)}" onchange="updateBatchDelete()" /></td>
      <td><a href="/dashboard/${l.code}" class="code-badge">${escapeHtml(l.code)}</a></td>
      <td class="url-cell" title="${escapeHtml(l.url)}">${escapeHtml(l.url)}</td>
      <td>${sourceLabel}</td>
      <td class="clicks">${l.clicks.toLocaleString()}</td>
      <td>${expiryLabel}</td>
      <td>${new Date(l.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="copy-btn" onclick="copyLink('${baseUrl}/${l.code}')">${ICONS.copy} ${escapeHtml(t("copy", lang))}</button>
      </td>
    </tr>`;
  }).join("");

  const mobileCards = links.data.map((l) => {
    const isExpired = l.expiresAt !== null && l.expiresAt < Date.now();
    const statusBadge = l.expiresAt === null
      ? `<span class="badge badge-active">${escapeHtml(t("active", lang))}</span>`
      : isExpired
      ? `<span class="badge badge-expired">${escapeHtml(t("expired", lang))}</span>`
      : `<span class="badge badge-active">${new Date(l.expiresAt).toLocaleDateString()}</span>`;

    const sourceLabel = l.source === "public"
      ? `<span class="badge" style="background:var(--warning-light);color:var(--warning);font-size:0.6875rem;">${escapeHtml(t("source_public", lang))}</span>`
      : `<span class="badge" style="background:var(--primary-light);color:var(--primary);font-size:0.6875rem;">${escapeHtml(t("source_admin", lang))}</span>`;

    return `<div class="mobile-link-card">
      <div class="m-card-row">
        <div style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" class="link-checkbox" value="${escapeHtml(l.code)}" onchange="updateBatchDelete()" />
          <a href="/dashboard/${l.code}" class="code-badge">${escapeHtml(l.code)}</a>
        </div>
        <div style="display:flex;gap:4px;">${sourceLabel} ${statusBadge}</div>
      </div>
      <div class="m-url" title="${escapeHtml(l.url)}">${escapeHtml(l.url)}</div>
      <div class="m-footer">
        <span>${escapeHtml(t("clicks", lang))}: ${l.clicks.toLocaleString()}</span>
        <button class="copy-btn" onclick="copyLink('${baseUrl}/${l.code}')">${ICONS.copy} ${escapeHtml(t("copy", lang))}</button>
      </div>
    </div>`;
  }).join("");

  const totalPages = Math.max(1, Math.ceil(links.total / links.limit));

  return layout(`
    <div class="header">
      <div class="header-left">
        <span class="header-logo">${ICONS.link}</span>
        <span class="header-title">${escapeHtml(t("site_title", lang))}</span>
      </div>
      <div class="header-right">
        <button class="btn-icon" onclick="toggleTheme()" title="${escapeHtml(t("dark_mode", lang))}"><span class="theme-sun">${ICONS.sun}</span><span class="theme-moon">${ICONS.moon}</span></button>
        <a href="/lang/${lang === "zh" ? "en" : "zh"}" class="btn-icon" title="${escapeHtml(t("lang_switch", lang))}" style="text-decoration:none;">${ICONS.globe}</a>
        <a href="/dashboard" onclick="document.cookie='api_key=;path=/;max-age=0';return true;" class="btn btn-ghost btn-sm">${escapeHtml(t("sign_out", lang))}</a>
      </div>
    </div>

    <div class="container">
      ${error ? `<div class="msg msg-error">${escapeHtml(error)}</div>` : ""}
      ${success ? `<div class="msg msg-success">${escapeHtml(success)}</div>` : ""}

      ${stats ? `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
        <div class="card" style="margin-bottom:0;text-align:center;padding:20px 16px;">
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${escapeHtml(t("total_links", lang))}</div>
          <div style="font-size:1.5rem;font-weight:700;font-family:var(--font-mono);color:var(--text);">${stats.total}</div>
        </div>
        <div class="card" style="margin-bottom:0;text-align:center;padding:20px 16px;">
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${escapeHtml(t("active_links", lang))}</div>
          <div style="font-size:1.5rem;font-weight:700;font-family:var(--font-mono);color:var(--success);">${stats.active}</div>
        </div>
        <div class="card" style="margin-bottom:0;text-align:center;padding:20px 16px;">
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">${escapeHtml(t("expired_links", lang))}</div>
          <div style="font-size:1.5rem;font-weight:700;font-family:var(--font-mono);color:var(--danger);">${stats.expired}</div>
        </div>
      </div>
      ` : ""}

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
          <h2 style="margin-bottom:0;">${escapeHtml(t("all_links", lang))} (${links.total})</h2>
          <div style="display:flex;gap:8px;align-items:center;">
            <span id="selectedCount" style="font-size:0.8125rem;color:var(--text-secondary);display:none;"></span>
            <button id="batchDeleteBtn" class="btn btn-danger btn-sm" style="display:none;" onclick="batchDelete()">${ICONS.trash} ${escapeHtml(t("batch_delete", lang))}</button>
          </div>
        </div>
        <form method="GET" action="/dashboard" class="search-bar">
          <div class="search-input-wrapper">
            <span class="search-icon">${ICONS.search}</span>
            <input type="text" name="search" placeholder="${escapeHtml(t("search_placeholder", lang))}" value="${escapeHtml(search)}" />
          </div>
          <button type="submit" class="btn btn-ghost">${escapeHtml(t("search", lang))}</button>
          ${search ? `<a href="/dashboard" class="btn btn-ghost">${escapeHtml(t("clear", lang))}</a>` : ""}
        </form>
        ${links.data.length > 0 ? `
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style="width:40px;"><input type="checkbox" id="selectAll" onchange="toggleSelectAll(this)" /></th>
                  <th>${escapeHtml(t("code", lang))}</th>
                  <th>${escapeHtml(t("url", lang))}</th>
                  <th>${escapeHtml(t("source", lang))}</th>
                  <th>${escapeHtml(t("clicks", lang))}</th>
                  <th>${escapeHtml(t("expires", lang))}</th>
                  <th>${escapeHtml(t("created", lang))}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div class="mobile-cards">${mobileCards}</div>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-light);">
            <button id="batchDeleteBtnBottom" class="btn btn-danger btn-sm" style="display:none;" onclick="batchDelete()">${ICONS.trash} ${escapeHtml(t("batch_delete", lang))}</button>
          </div>
          <div class="pagination">
            <span>${escapeHtml(t("page_info", lang).replace("{page}", String(links.page)).replace("{total}", String(totalPages)))}</span>
            <div style="display:flex;gap:8px;">
              ${links.page > 1
                ? `<a href="/dashboard?page=${links.page - 1}${search ? "&search=" + encodeURIComponent(search) : ""}" class="btn btn-ghost btn-sm">${ICONS.arrowLeft} ${escapeHtml(t("previous", lang))}</a>`
                : ""}
              ${links.page < totalPages
                ? `<a href="/dashboard?page=${links.page + 1}${search ? "&search=" + encodeURIComponent(search) : ""}" class="btn btn-ghost btn-sm">${escapeHtml(t("next", lang))} ${ICONS.externalLink}</a>`
                : ""}
            </div>
          </div>
        ` : `<div class="empty-state">${escapeHtml(t("no_links", lang))}</div>`}
      </div>
    </div>

    <script>
    function copyLink(url) {
      navigator.clipboard.writeText(url).then(function() {
        showToast('${escapeHtml(t("copied", lang))}');
      });
    }
    function toggleSelectAll(el) {
      var boxes = document.querySelectorAll('.link-checkbox');
      boxes.forEach(function(b) { b.checked = el.checked; });
      updateBatchDelete();
    }
    function updateBatchDelete() {
      var boxes = document.querySelectorAll('.link-checkbox:checked');
      var count = boxes.length;
      var btn = document.getElementById('batchDeleteBtn');
      var btnBottom = document.getElementById('batchDeleteBtnBottom');
      var label = document.getElementById('selectedCount');
      if (count > 0) {
        btn.style.display = 'inline-flex';
        btnBottom.style.display = 'inline-flex';
        label.style.display = 'inline';
        label.textContent = '${escapeHtml(t("links_selected", lang).replace("{count}", "' + count + '"))}';
      } else {
        btn.style.display = 'none';
        btnBottom.style.display = 'none';
        label.style.display = 'none';
      }
    }
    function batchDelete() {
      var boxes = document.querySelectorAll('.link-checkbox:checked');
      var codes = [];
      boxes.forEach(function(b) { codes.push(b.value); });
      if (codes.length === 0) {
        showToast('${escapeHtml(t("no_selection", lang))}');
        return;
      }
      if (!confirm('${escapeHtml(t("batch_delete_confirm", lang))}')) return;
      var form = document.createElement('form');
      form.method = 'POST';
      form.action = '/dashboard/batch-delete';
      var input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'codes';
      input.value = codes.join(',');
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    }
    </script>
  `, lang);
}

// --------------- Detail Page ---------------

export interface DetailData {
  link: {
    code: string;
    url: string;
    clicks: number;
    createdAt: number;
    expiresAt: number | null;
    customCode: boolean;
    active: boolean;
  };
  baseUrl: string;
  error?: string;
  success?: string;
  lang: Locale;
}

export function detailPage(data: DetailData): string {
  const { link, baseUrl, error, success, lang } = data;
  const shortUrl = `${baseUrl}/${link.code}`;
  const isExpired = link.expiresAt !== null && link.expiresAt < Date.now();

  const statusHtml = isExpired
    ? `<span class="badge badge-expired">${escapeHtml(t("expired", lang))}</span>`
    : link.active
    ? `<span class="badge badge-active">${escapeHtml(t("active", lang))}</span>`
    : `<span class="badge badge-deleted">${escapeHtml(t("deleted", lang))}</span>`;

  return layout(`
    <div class="header">
      <div class="header-left">
        <span class="header-logo">${ICONS.link}</span>
        <span class="header-title">${escapeHtml(t("site_title", lang))}</span>
      </div>
      <div class="header-right">
        <button class="btn-icon" onclick="toggleTheme()" title="${escapeHtml(t("dark_mode", lang))}"><span class="theme-sun">${ICONS.sun}</span><span class="theme-moon">${ICONS.moon}</span></button>
        <a href="/lang/${lang === "zh" ? "en" : "zh"}" class="btn-icon" title="${escapeHtml(t("lang_switch", lang))}" style="text-decoration:none;">${ICONS.globe}</a>
        <a href="/dashboard" onclick="document.cookie='api_key=;path=/;max-age=0';return true;" class="btn btn-ghost btn-sm">${escapeHtml(t("sign_out", lang))}</a>
      </div>
    </div>

    <div class="container">
      <div class="breadcrumb">
        <a href="/dashboard">${escapeHtml(t("site_title", lang))}</a>
        <span class="separator">/</span>
        <span class="current">${escapeHtml(link.code)}</span>
      </div>

      ${error ? `<div class="msg msg-error">${escapeHtml(error)}</div>` : ""}
      ${success ? `<div class="msg msg-success">${escapeHtml(success)}</div>` : ""}

      <div class="card">
        <h2>${escapeHtml(t("link_details", lang))}</h2>

        <div class="detail-field">
          <span class="detail-label">${escapeHtml(t("short_url", lang))}</span>
          <span class="detail-value">
            <span class="copy-text">
              <span id="shortUrl">${escapeHtml(shortUrl)}</span>
              <button class="copy-btn" onclick="copyUrl()">${ICONS.copy} ${escapeHtml(t("copy", lang))}</button>
            </span>
          </span>
        </div>

        <div class="detail-field">
          <span class="detail-label">${escapeHtml(t("target_url", lang))}</span>
          <span class="detail-value"><a href="${escapeHtml(link.url)}" target="_blank" rel="noopener">${escapeHtml(link.url)} ${ICONS.externalLink}</a></span>
        </div>

        <div class="detail-field">
          <span class="detail-label">${escapeHtml(t("clicks", lang))}</span>
          <span class="detail-value"><strong>${link.clicks.toLocaleString()}</strong></span>
        </div>

        <div class="detail-field">
          <span class="detail-label">${escapeHtml(t("custom_code_label", lang))}</span>
          <span class="detail-value">${link.customCode ? escapeHtml(t("yes", lang)) : escapeHtml(t("no", lang))}</span>
        </div>

        <div class="detail-field">
          <span class="detail-label">${escapeHtml(t("status", lang))}</span>
          <span class="detail-value">${statusHtml}</span>
        </div>

        <div class="detail-field">
          <span class="detail-label">${escapeHtml(t("created", lang))}</span>
          <span class="detail-value">${new Date(link.createdAt).toLocaleString()}</span>
        </div>

        <div class="detail-field">
          <span class="detail-label">${escapeHtml(t("expires", lang))}</span>
          <span class="detail-value">${link.expiresAt === null ? escapeHtml(t("never", lang)) : new Date(link.expiresAt).toLocaleString()}</span>
        </div>

        <div class="detail-actions">
          <form method="POST" action="/dashboard/${link.code}/delete" onsubmit="return confirm('${escapeHtml(t("delete_confirm", lang))}');">
            <button type="submit" class="btn btn-danger">${ICONS.trash} ${escapeHtml(t("delete_link", lang))}</button>
          </form>
          <a href="/dashboard" class="btn btn-ghost">${ICONS.arrowLeft} ${escapeHtml(t("back", lang))}</a>
        </div>
      </div>
    </div>

    <script>
    function copyUrl() {
      var url = document.getElementById('shortUrl').textContent;
      navigator.clipboard.writeText(url).then(function() {
        showToast('${escapeHtml(t("copied", lang))}');
      });
    }
    </script>
  `, lang);
}

// --------------- 404 Page ---------------

export function notFoundPage(lang: Locale = "zh"): string {
  return layout(`
    <div class="not-found-wrapper">
      <div class="not-found-card">
        <div class="not-found-code">404</div>
        <h2>${escapeHtml(t("not_found_title", lang))}</h2>
        <p>${escapeHtml(t("not_found_desc", lang))}</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <a href="/" class="btn btn-primary">${escapeHtml(t("go_home", lang))}</a>
          <a href="/lang/${lang === "zh" ? "en" : "zh"}" class="btn btn-ghost btn-sm">${ICONS.globe} ${escapeHtml(t("lang_switch", lang))}</a>
        </div>
      </div>
    </div>
  `, lang);
}
