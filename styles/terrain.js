// styles/audio_terrain.js
(function () {
    const COLS = 36;
    const ROWS = 28;
    const CELL = 5;
    const FOCAL = 500;
    const HEIGHT_SCALE = 40;
    const LIGHT = (() => {
        const x = -0.4, y = -0.8, z = -0.45;
        const l = Math.hypot(x, y, z);
        return [x/l, y/l, z/l];
    })();

    const heights = new Float32Array(COLS * ROWS);
    let scrollOffset = 0;

    const WORLD = new Float32Array(COLS * ROWS * 3);
    const SCREEN = new Float32Array(COLS * ROWS * 3);

    const TRIS = [];
    for (let r = 0; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS - 1; c++) {
            const a = r * COLS + c;
            const b = r * COLS + c + 1;
            const d = (r + 1) * COLS + c;
            const e = (r + 1) * COLS + c + 1;
            TRIS.push([a, d, b]);
            TRIS.push([b, d, e]);
        }
    }

    function noise(x, t) {
        return Math.sin(x * 0.7 + t) * 0.5
             + Math.sin(x * 1.9 - t * 0.6) * 0.25
             + Math.sin(x * 3.1 + t * 1.3) * 0.15;
    }

    window.CurrentVisualizerStyle = {
        draw(ctx, cx, cy, intensity, time, dataArray) {
            const bass = dataArray ? (dataArray[1] + dataArray[3] + dataArray[5]) / (3 * 255) : 0;
            scrollOffset += 0.25 + bass * 1.2 + intensity * 0.4;

            if (scrollOffset >= 1) {
                const steps = Math.floor(scrollOffset);
                scrollOffset -= steps;
                for (let s = 0; s < steps; s++) {
                    heights.copyWithin(COLS, 0, COLS * (ROWS - 1));
                    for (let c = 0; c < COLS; c++) {
                        const mirrored = c < COLS / 2 ? c : COLS - c - 1;
                        const fIdx = Math.floor((mirrored / (COLS/2)) * 64) + 2;
                        const fv = dataArray ? dataArray[fIdx] / 255 : 0;
                        heights[c] = fv * HEIGHT_SCALE + noise(c, time) * 6;
                    }
                }
            }

            const halfW = (COLS - 1) * CELL * 0.5;
            const halfD = (ROWS - 1) * CELL * 0.5;
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const i = (r * COLS + c) * 3;
                    WORLD[i]   = c * CELL - halfW;
                    WORLD[i+1] = -heights[r * COLS + c];
                    WORLD[i+2] = r * CELL - halfD;
                }
            }

            const yaw   = Math.sin(time * 0.25) * 0.25;
            const pitch = 0.55 + Math.sin(time * 0.4) * 0.05;
            const sY = Math.sin(yaw),   cY = Math.cos(yaw);
            const sP = Math.sin(pitch), cP = Math.cos(pitch);
            
            // ЦЕНТРИРОВАНИЕ: Убрано вертикальное смещение camY (-60 -> 0)
            const camZ = 190;
            const camY = 0; 

            const N = COLS * ROWS;
            for (let i = 0; i < N; i++) {
                const ix = i * 3;
                let x = WORLD[ix], y = WORLD[ix+1], z = WORLD[ix+2];

                let xz =  x * cY + z * sY;
                let zz = -x * sY + z * cY;
                x = xz; z = zz;

                let yz = y * cP - z * sP;
                let zp = y * sP + z * cP;
                y = yz; z = zp;

                y += camY;
                z += camZ;

                const k = FOCAL / Math.max(z, 1);
                SCREEN[ix]   = cx + x * k;
                SCREEN[ix+1] = cy + y * k;
                SCREEN[ix+2] = z;
            }

            const order = new Array(TRIS.length);
            for (let i = 0; i < TRIS.length; i++) order[i] = i;
            order.sort((a, b) => {
                const A = TRIS[a], B = TRIS[b];
                const za = SCREEN[A[0]*3+2] + SCREEN[A[1]*3+2] + SCREEN[A[2]*3+2];
                const zb = SCREEN[B[0]*3+2] + SCREEN[B[1]*3+2] + SCREEN[B[2]*3+2];
                return zb - za;
            });

            const baseHue = (time * 18) % 360;
            const farZ = camZ + halfD + 100;
            const nearZ = camZ - halfD - 25;

            for (let oi = 0; oi < order.length; oi++) {
                const tri = TRIS[order[oi]];
                const i0 = tri[0]*3, i1 = tri[1]*3, i2 = tri[2]*3;
                const ax = WORLD[i0], ay = WORLD[i0+1], az = WORLD[i0+2];
                const bx = WORLD[i1], by = WORLD[i1+1], bz = WORLD[i1+2];
                const cxv= WORLD[i2], cyv= WORLD[i2+1], czv= WORLD[i2+2];

                const ux = bx - ax, uy = by - ay, uz = bz - az;
                const vx = cxv - ax, vy = cyv - ay, vz = czv - az;

                let nx = uy * vz - uz * vy;
                let ny = uz * vx - ux * vz;
                let nz = ux * vy - uy * vx;
                const nl = Math.hypot(nx, ny, nz) || 1;
                nx /= nl; ny /= nl; nz /= nl;

                let lambert = -(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
                lambert = Math.max(0, lambert);
                const lit = 0.18 + lambert * 0.82;

                const avgH = -(ay + by + cyv) / 3;
                const norm = Math.min(1, avgH / HEIGHT_SCALE);
                const hue = (baseHue + norm * 90) % 360;
                const sat = 70 + norm * 25;
                const lig = 12 + lit * (38 + norm * 35);

                const zMid = (SCREEN[i0+2] + SCREEN[i1+2] + SCREEN[i2+2]) / 3;
                const fog = 1 - Math.min(1, Math.max(0, (zMid - nearZ) / (farZ - nearZ)));
                const alpha = 0.35 + fog * 0.6;

                ctx.beginPath();
                ctx.moveTo(SCREEN[i0], SCREEN[i0+1]);
                ctx.lineTo(SCREEN[i1], SCREEN[i1+1]);
                ctx.lineTo(SCREEN[i2], SCREEN[i2+1]);
                ctx.closePath();
                ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lig}%, ${alpha})`;
                ctx.fill();

                if (norm > 0.15) {
                    ctx.strokeStyle = `hsla(${hue}, 100%, ${65 + norm * 25}%, ${alpha * 0.45})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }

            // ЦЕНТРИРОВАНИЕ ТУМАНА: Прямоугольник теперь центрирован относительно cx/cy
            const grd = ctx.createLinearGradient(0, cy - 100, 0, cy + 100);
            grd.addColorStop(0, 'rgba(0,0,0,0.35)');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(cx - 350, cy - 100, 700, 200);
        },

        drawParticles(ctx, overallIntensity, mouseX, mouseY, particles, dataArray) {
            // ЦЕНТРИРОВАНИЕ ЧАСТИЦ: Используем те же cx/cy, что и в draw (из VibeBlock_root)
            const target = document.querySelector('[class*="VibeBlock_root"]');
            if (!target) return;
            const rect = target.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            particles.forEach(p => {
                if (p._wx === undefined) {
                    p._wx = (Math.random() - 0.5) * 450;
                    p._wy = -40 - Math.random() * 60;
                    p._wz = (Math.random() - 0.5) * 350;
                    p._phase = Math.random() * Math.PI * 2;
                }
                const pInt = (dataArray ? dataArray[p.freqIndex] : 0) / 255;

                p._phase += 0.02 + pInt * 0.08;
                p._wx += Math.cos(p._phase) * 0.3;
                p._wy += Math.sin(p._phase * 1.3) * 0.2 - pInt * 0.3;
                p._wz += Math.sin(p._phase * 0.7) * 0.25;

                const dx = p.x - mouseX, dy = p.y - mouseY;
                const d2 = dx*dx + dy*dy;
                if (d2 < 30000) {
                    const f = (1 - d2 / 30000) * 0.8;
                    const dd = Math.sqrt(d2) || 1;
                    p._wx += (dx / dd) * f * 4;
                    p._wy += (dy / dd) * f * 2;
                }

                const sP = Math.sin(0.55), cP = Math.cos(0.55);
                let y = p._wy, z = p._wz;
                let yz = y * cP - z * sP;
                let zp = y * sP + z * cP;
                y = yz; z = zp; // Убрано camY здесь для синхронизации
                y += 0; z += 190; // camY=0, camZ=190

                if (z < 10) { p._wz += 350; return; }
                const k = 600 / z;
                const sx = cx + p._wx * k;
                const sy = cy + y * k;
                const size = Math.max(0.5, (p.baseSize + pInt * 3) * k);

                const fog = Math.max(0, Math.min(1, 1 - (z - 100) / 300));
                const a = (0.2 + fog * 0.8) * (0.4 + pInt * 0.6);

                p.hue = (p.hue + 0.5) % 360;
                ctx.fillStyle = `hsla(${p.hue}, 95%, 75%, ${a})`;
                ctx.beginPath();
                ctx.arc(sx, sy, size, 0, Math.PI * 2);
                ctx.fill();

                if (pInt > 0.6) {
                    ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${a * 0.25})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, size * 3.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                p.x = sx; p.y = sy;
            });
        }
    };
})();