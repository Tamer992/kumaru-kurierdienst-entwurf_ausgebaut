(() => {
  "use strict";
/* Kumaru Kurierdienst, Unterseiten: Navigation und Kopfzeile. build.py fügt die Bereichsdateien an und schließt alles in eine Funktion ein. */
  const $ = (id) => document.getElementById(id);
  const EN = document.documentElement.lang === "en"; // englische Fassung unter /en/

  /* ---------- Navigation ---------- */
  const navBtns = [...document.querySelectorAll(".nav__btn")];
  const closeMega = () => navBtns.forEach((b) => { b.setAttribute("aria-expanded", "false"); $(b.getAttribute("aria-controls")).hidden = true; });
  navBtns.forEach((b) => b.addEventListener("click", () => {
    const open = b.getAttribute("aria-expanded") === "true";
    closeMega();
    if (!open) { b.setAttribute("aria-expanded", "true"); $(b.getAttribute("aria-controls")).hidden = false; }
  }));
  document.addEventListener("click", (e) => { if (!e.target.closest(".top") || e.target.closest(".mega a")) closeMega(); });

  const burger = $("burger"), mobile = $("mobileNav");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? (EN ? "Close menu" : "Menü schließen") : (EN ? "Open menu" : "Menü öffnen"));
    if (open) mobile.style.paddingTop = Math.round(document.querySelector(".top").getBoundingClientRect().bottom + 16) + "px"; // Menü beginnt direkt unter der Kopfzeile, auch nach dem Scrollen
    mobile.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  mobile.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMega(); setMenu(false); } });

  /* ---------- Kopfzeile: Glas ab dem ersten Scrollen ---------- */
  const top = document.querySelector(".top");
  const glass = () => top.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", glass, { passive: true }); glass();

  /* ---------- Anfrage (Demo, kein Versand) ---------- */
  const form = $("orderForm"), done = $("done");
  if (form) {
    const req = [...form.querySelectorAll("[required]")];
    const bad = (el) => !el.value.trim() || (el.type === "email" && !/^\S+@\S+\.\S+$/.test(el.value));
    const mark = (el, isBad) => {
      el.setAttribute("aria-invalid", String(isBad));
      const m = el.parentElement.querySelector(".field__err");
      if (m) { m.hidden = !isBad; m.id ||= el.id + "-err"; isBad ? el.setAttribute("aria-describedby", m.id) : el.removeAttribute("aria-describedby"); }
    };
    req.forEach((el) => el.addEventListener("input", () => !bad(el) && mark(el, false)));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let first;
      req.forEach((el) => { const b = bad(el); mark(el, b); if (b && !first) first = el; });
      if (first) return first.focus();
      done.hidden = false; form.reset();
    });
  }

  /* ---------- Schnellanfrage der Startseite: Felder vorbelegen ---------- */
  const q = new URLSearchParams(location.search);
  if ($("orderForm") && (q.get("von") || q.get("nach") || q.get("fz"))) {
    const v = (k) => (q.get(k) || "").slice(0, 120);
    $("f-von").value = v("von"); $("f-nach").value = v("nach");
    if (v("fz")) $("f-info").value = (EN ? "Vehicle: " : "Fahrzeug: ") + v("fz");
  }

  /* ---------- Branchen: aktuelle Branche im Register markieren, am Handy ins Bild rücken ---------- */
  const brLinks = [...document.querySelectorAll(".br__nav a")];
  if (brLinks.length && "IntersectionObserver" in window) {
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const bio = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      brLinks.forEach((a) => a.setAttribute("aria-current", String(a.hash === "#" + en.target.id)));
      const cur = brLinks.find((a) => a.hash === "#" + en.target.id), ol = cur && cur.closest("ol");
      if (ol && ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: cur.offsetLeft - 4, behavior: still.matches ? "auto" : "smooth" });
    }), { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll(".br__item").forEach((el) => bio.observe(el));
    const brOl = brLinks[0].closest("ol"); // weicher Auslauf nur, solange rechts noch Branchen folgen
    const brEnd = () => brOl.classList.toggle("is-end", brOl.scrollLeft + brOl.clientWidth >= brOl.scrollWidth - 2);
    brOl.addEventListener("scroll", brEnd, { passive: true }); brEnd();
  }

  /* ---------- Kontakt: Erreichbarkeit live (Zeit in Deutschland) ---------- */
  const st = document.getElementById("kxStatus"), wk = document.getElementById("week");
  if (st || wk) {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Berlin", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const d = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
    const min = +p.hour * 60 + +p.minute;
    const open = { 1: 420, 2: 420, 3: 420, 4: 420, 5: 420, 6: 540 };
    if (wk) { const li = wk.querySelector('[data-d="' + d + '"]'); if (li) li.classList.add("is-today"); }
    if (st) {
      const on = open[d] !== undefined && min >= open[d] && min < 1080;
      st.dataset.state = on ? "open" : "closed";
      st.textContent = EN ? (on ? "Open now, until 18:00 (German time)" : "Closed now. Mon to Fri 07:00 to 18:00, Sat 09:00 to 18:00 (German time)") : on ? "Jetzt erreichbar, bis 18:00 Uhr" : "Aktuell geschlossen. Mo bis Fr 07:00 bis 18:00 Uhr, Sa 09:00 bis 18:00 Uhr";
    }
  }
})();
