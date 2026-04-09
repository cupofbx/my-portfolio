/* 全屏波点动画层
 * - 随机生成深红/深蓝高饱和“油画式波点”
 * - 每个波点从第三区(左下)移动到第一区(右上)
 * - 轨迹使用余弦曲率：y = lerp + amp * s(1-s) * cos(pi*s + phase)
 */

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("dotfield");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BLUE = "#0a187d"; // 更深蓝
  const RED = "#690016"; // 更深红

  let w = 0;
  let h = 0;
  let dpr = 1;

  /** @type {Array<{sx:number,sy:number,ex:number,ey:number,size:number,color:string,amp:number,phase:number,duration:number,offset:number,coreJitter:number}>} */
  let dots = [];

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function resize() {
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    w = Math.max(320, window.innerWidth);
    h = Math.max(480, window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initDots();
  }

  function initDots() {
    // 控制数量：波点 50-100px，太多会盖住内容
    const area = w * h;
    const count = Math.max(14, Math.min(26, Math.round(area / 650000)));
    dots = [];
    for (let i = 0; i < count; i++) {
      // 三区(左下)：x∈[0, W/2], y∈[H/2, H]
      const sx = rand(0.03 * w, 0.49 * w);
      const sy = rand(0.52 * h, 0.96 * h);

      // 一区(右上)：x∈[W/2, W], y∈[0, H/2]
      const ex = rand(0.52 * w, 0.97 * w);
      const ey = rand(0.04 * h, 0.45 * h);

      // 大小 50-100px
      const size = rand(50, 100);

      // 深红/深蓝（高饱和）
      const color = Math.random() > 0.5 ? BLUE : RED;

      // 余弦曲线幅度
      const amp = rand(20, 90);
      const phase = rand(0, Math.PI * 2);

      // 每个点周期稍有差异，保证全屏“随机分布感”
      const duration = rand(7500, 10500);
      const offset = rand(0, duration);

      dots.push({
        sx,
        sy,
        ex,
        ey,
        size,
        color,
        amp,
        phase,
        duration,
        offset,
        coreJitter: rand(0.0, 0.035),
      });
    }
  }

  function drawDot(x, y, size, color, t) {
    // 让“边缘更清晰”的做法：不用 blur，直接叠加一个小内核
    const r = size / 2;

    // 轻微的油彩颗粒：通过透明度与半径微抖动实现
    const alphaOuter = 0.86;
    const alphaInner = 0.28;
    const jitter = 1 + Math.sin(t * 0.001 + x * 0.01 + y * 0.01) * 0.005;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alphaOuter;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r * jitter, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alphaInner;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.88, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function frame(now) {
    ctx.clearRect(0, 0, w, h);

    for (const d of dots) {
      const s = ((now + d.offset) % d.duration) / d.duration; // 0..1

      // 线性 x：从左到右
      const x = lerp(d.sx, d.ex, s);

      // 余弦曲率 y：从下到上，同时加入 cos 弯曲（端点保持不偏）
      // y = lerp + amp * s(1-s) * cos(pi*s + phase)
      const baseY = lerp(d.sy, d.ey, s);
      const curvature = d.amp * s * (1 - s) * Math.cos(Math.PI * s + d.phase);
      const y = baseY + curvature;

      // 轻微油画“漂移”：只影响中心位置，不改变轨迹方向
      const jitter = d.size * d.coreJitter;
      const jx = Math.sin(now * 0.001 + d.phase) * jitter;
      const jy = Math.cos(now * 0.0012 + d.phase) * jitter;

      // 绘制
      drawDot(x + jx, y + jy, d.size, d.color, now);
    }

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  // resize 后重建 dots，保持随机性与全屏覆盖
  window.addEventListener("resize", () => resize(), { passive: true });

  resize();
  if (reduceMotion) {
    frame(performance.now());
  } else {
    requestAnimationFrame(frame);
  }
});

