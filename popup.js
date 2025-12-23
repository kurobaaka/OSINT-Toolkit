// Переключение вкладок
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Убираем активный класс со всех вкладок
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Добавляем активный класс к выбранной вкладке
      tab.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });
  
  // Поисковые инструменты
  const searchUrls = {
    google: (q) => `https://www.google.com/search?q=${q}`,
    github: (q) => `https://github.com/search?q=${q}&type=users`,
    twitter: (q) => `https://twitter.com/search?q=${q}&f=user`,
    linkedin: (q) => `https://www.linkedin.com/search/results/people/?keywords=${q}`,
    instagram: (q) => `https://www.instagram.com/${q}/`,
    reddit: (q) => `https://www.reddit.com/search/?q=${q}`
  };
  
  // Инструменты анализа
  const analyzeUrls = {
    whois: (q) => `https://who.is/whois/${q}`,
    dns: (q) => `https://mxtoolbox.com/SuperTool.aspx?action=a:${q}`,
    shodan: (q) => `https://www.shodan.io/search?query=${q}`,
    virustotal: (q) => `https://www.virustotal.com/gui/search/${q}`,
    wayback: (q) => `https://web.archive.org/web/*/${q}`,
    crt: (q) => `https://crt.sh/?q=${q}`
  };
  
  // Обработчики поисковых кнопок
  document.querySelectorAll('[data-search]').forEach(btn => {
    btn.addEventListener('click', () => {
      const searchType = btn.dataset.search;
      const query = document.getElementById('usernameInput').value.trim();
      
      if (!query) {
        alert('Введите username или email для поиска');
        return;
      }
      
      const url = searchUrls[searchType](encodeURIComponent(query));
      chrome.tabs.create({ url });
    });
  });
  
  // Обработчики кнопок анализа
  document.querySelectorAll('[data-analyze]').forEach(btn => {
    btn.addEventListener('click', () => {
      const analyzeType = btn.dataset.analyze;
      const query = document.getElementById('domainInput').value.trim();
      
      if (!query) {
        alert('Введите домен или IP для анализа');
        return;
      }
      
      const url = analyzeUrls[analyzeType](encodeURIComponent(query));
      chrome.tabs.create({ url });
    });
  });
  
  // Enter для быстрого поиска
  document.getElementById('usernameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.querySelector('[data-search="google"]').click();
    }
  });
  
  document.getElementById('domainInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.querySelector('[data-analyze="whois"]').click();
    }
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
  
  // Сохранение при изменении
  document.getElementById('usernameInput').addEventListener('input', (e) => {
    chrome.storage.local.set({ lastUsername: e.target.value });
  });
  
  document.getElementById('domainInput').addEventListener('input', (e) => {
    chrome.storage.local.set({ lastDomain: e.target.value });
  });