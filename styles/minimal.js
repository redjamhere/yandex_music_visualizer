// styles/anime.js
window.CurrentVisualizerStyle = {
    draw(ctx, cx, cy, intensity, time, dataArray) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        // Использовать cx, cy
        ctx.arc(cx, cy, 150 + intensity * 50, 0, Math.PI * 2); 
        ctx.stroke();
    },

    drawParticles(ctx, overallIntensity, mouseX, mouseY, particles, dataArray) {
        particles.forEach(p => {
            const pInt = (dataArray ? dataArray[p.freqIndex] : 0) / 255;
            p.vx += (Math.random() - 0.5) * 0.02;
            p.vy += (Math.random() - 0.5) * 0.02;

            const dx = p.x - mouseX, dy = p.y - mouseY;
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

            p.hue = (p.hue + 1) % 360;
            ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${0.3 + pInt * 0.6})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.baseSize + pInt * 4, 0, Math.PI * 2); ctx.fill();
        });
    }
};