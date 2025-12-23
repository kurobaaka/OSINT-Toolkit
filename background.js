// Создание контекстного меню при установке расширения
chrome.runtime.onInstalled.addListener(() => {
  // Поиск выделенного текста
  chrome.contextMenus.create({
    id: 'osint-search-google',
    title: '🔍 OSINT: Google поиск "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'osint-search-github',
    title: '💻 OSINT: GitHub "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'osint-search-twitter',
    title: '🐦 OSINT: Twitter/X "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'osint-search-linkedin',
    title: '💼 OSINT: LinkedIn "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'osint-separator-1',
    type: 'separator',
    contexts: ['selection']
  });

  // Анализ доменов/IP
  chrome.contextMenus.create({
    id: 'osint-whois',
    title: '📋 OSINT: WHOIS "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'osint-shodan',
    title: '🌐 OSINT: Shodan "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'osint-virustotal',
    title: '🛡️ OSINT: VirusTotal "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'osint-separator-2',
    type: 'separator',
    contexts: ['selection']
  });

  // Email проверка
  chrome.contextMenus.create({
    id: 'osint-email-check',
    title: '📧 OSINT: Проверить Email "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'osint-separator-3',
    type: 'separator',
    contexts: ['selection']
  });

  // Быстрый парсинг
  chrome.contextMenus.create({
    id: 'osint-quick-parse',
    title: '🚀 OSINT: Парсить страницу',
    contexts: ['page']
  });

  // Поиск по изображению
  chrome.contextMenus.create({
    id: 'osint-image-search',
    title: '🔍 OSINT: Google Images',
    contexts: ['image']
  });

  chrome.contextMenus.create({
    id: 'osint-image-tineye',
    title: '🖼️ OSINT: TinEye',
    contexts: ['image']
  });

  chrome.contextMenus.create({
    id: 'osint-image-yandex',
    title: '🔎 OSINT: Yandex Images',
    contexts: ['image']
  });
});

// Обработка кликов по контекстному меню
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const query = encodeURIComponent(info.selectionText || '');
  const imageUrl = encodeURIComponent(info.srcUrl || '');
  let url = '';

  switch (info.menuItemId) {
    // Поиск
    case 'osint-search-google':
      url = `https://www.google.com/search?q=${query}`;
      break;
    case 'osint-search-github':
      url = `https://github.com/search?q=${query}&type=users`;
      break;
    case 'osint-search-twitter':
      url = `https://twitter.com/search?q=${query}`;
      break;
    case 'osint-search-linkedin':
      url = `https://www.linkedin.com/search/results/people/?keywords=${query}`;
      break;
    
    // Анализ
    case 'osint-whois':
      url = `https://who.is/whois/${query}`;
      break;
    case 'osint-shodan':
      url = `https://www.shodan.io/search?query=${query}`;
      break;
    case 'osint-virustotal':
      url = `https://www.virustotal.com/gui/search/${query}`;
      break;
    
    // Email
    case 'osint-email-check':
      checkEmailIntelligence(info.selectionText);
      return;
    
    // Изображения
    case 'osint-image-search':
      url = `https://www.google.com/searchbyimage?image_url=${imageUrl}`;
      break;
    case 'osint-image-tineye':
      url = `https://tineye.com/search?url=${imageUrl}`;
      break;
    case 'osint-image-yandex':
      url = `https://yandex.com/images/search?rpt=imageview&url=${imageUrl}`;
      break;
    
    // Парсинг
    case 'osint-quick-parse':
      parseCurrentPage(tab.id);
      return;
  }

  if (url) {
    chrome.tabs.create({ url });
  }
});

// Функция проверки email через множественные сервисы
async function checkEmailIntelligence(email) {
  const results = {
    email: email,
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Have I Been Pwned
  try {
    const pwnedResponse = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`,
      { headers: { 'User-Agent': 'OSINT-Toolkit-Chrome' } }
    );
    
    if (pwnedResponse.status === 404) {
      results.checks.haveibeenpwned = { safe: true, breaches: 0 };
    } else if (pwnedResponse.ok) {
      const data = await pwnedResponse.json();
      results.checks.haveibeenpwned = { safe: false, breaches: data.length, details: data.map(b => b.Name) };
    }
  } catch (error) {
    results.checks.haveibeenpwned = { error: error.message };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  results.checks.format = { valid: emailRegex.test(email) };

  // Открываем вкладку с результатами
  const resultsUrl = chrome.runtime.getURL('results.html');
  chrome.tabs.create({ url: resultsUrl }, (tab) => {
    // Передаем результаты во вновь открытую вкладку
    chrome.storage.local.set({ emailCheckResults: results });
  });
}

// Функция парсинга текущей страницы
function parseCurrentPage(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: () => {
      const pageText = document.body.innerText;
      const pageHtml = document.body.innerHTML;
      
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const urlRegex = /https?:\/\/[^\s<>"]+/g;
      
      const socialPatterns = {
        twitter: /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/g,
        linkedin: /linkedin\.com\/in\/([a-zA-Z0-9-]+)/g,
        github: /github\.com\/([a-zA-Z0-9-]+)/g,
        instagram: /instagram\.com\/([a-zA-Z0-9_.]+)/g,
        telegram: /t\.me\/([a-zA-Z0-9_]+)/g,
        facebook: /facebook\.com\/([a-zA-Z0-9.]+)/g
      };
      
      const emails = [...new Set(pageText.match(emailRegex) || [])];
      const phones = [...new Set(pageText.match(phoneRegex) || [])];
      const urls = [...new Set(pageHtml.match(urlRegex) || [])].slice(0, 50);
      
      const socials = {};
      for (const [platform, regex] of Object.entries(socialPatterns)) {
        const matches = [...pageHtml.matchAll(regex)];
        const accounts = [...new Set(matches.map(m => m[1]))];
        if (accounts.length > 0) {
          socials[platform] = accounts;
        }
      }
      
      return {
        url: window.location.href,
        title: document.title,
        emails,
        phones,
        urls,
        socials,
        metadata: {
          description: document.querySelector('meta[name="description"]')?.content || '',
          keywords: document.querySelector('meta[name="keywords"]')?.content || '',
          author: document.querySelector('meta[name="author"]')?.content || ''
        },
        timestamp: new Date().toISOString()
      };
    }
  }, (results) => {
    if (results && results[0]) {
      // Сохраняем результаты и открываем страницу с результатами
      chrome.storage.local.set({ lastParseResults: results[0].result });
      
      const resultsUrl = chrome.runtime.getURL('results.html');
      chrome.tabs.create({ url: resultsUrl });
    }
  });
}

// Горячие клавиши
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-osint-popup') {
    chrome.action.openPopup();
  } else if (command === 'quick-parse') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        parseCurrentPage(tabs[0].id);
      }
    });
  }
});

// Обработка сообщений от content script и popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'parseComplete') {
    chrome.storage.local.set({ lastParseResults: request.data });
    sendResponse({ success: true });
  }
  return true;
});