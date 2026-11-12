/* Kumaru Kurierdienst, Entwurf v3. Inhalte von kurierkumaru.de, kein Backend. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

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
    burger.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    mobile.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  mobile.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMega(); setMenu(false); } });

  /* ---------- Fahrzeuge: Bilder von kurierkumaru.de ---------- */
  const tabs = [...document.querySelectorAll(".veh__tabs [role=tab]")];
  const vImg = $("vImg");
  function showVehicle(t) {
    tabs.forEach((b) => b.setAttribute("aria-selected", String(b === t)));
    const d = t.dataset;
    vImg.dataset.want = d.img; // jüngste Auswahl merken, ältere Ladevorgänge verfallen
    if (vImg.getAttribute("src") !== d.img) {
      const want = d.img;
      const swap = () => {
        if (vImg.dataset.want !== want) return; // inzwischen ein anderes Fahrzeug gewählt
        vImg.src = want; vImg.alt = d.name + " im Kumaru-Design";
        vImg.style.animation = "none"; void vImg.offsetWidth; vImg.style.animation = "";
      };
      // erst entschlüsseln, dann tauschen: kein Aufblitzen und kein Ruckeln beim Wechsel
      let done = false; const go = () => { if (!done) { done = true; swap(); } };
      const pre = new Image(); pre.src = want;
      pre.decode ? pre.decode().then(go, go) : (pre.onload = go);
      setTimeout(go, 1500); // Notausgang, falls der Browser das Entschlüsseln aufschiebt
    }
    $("vName").textContent = d.name;
    $("vL").textContent = d.l; $("vB").textContent = d.b; $("vH").textContent = d.h;
    $("vKg").textContent = Number(d.kg).toLocaleString("de-DE");
    $("vLoad").textContent = d.load;
    $("vLift").textContent = d.lift;
  }
  addEventListener("load", () => (window.requestIdleCallback || setTimeout)(() => tabs.forEach((t) => { const i = new Image(); i.src = t.dataset.img; })));
  tabs.forEach((t) => t.addEventListener("click", () => showVehicle(t)));
  tabs.forEach((t, i) => t.addEventListener("keydown", (e) => {
    const n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!n) return;
    const next = tabs[(i + n + tabs.length) % tabs.length];
    next.focus(); showVehicle(next);
  }));
  showVehicle(tabs.find((b) => b.getAttribute("aria-selected") === "true"));

  /* ---------- Einsatzgebiet: Europakarte ---------- */
  const LON0 = -8, LON1 = 28, LAT0 = 40, LAT1 = 57.4, W = 1000, H = 725;
  const px = (lon) => ((lon - LON0) / (LON1 - LON0)) * W;
  const py = (lat) => ((LAT1 - lat) / (LAT1 - LAT0)) * H;
  const LAND = [ // grobe Umrisse (lon, lat), nur als Punktraster gezeichnet
    [[-9,43.5],[-2,43.4],[-1.2,46],[-4.5,48.4],[-1.5,48.7],[1.5,50.1],[3,51.2],[4.5,52.5],[5,53.4],[8.5,53.8],[8.7,55],[8.2,56.8],[10.5,57.6],[10.3,55],[11.5,54.2],[14,54.1],[18,54.8],[21,55.3],[21,57],[24,57.3],[24.5,59.3],[30,59.8],[30,45],[28.5,45],[28.5,41.3],[26.3,40.2],[23,39.5],[20.2,39.7],[19.4,41.8],[18.5,42.5],[16,43.5],[15.2,44.6],[14.3,45.2],[13.7,45.6],[12.3,45.3],[10,44],[8.5,44.3],[7,43.7],[6,43.1],[3.2,43.2],[3.2,42.4],[0.5,40.2],[-9,40]],
    [[10,44],[12.3,44.5],[13.5,43.6],[14.2,42.4],[16,41.8],[18.5,40.4],[17.1,39.9],[16.6,39],[15.7,38],[15.9,40.2],[14.3,40.7],[12.5,41.7],[11,42.6]],
    [[-5.7,50],[1.4,51.2],[1.7,52.8],[0,53.6],[-2,55.8],[-3,56.6],[-5,56.6],[-6,56.5],[-5,55],[-3,54.8],[-3.3,53.4],[-4.7,52.8],[-5,51.7],[-5.5,50.5]],
    [[-10,51.5],[-6,52],[-6,54.2],[-8,55.2],[-10,54]],
    [[11.1,55.6],[12.6,56],[12.6,55.2],[11.2,54.9]],
    [[11,58],[12.5,56],[14,55.4],[16,56.2],[16.5,57.5],[16.5,59],[11.5,59]],
  ];
  const inside = (pt, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  function drawDots() {
    const cv = $("netDots"), ctx = cv.getContext("2d"), k = cv.width / W;
    ctx.clearRect(0, 0, cv.width, cv.height);
    // Marineblaue Punkte im Sechseckraster, rund um Brühl glühen sie in Markenrot
    const cs = getComputedStyle(cv.closest(".net"));
    const rgb = (v) => { const c = document.createElement("canvas").getContext("2d"); c.fillStyle = v.trim(); return c.fillStyle.match(/\w\w/g).map((h) => parseInt(h, 16)); };
    const navy = rgb(cs.getPropertyValue("--navy")), red = rgb(cs.getPropertyValue("--accent"));
    const hx = px(8.52) * k, hy = py(49.39) * k, reach = 520 * k / 2, rs = k / 2;
    let row = 0, lat = LAT1;
    // in Häppchen von ca. 6 ms zeichnen, damit der Hauptthread frei bleibt
    const slice = () => {
      const t0 = performance.now();
      while (lat > LAT0 && performance.now() - t0 < 6) {
        for (let lon = LON0 + (row % 2) * 0.15; lon < LON1; lon += 0.3) {
          if (!LAND.some((p) => inside([lon, lat], p))) continue;
          const x = px(lon) * k, y = py(lat) * k, t = Math.max(0, 1 - Math.hypot(x - hx, y - hy) / reach), e = t * t;
          const c = navy.map((v, i) => Math.round(v + (red[i] - v) * e));
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.34 + 0.62 * e})`;
          ctx.beginPath(); ctx.arc(x, y, (3 + 1.6 * e) * rs, 0, 7); ctx.fill();
        }
        lat -= 0.2; row++;
      }
      if (lat > LAT0) setTimeout(slice, 16);
    };
    slice();
  }

  // Punktraster nach dem Laden zeichnen, wenn der Browser Luft hat
  addEventListener("load", () => (window.requestIdleCallback || setTimeout)(drawDots, { timeout: 1500 }));

  // [Name, Länge, Breite, Hub?, Beschriftungsrichtung]
  const CITIES = [
    ["Brühl", 8.52, 49.39, true, "down"],
    ["Paris", 2.35, 48.85], ["London", -0.12, 51.5, false, "left"], ["Amsterdam", 4.9, 52.37, false, "up"], ["Brüssel", 4.35, 50.85, false, "up"],
    ["Zürich", 8.54, 47.37, false, "down"], ["Mailand", 9.19, 45.46, false, "down"], ["Wien", 16.37, 48.2], ["Prag", 14.42, 50.08, false, "up"],
    ["Warschau", 21, 52.23], ["Kopenhagen", 12.57, 55.68, false, "up"], ["Barcelona", 2.17, 41.39],
  ];
  const svg = $("netSvg"), NS = "http://www.w3.org/2000/svg";
  const hub = CITIES[0], hx = px(hub[1]), hy = py(hub[2]);
  const arcs = [];
  CITIES.slice(1).forEach((c, i) => {
    const x = px(c[1]), y = py(c[2]);
    const dist = Math.hypot(x - hx, y - hy);
    const path = document.createElementNS(NS, "path");
    path.setAttribute("class", "arc");
    path.setAttribute("d", `M${hx} ${hy} Q${(hx + x) / 2} ${Math.min(hy, y) - dist * 0.22} ${x} ${y}`);
    svg.appendChild(path);
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = reduce ? 0 : len;
    path.style.transition = reduce ? "none" : `stroke-dashoffset 1500ms cubic-bezier(.23,1,.32,1) ${i * 100}ms`;
    arcs.push(path);
  });
  CITIES.forEach((c) => {
    const x = px(c[1]), y = py(c[2]), g = document.createElementNS(NS, "g");
    g.setAttribute("class", "node" + (c[3] ? " node--hub" : ""));
    const dir = c[4], mid = dir === "up" || dir === "down";
    const tx = mid ? x : dir === "left" ? x - 18 : x + 18, ty = dir === "up" ? y - 20 : dir === "down" ? y + 34 : y + 7;
    g.innerHTML = `<circle class="halo" cx="${x}" cy="${y}" r="${c[3] ? 17 : 12}"/><circle class="dot" cx="${x}" cy="${y}" r="${c[3] ? 8 : 5.5}"/><text x="${tx}" y="${ty}" text-anchor="${mid ? "middle" : dir === "left" ? "end" : "start"}">${c[0]}</text>`;
    svg.appendChild(g);
  });
  const netIO = new IntersectionObserver(([en]) => {
    if (!en.isIntersecting) return;
    arcs.forEach((a) => (a.style.strokeDashoffset = 0));
    netIO.disconnect();
  }, { threshold: 0.35 });
  netIO.observe($("netMap"));
  
  /* ---------- Zähler: Walzen statt Hochzählen ---------- */
  document.querySelectorAll(".odo").forEach((el) => {
    const v = el.dataset.value; let n = 0;
    el.innerHTML = [...v].map((ch) => {
      if (!/\d/.test(ch)) return `<span class="s" aria-hidden="true">${ch}</span>`;
      const col = Array.from({ length: 10 }, (_, d) => `<i>${d}</i>`).join("");
      return `<span class="d" aria-hidden="true"><span style="--n:${ch};--dl:${n++ * 90}ms">${col}</span></span>`;
    }).join("");
  });
  const oio = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("is-in"); oio.unobserve(en.target); }
  }), { threshold: 0.6 });
  document.querySelectorAll(".odo").forEach((el) => (reduce ? el.classList.add("is-in") : oio.observe(el)));

  /* ---------- Kundennamen laufen von links ein ---------- */
  const logos = $("logos");
  const lio = new IntersectionObserver(([en]) => { if (en.isIntersecting) { logos.classList.add("is-in"); lio.disconnect(); } }, { threshold: 0.5 });
  reduce ? logos.classList.add("is-in") : lio.observe(logos);

  /* ---------- Statement "Inhabergeführt" ---------- */
  const stm = document.querySelector(".stm");
  const sio = new IntersectionObserver(([en]) => { if (en.isIntersecting) { stm.classList.add("is-in"); sio.disconnect(); } }, { threshold: 0.35 });
  reduce ? stm.classList.add("is-in") : sio.observe(stm);

  /* ---------- Anfrage (Demo, kein Versand) ---------- */
  const form = $("orderForm"), done = $("done");
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

  /* ---------- Logo: Seite neu laden, Start oben ---------- */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  document.querySelectorAll("[data-reload]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    location.href === location.origin + location.pathname ? location.reload() : location.assign(location.pathname + location.search);
  }));

  /* ---------- Kopfzeile: Glas ab dem ersten Scrollen ---------- */
  const top = document.querySelector(".top");
  const glass = () => top.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", glass, { passive: true }); glass();
})();
