(function() {
    chrome.storage.local.get(['selectedStyle'], (result) => {
        const style = result.selectedStyle || 'anomaly'; 
        const gifName = style === 'anime' ? "anime_dance.gif" : "rat_dance.gif";
        
        document.documentElement.setAttribute('data-rat-gif-url', chrome.runtime.getURL(gifName));
        document.documentElement.setAttribute('data-vis-style', style); 

        // 1. Загружаем ядро
        const core = document.createElement('script');
        core.src = chrome.runtime.getURL('core.js');
        document.head.appendChild(core);

        // 2. Загружаем скрипт конкретного стиля
        const styleScript = document.createElement('script');
        styleScript.src = chrome.runtime.getURL(`styles/${style}.js`);
        document.head.appendChild(styleScript);
    });
})();