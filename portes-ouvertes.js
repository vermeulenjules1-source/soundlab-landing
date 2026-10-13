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
