// Sound Lab — Landing Portes ouvertes : animations au scroll, compte à rebours, compteurs, ajout agenda.
document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ----- Apparition au scroll + compteurs -----
function formatCount(el, value) {
  let text = String(Math.round(value));
  if (el.dataset.format === "space") text = text.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return text + (el.dataset.suffix || "");
}

function runCounter(el) {
  const target = Number(el.dataset.count);
  if (reduceMotion) { el.textContent = formatCount(el, target); return; }
  const duration = 1600;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = formatCount(el, target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    entry.target.querySelectorAll("[data-count]").forEach(runCounter);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.2 });

document.querySelectorAll(".po-reveal").forEach((el) => observer.observe(el));

// ----- Compte à rebours -----
const timer = document.querySelector(".po-timer");
if (timer) {
  const target = new Date(timer.dataset.target).getTime();
  const units = {
    d: timer.querySelector('[data-unit="d"]'),
    h: timer.querySelector('[data-unit="h"]'),
    m: timer.querySelector('[data-unit="m"]'),
    s: timer.querySelector('[data-unit="s"]'),
  };
  const pad = (n) => String(n).padStart(2, "0");

  function update() {
    const diff = Math.max(target - Date.now(), 0);
    units.d.textContent = pad(Math.floor(diff / 86400000));
    units.h.textContent = pad(Math.floor(diff / 3600000) % 24);
    units.m.textContent = pad(Math.floor(diff / 60000) % 60);
    units.s.textContent = pad(Math.floor(diff / 1000) % 60);
    if (diff === 0) clearInterval(interval);
  }
  update();
  const interval = setInterval(update, 1000);
}

// ----- CTA collant sur mobile : visible après le hero, caché sur le CTA final -----
const sticky = document.querySelector(".po-sticky");
const hero = document.querySelector(".po-hero");
const finalCta = document.querySelector("#reserver");
if (sticky && hero && finalCta) {
  let pastHero = false;
  let onCta = false;
  const refresh = () => sticky.classList.toggle("is-shown", pastHero && !onCta);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; refresh(); }).observe(hero);
  new IntersectionObserver(([e]) => { onCta = e.isIntersecting; refresh(); }).observe(finalCta);
}

// ----- Carrousel en pile de cartes : flèches, points, swipe (doigt ou souris), clavier, défilement auto -----
const carousel = document.querySelector(".po-carousel");
if (carousel) {
  const stack = carousel.querySelector(".po-stack");
  const cards = [...stack.querySelectorAll(".po-card")];
  const vinyl = carousel.querySelector(".po-vinyl-badge");
  const n = cards.length;
  let current = 0;
  let turns = 0;

  const dots = cards.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `Photo ${i + 1} sur ${n}`);
    b.addEventListener("click", () => { show(i, i > current ? 1 : -1); restart(); });
    carousel.querySelector(".po-dots").appendChild(b);
    return b;
  });

  function layout() {
    cards.forEach((card, i) => {
      const k = (i - current + n) % n;
      card.style.setProperty("--k", k);
      card.classList.toggle("is-front", k === 0);
      card.setAttribute("aria-hidden", String(k !== 0));
    });
    dots.forEach((d, i) => d.setAttribute("aria-selected", String(i === current)));
  }

  function show(i, dir) {
    const next = (i + n) % n;
    if (next === current) return;
    if (dir > 0 && !reduceMotion) {
      // la carte de devant s'envole à gauche puis repasse derrière la pile
      const leaving = cards[current];
      leaving.classList.add("is-out");
      setTimeout(() => leaving.classList.remove("is-out"), 380);
    }
    current = next;
    turns += dir;
    vinyl.style.setProperty("--spin", `${turns * 360}deg`);
    layout();
  }
  const nextSlide = () => show(current + 1, 1);
  const prevSlide = () => show(current - 1, -1);

  carousel.querySelector(".po-next").addEventListener("click", () => { nextSlide(); restart(); });
  carousel.querySelector(".po-prev").addEventListener("click", () => { prevSlide(); restart(); });
  stack.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { nextSlide(); restart(); }
    if (e.key === "ArrowLeft") { prevSlide(); restart(); }
  });

  // Swipe : glisser vers la gauche = photo suivante
  let startX = null;
  stack.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    stack.classList.add("is-dragging");
    stop();
  });
  const endSwipe = (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    stack.classList.remove("is-dragging");
    if (dx < -40) nextSlide();
    else if (dx > 40) prevSlide();
    restart();
  };
  stack.addEventListener("pointerup", endSwipe);
  stack.addEventListener("pointercancel", endSwipe);
  stack.addEventListener("pointerleave", endSwipe);

  // Défilement auto, en pause au survol ou quand l'onglet est caché
  let timer = null;
  function start() { if (!reduceMotion && !timer) timer = setInterval(nextSlide, 4500); }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); start(); }
  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  layout();
  start();
}

// ----- Ajouter à l'agenda (.ics) -----
document.getElementById("po-ics")?.addEventListener("click", () => {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sound Lab//Portes ouvertes//FR",
    "BEGIN:VEVENT",
    "UID:portes-ouvertes-2026@soundlabschool.fr",
    "DTSTAMP:20261013T000000Z",
    "DTSTART:20261122T090000Z",
    "DTEND:20261122T160000Z",
    "SUMMARY:Portes ouvertes Sound Lab",
    "DESCRIPTION:Ateliers de mix\\, sets des étudiants\\, visite des studios. www.soundlabschool.fr",
    "URL:https://www.soundlabschool.fr",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "portes-ouvertes-sound-lab.ics" });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
