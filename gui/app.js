/**
 * MasterVPN — GUI Frontend Logic
 * Communicates with Python backend via pywebview JS Bridge.
 */

const app = {
  connected: false,
  connecting: false,
  config: null,
  scriptIds: [],
  logBuffer: [],
  uptimeInterval: null,
  statsInterval: null,
  connectTime: null,
  maxLogLines: 2000,

  // ── Initialization ──────────────────────────────────────────

  async init() {
    this.setupTabs();
    this.setupScriptIdInput();
    i18n.init();
    await this.loadConfig();
    await this.checkCert();
    this.startPolling();
  },

  // ── Tab Navigation ──────────────────────────────────────────

  setupTabs() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
      });
    });
  },

  // ── Config Management ───────────────────────────────────────

  async loadConfig() {
    try {
      const config = await this.api('get_config');
      if (!config) return;
      this.config = config;
      this.populateConfigForm(config);
      this.updateProxyInfo(config);
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  },

  populateConfigForm(cfg) {
    // Script IDs — normalize to array
    const raw = cfg.script_ids || cfg.script_id || [];
    this.scriptIds = Array.isArray(raw) ? [...raw] : (raw ? [raw] : []);
    this.renderScriptIds();

    this.setVal('cfg-auth-key', cfg.auth_key || '');
    this.setVal('setup-auth-key', cfg.auth_key || '');
    this.setVal('cfg-google-ip', cfg.google_ip || '216.239.38.120');
    this.setVal('cfg-front-domain', cfg.front_domain || 'www.google.com');
    this.setVal('cfg-listen-host', cfg.listen_host || '127.0.0.1');
    this.setVal('cfg-listen-port', cfg.listen_port || 8085);
    this.setVal('cfg-socks5-port', cfg.socks5_port || 1080);
    this.setVal('cfg-log-level', cfg.log_level || 'INFO');

    document.getElementById('cfg-socks5-enabled').checked = cfg.socks5_enabled !== false;
    document.getElementById('cfg-verify-ssl').checked = cfg.verify_ssl !== false;

    const blockHosts = (cfg.block_hosts || []).join('\n');
    const bypassHosts = (cfg.bypass_hosts || []).join('\n');
    document.getElementById('cfg-block-hosts').value = blockHosts;
    document.getElementById('cfg-bypass-hosts').value = bypassHosts;
  },

  updateProxyInfo(cfg) {
    const host = cfg.listen_host || '127.0.0.1';
    const httpPort = cfg.listen_port || 8085;
    const socksPort = cfg.socks5_port || 1080;
    const socksEnabled = cfg.socks5_enabled !== false;

    document.getElementById('proxy-http').textContent = `${host}:${httpPort}`;
    document.getElementById('proxy-socks5').textContent = `${host}:${socksPort}`;
    document.getElementById('socks5-row').style.display = socksEnabled ? 'flex' : 'none';
  },

  async saveConfig() {
    const cfg = this.gatherConfigForm();
    try {
      const result = await this.api('save_config', cfg);
      if (result && result.success) {
        this.config = cfg;
        this.updateProxyInfo(cfg);
        this.toast(i18n.t('toast.settingsSaved'), 'success');
      } else {
        this.toast(result?.error || i18n.t('toast.settingsFailed'), 'error');
      }
    } catch (e) {
      this.toast(i18n.t('toast.settingsFailed'), 'error');
    }
  },

  gatherConfigForm() {
    const blockText = document.getElementById('cfg-block-hosts').value.trim();
    const bypassText = document.getElementById('cfg-bypass-hosts').value.trim();

    return {
      mode: 'apps_script',
      script_ids: [...this.scriptIds],
      auth_key: this.getVal('cfg-auth-key'),
      google_ip: this.getVal('cfg-google-ip') || '216.239.38.120',
      front_domain: this.getVal('cfg-front-domain') || 'www.google.com',
      listen_host: this.getVal('cfg-listen-host') || '127.0.0.1',
      listen_port: parseInt(this.getVal('cfg-listen-port'), 10) || 8085,
      socks5_port: parseInt(this.getVal('cfg-socks5-port'), 10) || 1080,
      socks5_enabled: document.getElementById('cfg-socks5-enabled').checked,
      log_level: this.getVal('cfg-log-level') || 'INFO',
      verify_ssl: document.getElementById('cfg-verify-ssl').checked,
      block_hosts: blockText ? blockText.split('\n').map(s => s.trim()).filter(Boolean) : [],
      bypass_hosts: bypassText ? bypassText.split('\n').map(s => s.trim()).filter(Boolean) : [],
    };
  },

  async resetConfig() {
    await this.loadConfig();
    this.toast(i18n.t('toast.settingsReset'), 'info');
  },

  // ── Script IDs Management ───────────────────────────────────

  setupScriptIdInput() {
    const input = document.getElementById('cfg-script-id-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addScriptId();
        }
      });
    }

    const setupInput = document.getElementById('setup-script-id');
    if (setupInput) {
      setupInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addScriptIdFromSetup();
        }
      });
    }},

  addScriptId() {
    const input = document.getElementById('cfg-script-id-input');
    const val = input.value.trim();
    if (!val) return;

    if (this.scriptIds.includes(val)) {
      this.toast(i18n.t('toast.duplicateId'), 'error');
      return;
    }

    this.scriptIds.push(val);
    input.value = '';
    input.focus();
    this.renderScriptIds();
    this.toast(`Deployment #${this.scriptIds.length} added`, 'success');
  },

  removeScriptId(index) {
    this.scriptIds.splice(index, 1);
    this.renderScriptIds();
  },

  renderScriptIds() {
    const list = document.getElementById('script-ids-list');
    const count = document.getElementById('script-id-count');
    list.innerHTML = '';

    this.scriptIds.forEach((id, i) => {
      const tag = document.createElement('div');
      tag.className = 'script-id-tag';
      const shortId = id.length > 40 ? id.slice(0, 18) + '…' + id.slice(-18) : id;
      tag.innerHTML = `
        <span class="tag-index">#${i + 1}</span>
        <span class="tag-value" title="${this.escHtml(id)}">${this.escHtml(shortId)}</span>
        <button class="tag-remove" onclick="app.removeScriptId(${i})" title="Remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      list.appendChild(tag);
    });

    const n = this.scriptIds.length;
    if (n === 0) {
      count.textContent = '0 deployment(s) configured';
    } else if (n === 1) {
      count.textContent = '1 deployment configured';
    } else {
      count.textContent = `${n} deployments configured — load balancing active ⚡`;
    }

    // Also update setup tab status
    const setupStatus = document.getElementById('setup-id-status');
    if (setupStatus) {
      if (n === 0) {
        setupStatus.textContent = 'No deployments added yet';
      } else {
        setupStatus.textContent = `✅ ${n} deployment(s) added — ready to connect!`;
      }
    }
  },

  // ── Setup Guide Methods ─────────────────────────────────────

  codeGsTemplate: null,

  async loadCodeGsTemplate() {
    try {
      const code = await this.api('get_code_gs');
      if (code) this.codeGsTemplate = code;
    } catch (e) {
      // fallback: template is embedded in backend
    }
  },

  async saveAuthKeyAndCopyCode() {
    const authKey = document.getElementById('setup-auth-key').value.trim();
    if (!authKey) {
      this.toast(i18n.t('toast.enterAuthKey'), 'error');
      return;
    }

    // Save auth key to config
    if (!this.config) this.config = {};
    this.config.auth_key = authKey;

    // Also update settings tab
    this.setVal('cfg-auth-key', authKey);

    // Save config
    const cfg = this.gatherConfigForm();
    cfg.auth_key = authKey;
    await this.api('save_config', cfg);

    // Get Code.gs with auth key embedded
    let code = await this.api('get_code_gs', authKey);
    if (!code) {
      this.toast(i18n.t('toast.codeGsFailed'), 'error');
      return;
    }

    // Copy to clipboard
    await this.writeClipboard(code);
    this.toast(i18n.t('toast.authKeySaved'), 'success');
  },

  addScriptIdFromSetup() {
    const input = document.getElementById('setup-script-id');
    const val = input.value.trim();
    if (!val) return;

    if (this.scriptIds.includes(val)) {
      this.toast(i18n.t('toast.duplicateId'), 'error');
      return;
    }

    this.scriptIds.push(val);
    input.value = '';
    input.focus();
    this.renderScriptIds();

    // Auto-save config with new ID
    const cfg = this.gatherConfigForm();
    this.api('save_config', cfg).then(result => {
      if (result && result.success) {
        this.toast(`Deployment #${this.scriptIds.length} added & saved!`, 'success');
      }
    });
  },

  openExternal(url) {
    if (window.pywebview && window.pywebview.api && window.pywebview.api.open_url) {
      window.pywebview.api.open_url(url);
    } else {
      window.open(url, '_blank');
    }
  },

  async writeClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  },

  // ── Connection Control ──────────────────────────────────────

  async toggleConnection() {
    if (this.connecting) return;

    if (this.connected) {
      await this.disconnect();
    } else {
      await this.connect();
    }
  },

  async connect() {
    this.setConnecting(true);

    try {
      const result = await this.api('start_proxy');
      if (result && result.success) {
        this.setConnected(true);
        this.connectTime = Date.now();
        this.startUptime();
        this.toast(i18n.t('toast.connected'), 'success');
      } else {
        this.setConnecting(false);
        this.setConnected(false);
        this.toast(result?.error || i18n.t('toast.connectFailed'), 'error');
      }
    } catch (e) {
      this.setConnecting(false);
      this.setConnected(false);
      this.toast('Connection failed: ' + e.message, 'error');
    }
  },

  async disconnect() {
    this.setConnecting(true);

    try {
      await this.api('stop_proxy');
      this.setConnected(false);
      this.stopUptime();
      this.toast(i18n.t('toast.disconnected'), 'info');
    } catch (e) {
      this.toast('Disconnect failed: ' + e.message, 'error');
    }

    this.setConnecting(false);
  },

  setConnecting(state) {
    this.connecting = state;
    const btn = document.getElementById('connect-btn');
    const ring = document.getElementById('ring-progress');
    const icon = document.getElementById('connection-icon');
    const status = document.getElementById('connection-status');
    const dot = document.querySelector('#sidebar-status .status-dot');
    const label = document.querySelector('#sidebar-status .status-label');

    if (state) {
      btn.classList.add('connecting');
      btn.classList.remove('connected');
      ring.classList.add('connecting');
      ring.classList.remove('active');
      icon.classList.add('connecting');
      icon.classList.remove('connected');
      status.textContent = i18n.t('home.connecting');
      status.classList.add('connecting');
      status.classList.remove('connected');
      dot.className = 'status-dot connecting';
      label.textContent = i18n.t('sidebar.connecting');
    }
  },

  setConnected(state) {
    this.connected = state;
    this.connecting = false;

    const btn = document.getElementById('connect-btn');
    const btnText = btn.querySelector('.btn-text');
    const ring = document.getElementById('ring-progress');
    const icon = document.getElementById('connection-icon');
    const status = document.getElementById('connection-status');
    const card = document.getElementById('connection-card');
    const dot = document.querySelector('#sidebar-status .status-dot');
    const label = document.querySelector('#sidebar-status .status-label');

    btn.classList.remove('connecting');
    ring.classList.remove('connecting');
    icon.classList.remove('connecting');
    status.classList.remove('connecting');

    if (state) {
      btn.classList.add('connected');
      btnText.textContent = i18n.t('home.disconnect');
      ring.classList.add('active');
      icon.classList.add('connected');
      status.textContent = i18n.t('home.connected');
      status.classList.add('connected');
      card.classList.add('connected');
      dot.className = 'status-dot connected';
      label.textContent = i18n.t('sidebar.connected');
    } else {
      btn.classList.remove('connected');
      btnText.textContent = i18n.t('home.connect');
      ring.classList.remove('active');
      icon.classList.remove('connected');
      status.textContent = i18n.t('home.disconnected');
      status.classList.remove('connected');
      card.classList.remove('connected');
      dot.className = 'status-dot disconnected';
      label.textContent = i18n.t('sidebar.disconnected');
      this.resetStats();
    }
  },

  // ── Uptime Counter ──────────────────────────────────────────

  startUptime() {
    this.stopUptime();
    this.uptimeInterval = setInterval(() => {
      if (!this.connectTime) return;
      const elapsed = Math.floor((Date.now() - this.connectTime) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      document.getElementById('stat-uptime').textContent = `${h}:${m}:${s}`;
    }, 1000);
  },

  stopUptime() {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
    }
  },

  // ── Stats Polling ───────────────────────────────────────────

  startPolling() {
    this.statsInterval = setInterval(async () => {
      if (!this.connected) return;

      try {
        const stats = await this.api('get_stats');
        if (stats) {
          document.getElementById('stat-upload').textContent = this.formatBytes(stats.bytes_sent || 0);
          document.getElementById('stat-download').textContent = this.formatBytes(stats.bytes_received || 0);
          document.getElementById('stat-requests').textContent = String(stats.requests || 0);
        }
      } catch (e) {
        // silently ignore polling errors
      }

      try {
        const logs = await this.api('get_logs');
        if (logs && logs.length) {
          this.appendLogs(logs);
        }
      } catch (e) {
        // silently ignore
      }

      try {
        const status = await this.api('get_status');
        if (status && !status.running && this.connected) {
          this.setConnected(false);
          this.stopUptime();
          this.toast(i18n.t('toast.proxyStopped'), 'error');
        }
      } catch (e) {
        // silently ignore
      }
    }, 1500);
  },

  resetStats() {
    document.getElementById('stat-upload').textContent = '0 B';
    document.getElementById('stat-download').textContent = '0 B';
    document.getElementById('stat-uptime').textContent = '00:00:00';
    document.getElementById('stat-requests').textContent = '0';
    this.connectTime = null;
  },

  // ── Logs ────────────────────────────────────────────────────

  appendLogs(entries) {
    const viewer = document.getElementById('log-viewer');
    const empty = viewer.querySelector('.log-empty');
    if (empty) empty.remove();

    const autoScroll = document.getElementById('log-auto-scroll').checked;
    const atBottom = viewer.scrollHeight - viewer.scrollTop - viewer.clientHeight < 40;

    entries.forEach(entry => {
      const line = document.createElement('div');
      line.className = 'log-line';

      const time = entry.time || '';
      const level = entry.level || 'INFO';
      const msg = entry.message || entry.msg || '';

      line.innerHTML =
        `<span class="log-time">${this.escHtml(time)}</span> ` +
        `<span class="log-level-${level}">[${level}]</span> ` +
        `<span class="log-msg">${this.escHtml(msg)}</span>`;

      viewer.appendChild(line);
      this.logBuffer.push(line);
    });

    // Trim old logs
    while (this.logBuffer.length > this.maxLogLines) {
      const old = this.logBuffer.shift();
      if (old.parentNode) old.parentNode.removeChild(old);
    }

    if (autoScroll && atBottom) {
      viewer.scrollTop = viewer.scrollHeight;
    }
  },

  clearLogs() {
    const viewer = document.getElementById('log-viewer');
    viewer.innerHTML = `
      <div class="log-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.3">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <p>Logs cleared.</p>
      </div>`;
    this.logBuffer = [];
  },

  // ── Certificate ─────────────────────────────────────────────

  async checkCert() {
    try {
      const result = await this.api('check_cert');
      this.updateCertUI(result);
    } catch (e) {
      this.updateCertUI({ exists: false, trusted: false, error: e.message });
    }
  },

  async downloadCert() {
    try {
      const result = await this.api('download_cert');
      if (result && result.success) {
        this.toast(i18n.t('toast.copied') + ': ' + (result.path || 'MasterVPN-CA.crt'), 'success');
      } else if (result?.error === 'Cancelled') {
        // user cancelled — do nothing
      } else {
        this.toast(result?.error || 'Download failed', 'error');
      }
    } catch (e) {
      this.toast('Certificate download failed', 'error');
    }
  },

  async regenerateCert() {
    if (!confirm('This will delete the current certificate and generate a new one.\n\nYou will need to re-install the new certificate in your browser/system.\n\nContinue?')) return;
    try {
      const result = await this.api('regenerate_cert');
      if (result && result.success) {
        this.toast(i18n.t('toast.certGenerated'), 'success');
        this.updateCertUI({ exists: true, trusted: false, cn: result.cn, expiry: result.expiry, fingerprint: result.fingerprint });
      } else {
        this.toast(result?.error || 'Regeneration failed', 'error');
      }
    } catch (e) {
      this.toast('Certificate regeneration failed', 'error');
    }
  },

  async installCert() {
    try {
      const result = await this.api('install_cert');
      if (result && result.success) {
        this.toast(i18n.t('toast.certInstalled'), 'success');
        this.checkCert(); // refresh full state
      } else {
        this.toast(result?.error || 'Certificate installation failed', 'error');
      }
    } catch (e) {
      this.toast('Certificate installation failed', 'error');
    }
  },

  switchGuide(platform) {
    document.querySelectorAll('.guide-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.guide-content').forEach(c => c.classList.remove('active'));
    const tab = document.getElementById('guide-tab-' + platform);
    const content = document.getElementById('guide-' + platform);
    if (tab) tab.classList.add('active');
    if (content) content.classList.add('active');
  },

  updateCertUI(result) {
    const icon = document.getElementById('cert-icon');
    const title = document.getElementById('cert-status-text');
    const detail = document.getElementById('cert-status-detail');
    const details = document.getElementById('cert-details');
    const cnEl = document.getElementById('cert-cn');
    const expiryEl = document.getElementById('cert-expiry');
    const fpEl = document.getElementById('cert-fingerprint');

    if (!result) {
      title.textContent = 'Unknown';
      detail.textContent = 'Could not check certificate status';
      icon.className = 'cert-icon';
      if (details) details.style.display = 'none';
      return;
    }

    if (!result.exists) {
      icon.className = 'cert-icon not-generated';
      title.textContent = i18n.t('cert.noCert');
      detail.textContent = result.error || i18n.t('cert.noCertDetail');
      if (details) details.style.display = 'none';
      return;
    }

    if (result.trusted) {
      icon.className = 'cert-icon trusted';
      title.textContent = i18n.t('cert.trusted');
      detail.textContent = i18n.t('cert.trustedDetail');
    } else {
      icon.className = 'cert-icon not-trusted';
      title.textContent = i18n.t('cert.notTrusted');
      detail.textContent = i18n.t('cert.notTrustedDetail');
    }

    // Show cert details
    if (details && (result.cn || result.expiry || result.fingerprint)) {
      details.style.display = 'flex';
      if (cnEl) cnEl.textContent = 'CN: ' + (result.cn || 'Unknown');
      if (expiryEl) expiryEl.textContent = 'Expires: ' + (result.expiry || 'Unknown');
      if (fpEl) fpEl.textContent = 'SHA-256: ' + (result.fingerprint || 'Unknown');
    }
  },

  // ── Bridge API Helper ───────────────────────────────────────

  async api(method, ...args) {
    // pywebview exposes window.pywebview.api
    if (window.pywebview && window.pywebview.api) {
      return await window.pywebview.api[method](...args);
    }

    // Fallback: mock for dev / browser testing
    console.warn(`[Mock API] ${method}`, args);
    return this.mockApi(method, args);
  },

  mockApi(method, args) {
    const mocks = {
      get_config: () => ({
        mode: 'apps_script',
        script_ids: [],
        auth_key: '',
        google_ip: '216.239.38.120',
        front_domain: 'www.google.com',
        listen_host: '127.0.0.1',
        listen_port: 8085,
        socks5_port: 1080,
        socks5_enabled: true,
        log_level: 'INFO',
        verify_ssl: true,
        block_hosts: [],
        bypass_hosts: ['localhost', '.local', '.lan'],
      }),
      save_config: () => ({ success: true }),
      start_proxy: () => ({ success: true }),
      stop_proxy: () => ({ success: true }),
      get_status: () => ({ running: false }),
      get_stats: () => ({ bytes_sent: 0, bytes_received: 0, requests: 0 }),
      get_logs: () => [],
      check_cert: () => ({ exists: true, trusted: false, cn: 'MasterHttpRelayVPN', expiry: '2036-04-22', fingerprint: 'ab:cd:ef:12:34:56:78:90...' }),
      install_cert: () => ({ success: false, error: 'Run as GUI to install' }),
      download_cert: () => ({ success: false, error: 'Run as GUI to download' }),
      regenerate_cert: () => ({ success: true, cn: 'MasterHttpRelayVPN', expiry: '2036-04-22', fingerprint: 'aa:bb:cc:dd:ee:ff:00:11...' }),
      get_cert_info: () => ({ exists: true, cn: 'MasterHttpRelayVPN', expiry: '2036-04-22', fingerprint: 'ab:cd:ef:12:34:56:78:90...' }),
      get_code_gs: (key) => `// Code.gs with AUTH_KEY = "${key || 'YOUR_KEY'}";\n// (Mock — full code available in GUI mode)`,
      open_url: () => null,
    };
    return mocks[method] ? mocks[method](...args) : null;
  },

  // ── Utilities ───────────────────────────────────────────────

  formatBytes(b) {
    if (b === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(1024));
    const val = (b / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
    return `${val} ${units[i]}`;
  },

  escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  },

  setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  },

  getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  },

  togglePassword(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
  },

  async copyToClipboard(id) {
    await this.writeClipboard(id);
    this.toast(i18n.t('toast.copied'), 'success');
  },

  async writeClipboard(payload) {
    let text = payload;
    // If payload is an element ID, extract its text
    if (typeof payload === 'string' && document.getElementById(payload)) {
      const el = document.getElementById(payload);
      text = el.textContent || el.value;
    }

    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        this.fallbackCopyTextToClipboard(text);
      }
    } else {
      this.fallbackCopyTextToClipboard(text);
    }
  },

  fallbackCopyTextToClipboard(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(ta);
  },

  // ── Toast Notifications ─────────────────────────────────────

  toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message" style="flex: 1;">${this.escHtml(message)}</span>
      <button class="toast-close" title="Close"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    let timer = null;

    const removeToast = () => {
      if (timer) clearTimeout(timer);
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => toast.remove());
    };

    closeBtn.addEventListener('click', removeToast);

    if (duration > 0) {
      timer = setTimeout(removeToast, duration);
    }
  },
};

// ── Boot ─────────────────────────────────────────────────────

// Wait for pywebview to be ready
if (window.pywebview) {
  window.addEventListener('pywebviewready', () => app.init());
} else {
  // Dev/browser mode — init immediately
  document.addEventListener('DOMContentLoaded', () => app.init());
}
