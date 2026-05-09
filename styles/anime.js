window.CurrentVisualizerStyle = {
    draw(ctx, cx, cy, intensity, time, dataArray) {
        const bars = 32; const numLayers = 4;
        for (let j = 0; j < numLayers; j++) {
            const points = [];
            const layerBaseRadius = 130 + (j * 15) + (intensity * 20) + (Math.sin(time * 2 + j) * 5);
            const layerOpacity = (0.6 - (j * 0.12)) + (intensity * 0.2);
            for (let i = 0; i < bars; i++) {
                let mirroredIdx = i > bars / 2 ? bars - i : i;
                const freqScale = 0.4 + (j * 0.08);
                const val = dataArray ? dataArray[mirroredIdx * 4] : 0;
                const angle = ((i * Math.PI * 2) / bars) - Math.PI / 2;
                const r = layerBaseRadius + (val * freqScale);
                points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
            }
            ctx.beginPath(); ctx.lineWidth = 10 - (j * 2); ctx.lineJoin = 'round';
            const hue = (time * 40 + j * 15) % 360;
            ctx.strokeStyle = `hsla(${hue}, 80%, 75%, ${layerOpacity})`;
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 0; i < bars; i++) {
                const next = points[(i + 1) % bars];
                const xc = (points[i].x + next.x) / 2; const yc = (points[i].y + next.y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.closePath(); ctx.stroke();
            if (j === 0) {
                ctx.globalAlpha = 0.15 + (intensity * 0.1);
                ctx.fillStyle = `hsla(${hue}, 60%, 80%, 1)`; ctx.fill(); ctx.globalAlpha = 1.0;
            }
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
            
            p.hue = (p.hue + 1) % 360;
            ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${0.3 + pInt * 0.6})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.baseSize + pInt * 4, 0, Math.PI * 2); ctx.fill();
        });
    }
};