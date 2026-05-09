// styles/cosmic.js
window.CurrentVisualizerStyle = {
    draw(ctx, cx, cy, intensity, time, dataArray) {
        const rays = 24;
        
        // Лучи
        for (let i = 0; i < rays; i++) {
            const val = dataArray ? dataArray[i * 4] : 0;
            const v = val / 255;
            const angle = (i * Math.PI * 2) / rays + time * 0.2;
            const length = 80 + v * 200 + intensity * 50;
            
            const x1 = cx + Math.cos(angle) * 60;
            const y1 = cy + Math.sin(angle) * 60;
            const x2 = cx + Math.cos(angle) * length;
            const y2 = cy + Math.sin(angle) * length;
            
            const hue = (angle * 180 / Math.PI + time * 40) % 360;
            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0, `hsla(${hue}, 100%, 70%, ${0.7 + v * 0.3})`);
            grad.addColorStop(1, 'transparent');
            
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2 + v * 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Центральное ядро с пульсацией
        const pulseR = 50 + intensity * 40 + Math.sin(time * 4) * 5;
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        coreGrad.addColorStop(0.4, `hsla(${(time * 80) % 360}, 100%, 60%, 0.6)`);
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
        ctx.fill();
    },

    drawParticles(ctx, overallIntensity, mouseX, mouseY, particles, dataArray) {
        particles.forEach(p => {
            const pInt = (dataArray ? dataArray[p.freqIndex] : 0) / 255;
            
            // Звёздный мерцающий эффект
            p.vx += (Math.random() - 0.5) * 0.05;
            p.vy += (Math.random() - 0.5) * 0.05;
            p.x += p.vx * (1 + pInt * 2);
            p.y += p.vy * (1 + pInt * 2);
            p.vx *= 0.95; p.vy *= 0.95;

            if (p.x < 0) p.x = window.innerWidth;
            if (p.x > window.innerWidth) p.x = 0;
            if (p.y < 0) p.y = window.innerHeight;
            if (p.y > window.innerHeight) p.y = 0;

            // Мерцание
            const twinkle = 0.5 + Math.sin(Date.now() * 0.005 + p.freqIndex) * 0.5;
            ctx.fillStyle = `hsla(${p.hue}, 30%, 90%, ${twinkle * (0.4 + pInt * 0.6)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.baseSize * (1 + pInt * 2), 0, Math.PI * 2);
            ctx.fill();
            
            // Крестообразный блик у ярких частиц
            if (pInt > 0.5) {
                ctx.strokeStyle = `hsla(${p.hue}, 30%, 90%, ${pInt * 0.5})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x - 8, p.y); ctx.lineTo(p.x + 8, p.y);
                ctx.moveTo(p.x, p.y - 8); ctx.lineTo(p.x, p.y + 8);
                ctx.stroke();
            }
        });
    }
};