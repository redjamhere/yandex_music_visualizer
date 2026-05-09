// styles/dna.js
window.CurrentVisualizerStyle = {
    draw(ctx, cx, cy, intensity, time, dataArray) {
        const points = 60;
        const radius = 100 + intensity * 30;
        const helixA = [];
        const helixB = [];
        
        for (let i = 0; i < points; i++) {
            const t = (i / points) * Math.PI * 4;
            const val = dataArray ? dataArray[i * 2] : 0;
            const v = val / 255;
            
            // Угол вокруг центра + вращение
            const baseAngle = (i / points) * Math.PI * 2;
            const wobble = Math.sin(t + time * 2) * (radius + v * 40);
            
            const dirX = Math.cos(baseAngle);
            const dirY = Math.sin(baseAngle);
            const perpX = -dirY;
            const perpY = dirX;
            
            const distFromCenter = 50 + (i / points) * 100;
            const ax = cx + dirX * distFromCenter + perpX * wobble * 0.3;
            const ay = cy + dirY * distFromCenter + perpY * wobble * 0.3;
            const bx = cx + dirX * distFromCenter - perpX * wobble * 0.3;
            const by = cy + dirY * distFromCenter - perpY * wobble * 0.3;
            
            helixA.push({ x: ax, y: ay, v });
            helixB.push({ x: bx, y: by, v });
        }
        
        // Перемычки между нитями
        for (let i = 0; i < points; i += 2) {
            const hue = (i * 6 + time * 40) % 360;
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.3 + helixA[i].v * 0.5})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(helixA[i].x, helixA[i].y);
            ctx.lineTo(helixB[i].x, helixB[i].y);
            ctx.stroke();
        }
        
        // Две нити
        const drawStrand = (strand, hueOffset) => {
            ctx.beginPath();
            ctx.lineWidth = 3;
            const hue = (time * 50 + hueOffset) % 360;
            ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${0.7 + intensity * 0.3})`;
            strand.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.stroke();
            
            // Узлы
            strand.forEach(p => {
                ctx.fillStyle = `hsla(${hue}, 100%, 75%, ${0.5 + p.v * 0.5})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2 + p.v * 3, 0, Math.PI * 2);
                ctx.fill();
            });
        };
        
        drawStrand(helixA, 0);
        drawStrand(helixB, 180);
    }
};