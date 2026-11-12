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
    document.querySelector(".lang-toggle").textContent = lang === "ko" ? "EN" : "한국어";
    renderPortfolio();
    renderTeam();
    const status = document.getElementById("form-status");
    status.textContent = "";
    status.className = "form-status full";
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
