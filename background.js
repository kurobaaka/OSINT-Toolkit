// Создание контекстного меню при установке расширения
chrome.runtime.onInstalled.addListener(() => {
    // Поиск выделенного текста
    chrome.contextMenus.create({
      id: 'osint-search-google',
      title: 'OSINT: Искать в Google "%s"',
      contexts: ['selection']
    });
  
    chrome.contextMenus.create({
      id: 'osint-search-github',
      title: 'OSINT: Искать на GitHub "%s"',
      contexts: ['selection']
    });
  
    chrome.contextMenus.create({
      id: 'osint-search-twitter',
      title: 'OSINT: Искать в Twitter "%s"',
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
      title: 'OSINT: WHOIS "%s"',
      contexts: ['selection']
    });
  
    chrome.contextMenus.create({
      id: 'osint-shodan',
      title: 'OSINT: Shodan "%s"',
      contexts: ['selection']
    });
  
    chrome.contextMenus.create({
      id: 'osint-virustotal',
      title: 'OSINT: VirusTotal "%s"',
      contexts: ['selection']
    });
  
    // Поиск по изображению
    chrome.contextMenus.create({
      id: 'osint-image-search',
      title: 'OSINT: Обратный поиск изображения',
      contexts: ['image']
    });
  
    chrome.contextMenus.create({
      id: 'osint-image-tineye',
      title: 'OSINT: TinEye поиск',
      contexts: ['image']
    });
  });
  
  // Обработка кликов по контекстному меню
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    const query = encodeURIComponent(info.selectionText || '');
    const imageUrl = encodeURIComponent(info.srcUrl || '');
    let url = '';
  
    switch (info.menuItemId) {
      case 'osint-search-google':
        url = `https://www.google.com/search?q=${query}`;
        break;
      case 'osint-search-github':
        url = `https://github.com/search?q=${query}&type=users`;
        break;
      case 'osint-search-twitter':
        url = `https://twitter.com/search?q=${query}`;
        break;
      case 'osint-whois':
        url = `https://who.is/whois/${query}`;
        break;
      case 'osint-shodan':
        url = `https://www.shodan.io/search?query=${query}`;
        break;
      case 'osint-virustotal':
        url = `https://www.virustotal.com/gui/search/${query}`;
        break;
      case 'osint-image-search':
        url = `https://www.google.com/searchbyimage?image_url=${imageUrl}`;
        break;
      case 'osint-image-tineye':
        url = `https://tineye.com/search?url=${imageUrl}`;
        break;
    }
  
    if (url) {
      chrome.tabs.create({ url });
    }
  });
  
  // Горячие клавиши (опционально)
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'open-osint-popup') {
      chrome.action.openPopup();
    }
  });