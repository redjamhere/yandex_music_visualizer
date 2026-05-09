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

    // Функция применения фона с эффектом затемнения
    function applyBackground(dataUrl) {
        let bgStyle = document.getElementById('custom-background-style');
        if (!bgStyle) {
            bgStyle = document.createElement('style');
            bgStyle.id = 'custom-background-style';
            document.head.appendChild(bgStyle);
        }
        
        if (dataUrl) {
            bgStyle.innerHTML = `
                /* Таргетируем основной контейнер */
                .Content_rootOld__g85_m.CommonLayout_content__zy_Ja {
                    /* linear-gradient накладывает цвет поверх картинки. 0.5 — это 50% затемнения */
                    background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${dataUrl}) !important;
                    background-size: cover !important;
                    background-position: center !important;
                    background-attachment: fixed !important;
                    background-color: transparent !important;
                    
                    /* Закругление краев */
                    border-radius: var(--ym-layout-border-radius) !important;
                    overflow: hidden !important;
                }

                /* Делаем прозрачными только фоновые блоки контента */
                .Content_rootOld__g85_m.CommonLayout_content__zy_Ja [class*="MainPage_root"],
                .Content_rootOld__g85_m.CommonLayout_content__zy_Ja [class*="MainPage_content"],
                .Content_rootOld__g85_m.CommonLayout_content__zy_Ja [class*="VibeBlock_root"],
                .Content_rootOld__g85_m.CommonLayout_content__zy_Ja [class*="App_content"],
                .Content_rootOld__g85_m.CommonLayout_content__zy_Ja [class*="Content_main"],
                .Content_rootOld__g85_m.CommonLayout_content__zy_Ja [class*="Surface_surface"],
                .Content_rootOld__g85_m.CommonLayout_content__zy_Ja [class*="CenterCanvas_root"] {
                    background-color: transparent !important;
                    background-image: none !important;
                    background: transparent !important;
                }

                /* Гарантируем видимость текста Моей волны */
                [class*="VibeBlock_title"], 
                [class*="VibeBlock_description"],
                [class*="VibeBlock_controls"] {
                    color: var(--ym-controls-color-primary-text-enabled) !important;
                    z-index: 10;
                    position: relative;
                }

                /* Сброс глобальных переменных фона */
                :root {
                    --ym-background-color-primary-enabled-basic: transparent !important;
                    --ym-background-color-primary-enabled-content: transparent !important;
                    --ym-background-color-primary-enabled-vibe: transparent !important;
                }
            `;
        } else {
            bgStyle.innerHTML = '';
        }
    }

    function createFloatingSelector(currentStyle) {
        if (document.getElementById('vis-control-panel')) return;

        const container = document.createElement('div');
        container.id = 'vis-control-panel';
        container.style.cssText = `
            position: fixed;
            top: 15px;
            right: 80px; 
            z-index: 10001;
            background: rgba(26, 26, 26, 0.95);
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #ff0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6);
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: auto;
            backdrop-filter: blur(4px);
            cursor: move;
            user-select: none;
            width: 200px;
        `;

        container.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #ff0; font-size: 11px; font-weight: bold; font-family: sans-serif; text-transform: uppercase;">Style:</span>
                <select id="vis-selector-ui" style="background: #000; color: #fff; border: 1px solid #444; border-radius: 4px; padding: 2px 6px; cursor: pointer; font-size: 12px; flex-grow: 1;">
                    ${STYLES.map(s => `<option value="${s}" ${s === currentStyle ? 'selected' : ''}>${s.toUpperCase()}</option>`).join('')}
                </select>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <span style="color: #ff0; font-size: 11px; font-weight: bold; font-family: sans-serif; text-transform: uppercase;">Background:</span>
                <input type="file" id="bg-upload" accept="image/*" style="font-size: 10px; color: #ccc;">
                <button id="bg-reset" style="background: #333; color: #fff; border: none; border-radius: 4px; padding: 2px; font-size: 10px; cursor: pointer;">Reset</button>
            </div>
        `;

        document.body.appendChild(container);

        let isDragging = false, offsetX, offsetY;
        container.addEventListener('mousedown', (e) => {
            if (['SELECT', 'INPUT', 'BUTTON'].includes(e.target.tagName)) return;
            isDragging = true;
            const rect = container.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            container.style.right = 'auto';
            container.style.left = (e.clientX - offsetX) + 'px';
            container.style.top = (e.clientY - offsetY) + 'px';
        });

        document.addEventListener('mouseup', () => isDragging = false);

        document.getElementById('vis-selector-ui').addEventListener('change', (e) => {
            const newStyle = e.target.value;
            chrome.storage.local.set({ selectedStyle: newStyle });
            updatePageAttributes(newStyle);
            injectStyleScript(newStyle);
        });

        document.getElementById('bg-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const dataUrl = event.target.result;
                    chrome.storage.local.set({ customBackground: dataUrl });
                    applyBackground(dataUrl);
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('bg-reset').addEventListener('click', () => {
            chrome.storage.local.remove('customBackground');
            applyBackground(null);
        });
    }

    chrome.storage.local.get(['selectedStyle', 'customBackground'], (result) => {
        const style = result.selectedStyle || 'anomaly';
        updatePageAttributes(style);

        if (result.customBackground) {
            applyBackground(result.customBackground);
        }

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