// styles/wireframe_torus.js
// Перспективная проекция тора с аудио-displacement по нормалям.
// Вершины пересчитываются каждый кадр; рёбра сортируются по средней глубине.

(function () {
    const SEG_U = 48;          // сегменты вдоль большого круга
    const SEG_V = 18;          // сегменты вдоль трубки
    const R = 160;             // большой радиус
    const r = 55;              // радиус трубки
    const FOCAL = 520;         // фокусное расстояние камеры

    // Предсоздаём индексы рёбер один раз — экономим GC
    const EDGES = [];
    for (let u = 0; u < SEG_U; u++) {
        for (let v = 0; v < SEG_V; v++) {
            const a = u * SEG_V + v;
            const b = ((u + 1) % SEG_U) * SEG_V + v;
            const c = u * SEG_V + ((v + 1) % SEG_V);
            EDGES.push([a, b]); // продольные
            EDGES.push([a, c]); // поперечные
        }
    }

    // Переиспользуемые буферы вершин — без аллокаций в кадре
    const VTX = new Float32Array(SEG_U * SEG_V * 3); // x,y,z в мире
    const PRJ = new Float32Array(SEG_U * SEG_V * 3); // x,y,depth на экране

    window.CurrentVisualizerStyle = {
        draw(ctx, cx, cy, intensity, time, dataArray) {
            // Углы камеры — медленный автоповорот + покачивание от баса
            const bass = dataArray ? (dataArray[2] + dataArray[6] + dataArray[10]) / (3 * 255) : 0;
            const yaw   = time * 0.35;
            const pitch = Math.sin(time * 0.4) * 0.55 + bass * 0.25;

            const sinY = Math.sin(yaw),   cosY = Math.cos(yaw);
            const sinP = Math.sin(pitch), cosP = Math.cos(pitch);

            // 1) Генерируем вершины с displacement по нормали
            let vi = 0;
            for (let u = 0; u < SEG_U; u++) {
                const phi = (u / SEG_U) * Math.PI * 2;
                const cphi = Math.cos(phi), sphi = Math.sin(phi);

                for (let v = 0; v < SEG_V; v++) {
                    const theta = (v / SEG_V) * Math.PI * 2;
                    const cth = Math.cos(theta), sth = Math.sin(theta);

                    // Аудио-displacement: разные частоты по углу phi
                    const freqIdx = (u * 2 + v) % 96;
                    const audio = dataArray ? dataArray[freqIdx] / 255 : 0;
                    const disp  = audio * 35 * (0.6 + intensity * 0.8)
                                + Math.sin(phi * 3 + time * 2) * 4;

                    const rr = r + disp;
                    // Параметризация тора + смещение по нормали (в плоскости трубки)
                    const x =  (R + rr * cth) * cphi;
                    const y =  rr * sth;
                    const z =  (R + rr * cth) * sphi;

                    VTX[vi]   = x;
                    VTX[vi+1] = y;
                    VTX[vi+2] = z;
                    vi += 3;
                }
            }

            // 2) Поворот (Y затем X) + перспективная проекция
            const camZ = 620;
            const N = SEG_U * SEG_V;
            for (let i = 0; i < N; i++) {
                const ix = i * 3;
                let x = VTX[ix], y = VTX[ix+1], z = VTX[ix+2];

                // Yaw (вокруг Y)
                let xz =  x * cosY + z * sinY;
                let zz = -x * sinY + z * cosY;
                x = xz; z = zz;
                // Pitch (вокруг X)
                let yz = y * cosP - z * sinP;
                let zp = y * sinP + z * cosP;
                y = yz; z = zp;

                // Перспектива
                const zc = z + camZ;
                const k  = FOCAL / Math.max(zc, 1);
                PRJ[ix]   = cx + x * k;
                PRJ[ix+1] = cy + y * k;
                PRJ[ix+2] = zc; // храним глубину для сортировки
            }

            // 3) Сортируем рёбра по средней глубине (back-to-front)
            //    Сортируем индексы, чтобы не двигать массив рёбер
            const edgeOrder = EDGES.map((_, k) => k);
            edgeOrder.sort((a, b) => {
                const ea = EDGES[a], eb = EDGES[b];
                const da = (PRJ[ea[0]*3+2] + PRJ[ea[1]*3+2]);
                const db = (PRJ[eb[0]*3+2] + PRJ[eb[1]*3+2]);
                return db - da; // дальние сначала
            });

            // 4) Отрисовка рёбер с depth fog и rim-подсветкой
            const minZ = camZ - R - r - 80;
            const maxZ = camZ + R + r + 80;
            const baseHue = (time * 25) % 360;

            for (let k = 0; k < edgeOrder.length; k++) {
                const e = EDGES[edgeOrder[k]];
                const i0 = e[0] * 3, i1 = e[1] * 3;
                const x0 = PRJ[i0],   y0 = PRJ[i0+1], z0 = PRJ[i0+2];
                const x1 = PRJ[i1],   y1 = PRJ[i1+1], z1 = PRJ[i1+2];
                const zMid = (z0 + z1) * 0.5;

                // depth 0..1 (1 — ближе)
                const depth = 1 - (zMid - minZ) / (maxZ - minZ);
                const dClamp = Math.max(0, Math.min(1, depth));

                // Хроматический сдвиг по углу + глубине
                const hue = (baseHue + dClamp * 80) % 360;
                const alpha = (0.08 + dClamp * 0.85) * (0.5 + intensity * 0.6);
                const lw = 0.4 + dClamp * 1.6 + intensity * 0.8;

                ctx.strokeStyle = `hsla(${hue}, 90%, ${45 + dClamp * 35}%, ${alpha})`;
                ctx.lineWidth = lw;
                ctx.beginPath();
                ctx.moveTo(x0, y0);
                ctx.lineTo(x1, y1);
                ctx.stroke();
            }

            // 5) Объёмное ядро в центре — bloom-имитация
            const coreR = 28 + intensity * 60 + bass * 25;
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
            g.addColorStop(0,   `hsla(${baseHue}, 100%, 80%, 0.9)`);
            g.addColorStop(0.4, `hsla(${(baseHue + 40) % 360}, 100%, 60%, 0.35)`);
            g.addColorStop(1,   'transparent');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
            ctx.fill();
        },

        // Частицы — пыль в 3D-пространстве с тем же фокусом, парят вокруг тора
        drawParticles(ctx, overallIntensity, mouseX, mouseY, particles, dataArray) {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;

            particles.forEach(p => {
                // Лениво инициализируем z-координату в собственном пространстве частицы
                if (p._z === undefined) {
                    p._z = (Math.random() - 0.5) * 800;
                    p._sx = p.x - cx;
                    p._sy = p.y - cy;
                }
                const pInt = (dataArray ? dataArray[p.freqIndex] : 0) / 255;

                // Дрейф в 3D
                p._sx += p.vx * (1 + pInt * 3);
                p._sy += p.vy * (1 + pInt * 3);
                p._z  -= 1.5 + pInt * 4 + overallIntensity * 2;

                // Реакция на курсор в 2D-проекции — мягкое отталкивание
                const dx = (cx + p._sx) - mouseX;
                const dy = (cy + p._sy) - mouseY;
                const d2 = dx*dx + dy*dy;
                if (d2 < 40000) {
                    const f = (1 - d2 / 40000) * 0.6;
                    const dd = Math.sqrt(d2) || 1;
                    p.vx += (dx / dd) * f;
                    p.vy += (dy / dd) * f;
                }
                p.vx *= 0.96; p.vy *= 0.96;

                // Респавн при выходе за дальнюю/ближнюю плоскость
                if (p._z < -300) {
                    p._z = 500;
                    p._sx = (Math.random() - 0.5) * window.innerWidth;
                    p._sy = (Math.random() - 0.5) * window.innerHeight;
                }

                // Перспективная проекция
                const k = 520 / (p._z + 600);
                const sx = cx + p._sx * k;
                const sy = cy + p._sy * k;
                const size = (p.baseSize + pInt * 3) * k;
                if (size < 0.2) return;

                // Глубинный alpha + hue
                const depth = (p._z + 300) / 800; // 0..1
                const a = (0.15 + (1 - depth) * 0.75) * (0.4 + pInt * 0.6);
                p.hue = (p.hue + 0.6) % 360;

                ctx.fillStyle = `hsla(${p.hue}, 85%, ${60 + (1 - depth) * 25}%, ${a})`;
                ctx.beginPath();
                ctx.arc(sx, sy, Math.max(0.4, size), 0, Math.PI * 2);
                ctx.fill();

                // Сохраняем 2D-координаты для следующего mouse-теста
                p.x = sx; p.y = sy;
            });
        }
    };
})();