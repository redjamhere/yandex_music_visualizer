// styles/liquid.js
window.CurrentVisualizerStyle = {
    draw(ctx, cx, cy, intensity, time, dataArray) {
        const blobs = 8;
        ctx.globalCompositeOperation = 'lighter';
        
        for (let i = 0; i < blobs; i++) {
            const val = dataArray ? dataArray[i * 8] : 0;
            const v = val / 255;
            const angle = (i * Math.PI * 2) / blobs + time * 0.4;
            const orbitR = 100 + Math.sin(time * 2 + i) * 30 + v * 40;
            
            const bx = cx + Math.cos(angle) * orbitR;
            const by = cy + Math.sin(angle) * orbitR;
            const radius = 40 + v * 50 + intensity * 30;
            
            const hue = (i * 45 + time * 30) % 360;
            const grad = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
            grad.addColorStop(0, `hsla(${hue}, 100%, 60%, ${0.6 + v * 0.4})`);
            grad.addColorStop(0.5, `hsla(${hue + 30}, 100%, 50%, 0.3)`);
            grad.addColorStop(1, 'transparent');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(bx, by, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalCompositeOperation = 'source-over';
    }
};