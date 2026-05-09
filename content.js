// content.js (ISOLATED мир)
(function() {
    try {
        const ratGifUrl = chrome.runtime.getURL("rat_dance.gif");
        const mainWorldScriptUrl = chrome.runtime.getURL("main_world.js");

        // Передаем URL гифки через атрибут, чтобы main-world.js его увидел
        document.documentElement.setAttribute('data-rat-gif-url', ratGifUrl);

        const script = document.createElement('script');
        script.src = mainWorldScriptUrl;
        
        // Важно: дожидаемся готовности документа
        (document.head || document.documentElement).appendChild(script);
        
        console.log("✅ [Anomaly] Скрипт визуализатора успешно внедрен");
    } catch (e) {
        console.error("❌ [Anomaly] Ошибка при внедрении:", e);
    }
})();