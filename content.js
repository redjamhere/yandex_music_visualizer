(function() {
    let globalAnalyser, globalDataArray;
    let particles = [];

    const PALETTE = {
        rustDeep: 'hsla(18, 100%, 15%, 0.8)',
        rustMid: 'hsla(20, 80%, 40%, 0.6)',
        rustPeak: 'hsla(30, 70%, 75%, 0.9)',
        glitchRed: 'hsla(0, 80%, 40%, 0.4)',
        glitchBlue: 'hsla(200, 80%, 40%, 0.3)'
    };

    // --- 1. Система частиц на весь экран ---
    const createParticles = () => {
        particles = [];
        const count = 100; // Увеличено для всего экрана
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                baseSize: Math.random() * 1.2 + 0.3,
                freqIndex: Math.floor(Math.random() * 120)
            });
        }
    };

    // --- 2. Инициализация полноэкранного холста ---
    const initUI = () => {
        if (document.getElementById('cyber-visualizer')) return;

        const canvas = document.createElement('canvas');
        canvas.id = 'cyber-visualizer';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Фиксируем на весь экран, но разрешаем клики сквозь него
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 1; 
            pointer-events: none; 
            mix-blend-mode: screen;
        `;
        
        document.body.appendChild(canvas);

        const style = document.createElement('style');
        style.innerHTML = `
            .VibeAnimation_root__UKMJy { opacity: 0 !important; } /* Скрываем оригинал */
            .VibeBlock_root__z7LtR { background: transparent !important; }
        `;
        document.head.appendChild(style);

        createParticles();
        
        window.onresize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            createParticles(); // Пересоздаем частицы под новый размер
        };

        startAnimation(canvas.getContext('2d'));
    };

    // --- 3. Отрисовка: Полноэкранный фон + Центрированное ядро ---
    const startAnimation = (ctx) => {
        let time = 0;
        const draw = () => {
            requestAnimationFrame(draw);
            time += 0.003;
            
            const w = window.innerWidth;
            const h = window.innerHeight;
            ctx.clearRect(0, 0, w, h);

            // Ищем блок Моей волны для центрования ядра
            const targetBlock = document.querySelector('.VibeBlock_root__z7LtR');
            if (!targetBlock) return;

            // Вычисляем координаты центра блока относительно окна браузера
            const rect = targetBlock.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            if (globalAnalyser) {
                globalAnalyser.getByteFrequencyData(globalDataArray);
            }

            let totalSum = 0;
            if (globalDataArray) {
                for (let k = 0; k < 120; k++) totalSum += globalDataArray[k];
            }
            const overallIntensity = (totalSum / 120) / 255;

            // --- ЧАСТИЦЫ: На весь экран ---
            particles.forEach(p => {
                const pFreqVal = globalDataArray ? globalDataArray[p.freqIndex] : 0;
                const pIntensity = pFreqVal / 255;
                const jitter = pIntensity * 4;
                
                p.x += p.vx * (1 + pIntensity * 8) + (Math.random() - 0.5) * jitter;
                p.y += p.vy * (1 + pIntensity * 8) + (Math.random() - 0.5) * jitter;
                
                if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
                
                ctx.fillStyle = `hsla(20, 80%, 40%, ${0.1 + pIntensity * 0.4})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.baseSize + pIntensity * 3, 0, Math.PI * 2);
                ctx.fill();
            });

            // --- АНОМАЛИЯ: Центрирована в блоке ---
            const bars = 180;
            const numLayers = 5;

            // Свечение ядра
            if (overallIntensity > 0.4) {
                const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150 * overallIntensity);
                glow.addColorStop(0, `hsla(20, 100%, 50%, ${overallIntensity * 0.15})`);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(centerX, centerY, 200 * overallIntensity, 0, Math.PI * 2);
                ctx.fill();
            }

            for (let j = 0; j < numLayers; j++) {
                const drawLayer = (offset = 0, colorOverride = null) => {
                    ctx.beginPath();
                    const layerOpacity = (0.25 + overallIntensity * 0.4) - (j * 0.05);
                    ctx.strokeStyle = colorOverride || `hsla(${18 + overallIntensity * 12}, 75%, ${25 + overallIntensity * 55}%, ${layerOpacity})`;
                    ctx.lineWidth = 1.2 + (overallIntensity * 1.5);

                    for (let i = 0; i < bars; i++) {
                        const val = globalDataArray ? globalDataArray[10 + (i % 100)] : 0;
                        const angle = (i * Math.PI * 2) / bars;
                        const baseRadius = 110 + j * 7 + Math.sin(time + j) * 7;
                        // Амплитуда пульсации
                        const radius = baseRadius + (val * 0.55 * (1 + overallIntensity * 0.4)) + offset;

                        const x = centerX + Math.cos(angle) * radius;
                        const y = centerY + Math.sin(angle) * radius;

                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                    ctx.stroke();
                };

                drawLayer();
                if (overallIntensity > 0.5 && j === 0) {
                    drawLayer(overallIntensity * 10, PALETTE.glitchRed);
                    drawLayer(-overallIntensity * 10, PALETTE.glitchBlue);
                }
            }
        };
        draw();
    };

    const hijackAudioEngine = () => {
        const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
        const NativeAudioNode = window.AudioNode;
        window.AudioContext = window.webkitAudioContext = function() {
            const ctx = new NativeAudioContext();
            if (!globalAnalyser) {
                globalAnalyser = ctx.createAnalyser();
                globalAnalyser.fftSize = 512;
                globalAnalyser.smoothingTimeConstant = 0.88;
                globalDataArray = new Uint8Array(globalAnalyser.frequencyBinCount);
            }
            return ctx;
        };
        const originalConnect = NativeAudioNode.prototype.connect;
        NativeAudioNode.prototype.connect = function(destination) {
            if (globalAnalyser && this.context === globalAnalyser.context) {
                if (this !== globalAnalyser && destination !== globalAnalyser) {
                    try { originalConnect.call(this, globalAnalyser); } catch (e) {}
                }
            }
            return originalConnect.apply(this, arguments);
        };
    };

    hijackAudioEngine();
    setInterval(initUI, 1000);
    window.addEventListener('mousedown', () => { 
        if (globalAnalyser && globalAnalyser.context.state === 'suspended') globalAnalyser.context.resume(); 
    });
})();