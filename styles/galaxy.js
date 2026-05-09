// styles/galaxy.js
window.CurrentVisualizerStyle = {
    draw(ctx, cx, cy, intensity, time, dataArray) {
        const arms = 4;
        const pointsPerArm = 60;
        
        for (let a = 0; a < arms; a++) {
            ctx.beginPath();
            const armOffset = (a * Math.PI * 2) / arms;
            const hue = (time * 30 + a * 90) % 360;
            ctx.strokeStyle = `hsla(${hue}, 80%, 65%, ${0.4 + intensity * 0.5})`;
            ctx.lineWidth = 2 + intensity * 2;
            
            for (let i = 0; i < pointsPerArm; i++) {
                const t = i / pointsPerArm;
                const val = dataArray ? dataArray[Math.floor(i * 2)] : 0;
                const r = 30 + t * 200 + val * 0.3;
                const angle = armOffset + t * Math.PI * 3 + time * 0.5;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // Ядро галактики
        const coreRadius = 25 + intensity * 30;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
        grad.addColorStop(0, `hsla(${(time * 60) % 360}, 100%, 80%, 1)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
        ctx.fill();
    },

    drawParticles(ctx, overallIntensity, mouseX, mouseY, particles, dataArray) {
        particles.forEach(p => {
            const pInt = (dataArray ? dataArray[p.freqIndex] : 0) / 255;
            // Орбитальное движение вокруг центра экрана
            const ccx = window.innerWidth / 2;
            const ccy = window.innerHeight / 2;
            const dx = p.x - ccx, dy = p.y - ccy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            // Касательная сила
            p.vx += (-dy / dist) * 0.05;
            p.vy += (dx / dist) * 0.05;
            // Лёгкое притяжение к центру
            p.vx -= (dx / dist) * 0.02;
            p.vy -= (dy / dist) * 0.02;

            p.x += p.vx * (1 + pInt * 3);
            p.y += p.vy * (1 + pInt * 3);
            p.vx *= 0.98; p.vy *= 0.98;

            if (p.x < 0) p.x = window.innerWidth;
            if (p.x > window.innerWidth) p.x = 0;
            if (p.y < 0) p.y = window.innerHeight;
            if (p.y > window.innerHeight) p.y = 0;

            ctx.fillStyle = `hsla(${(p.hue + dist * 0.5) % 360}, 90%, 75%, ${0.4 + pInt * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.baseSize + pInt * 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
};