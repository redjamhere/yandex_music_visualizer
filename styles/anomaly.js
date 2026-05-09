// styles/anomaly.js
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

                if (i === 0) {
                    ctx.moveTo(x, y); // Устанавливаем начальную точку пути
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath(); // Автоматически соединяет последнюю точку с первой, убирая разрыв
            ctx.stroke();
        }
    }
};