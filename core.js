// core.js (MAIN мир)
window.VisualizerCore = {
    analyser: null,
    dataArray: null,
    particles: [],
    contexts: new Set(),
    mouseX: 0,
    mouseY: 0,
    visStyle: 'anomaly',
    ratElement: null,
    
    init() {
        this.visStyle = document.documentElement.getAttribute('data-vis-style') || 'anomaly';
        window.addEventListener('mousemove', e => { this.mouseX = e.clientX; this.mouseY = e.clientY; });
        this.hijackAudio();
        this.observeStyleChange(); // Следим за селектором
        setInterval(() => this.initUI(), 1000);

        window.addEventListener('mousedown', () => { 
            this.contexts.forEach(ctx => { if (ctx.state === 'suspended') ctx.resume(); });
        });
    },

    observeStyleChange() {
        // Следим за атрибутом, который меняет content.js
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-vis-style') {
                    this.visStyle = document.documentElement.getAttribute('data-vis-style');
                    this.updateRatState();
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
    },

    updateRatState() {
        const needsRat = (this.visStyle === 'anomaly' || this.visStyle === 'anime');
        if (this.ratElement) {
            if (needsRat) {
                this.ratElement.src = document.documentElement.getAttribute('data-rat-gif-url');
            } else {
                this.ratElement.style.display = 'none';
            }
        }
    },

    hijackAudio() {
        const NativeCtx = window.AudioContext || window.webkitAudioContext;
        const NativeNode = window.AudioNode;
        const self = this;
        window.AudioContext = window.webkitAudioContext = new Proxy(NativeCtx, {
            construct(target, args) {
                const ctx = new target(...args);
                self.contexts.add(ctx);
                return ctx;
            }
        });
        const orgConnect = NativeNode.prototype.connect;
        NativeNode.prototype.connect = function(dest) {
            if (!self.contexts.has(this.context)) self.contexts.add(this.context);
            if (!this.context.__visualizer_analyser) {
                try {
                    const analyser = this.context.createAnalyser();
                    analyser.fftSize = 512;
                    this.context.__visualizer_analyser = analyser;
                    this.context.__visualizer_data = new Uint8Array(analyser.frequencyBinCount);
                } catch (e) {}
            }
            const analyser = this.context.__visualizer_analyser;
            if (analyser && this !== analyser && dest !== analyser) {
                try { orgConnect.call(this, analyser); } catch (e) {}
            }
            return orgConnect.apply(this, arguments);
        };
    },

    initUI() {
        if (document.getElementById('cyber-visualizer')) {
            if (!this.ratElement && (this.visStyle === 'anomaly' || this.visStyle === 'anime')) {
                this.createRat();
            }
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.id = 'cyber-visualizer';
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:1;pointer-events:none;mix-blend-mode:screen;';
        document.body.appendChild(canvas);

        if (this.visStyle === 'anomaly' || this.visStyle === 'anime') {
            this.createRat();
        }

        const style = document.createElement('style');
        style.innerHTML = `
            [class*="VibeAnimation_root"] { opacity: 0 !important; } 
            [class*="VibeBlock_root"] { background: transparent !important; }
        `;
        document.head.appendChild(style);

        this.createParticles();
        this.startLoop(canvas.getContext('2d'));
    },

    createRat() {
        if (this.ratElement) return;
        this.ratElement = document.createElement('img');
        this.ratElement.id = 'rat-dance-overlay';
        this.ratElement.src = document.documentElement.getAttribute('data-rat-gif-url');
        this.ratElement.style.cssText = 'position:fixed;z-index:2;width:180px;height:180px;opacity:0.8;pointer-events:none;display:none;transform:translate(-50%,-50%);';
        document.body.appendChild(this.ratElement);
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

    startLoop(ctx) {
        let time = 0;
        const tick = () => {
            requestAnimationFrame(tick);
            time += 0.01;
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            const target = document.querySelector('[class*="VibeBlock_root"]');
            if (!target) { if(this.ratElement) this.ratElement.style.display = 'none'; return; }
            
            const rect = target.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            let activeIntensity = 0;
            let activeData = null;
            this.contexts.forEach(audioCtx => {
                if (audioCtx.state === 'closed') { this.contexts.delete(audioCtx); return; }
                const analyser = audioCtx.__visualizer_analyser;
                const data = audioCtx.__visualizer_data;
                if (analyser && data) {
                    analyser.getByteFrequencyData(data);
                    let sum = 0; for (let i = 0; i < 120; i++) sum += data[i];
                    let currentIntensity = (sum / 120) / 255;
                    if (currentIntensity > activeIntensity) { activeIntensity = currentIntensity; activeData = data; }
                }
            });
            this.dataArray = activeData;
            const intensity = activeIntensity;

            if(this.ratElement) this.handleRat(this.ratElement, intensity, cx, cy);

            if (window.CurrentVisualizerStyle) {
                window.CurrentVisualizerStyle.draw(ctx, cx, cy, intensity, time, this.dataArray);
                if (window.CurrentVisualizerStyle.drawParticles) {
                    window.CurrentVisualizerStyle.drawParticles(ctx, intensity, this.mouseX, this.mouseY, this.particles, this.dataArray);
                }
            }
        };
        tick();
    },

    handleRat(rat, intensity, cx, cy) {
        if (intensity > 0.01 && (this.visStyle === 'anomaly' || this.visStyle === 'anime')) {
            rat.style.display = 'block';
            rat.style.left = cx + 'px'; rat.style.top = cy + 'px';
            const size = 180 + (intensity * 80);
            rat.style.width = size + 'px'; rat.style.height = size + 'px';
        } else { rat.style.display = 'none'; }
    }
};

VisualizerCore.init();