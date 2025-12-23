// Content script для автоматического парсинга страниц

// Создание плавающей кнопки OSINT
function createOSINTButton() {
    const button = document.createElement('div');
    button.id = 'osint-float-btn';
    button.innerHTML = '🔍';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 24px;
      z-index: 999999;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
    
    button.addEventListener('click', () => {
      showQuickParseMenu();
    });
    
    document.body.appendChild(button);
  }
  
  // Быстрое меню парсинга
  function showQuickParseMenu() {
    const existingMenu = document.getElementById('osint-quick-menu');
    if (existingMenu) {
      existingMenu.remove();
      return;
    }
    
    const menu = document.createElement('div');
    menu.id = 'osint-quick-menu';
    menu.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: white;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
      z-index: 999999;
      min-width: 250px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    menu.innerHTML = `
      <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">🔍 OSINT Quick Parse</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button id="osint-parse-emails" style="padding: 10px; border: none; background: #667eea; color: white; border-radius: 6px; cursor: pointer; font-size: 14px;">📧 Найти Email</button>
        <button id="osint-parse-phones" style="padding: 10px; border: none; background: #764ba2; color: white; border-radius: 6px; cursor: pointer; font-size: 14px;">📞 Найти Телефоны</button>
        <button id="osint-parse-socials" style="padding: 10px; border: none; background: #f093fb; color: white; border-radius: 6px; cursor: pointer; font-size: 14px;">🌐 Соц. сети</button>
        <button id="osint-parse-all" style="padding: 10px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 6px; cursor: pointer; font-size: 14px;">🚀 Полный парсинг</button>
      </div>
      <div id="osint-parse-result" style="margin-top: 10px; max-height: 200px; overflow-y: auto; font-size: 12px; color: #333;"></div>
    `;
    
    document.body.appendChild(menu);
    
    // Обработчики кнопок
    document.getElementById('osint-parse-emails').addEventListener('click', () => {
      const emails = parseEmails();
      showParseResult('Email адреса', emails);
    });
    
    document.getElementById('osint-parse-phones').addEventListener('click', () => {
      const phones = parsePhones();
      showParseResult('Телефоны', phones);
    });
    
    document.getElementById('osint-parse-socials').addEventListener('click', () => {
      const socials = parseSocialMedia();
      showParseResult('Социальные сети', socials, true);
    });
    
    document.getElementById('osint-parse-all').addEventListener('click', () => {
      const data = parseFullPage();
      showFullParseResult(data);
    });
    
    // Закрытие при клике вне меню
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target.id !== 'osint-float-btn') {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 100);
  }
  
  // Функции парсинга
  function parseEmails() {
    const text = document.body.innerText;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return [...new Set(text.match(emailRegex) || [])];
  }
  
  function parsePhones() {
    const text = document.body.innerText;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    return [...new Set(text.match(phoneRegex) || [])];
  }
  
  function parseSocialMedia() {
    const html = document.body.innerHTML;
    const patterns = {
      'Twitter/X': /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/g,
      'LinkedIn': /linkedin\.com\/in\/([a-zA-Z0-9-]+)/g,
      'GitHub': /github\.com\/([a-zA-Z0-9-]+)/g,
      'Instagram': /instagram\.com\/([a-zA-Z0-9_.]+)/g,
      'Telegram': /t\.me\/([a-zA-Z0-9_]+)/g,
      'Facebook': /facebook\.com\/([a-zA-Z0-9.]+)/g
    };
    
    const results = {};
    for (const [platform, regex] of Object.entries(patterns)) {
      const matches = [...html.matchAll(regex)];
      const accounts = [...new Set(matches.map(m => m[1]))];
      if (accounts.length > 0) {
        results[platform] = accounts;
      }
    }
    return results;
  }
  
  function parseFullPage() {
    return {
      url: window.location.href,
      title: document.title,
      emails: parseEmails(),
      phones: parsePhones(),
      socials: parseSocialMedia(),
      metadata: {
        description: document.querySelector('meta[name="description"]')?.content || '',
        keywords: document.querySelector('meta[name="keywords"]')?.content || '',
        author: document.querySelector('meta[name="author"]')?.content || ''
      }
    };
  }
  
  // Отображение результатов
  function showParseResult(title, data, isObject = false) {
    const resultDiv = document.getElementById('osint-parse-result');
    
    if (isObject) {
      let html = `<strong>${title}:</strong><br>`;
      for (const [key, values] of Object.entries(data)) {
        html += `<div style="margin: 5px 0;"><strong>${key}:</strong> ${values.join(', ')}</div>`;
      }
      resultDiv.innerHTML = html;
    } else {
      if (data.length === 0) {
        resultDiv.innerHTML = `<strong>${title}:</strong><br>Ничего не найдено`;
      } else {
        resultDiv.innerHTML = `<strong>${title} (${data.length}):</strong><br>${data.join('<br>')}`;
      }
    }
  }
  
  function showFullParseResult(data) {
    const resultDiv = document.getElementById('osint-parse-result');
    let html = '<strong>Полный парсинг:</strong><br>';
    
    if (data.emails.length > 0) {
      html += `<div style="margin: 5px 0;"><strong>📧 Email (${data.emails.length}):</strong> ${data.emails.slice(0, 5).join(', ')}${data.emails.length > 5 ? '...' : ''}</div>`;
    }
    
    if (data.phones.length > 0) {
      html += `<div style="margin: 5px 0;"><strong>📞 Телефоны (${data.phones.length}):</strong> ${data.phones.slice(0, 5).join(', ')}${data.phones.length > 5 ? '...' : ''}</div>`;
    }
    
    if (Object.keys(data.socials).length > 0) {
      html += '<div style="margin: 5px 0;"><strong>🌐 Соц. сети:</strong></div>';
      for (const [platform, accounts] of Object.entries(data.socials)) {
        html += `<div style="margin-left: 10px;">${platform}: ${accounts.slice(0, 3).join(', ')}${accounts.length > 3 ? '...' : ''}</div>`;
      }
    }
    
    resultDiv.innerHTML = html;
    
    // Кнопка экспорта
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📥 Экспортировать JSON';
    exportBtn.style.cssText = 'margin-top: 10px; padding: 8px; width: 100%; border: none; background: #4CAF50; color: white; border-radius: 6px; cursor: pointer;';
    exportBtn.addEventListener('click', () => {
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `osint-${Date.now()}.json`;
      a.click();
    });
    
    resultDiv.appendChild(exportBtn);
  }
  
  // Автоматическое определение типа страницы и подсказки
  function detectPageType() {
    const url = window.location.href;
    
    if (url.includes('linkedin.com')) {
      return { type: 'LinkedIn Profile', suggestion: 'Парсинг контактов и опыта работы' };
    } else if (url.includes('github.com')) {
      return { type: 'GitHub Profile', suggestion: 'Парсинг репозиториев и активности' };
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      return { type: 'Twitter/X Profile', suggestion: 'Парсинг твитов и подписчиков' };
    }
    
    return null;
  }
  
  // Инициализация
  if (document.body) {
    createOSINTButton();
  } else {
    window.addEventListener('load', createOSINTButton);
  }
  
  // Слушатель сообщений от popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'parsePage') {
      const data = parseFullPage();
      sendResponse(data);
    }
    return true;
  });