(function () {
  const data = window.SITE_DATA;
  const PITCH_EMAIL = "hello@beulahventures.com";
  let lang = "ko";

  try {
    const saved = localStorage.getItem("lang");
    if (saved === "ko" || saved === "en") lang = saved;
    else if (!navigator.language.toLowerCase().startsWith("ko")) lang = "en";
  } catch (_) { /* storage unavailable */ }

  const t = (key) => data.i18n[lang][key] ?? data.i18n.ko[key] ?? key;
  const pick = (obj) => (obj && typeof obj === "object" ? obj[lang] ?? obj.ko : obj);

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    });
    (children || []).forEach((c) => node.appendChild(c));
    return node;
  }

  function renderPortfolio() {
    const grid = document.getElementById("portfolio-grid");
    grid.replaceChildren();
    data.portfolio.forEach((co) => {
      const name = el(co.url ? "a" : "h3", co.url ? { class: "name", href: co.url, target: "_blank", rel: "noopener", text: co.name } : { text: co.name });
      grid.appendChild(el("article", { class: "portfolio-item" }, [
        el("span", { class: "tag", text: pick(co.sector) }),
        el("div", {}, [name, el("p", { class: "muted", text: pick(co.desc) })])
      ]));
    });
    grid.appendChild(el("article", { class: "portfolio-item open" }, [
      el("span", { class: "tag", text: t("portfolio.open") }),
      el("a", { href: "#pitch", text: t("portfolio.openCta") })
    ]));
    document.querySelector('[data-i18n="portfolio.note"]').hidden = data.portfolio.length > 0;
  }

  function renderTeam() {
    const grid = document.getElementById("team-grid");
    grid.replaceChildren();
    data.team.forEach((m) => {
      const name = pick(m.name);
      grid.appendChild(el("article", { class: "member" }, [
        el("div", { class: "avatar", text: name.trim().charAt(0) }),
        el("h3", { text: name }),
        el("p", { class: "role", text: pick(m.role) }),
        el("p", { text: pick(m.bio) })
      ]));
    });
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });
    // Trusted, site-authored strings that carry <em>/<br> emphasis
    document.querySelectorAll("[data-i18n-html]").forEach((node) => {
      node.innerHTML = t(node.dataset.i18nHtml);
    });
    document.querySelector(".lang-toggle").textContent = lang === "ko" ? "EN" : "한국어";
    renderPortfolio();
    renderTeam();
    renderYears();
    renderFlywheel();
    const status = document.getElementById("form-status");
    status.textContent = "";
    status.className = "form-status full";
  }

  // Seven years of plenty and famine, drawn with grains. Same scale for every year.
  function renderYears() {
    const svg = document.getElementById("years-chart");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const W = 980, H = 300, left = 40, right = 20, top = 34, base = 230;
    const cols = 14, colW = (W - left - right) / cols;
    // Plenty: store 4 units a year. Famine: draw 3.6 a year. Never reaches zero.
    const store = [];
    let level = 0;
    for (let y = 0; y < cols; y++) { level += y < 7 ? 4 : -3.6; store.push(Math.max(level, 0)); }
    const maxStore = 28;
    const sy = (v) => base - (v / maxStore) * (base - top - 20);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.replaceChildren();
    const add = (tag, attrs, text) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (text != null) n.textContent = text;
      svg.appendChild(n);
      return n;
    };
    add("text", { x: left, y: top - 10, class: "yc-era" }, t("joseph.plenty"));
    add("text", { x: left + colW * 7, y: top - 10, class: "yc-era" }, t("joseph.famine"));
    add("line", { x1: left + colW * 7, y1: top - 4, x2: left + colW * 7, y2: base, class: "yc-divider" });
    let d = `M ${left} ${base}`;
    store.forEach((v, i) => { d += ` L ${left + colW * i} ${sy(v)} L ${left + colW * (i + 1)} ${sy(v)}`; });
    d += ` L ${left + colW * cols} ${base} Z`;
    add("path", { d, class: "yc-store" });
    for (let i = 0; i < cols; i++) {
      const cx = left + colW * (i + 0.5);
      const plenty = i < 7;
      const n = plenty ? 5 : 2;
      for (let k = 0; k < n; k++) {
        const ang = (k - (n - 1) / 2) * (plenty ? 16 : 22);
        const r = plenty ? 26 : 12;
        const gx = cx + Math.sin(ang * Math.PI / 180) * r;
        const gy = base - 16 - Math.cos(ang * Math.PI / 180) * r - (plenty ? 24 : 0);
        add("ellipse", { cx: gx, cy: gy, rx: plenty ? 4.6 : 3.4, ry: plenty ? 12 : 8, transform: `rotate(${ang} ${gx} ${gy})`, class: plenty ? "yc-grain" : "yc-grain-thin" });
      }
      add("text", { x: cx, y: base + 22, class: "yc-tick", "text-anchor": "middle" }, String(i + 1));
    }
    add("line", { x1: left, y1: base, x2: W - right, y2: base, class: "yc-axis" });
    add("text", { x: left, y: base + 46, class: "yc-axis-label" }, t("joseph.year"));
    add("rect", { x: W - right - 230, y: H - 23, width: 14, height: 10, class: "yc-store" });
    add("text", { x: W - right - 210, y: H - 14, class: "yc-legend" }, t("joseph.store"));
    add("ellipse", { cx: W - right - 100, cy: H - 18, rx: 3.2, ry: 7, class: "yc-grain" });
    add("text", { x: W - right - 90, y: H - 14, class: "yc-legend" }, t("joseph.harvest"));
  }

  // Flywheel = the brand mark, enlarged: seven grains around the gospel
  function renderFlywheel() {
    const svg = document.getElementById("flywheel");
    if (!svg) return;
    const NS = "http://www.w3.org/2000/svg";
    const C = 280, R = 150, N = 7;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    svg.setAttribute("viewBox", "-80 -10 720 580");
    svg.replaceChildren();
    const add = (parent, tag, attrs, text) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (text != null) n.textContent = text;
      parent.appendChild(n);
      return n;
    };
    const deg = (i) => -90 + (i * 360) / N;
    const pt = (a, r) => [C + r * Math.cos(a * Math.PI / 180), C + r * Math.sin(a * Math.PI / 180)];
    add(svg, "circle", { cx: C, cy: C, r: R, class: "fw-ring" });
    if (!reduce) {
      const dot = add(svg, "circle", { r: 5, class: "fw-seed" });
      add(dot, "animateMotion", { dur: "14s", repeatCount: "indefinite", path: `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R}` });
    }
    for (let i = 0; i < N; i++) {
      const a = deg(i);
      const [x, y] = pt(a, R);
      const g = add(svg, "g", { class: "fw-node", style: `--i:${i}` });
      add(g, "ellipse", { cx: x, cy: y, rx: 22, ry: 48, transform: `rotate(${a + 90} ${x} ${y})` });
      const [lx, ly] = pt(a, R + 86);
      const anchor = Math.abs(lx - C) < 30 ? "middle" : lx > C ? "start" : "end";
      add(g, "text", { x: lx, y: ly - 6, class: "fw-num", "text-anchor": anchor }, "0" + (i + 1));
      add(g, "text", { x: lx, y: ly + 16, class: "fw-label", "text-anchor": anchor }, t("fw.n" + (i + 1)));
    }
    add(svg, "circle", { cx: C, cy: C, r: 62, class: "fw-center" });
    add(svg, "text", { x: C, y: C + 6, class: "fw-center-text", "text-anchor": "middle" }, t("fw.center"));
    add(svg, "text", { x: C, y: C + 28, class: "fw-center-sub", "text-anchor": "middle" }, t("fw.centerSub"));
  }

  // River scene: one wide tree stands in the middle by the water.
  // Its seeds fall and drift to either side, are planted, and grow into new trees and grass.
  function initField() {
    const canvas = document.getElementById("field-canvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#111";
    const water = getComputedStyle(document.documentElement).getPropertyValue("--water").trim() || "#3b8fc4";
    let w = 0, h = 0, bankY = 0, mother = null, plants = [], seeds = [], floaters = [], nextSeed = 0, visible = true, raf = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const ease = (v) => 1 - Math.pow(1 - v, 3);

    // Branching tree. `wide` pushes the first forks outward for a broad crown.
    function makeTree(trunk, maxD, wide) {
      const segs = [], leaves = [];
      const grow = (x, y, ang, len, d) => {
        const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
        segs.push({ x, y, x2, y2, d, wdt: Math.max(0.6, (maxD - d) * (wide ? 0.75 : 0.55)) });
        if (d === maxD) { leaves.push({ x: x2, y: y2, ang: ang + Math.PI / 2 }); return; }
        const n = d > 1 && Math.random() < 0.3 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const base = wide && d < 3 ? rnd(0.62, 0.9) : rnd(0.34, 0.56);
          const spread = (i - (n - 1) / 2) * base;
          const ratio = wide && d < 2 ? rnd(0.74, 0.82) : rnd(0.68, 0.78);
          grow(x2, y2, ang + spread + rnd(-0.08, 0.08), len * ratio, d + 1);
        }
      };
      grow(0, 0, -Math.PI / 2 + rnd(-0.03, 0.03), trunk, 0);
      return { segs, leaves, maxD };
    }
    function makeGrass() {
      const n = Math.round(rnd(3, 6));
      return Array.from({ length: n }, (_, i) => ({ lean: (i - (n - 1) / 2) * rnd(0.15, 0.3), len: rnd(8, 22), phase: rnd(0, 6) }));
    }
    function addPlant(x, now, kind, age) {
      const tree = kind === "tree";
      const p = {
        x, kind, born: now - (age || 0), dur: tree ? rnd(16000, 26000) : rnd(4000, 7000), dying: 0,
        shape: tree ? makeTree((bankY - 14) / 3.6 * rnd(0.32, 0.6), 5, false) : makeGrass()
      };
      plants.push(p);
      return p;
    }
    const childTrees = () => plants.filter((p) => p.kind === "tree" && !p.dying).length;
    const clearOfMother = (x) => Math.abs(x - w / 2) > Math.max(70, w * 0.13);

    function setup(now) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bankY = h * 0.68;
      plants = []; seeds = [];
      const trunk = (bankY - 14) / (w < 600 ? 4.4 : 3.7);
      mother = { x: w / 2, born: now - 1e9, dur: 1, shape: makeTree(trunk, 6, true) };
      // A few offspring already on their way, so the story is visible on the first frame
      [-1, 1].forEach((side) => {
        addPlant(w / 2 + side * rnd(w * 0.2, w * 0.3), now, "tree", rnd(9000, 20000));
        if (w > 700) addPlant(w / 2 + side * rnd(w * 0.34, w * 0.44), now, "tree", rnd(2000, 8000));
      });
      const grass = Math.round(w / 55);
      for (let i = 0; i < grass; i++) { const x = rnd(10, w - 10); if (clearOfMother(x)) addPlant(x, now, "grass", rnd(0, 9000)); }
      floaters = Array.from({ length: Math.round(w / 80) }, () => ({ x: rnd(0, w), lane: Math.floor(rnd(0, 3)), v: rnd(0.25, 0.6), rot: rnd(0, 6) }));
    }

    function riverY(x, lane, t) { return bankY + 16 + lane * 13 + Math.sin(x * 0.018 + t / 900 + lane * 1.7) * 3.2; }
    function drawRiver(t) {
      // a faint wash of water under the lines
      const grad = ctx.createLinearGradient(0, bankY, 0, bankY + 64);
      grad.addColorStop(0, water); grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 0.1; ctx.fillStyle = grad; ctx.fillRect(0, bankY, w, 64);
      ctx.strokeStyle = water;
      for (let lane = 0; lane < 4; lane++) {
        ctx.globalAlpha = 0.85 - lane * 0.17; ctx.lineWidth = lane === 0 ? 1.4 : 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) { const y = riverY(x, lane, t); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1; ctx.lineWidth = 1; ctx.strokeStyle = ink;
      ctx.beginPath(); ctx.moveTo(0, bankY); ctx.lineTo(w, bankY); ctx.stroke();
    }
    function grain(x, y, rx, ry, rot, fill, alpha) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = ink; ctx.fill(); } else { ctx.strokeStyle = ink; ctx.stroke(); }
      ctx.restore();
    }
    function drawTree(p, t, leafScale) {
      const g = ease(clamp((t - p.born) / p.dur));
      const alpha = p.dying ? clamp(1 - (t - p.dying) / 2000) : 1;
      if (alpha <= 0) return;
      const { segs, leaves, maxD } = p.shape;
      const step = 0.8 / (maxD + 1);
      const sway = reduce ? 0 : Math.sin(t / 2600 + p.x) * 0.012;
      ctx.save(); ctx.translate(p.x, bankY); ctx.rotate(sway);
      ctx.strokeStyle = ink; ctx.globalAlpha = alpha;
      segs.forEach((sg) => {
        const f = clamp((g - sg.d * step) / step);
        if (f <= 0) return;
        ctx.lineWidth = sg.wdt;
        ctx.beginPath(); ctx.moveTo(sg.x, sg.y); ctx.lineTo(sg.x + (sg.x2 - sg.x) * f, sg.y + (sg.y2 - sg.y) * f); ctx.stroke();
      });
      const lf = clamp((g - 0.8) / 0.2);
      if (lf > 0) leaves.forEach((l, i) => {
        const flutter = reduce ? 0 : Math.sin(t / 700 + i) * 0.15;
        grain(l.x, l.y, 2.4 * lf * leafScale, 5.8 * lf * leafScale, l.ang + flutter, i % 3 !== 0, alpha);
      });
      ctx.restore(); ctx.globalAlpha = 1;
    }
    function drawGrass(p, t) {
      const g = ease(clamp((t - p.born) / p.dur));
      const alpha = p.dying ? clamp(1 - (t - p.dying) / 2000) : 1;
      if (alpha <= 0) return;
      ctx.strokeStyle = ink; ctx.globalAlpha = alpha; ctx.lineWidth = 1;
      p.shape.forEach((b) => {
        const sway = reduce ? 0 : Math.sin(t / 1300 + b.phase) * 0.12;
        const len = b.len * g, a = -Math.PI / 2 + b.lean + sway;
        ctx.beginPath(); ctx.moveTo(p.x, bankY);
        ctx.quadraticCurveTo(p.x + Math.cos(a) * len * 0.3, bankY - len * 0.6, p.x + Math.cos(a) * len, bankY + Math.sin(a) * len);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
    // A seed leaves a leaf of the big tree and drifts out to one side
    function spawnSeed(t) {
      const leaf = mother.shape.leaves[Math.floor(Math.random() * mother.shape.leaves.length)];
      const x0 = mother.x + leaf.x, y0 = bankY + leaf.y;
      const side = leaf.x === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(leaf.x);
      let x1 = w / 2 + side * rnd(Math.max(70, w * 0.14), w * 0.48);
      x1 = Math.max(12, Math.min(w - 12, x1));
      seeds.push({ x0, y0, x1, peak: y0 - rnd(6, 30), start: t, dur: rnd(3200, 5200), spin: rnd(-6, 6) });
    }
    function drawSeeds(t) {
      seeds = seeds.filter((s) => {
        const u = (t - s.start) / s.dur;
        if (u >= 1) {
          const living = plants.filter((p) => !p.dying);
          if (living.length > w / 22) {
            const old = living.find((p) => p.kind === "grass") || living.find((p) => p.kind === "tree");
            if (old) old.dying = t;
          }
          const canTree = childTrees() < Math.max(3, Math.round(w / 220));
          addPlant(s.x1, t, canTree && Math.random() < 0.45 ? "tree" : "grass", 0);
          return false;
        }
        const x = s.x0 + (s.x1 - s.x0) * u + Math.sin(u * Math.PI * 3) * 12;
        const y = (1 - u) * (1 - u) * s.y0 + 2 * (1 - u) * u * s.peak + u * u * bankY;
        grain(x, y, 2, 4.6, s.spin * u, true, 0.9);
        return true;
      });
    }
    function drawFloaters(t) {
      floaters.forEach((f) => {
        if (!reduce) { f.x += f.v; f.rot += 0.01; if (f.x > w + 10) f.x = -10; }
        grain(f.x, riverY(f.x, f.lane, t) - 2, 1.8, 4, Math.PI / 2 + Math.sin(f.rot) * 0.4, false, 0.6);
      });
    }
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      drawRiver(t);
      plants = plants.filter((p) => !(p.dying && t - p.dying > 2000));
      plants.forEach((p) => (p.kind === "tree" ? drawTree(p, t, 1) : drawGrass(p, t)));
      drawTree(mother, t, 1.15);
      drawFloaters(t);
      if (!reduce) {
        if (t > nextSeed) { spawnSeed(t); nextSeed = t + rnd(900, 1700); }
        drawSeeds(t);
        if (visible) raf = requestAnimationFrame(frame);
      }
    }
    const now0 = performance.now();
    setup(reduce ? now0 + 1e6 : now0);
    frame(reduce ? now0 + 1e6 : now0);
    if (!reduce && "IntersectionObserver" in window) {
      new IntersectionObserver((es) => {
        const v = es.some((e) => e.isIntersecting);
        if (v && !visible) { visible = true; raf = requestAnimationFrame(frame); }
        visible = v;
      }).observe(canvas);
    }
    let rz = 0;
    window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { cancelAnimationFrame(raf); const n = performance.now(); setup(reduce ? n + 1e6 : n); visible = true; frame(reduce ? n + 1e6 : n); }, 150); });
  }
  initField();

  // Reveal on scroll. Content is visible by default; the animation only plays as it enters view.
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const targets = document.querySelectorAll(".reveal, .values > li, .stages > li, .tracks > li, .fw-list > li, .modules > li, .facts > div, .years, .equation-line");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.animationDelay = `${Math.min(idx, 7) * 70}ms`;
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.12 });
    targets.forEach((el) => io.observe(el));
  }

  document.querySelector(".lang-toggle").addEventListener("click", () => {
    lang = lang === "ko" ? "en" : "ko";
    try { localStorage.setItem("lang", lang); } catch (_) { /* ignore */ }
    applyLang();
  });

  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Pitch form: static site, so it composes an email. Swap for Formspree/Netlify Forms/etc. to collect submissions server-side.
  document.getElementById("pitch-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const f = Object.fromEntries(new FormData(form).entries());
    const status = document.getElementById("form-status");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email || "");
    if (!f.name?.trim() || !emailOk || !f.company?.trim() || !f.desc?.trim()) {
      status.textContent = t("form.error");
      status.className = "form-status full error";
      return;
    }
    if (!f.cohort?.trim() || !f.completed) {
      status.textContent = t("form.errorV101");
      status.className = "form-status full error";
      return;
    }
    const subject = `[Pitch] ${f.company} (${f.stage})`;
    const body = [
      `Name: ${f.name}`,
      `Email: ${f.email}`,
      `Company: ${f.company}`,
      `Track: ${f.track}`,
      `Stage: ${f.stage}`,
      `Deck: ${f.deck || "-"}`,
      `Venture 101 cohort: ${f.cohort}`,
      "",
      f.desc
    ].join("\n");
    const full = `Subject: ${subject}\n\n${body}`;
    const mailLink = el("a", { class: "btn btn-light", href: `mailto:${PITCH_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, text: t("form.openMail") });
    const copyBtn = el("button", { type: "button", class: "btn btn-outline-light", text: t("form.copy") });
    copyBtn.addEventListener("click", () => {
      const done = () => { copyBtn.textContent = t("form.copied"); };
      navigator.clipboard?.writeText(full).then(done, () => { pre.focus(); window.getSelection().selectAllChildren(pre); });
    });
    const pre = el("pre", { class: "pitch-preview", tabindex: "0", text: full });
    status.replaceChildren(
      el("span", { text: t("form.ok") + " " }),
      el("strong", { class: "pitch-email", text: PITCH_EMAIL }),
      pre,
      el("span", { class: "pitch-actions" }, [mailLink, copyBtn])
    );
    status.className = "form-status full ok";
  });

  document.getElementById("year").textContent = new Date().getFullYear();
  applyLang();
})();
