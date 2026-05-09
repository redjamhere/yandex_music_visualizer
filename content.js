// content.js (ISOLATED мир)
(function() {
    const STYLES = ['anomaly', 'terrain', 'torus', 'anime', 'galaxy', 'equalizer', 'neon', 'liquid', 'cosmic', 'dna'];

    function injectStyleScript(style) {
        const scriptId = 'visualizer-style-script';
        let script = document.getElementById(scriptId);
        if (script) script.remove();

        script = document.createElement('script');
        script.id = scriptId;
        script.src = chrome.runtime.getURL(`styles/${style}.js`);
        (document.head || document.documentElement).appendChild(script);
    }

    function updatePageAttributes(style) {
        const gifName = (style === 'anime' || style === 'anomaly') ? (style === 'anime' ? "anime_dance.gif" : "rat_dance.gif") : "";
        if (gifName) {
            document.documentElement.setAttribute('data-rat-gif-url', chrome.runtime.getURL(gifName));
        } else {
            document.documentElement.removeAttribute('data-rat-gif-url');
        }
        document.documentElement.setAttribute('data-vis-style', style);
    }

    function createFloatingSelector(currentStyle) {
        if (document.getElementById('vis-control-panel')) return;

        const container = document.createElement('div');
        container.id = 'vis-control-panel';
        // Установлен cursor: move и начальное позиционирование
        container.style.cssText = `
            position: fixed;
            top: 15px;
            right: 80px; 
            z-index: 10001;
            background: rgba(26, 26, 26, 0.9);
            padding: 6px 10px;
            border-radius: 8px;
            border: 1px solid #ff0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            gap: 10px;
            pointer-events: auto;
            backdrop-filter: blur(4px);
            cursor: move;
            user-select: none;
        `;

        container.innerHTML = `
            <span style="color: #ff0; font-size: 11px; font-weight: bold; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.5px; pointer-events: none;">Visualizer:</span>
            <select id="vis-selector-ui" style="
                background: #000;
                color: #fff;
                border: 1px solid #444;
                border-radius: 4px;
                padding: 2px 6px;
                cursor: pointer;
                outline: none;
                font-size: 12px;
                font-family: inherit;
            ">
                ${STYLES.map(s => `<option value="${s}" ${s === currentStyle ? 'selected' : ''}>${s.toUpperCase()}</option>`).join('')}
            </select>
        `;

        document.body.appendChild(container);

        // --- ЛОГИКА ПЕРЕТАСКИВАНИЯ (DRAG & MOVE) ---
        let isDragging = false;
        let offsetX, offsetY;

        container.addEventListener('mousedown', (e) => {
            // Не начинаем тащить, если кликнули по самому списку
            if (e.target.tagName === 'SELECT') return;
            
            isDragging = true;
            const rect = container.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            container.style.transition = 'none'; // Убираем задержки при движении
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            // Переключаемся с right на left для точного позиционирования
            container.style.right = 'auto';
            container.style.left = (e.clientX - offsetX) + 'px';
            container.style.top = (e.clientY - offsetY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // --- ЛОГИКА СМЕНЫ СТИЛЯ ---
        const selector = document.getElementById('vis-selector-ui');
        selector.addEventListener('change', (e) => {
            const newStyle = e.target.value;
            chrome.storage.local.set({ selectedStyle: newStyle });
            updatePageAttributes(newStyle);
            injectStyleScript(newStyle);
        });
    }

    chrome.storage.local.get(['selectedStyle'], (result) => {
        const style = result.selectedStyle || 'anomaly';
        updatePageAttributes(style);

        const core = document.createElement('script');
        core.src = chrome.runtime.getURL('core.js');
        document.head.appendChild(core);

        injectStyleScript(style);

        if (document.body) {
            createFloatingSelector(style);
        } else {
            window.addEventListener('DOMContentLoaded', () => createFloatingSelector(style));
        }
    });
})();