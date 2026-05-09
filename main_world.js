// main_world.js (MAIN мир)
(function() {
    const gifUrl = document.documentElement.getAttribute('data-rat-gif-url');
    
    let globalAnalyser, globalDataArray;
    let particles = [];
    let ratImage;

    const PALETTE = {
        rustDeep: 'hsla(18, 100%, 15%, 0.8)',
        rustMid: 'hsla(20, 80%, 40%, 0.6)',
        rustPeak: 'hsla(30, 70%, 75%, 0.9)',
        glitchRed: 'hsla(0, 80%, 40%, 0.4)',
        glitchBlue: 'hsla(200, 80%, 40%, 0.3)'
    };

    const createParticles = () => {
        particles = [];
        const count = 100;
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

    const initUI = () => {
        if (document.getElementById('cyber-visualizer')) return;

        const canvas = document.createElement('canvas');
        canvas.id = 'cyber-visualizer';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:1;pointer-events:none;mix-blend-mode:screen;';
        document.body.appendChild(canvas);

        ratImage = document.createElement('img');
        ratImage.id = 'rat-dance-overlay';
        ratImage.src = gifUrl; 
        ratImage.style.cssText = `
            position:fixed;
            z-index:2;
            width:160px; 
            height:160px;
            opacity:0.5;
            pointer-events:none;
            display:none; 
            transform:translate(-50%,-50%);
        `;
        document.body.appendChild(ratImage);

        const style = document.createElement('style');
        style.innerHTML = `
            [class*="VibeAnimation_root"] { opacity: 0 !important; } 
            [class*="VibeBlock_root"] { background: transparent !important; }
        `;
        document.head.appendChild(style);

        createParticles();
        window.onresize = () => { 
            canvas.width = window.innerWidth; 
            canvas.height = window.innerHeight; 
            createParticles(); 
        };
        startAnimation(canvas.getContext('2d'));
    };

    const startAnimation = (ctx) => {
        let time = 0;
        const draw = () => {
            requestAnimationFrame(draw);
            time += 0.003;
            const w = window.innerWidth, h = window.innerHeight;
            ctx.clearRect(0, 0, w, h);

            const targetBlock = document.querySelector('[class*="VibeBlock_root"]');
            if (!targetBlock) {
                if (ratImage) ratImage.style.display = 'none';
                return;
            }

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

            // --- УПРАВЛЕНИЕ ГИФКОЙ (ПУЛЬСАЦИЯ И АВТОЗАПУСК) ---
            if (ratImage) {
                const isPlaying = overallIntensity > 0.01; // Порог тишины

                if (isPlaying) {
                    // Если музыка начала играть, и гифка была скрыта — сбрасываем src, чтобы анимация началась сначала
                    if (ratImage.style.display === 'none') {
                        ratImage.src = "";
                        ratImage.src = gifUrl;
                    }
                    ratImage.style.display = 'block';
                    ratImage.style.left = centerX + 'px';
                    ratImage.style.top = centerY + 'px';

                    // Пульсация размера: база 160px + до 70px от басов
                    const currentSize = 160 + (overallIntensity * 70);
                    ratImage.style.width = currentSize + 'px';
                    ratImage.style.height = currentSize + 'px';
                } else {
                    // Если тишина — скрываем гифку
                    ratImage.style.display = 'none';
                }
            }

            // --- ЧАСТИЦЫ ---
            particles.forEach(p => {
                const pFreqVal = globalDataArray ? globalDataArray[p.freqIndex] : 0;
                const pIntensity = pFreqVal / 255;
                p.x += p.vx * (1 + pIntensity * 8);
                p.y += p.vy * (1 + pIntensity * 8);
                if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
                ctx.fillStyle = `hsla(20, 80%, 40%, ${0.1 + pIntensity * 0.4})`;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.baseSize + pIntensity * 3, 0, Math.PI * 2); ctx.fill();
            });

            // --- АНОМАЛИЯ ---
            const bars = 180;
            const numLayers = 5;
            for (let j = 0; j < numLayers; j++) {
                const drawLayer = (offset = 0, colorOverride = null) => {
                    ctx.beginPath();
                    const layerOpacity = (0.2 + overallIntensity * 0.4) - (j * 0.05);
                    ctx.strokeStyle = colorOverride || `hsla(${18 + overallIntensity * 12}, 75%, ${25 + overallIntensity * 55}%, ${layerOpacity})`;
                    ctx.lineWidth = 1.2 + (overallIntensity * 1.5);
                    for (let i = 0; i < bars; i++) {
                        const val = globalDataArray ? globalDataArray[10 + (i % 100)] : 0;
                        const angle = (i * Math.PI * 2) / bars;
                        const baseRadius = 110 + j * 7 + Math.sin(time + j) * 7;
                        const radius = baseRadius + (val * 0.55 * (1 + overallIntensity * 0.4)) + offset;
                        const x = centerX + Math.cos(angle) * radius;
                        const y = centerY + Math.sin(angle) * radius;
                        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.closePath(); ctx.stroke();
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

        const orgConnect = window.AudioNode.prototype.connect;
        window.AudioNode.prototype.connect = function(dest) {
            if (globalAnalyser && this.context === globalAnalyser.context) {
                if (this !== globalAnalyser && dest !== globalAnalyser) {
                    try { orgConnect.call(this, globalAnalyser); } catch (e) {}
                }
            }
            return orgConnect.apply(this, arguments);
        };
    };

    hijackAudioEngine();
    setInterval(initUI, 1000);
    window.addEventListener('mousedown', () => { 
        if (globalAnalyser && globalAnalyser.context.state === 'suspended') globalAnalyser.context.resume(); 
    });
})();