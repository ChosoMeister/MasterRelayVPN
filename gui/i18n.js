/**
 * MasterVPN — Internationalization (i18n)
 * Supports: English (en), Persian/Farsi (fa)
 */

const i18n = {
  currentLang: 'en',

  translations: {
    en: {
      // Sidebar
      'nav.home': 'Home',
      'nav.setup': 'Setup',
      'nav.settings': 'Settings',
      'nav.logs': 'Logs',
      'nav.cert': 'Certificate',
      'sidebar.disconnected': 'Disconnected',
      'sidebar.connected': 'Connected',
      'sidebar.connecting': 'Connecting...',

      // Home
      'home.disconnected': 'Disconnected',
      'home.connected': 'Connected',
      'home.connecting': 'Connecting...',
      'home.connect': 'Connect',
      'home.disconnect': 'Disconnect',
      'home.upload': 'Upload',
      'home.download': 'Download',
      'home.uptime': 'Uptime',
      'home.requests': 'Requests',
      'home.httpProxy': 'HTTP Proxy',
      'home.socks5Proxy': 'SOCKS5 Proxy',

      // Setup
      'setup.title': 'Setup Guide',
      'setup.subtitle': 'Follow these steps to configure your relay proxy',
      'setup.step1.title': 'Choose Your Auth Key',
      'setup.step1.desc': 'Pick a secret password. This same key must be used in both the app and your Apps Script.',
      'setup.step1.placeholder': 'Enter a strong secret password',
      'setup.step1.btn': 'Save Auth Key & Copy Code.gs to Clipboard',
      'setup.step2.title': 'Create Google Apps Script',
      'setup.step2.1': 'Go to <a href="#" onclick="app.openExternal(\'https://script.google.com\'); return false;" class="setup-link">script.google.com</a> and click <strong>New Project</strong>',
      'setup.step2.2': 'Delete all the default code in the editor',
      'setup.step2.3': 'Paste the code you copied in Step 1 <kbd>Ctrl+V</kbd>',
      'setup.step2.4': 'Click <strong>Deploy → New deployment</strong>',
      'setup.step2.5': 'Click the ⚙️ gear icon → select <strong>Web app</strong>',
      'setup.step2.6': 'Set <strong>Execute as:</strong> → <em>Me</em>',
      'setup.step2.7': 'Set <strong>Who has access:</strong> → <em>Anyone</em>',
      'setup.step2.8': 'Click <strong>Deploy</strong> and copy the <strong>Deployment ID</strong>',
      'setup.step2.tip': 'For load balancing, repeat this process multiple times with different Google accounts. All deployments must use the <strong>same Auth Key</strong>.',
      'setup.step3.title': 'Add Deployment ID',
      'setup.step3.desc': 'Paste the Deployment ID you copied from Apps Script:',
      'setup.step3.placeholder': 'Paste your Deployment ID here',
      'setup.step3.status': 'No deployments added yet',
      'setup.step4.title': 'Connect!',
      'setup.step4.desc': 'Go to the <strong>Home</strong> tab and click <strong>Connect</strong>. Your proxy will be ready at:',
      'setup.step4.note': 'Configure your browser or system proxy settings to use these addresses.',

      // Settings
      'settings.title': 'Settings',
      'settings.subtitle': 'Configure your VPN connection',
      'settings.relay': 'Relay Configuration',
      'settings.authKey': 'Auth Key',
      'settings.authKeyPlaceholder': 'Your secret password',
      'settings.scriptIds': 'Script IDs (Deployment IDs)',
      'settings.scriptIdsHint': '— add multiple for load balancing',
      'settings.scriptIdPlaceholder': 'Paste Deployment ID and press Enter',
      'settings.deploymentsCount': '{n} deployment(s) configured',
      'settings.googleIp': 'Google IP',
      'settings.frontDomain': 'Front Domain',
      'settings.network': 'Network',
      'settings.listenHost': 'Listen Host',
      'settings.httpPort': 'HTTP Port',
      'settings.socks5Port': 'SOCKS5 Port',
      'settings.socks5Enabled': 'SOCKS5 Enabled',
      'settings.logLevel': 'Log Level',
      'settings.verifySSL': 'Verify SSL',
      'settings.hostRules': 'Host Rules',
      'settings.blockedHosts': 'Blocked Hosts',
      'settings.blockedHostsHint': '(one per line)',
      'settings.bypassHosts': 'Bypass Hosts',
      'settings.bypassHostsHint': '(one per line, direct connection)',
      'settings.reset': 'Reset',
      'settings.save': 'Save Settings',

      // Logs
      'logs.title': 'Logs',
      'logs.autoScroll': 'Auto-scroll',
      'logs.clear': 'Clear',
      'logs.empty': 'No logs yet. Connect to start logging.',
      'logs.cleared': 'Logs cleared.',

      // Certificate
      'cert.title': 'SSL Certificate',
      'cert.subtitle': 'Manage the MITM CA certificate for HTTPS interception',
      'cert.checking': 'Checking...',
      'cert.verifying': 'Verifying CA certificate',
      'cert.noCert': 'No Certificate',
      'cert.noCertDetail': 'Click "Regenerate" to create a new certificate',
      'cert.trusted': 'Certificate Trusted',
      'cert.trustedDetail': 'MITM CA is installed and trusted by the system',
      'cert.notTrusted': 'Certificate Not Trusted',
      'cert.notTrustedDetail': 'Download and install the certificate using the guide below',
      'cert.download': 'Download Certificate',
      'cert.checkStatus': 'Check Status',
      'cert.regenerate': 'Regenerate',
      'cert.installGuide': 'Installation Guide',
      'cert.whyNeeded': 'Why is this needed?',
      'cert.whyDesc': 'In Apps Script mode, the proxy decrypts and re-encrypts HTTPS traffic locally. A trusted CA certificate prevents security warnings in your browser.',
      'cert.whyLocal': 'The certificate is <strong>local only</strong> — it never leaves your machine',
      'cert.whyAuto': 'A new certificate is generated automatically on first run',
      'cert.whyRegen': 'You can <strong>Regenerate</strong> it anytime from this page',
      'cert.whyValid': 'Each certificate is valid for <strong>10 years</strong>',

      // Cert Guides
      'cert.guide.win1': 'Click <strong>Download Certificate</strong> above to save <code>ca.crt</code>',
      'cert.guide.win2': 'Double-click the downloaded <code>ca.crt</code> file',
      'cert.guide.win3': 'Click <strong>Install Certificate</strong>',
      'cert.guide.win4': 'Select <strong>Local Machine</strong> (or Current User)',
      'cert.guide.win5': 'Choose <strong>Place all certificates in the following store</strong>',
      'cert.guide.win6': 'Click <strong>Browse</strong> and select <strong>Trusted Root Certification Authorities</strong>',
      'cert.guide.win7': 'Click <strong>OK</strong>, then <strong>Next</strong>, then <strong>Finish</strong>',
      'cert.guide.winTip': 'After installation, restart your browser for the changes to take effect.',
      'cert.guide.mac1': 'Click <strong>Download Certificate</strong> above to save <code>ca.crt</code>',
      'cert.guide.mac2': 'Double-click the downloaded file — <strong>Keychain Access</strong> will open',
      'cert.guide.mac3': 'The certificate will appear in <strong>System</strong> keychain',
      'cert.guide.mac4': 'Double-click the certificate <strong>MasterHttpRelayVPN</strong>',
      'cert.guide.mac5': 'Expand <strong>Trust</strong> section',
      'cert.guide.mac6': 'Set <strong>When using this certificate</strong> to <strong>Always Trust</strong>',
      'cert.guide.mac7': 'Close the window and enter your password to confirm',
      'cert.guide.macTip': 'Or use terminal: <code>sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ca.crt</code>',
      'cert.guide.firefoxTip': 'Firefox uses its own certificate store — it ignores system certificates by default.',
      'cert.guide.chromeTip': 'If you still see warnings, try clearing the browser cache and DNS: <code>chrome://net-internals/#dns</code>',

      // Logs
      'logs.autoScroll': 'Auto-scroll',
      'logs.clear': 'Clear',
      'logs.empty': 'No logs yet. Connect to start logging.',

      // Language
      'lang.switch': '🇮🇷 فارسی',

      // Toasts
      'toast.settingsSaved': 'Settings saved successfully',
      'toast.settingsFailed': 'Failed to save settings',
      'toast.settingsReset': 'Settings reset to saved values',
      'toast.connected': 'Connected successfully',
      'toast.disconnected': 'Disconnected',
      'toast.connectFailed': 'Failed to connect',
      'toast.proxyStopped': 'Proxy stopped unexpectedly',
      'toast.certInstalled': 'Certificate installed successfully',
      'toast.certFailed': 'Certificate installation failed',
      'toast.certGenerated': 'New certificate generated successfully',
      'toast.certRegenFailed': 'Regeneration failed',
      'toast.certDownloadFailed': 'Certificate download failed',
      'toast.copied': 'Copied to clipboard',
      'toast.authKeySaved': 'Auth Key saved & Code.gs copied to clipboard!',
      'toast.enterAuthKey': 'Enter an Auth Key first',
      'toast.codeGsFailed': 'Could not generate Code.gs',
      'toast.duplicateId': 'This Deployment ID is already added',
    },

    fa: {
      // Sidebar
      'nav.home': 'خانه',
      'nav.setup': 'راه‌اندازی',
      'nav.settings': 'تنظیمات',
      'nav.logs': 'گزارش‌ها',
      'nav.cert': 'گواهی SSL',
      'sidebar.disconnected': 'قطع شده',
      'sidebar.connected': 'متصل',
      'sidebar.connecting': 'در حال اتصال...',

      // Home
      'home.disconnected': 'قطع شده',
      'home.connected': 'متصل',
      'home.connecting': 'در حال اتصال...',
      'home.connect': 'اتصال',
      'home.disconnect': 'قطع اتصال',
      'home.upload': 'آپلود',
      'home.download': 'دانلود',
      'home.uptime': 'مدت اتصال',
      'home.requests': 'درخواست‌ها',
      'home.httpProxy': 'پروکسی HTTP',
      'home.socks5Proxy': 'پروکسی SOCKS5',

      // Setup
      'setup.title': 'راهنمای راه‌اندازی',
      'setup.subtitle': 'این مراحل را برای پیکربندی پروکسی دنبال کنید',
      'setup.step1.title': 'کلید احراز هویت را انتخاب کنید',
      'setup.step1.desc': 'یک رمز عبور قوی انتخاب کنید. همین کلید باید در هر دو جا (اپلیکیشن و Apps Script) استفاده شود.',
      'setup.step1.placeholder': 'یک رمز عبور قوی وارد کنید',
      'setup.step1.btn': 'ذخیره کلید و کپی Code.gs',
      'setup.step2.title': 'ساخت Google Apps Script',
      'setup.step2.1': 'به <a href="#" onclick="app.openExternal(\'https://script.google.com\'); return false;" class="setup-link">script.google.com</a> بروید و روی <strong>New Project</strong> کلیک کنید',
      'setup.step2.2': 'تمام کد پیش‌فرض در ادیتور را پاک کنید',
      'setup.step2.3': 'کدی که در مرحله ۱ کپی کردید را بچسبانید <kbd>Ctrl+V</kbd>',
      'setup.step2.4': 'روی <strong>Deploy → New deployment</strong> کلیک کنید',
      'setup.step2.5': 'آیکون ⚙️ را بزنید → <strong>Web app</strong> را انتخاب کنید',
      'setup.step2.6': '<strong>Execute as:</strong> را روی <em>Me</em> بگذارید',
      'setup.step2.7': '<strong>Who has access:</strong> را روی <em>Anyone</em> بگذارید',
      'setup.step2.8': 'روی <strong>Deploy</strong> کلیک کنید و <strong>Deployment ID</strong> را کپی کنید',
      'setup.step2.tip': 'برای تقسیم بار (Load Balancing)، این فرآیند را با اکانت‌های مختلف گوگل تکرار کنید. همه دیپلویمنت‌ها باید از <strong>همان کلید احراز هویت</strong> استفاده کنند.',
      'setup.step3.title': 'اضافه کردن Deployment ID',
      'setup.step3.desc': 'Deployment ID را که از Apps Script کپی کردید اینجا بچسبانید:',
      'setup.step3.placeholder': 'Deployment ID را اینجا بچسبانید',
      'setup.step3.status': 'هنوز دیپلویمنتی اضافه نشده',
      'setup.step4.title': 'اتصال!',
      'setup.step4.desc': 'به تب <strong>خانه</strong> بروید و روی <strong>اتصال</strong> کلیک کنید. پروکسی شما آماده خواهد بود:',
      'setup.step4.note': 'تنظیمات پروکسی مرورگر یا سیستم خود را برای استفاده از این آدرس‌ها پیکربندی کنید.',

      // Settings
      'settings.title': 'تنظیمات',
      'settings.subtitle': 'پیکربندی اتصال VPN',
      'settings.relay': 'پیکربندی ریلی',
      'settings.authKey': 'کلید احراز هویت',
      'settings.authKeyPlaceholder': 'رمز عبور شما',
      'settings.scriptIds': 'شناسه‌های اسکریپت (Deployment IDs)',
      'settings.scriptIdsHint': '— چند تا اضافه کنید برای تقسیم بار',
      'settings.scriptIdPlaceholder': 'Deployment ID را بچسبانید و Enter بزنید',
      'settings.deploymentsCount': '{n} دیپلویمنت پیکربندی شده',
      'settings.googleIp': 'آی‌پی گوگل',
      'settings.frontDomain': 'دامنه فرانت',
      'settings.network': 'شبکه',
      'settings.listenHost': 'هاست گوش‌دهنده',
      'settings.httpPort': 'پورت HTTP',
      'settings.socks5Port': 'پورت SOCKS5',
      'settings.socks5Enabled': 'SOCKS5 فعال',
      'settings.logLevel': 'سطح گزارش',
      'settings.verifySSL': 'تأیید SSL',
      'settings.hostRules': 'قوانین هاست',
      'settings.blockedHosts': 'هاست‌های مسدود',
      'settings.blockedHostsHint': '(هر خط یکی)',
      'settings.bypassHosts': 'هاست‌های بایپس',
      'settings.bypassHostsHint': '(هر خط یکی، اتصال مستقیم)',
      'settings.reset': 'بازنشانی',
      'settings.save': 'ذخیره تنظیمات',

      // Logs
      'logs.title': 'گزارش‌ها',
      'logs.autoScroll': 'اسکرول خودکار',
      'logs.clear': 'پاک کردن',
      'logs.empty': 'هنوز گزارشی نیست. برای شروع متصل شوید.',
      'logs.cleared': 'گزارش‌ها پاک شد.',

      // Certificate
      'cert.title': 'گواهی SSL',
      'cert.subtitle': 'مدیریت گواهی CA برای رهگیری HTTPS',
      'cert.checking': 'در حال بررسی...',
      'cert.verifying': 'بررسی گواهی CA',
      'cert.noCert': 'گواهی وجود ندارد',
      'cert.noCertDetail': 'برای ساخت گواهی جدید روی "بازسازی" کلیک کنید',
      'cert.trusted': 'گواهی معتبر است',
      'cert.trustedDetail': 'CA در سیستم نصب و معتبر شده است',
      'cert.notTrusted': 'گواهی معتبر نیست',
      'cert.notTrustedDetail': 'گواهی را دانلود و با راهنمای زیر نصب کنید',
      'cert.download': 'دانلود گواهی',
      'cert.checkStatus': 'بررسی وضعیت',
      'cert.regenerate': 'بازسازی',
      'cert.installGuide': 'راهنمای نصب',
      'cert.whyNeeded': 'چرا این لازم است؟',
      'cert.whyDesc': 'در حالت Apps Script، پروکسی ترافیک HTTPS را به صورت محلی رمزگشایی و دوباره رمزنگاری می‌کند. یک گواهی CA معتبر از نمایش هشدارهای امنیتی در مرورگر جلوگیری می‌کند.',
      'cert.whyLocal': 'گواهی <strong>فقط محلی</strong> است و هرگز از دستگاه شما خارج نمی‌شود',
      'cert.whyAuto': 'گواهی جدید به صورت خودکار در اولین اجرا ساخته می‌شود',
      'cert.whyRegen': 'می‌توانید هر زمان از این صفحه گواهی را <strong>بازسازی</strong> کنید',
      'cert.whyValid': 'هر گواهی <strong>۱۰ سال</strong> اعتبار دارد',

      // Cert Guides
      'cert.guide.win1': 'روی <strong>دانلود گواهی</strong> در بالا کلیک کنید تا فایل <code>ca.crt</code> ذخیره شود',
      'cert.guide.win2': 'روی فایل <code>ca.crt</code> دانلود شده دابل‌کلیک کنید',
      'cert.guide.win3': 'روی <strong>Install Certificate</strong> کلیک کنید',
      'cert.guide.win4': '<strong>Local Machine</strong> (یا Current User) را انتخاب کنید',
      'cert.guide.win5': '<strong>Place all certificates in the following store</strong> را انتخاب کنید',
      'cert.guide.win6': 'روی <strong>Browse</strong> کلیک کنید و <strong>Trusted Root Certification Authorities</strong> را انتخاب کنید',
      'cert.guide.win7': 'روی <strong>OK</strong>، سپس <strong>Next</strong>، سپس <strong>Finish</strong> کلیک کنید',
      'cert.guide.winTip': 'بعد از نصب، مرورگر خود را ری‌استارت کنید تا تغییرات اعمال شود.',
      'cert.guide.mac1': 'روی <strong>دانلود گواهی</strong> در بالا کلیک کنید تا فایل <code>ca.crt</code> ذخیره شود',
      'cert.guide.mac2': 'روی فایل دانلود شده دابل‌کلیک کنید — <strong>Keychain Access</strong> باز می‌شود',
      'cert.guide.mac3': 'گواهی در کیچین <strong>System</strong> ظاهر می‌شود',
      'cert.guide.mac4': 'روی گواهی <strong>MasterHttpRelayVPN</strong> دابل‌کلیک کنید',
      'cert.guide.mac5': 'بخش <strong>Trust</strong> را باز کنید',
      'cert.guide.mac6': '<strong>When using this certificate</strong> را روی <strong>Always Trust</strong> بگذارید',
      'cert.guide.mac7': 'پنجره را ببندید و رمز عبور خود را وارد کنید',
      'cert.guide.macTip': 'یا از ترمینال استفاده کنید: <code>sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ca.crt</code>',
      'cert.guide.firefoxTip': 'فایرفاکس از فروشگاه گواهی مخصوص خودش استفاده می‌کند و گواهی‌های سیستم را نادیده می‌گیرد.',
      'cert.guide.chromeTip': 'اگر همچنان هشدار می‌بینید، کش مرورگر و DNS را پاک کنید: <code>chrome://net-internals/#dns</code>',

      // Logs
      'logs.autoScroll': 'اسکرول خودکار',
      'logs.clear': 'پاک کردن',
      'logs.empty': 'هنوز گزارشی نیست. برای شروع متصل شوید.',
      'toast.settingsSaved': 'تنظیمات با موفقیت ذخیره شد',
      'toast.settingsFailed': 'ذخیره تنظیمات ناموفق بود',
      'toast.settingsReset': 'تنظیمات به مقادیر ذخیره‌شده بازگشت',
      'toast.connected': 'اتصال موفق',
      'toast.disconnected': 'قطع شد',
      'toast.connectFailed': 'اتصال ناموفق بود',
      'toast.proxyStopped': 'پروکسی به طور غیرمنتظره متوقف شد',
      'toast.certInstalled': 'گواهی با موفقیت نصب شد',
      'toast.certFailed': 'نصب گواهی ناموفق بود',
      'toast.certGenerated': 'گواهی جدید با موفقیت ساخته شد',
      'toast.certRegenFailed': 'بازسازی ناموفق بود',
      'toast.certDownloadFailed': 'دانلود گواهی ناموفق بود',
      'toast.copied': 'در کلیپ‌بورد کپی شد',
      'toast.authKeySaved': 'کلید ذخیره شد و Code.gs کپی شد!',
      'toast.enterAuthKey': 'ابتدا کلید احراز هویت را وارد کنید',
      'toast.codeGsFailed': 'ساخت Code.gs ناموفق بود',
      'toast.duplicateId': 'این Deployment ID قبلاً اضافه شده',

      // Language
      'lang.switch': '🇬🇧 English',
    },
  },

  t(key, params) {
    const val = this.translations[this.currentLang]?.[key] || this.translations.en[key] || key;
    if (params) {
      return val.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? _);
    }
    return val;
  },

  setLang(lang) {
    this.currentLang = lang;
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');

    // Update all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else {
        el.innerHTML = val;
      }
    });

    // Update language button
    const langBtn = document.getElementById('lang-switch-btn');
    if (langBtn) langBtn.innerHTML = this.t('lang.switch');

    // Persist choice
    try { localStorage.setItem('mastervpn-lang', lang); } catch(e) {}
  },

  toggle() {
    this.setLang(this.currentLang === 'en' ? 'fa' : 'en');
  },

  init() {
    try {
      const saved = localStorage.getItem('mastervpn-lang');
      if (saved && this.translations[saved]) {
        this.setLang(saved);
        return;
      }
    } catch(e) {}
    // Default to English
    this.setLang('en');
  }
};
