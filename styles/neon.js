// styles/neon.js
window.CurrentVisualizerStyle = {
    draw(ctx, cx, cy, intensity, time, dataArray) {
        const sides = 6 + Math.floor(intensity * 4); // 6-10 углов
        const layers = 5;
        
        for (let l = 0; l < layers; l++) {
            const layerScale = 1 - (l * 0.15);
            const rotation = time * (0.3 + l * 0.1);
            
            ctx.beginPath();
            for (let i = 0; i <= sides; i++) {
                const idx = (i % sides);
                const val = dataArray ? dataArray[idx * 5 + l * 3] : 0;
                const angle = (idx * Math.PI * 2) / sides + rotation;
                const r = (140 + (val * 0.4) + intensity * 30) * layerScale;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            
            const hue = (time * 50 + l * 40) % 360;
            // Glow effect
            ctx.shadowBlur = 20 + intensity * 30;
            ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
            ctx.strokeStyle = `hsla(${hue}, 100%, ${60 + l * 5}%, ${0.8 - l * 0.12})`;
            ctx.lineWidth = 3 - l * 0.4;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
    }
};