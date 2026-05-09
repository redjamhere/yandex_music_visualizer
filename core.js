// core.js (MAIN мир)
window.VisualizerCore = {
    analyser: null,
    dataArray: null,
    particles: [],
    mouseX: 0,
    mouseY: 0,
    visStyle: 'anomaly', // Текущий стиль
    
    init() {
        this.visStyle = document.documentElement.getAttribute('data-vis-style') || 'anomaly';
        window.addEventListener('mousemove', e => { this.mouseX = e.clientX; this.mouseY = e.clientY; });
        this.hijackAudio();
        setInterval(() => this.initUI(), 1000);
    },

    hijackAudio() {
        const NativeCtx = window.AudioContext || window.webkitAudioContext;
        window.AudioContext = window.webkitAudioContext = function() {
            const ctx = new NativeCtx();
            if (!VisualizerCore.analyser) {
                VisualizerCore.analyser = ctx.createAnalyser();
                VisualizerCore.analyser.fftSize = 512;
                VisualizerCore.dataArray = new Uint8Array(VisualizerCore.analyser.frequencyBinCount);
            }
            return ctx;
        };
        const orgConnect = window.AudioNode.prototype.connect;
        window.AudioNode.prototype.connect = function(dest) {
            if (VisualizerCore.analyser && this.context === VisualizerCore.analyser.context) {
                if (this !== VisualizerCore.analyser && dest !== VisualizerCore.analyser) {
                    try { orgConnect.call(this, VisualizerCore.analyser); } catch (e) {}
                }
            }
            return orgConnect.apply(this, arguments);
        };
    },

    initUI() {
        if (document.getElementById('cyber-visualizer')) return;
        const canvas = document.createElement('canvas');
        canvas.id = 'cyber-visualizer';
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:1;pointer-events:none;mix-blend-mode:screen;';
        document.body.appendChild(canvas);

        const rat = document.createElement('img');
        rat.id = 'rat-dance-overlay';
        rat.src = document.documentElement.getAttribute('data-rat-gif-url');
        rat.style.cssText = 'position:fixed;z-index:2;width:180px;height:180px;opacity:0.8;pointer-events:none;display:none;transform:translate(-50%,-50%);';
        document.body.appendChild(rat);

        const style = document.createElement('style');
        style.innerHTML = '[class*="VibeAnimation_root"] { opacity: 0 !important; } [class*="VibeBlock_root"] { background: transparent !important; }';
        document.head.appendChild(style);

        this.createParticles();
        this.startLoop(canvas.getContext('2d'), rat);
    },

    createParticles() {
        this.particles = [];
        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
                baseSize: Math.random() * 2 + 1, freqIndex: Math.floor(Math.random() * 100), hue: Math.random() * 360
            });
        }
    },

    startLoop(ctx, rat) {
        let time = 0;
        const tick = () => {
            requestAnimationFrame(tick);
            time += 0.01;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            const target = document.querySelector('[class*="VibeBlock_root"]');
            if (!target) { rat.style.display = 'none'; return; }
            
            const rect = target.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            if (this.analyser) this.analyser.getByteFrequencyData(this.dataArray);
            let intensity = 0;
            if (this.dataArray) {
                let sum = 0; for(let k=0; k<120; k++) sum += this.dataArray[k];
                intensity = (sum / 120) / 255;
            }

            this.handleRat(rat, intensity, cx, cy);
            this.updateAndDrawParticles(ctx, intensity);

            // Отрисовка стиля
            if (window.CurrentVisualizerStyle) {
                window.CurrentVisualizerStyle.draw(ctx, cx, cy, intensity, time, this.dataArray);
            }
        };
        tick();
    },

    updateAndDrawParticles(ctx, intensity) {
        this.particles.forEach(p => {
            const pInt = (this.dataArray ? this.dataArray[p.freqIndex] : 0) / 255;
            
            // Физика (общая для всех)
            p.vx += (Math.random() - 0.5) * 0.02;
            p.vy += (Math.random() - 0.5) * 0.02;
            const dx = p.x - this.mouseX, dy = p.y - this.mouseY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 200) {
                const force = (200 - dist) / 200;
                p.vx += (dx / dist) * force * 1.5;
                p.vy += (dy / dist) * force * 1.5;
            }
            p.x += p.vx * (1 + pInt * 5); p.y += p.vy * (1 + pInt * 5);
            p.vx *= 0.97; p.vy *= 0.97;

            if (p.x < 0) p.x = window.innerWidth; if (p.x > window.innerWidth) p.x = 0;
            if (p.y < 0) p.y = window.innerHeight; if (p.y > window.innerHeight) p.y = 0;

            // Цвет в зависимости от стиля
            if (this.visStyle === 'anime') {
                p.hue = (p.hue + 1) % 360;
                ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${0.3 + pInt * 0.6})`;
            } else {
                ctx.fillStyle = `hsla(20, 80%, 40%, ${0.1 + pInt * 0.5})`;
            }

            ctx.beginPath(); ctx.arc(p.x, p.y, p.baseSize + pInt * 4, 0, Math.PI * 2); ctx.fill();
        });
    },

    handleRat(rat, intensity, cx, cy) {
        if (intensity > 0.01) {
            if (rat.style.display === 'none') { const s = rat.src; rat.src = ""; rat.src = s; }
            rat.style.display = 'block';
            rat.style.left = cx + 'px'; rat.style.top = cy + 'px';
            const size = 180 + (intensity * 80);
            rat.style.width = size + 'px'; rat.style.height = size + 'px';
        } else { rat.style.display = 'none'; }
    }
};

VisualizerCore.init();