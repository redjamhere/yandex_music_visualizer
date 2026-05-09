window.CurrentVisualizerStyle = {
    draw(ctx, cx, cy, intensity, time, dataArray) {
        const bars = 180;
        for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${20 + intensity * 20}, 70%, ${30 + intensity * 40}%, ${0.3 - j * 0.05 + intensity * 0.4})`;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < bars; i++) {
                const val = dataArray ? dataArray[10 + (i % 100)] : 0;
                const angle = (i * Math.PI * 2) / bars;
                const r = (110 + j * 10) + (val * 0.5 * (1 + intensity));
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath(); ctx.stroke();
        }
    },
    drawParticles(ctx, overallIntensity, mouseX, mouseY, particles, dataArray) {
        particles.forEach(p => {
            const pInt = (dataArray ? dataArray[p.freqIndex] : 0) / 255;
            p.vx += (Math.random() - 0.5) * 0.02; p.vy += (Math.random() - 0.5) * 0.02;
            const dx = p.x - mouseX, dy = p.y - mouseY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 200) {
                const force = (200 - dist) / 200;
                p.vx += (dx / dist) * force * 1.5; p.vy += (dy / dist) * force * 1.5;
            }
            p.x += p.vx * (1 + pInt * 5); p.y += p.vy * (1 + pInt * 5);
            p.vx *= 0.97; p.vy *= 0.97;
            if (p.x < 0) p.x = window.innerWidth; if (p.x > window.innerWidth) p.x = 0;
            if (p.y < 0) p.y = window.innerHeight; if (p.y > window.innerHeight) p.y = 0;

            ctx.fillStyle = `hsla(20, 80%, 40%, ${0.1 + pInt * 0.5})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.baseSize + pInt * 4, 0, Math.PI * 2); ctx.fill();
        });
    }
};