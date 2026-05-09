// styles/anime.js
window.CurrentVisualizerStyle = {
    draw(ctx, cx, cy, intensity, time, dataArray) {
        const bars = 32; // Увеличим детализацию для более гладких холмов
        const numLayers = 4; // Добавляем слои

        for (let j = 0; j < numLayers; j++) {
            const points = [];
            // Каждый слой имеет свой радиус, который плавно пульсирует
            const layerBaseRadius = 130 + (j * 15) + (intensity * 20) + (Math.sin(time * 2 + j) * 5);
            const layerOpacity = (0.6 - (j * 0.12)) + (intensity * 0.2);

            for (let i = 0; i < bars; i++) {
                // Сохраняем зеркальную симметрию
                let mirroredIdx = i > bars / 2 ? bars - i : i;
                
                // Разная чувствительность к частотам для каждого слоя
                const freqScale = 0.4 + (j * 0.08);
                const val = dataArray ? dataArray[mirroredIdx * 4] : 0;
                
                // Центрируем бас сверху и снизу
                const angle = ((i * Math.PI * 2) / bars) - Math.PI / 2;
                const r = layerBaseRadius + (val * freqScale);
                
                points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
            }

            ctx.beginPath();
            // Внутренние слои тоньше внешних
            ctx.lineWidth = 10 - (j * 2);
            ctx.lineJoin = 'round';
            
            // Смещаем цвет каждого слоя для эффекта радуги
            const hue = (time * 40 + j * 15) % 360;
            ctx.strokeStyle = `hsla(${hue}, 80%, 75%, ${layerOpacity})`;

            // Отрисовка плавных кривых
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 0; i < bars; i++) {
                const next = points[(i + 1) % bars];
                const xc = (points[i].x + next.x) / 2;
                const yc = (points[i].y + next.y) / 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
            }
            ctx.closePath();
            ctx.stroke();

            // Добавляем мягкое заполнение только для самого внутреннего слоя
            if (j === 0) {
                ctx.globalAlpha = 0.15 + (intensity * 0.1);
                ctx.fillStyle = `hsla(${hue}, 60%, 80%, 1)`;
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
    }
};