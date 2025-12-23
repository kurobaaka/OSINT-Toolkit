// Тема
const themeToggle = document.getElementById('themeToggle');
let isDarkTheme = false;

// Загрузка сохраненной темы
chrome.storage.local.get(['theme'], (result) => {
  if (result.theme === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggle.textContent = '☀️';
    isDarkTheme = true;
  }
});

themeToggle.addEventListener('click', () => {
  isDarkTheme = !isDarkTheme;
  document.body.classList.toggle('dark-theme');
  themeToggle.textContent = isDarkTheme ? '☀️' : '🌙';
  chrome.storage.local.set({ theme: isDarkTheme ? 'dark' : 'light' });
});

// Переключение вкладок
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tabName).classList.add('active');
  });
});

// Поисковые URL
const searchUrls = {
  google: (q) => `https://www.google.com/search?q=${q}`,
  github: (q) => `https://github.com/search?q=${q}&type=users`,
  twitter: (q) => `https://twitter.com/search?q=${q}&f=user`,
  linkedin: (q) => `https://www.linkedin.com/search/results/people/?keywords=${q}`,
  instagram: (q) => `https://www.instagram.com/${q}/`,
  reddit: (q) => `https://www.reddit.com/search/?q=${q}`,
  telegram: (q) => `https://t.me/${q}`,
  facebook: (q) => `https://www.facebook.com/search/people/?q=${q}`,
  tiktok: (q) => `https://www.tiktok.com/search/user?q=${q}`,
  youtube: (q) => `https://www.youtube.com/results?search_query=${q}`
};

const analyzeUrls = {
  whois: (q) => `https://who.is/whois/${q}`,
  dns: (q) => `https://mxtoolbox.com/SuperTool.aspx?action=a:${q}`,
  shodan: (q) => `https://www.shodan.io/search?query=${q}`,
  virustotal: (q) => `https://www.virustotal.com/gui/search/${q}`,
  wayback: (q) => `https://web.archive.org/web/*/${q}`,
  crt: (q) => `https://crt.sh/?q=${q}`
};

// Обработчики поиска
document.querySelectorAll('[data-search]').forEach(btn => {
  btn.addEventListener('click', () => {
    const searchType = btn.dataset.search;
    const query = document.getElementById('usernameInput').value.trim();
    if (!query) {
      alert('Введите username или email');
      return;
    }
    const url = searchUrls[searchType](encodeURIComponent(query));
    chrome.tabs.create({ url });
  });
});

document.querySelectorAll('[data-analyze]').forEach(btn => {
  btn.addEventListener('click', () => {
    const analyzeType = btn.dataset.analyze;
    const query = document.getElementById('domainInput').value.trim();
    if (!query) {
      alert('Введите домен или IP');
      return;
    }
    const url = analyzeUrls[analyzeType](encodeURIComponent(query));
    chrome.tabs.create({ url });
  });
});

// API функции
async function checkHaveIBeenPwned(email) {
  try {
    const response = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`, {
      headers: { 'User-Agent': 'OSINT-Toolkit' }
    });
    
    if (response.status === 404) {
      return { safe: true, message: 'Email не найден в утечках данных ✅' };
    }
    
    const data = await response.json();
    return { 
      safe: false, 
      breaches: data.length,
      message: `Найдено утечек: ${data.length} ⚠️`,
      details: data.map(b => b.Name).join(', ')
    };
  } catch (error) {
    return { error: 'Ошибка проверки: ' + error.message };
  }
}

async function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Невалидный формат email' };
  }
  
  const domain = email.split('@')[1];
  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    const data = await response.json();
    
    if (data.Answer && data.Answer.length > 0) {
      return { 
        valid: true, 
        message: 'Email валидный ✅',
        mx: data.Answer.map(a => a.data).join(', ')
      };
    }
    return { valid: false, message: 'MX записи не найдены' };
  } catch (error) {
    return { error: 'Ошибка валидации: ' + error.message };
  }
}

// API обработчики
document.getElementById('haveibeenpwnedBtn').addEventListener('click', async () => {
  const email = document.getElementById('apiEmailInput').value.trim();
  if (!email) {
    alert('Введите email');
    return;
  }
  
  const btn = document.getElementById('haveibeenpwnedBtn');
  btn.classList.add('loading');
  btn.innerHTML = 'Проверка... <span class="loading-spinner"></span>';
  
  const result = await checkHaveIBeenPwned(email);
  displayApiResult(result);
  
  btn.classList.remove('loading');
  btn.textContent = 'Pwned?';
});

document.getElementById('emailValidateBtn').addEventListener('click', async () => {
  const email = document.getElementById('apiEmailInput').value.trim();
  if (!email) {
    alert('Введите email');
    return;
  }
  
  const btn = document.getElementById('emailValidateBtn');
  btn.classList.add('loading');
  btn.innerHTML = 'Проверка... <span class="loading-spinner"></span>';
  
  const result = await validateEmail(email);
  displayApiResult(result);
  
  btn.classList.remove('loading');
  btn.textContent = 'Validate';
});

document.getElementById('hunterBtn').addEventListener('click', () => {
  chrome.storage.local.get(['hunterApiKey'], (result) => {
    const email = document.getElementById('apiEmailInput').value.trim();
    if (!email) {
      alert('Введите email');
      return;
    }
    
    if (!result.hunterApiKey) {
      alert('Необходим API ключ Hunter.io. Настройте в разделе настроек.');
      return;
    }
    
    const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${result.hunterApiKey}`;
    chrome.tabs.create({ url: `https://hunter.io/verify/${email}` });
  });
});

document.getElementById('emailrepBtn').addEventListener('click', () => {
  const email = document.getElementById('apiEmailInput').value.trim();
  if (!email) {
    alert('Введите email');
    return;
  }
  chrome.tabs.create({ url: `https://emailrep.io/${email}` });
});

document.getElementById('ipinfoBtn').addEventListener('click', () => {
  const domain = document.getElementById('apiDomainInput').value.trim();
  if (!domain) {
    alert('Введите домен или IP');
    return;
  }
  chrome.tabs.create({ url: `https://ipinfo.io/${domain}` });
});

document.getElementById('securitytrailsBtn').addEventListener('click', () => {
  const domain = document.getElementById('apiDomainInput').value.trim();
  if (!domain) {
    alert('Введите домен');
    return;
  }
  chrome.tabs.create({ url: `https://securitytrails.com/domain/${domain}/dns` });
});

function displayApiResult(result) {
  const resultDiv = document.getElementById('apiResult');
  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
}

// Парсер страницы
document.getElementById('parseCurrentBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: parsePage
  }, (results) => {
    if (results && results[0]) {
      displayParserResult(results[0].result);
    }
  });
});

function parsePage() {
  const pageText = document.body.innerText;
  const pageHtml = document.body.innerHTML;
  
  // Регулярные выражения
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const urlRegex = /https?:\/\/[^\s<>"]+/g;
  
  // Социальные сети
  const socialPatterns = {
    twitter: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/g,
    linkedin: /linkedin\.com\/in\/([a-zA-Z0-9-]+)/g,
    github: /github\.com\/([a-zA-Z0-9-]+)/g,
    instagram: /instagram\.com\/([a-zA-Z0-9_.]+)/g,
    telegram: /t\.me\/([a-zA-Z0-9_]+)/g
  };
  
  const emails = [...new Set(pageText.match(emailRegex) || [])];
  const phones = [...new Set(pageText.match(phoneRegex) || [])];
  const urls = [...new Set(pageHtml.match(urlRegex) || [])];
  
  const socials = {};
  for (const [platform, regex] of Object.entries(socialPatterns)) {
    const matches = [...pageHtml.matchAll(regex)];
    socials[platform] = [...new Set(matches.map(m => m[1]))];
  }
  
  return {
    url: window.location.href,
    title: document.title,
    emails,
    phones,
    urls: urls.slice(0, 20),
    socials,
    metadata: {
      description: document.querySelector('meta[name="description"]')?.content || '',
      keywords: document.querySelector('meta[name="keywords"]')?.content || ''
    }
  };
}

function displayParserResult(data) {
  const resultDiv = document.getElementById('parserResult');
  resultDiv.style.display = 'block';
  
  let html = `<h4>📄 ${data.title}</h4>`;
  
  if (data.emails.length > 0) {
    html += `<h4>📧 Email (${data.emails.length}):</h4><ul>`;
    data.emails.forEach(email => html += `<li>${email}</li>`);
    html += '</ul>';
  }
  
  if (data.phones.length > 0) {
    html += `<h4>📞 Телефоны (${data.phones.length}):</h4><ul>`;
    data.phones.forEach(phone => html += `<li>${phone}</li>`);
    html += '</ul>';
  }
  
  if (Object.values(data.socials).some(arr => arr.length > 0)) {
    html += '<h4>🌐 Социальные сети:</h4><ul>';
    for (const [platform, accounts] of Object.entries(data.socials)) {
      if (accounts.length > 0) {
        html += `<li><strong>${platform}:</strong> ${accounts.join(', ')}</li>`;
      }
    }
    html += '</ul>';
  }
  
  resultDiv.innerHTML = html;
  
  // Сохранение для экспорта
  chrome.storage.local.set({ lastParseResult: data });
}

document.getElementById('parseExportBtn').addEventListener('click', () => {
  chrome.storage.local.get(['lastParseResult'], (result) => {
    if (!result.lastParseResult) {
      alert('Сначала выполните парсинг');
      return;
    }
    
    const dataStr = JSON.stringify(result.lastParseResult, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osint-parse-${Date.now()}.json`;
    a.click();
  });
});

document.getElementById('apiSettingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Сохранение последних запросов
chrome.storage.local.get(['lastUsername', 'lastDomain'], (result) => {
  if (result.lastUsername) {
    document.getElementById('usernameInput').value = result.lastUsername;
  }
  if (result.lastDomain) {
    document.getElementById('domainInput').value = result.lastDomain;
  }
});

document.getElementById('usernameInput').addEventListener('input', (e) => {
  chrome.storage.local.set({ lastUsername: e.target.value });
});

document.getElementById('domainInput').addEventListener('input', (e) => {
  chrome.storage.local.set({ lastDomain: e.target.value });
});