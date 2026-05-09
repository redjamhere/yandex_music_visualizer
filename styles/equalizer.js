// styles/equalizer.js
window.CurrentVisualizerStyle = {
    draw(ctx, cx, cy, intensity, time, dataArray) {
        const bars = 64;
        const baseRadius = 120;
        
        for (let i = 0; i < bars; i++) {
            // Зеркальная симметрия слева/справа
            const mirroredIdx = i < bars / 2 ? i : bars - i - 1;
            const val = dataArray ? dataArray[mirroredIdx * 2] : 0;
            const barHeight = (val / 255) * (80 + intensity * 60);
            
            const angle = ((i * Math.PI * 2) / bars) - Math.PI / 2;
            const x1 = cx + Math.cos(angle) * baseRadius;
            const y1 = cy + Math.sin(angle) * baseRadius;
            const x2 = cx + Math.cos(angle) * (baseRadius + barHeight);
            const y2 = cy + Math.sin(angle) * (baseRadius + barHeight);
            
            const hue = (i * 360 / bars + time * 20) % 360;
            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0, `hsla(${hue}, 90%, 50%, 0.9)`);
            grad.addColorStop(1, `hsla(${hue + 60}, 90%, 70%, 0.2)`);
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Внутреннее кольцо
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${(time * 40) % 360}, 70%, 60%, ${0.3 + intensity * 0.4})`;
        ctx.lineWidth = 2;
        ctx.arc(cx, cy, baseRadius - 5, 0, Math.PI * 2);
        ctx.stroke();
    }
};