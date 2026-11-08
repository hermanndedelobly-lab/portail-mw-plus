/* MW+ · Portail culturel wê — navigation et rendu des pages (sans dépendance).
   Le contenu est lu dans content/*.json, modifiable depuis l’espace administrateur (/admin). */
(function () {
  "use strict";
  var S;
  var RUBRIQUES = ["histoire", "langue", "culture", "musique", "tourisme", "mediatheque", "actualites", "business", "contact"];
  var main = document.getElementById("main");
  var nav = document.getElementById("nav");
  var menuBtn = document.querySelector(".menu-btn");
  var MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function section(id) { return S.sections.find(function (s) { return s.id === id; }); }
  function href(sec, page) { return "#" + (sec || "accueil") + (page ? "--" + page : ""); }
  var rubriques = [];
  function paras(t) {
    return String(t || "").split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean)
      .map(function (x) { return "<p>" + esc(x).replace(/\n/g, "<br>") + "</p>"; }).join("");
  }
  function figure(src, alt, credit, creditUrl) {
    if (!src) return "";
    var c = credit ? '<figcaption>' + (creditUrl ? '<a href="' + esc(creditUrl) + '" target="_blank" rel="noopener">' + esc(credit) + "</a>" : esc(credit)) + "</figcaption>" : "";
    return '<figure class="figure"><img src="' + esc(src) + '" alt="' + esc(alt || "") + '" loading="lazy">' + c + "</figure>";
  }

  /* ---------- Menu ---------- */
  function buildNav() {
    var html = "<ul>";
    S.sections.forEach(function (s) {
      if (!s.pages.length) {
        html += '<li><a class="nav__top" data-sec="' + s.id + '" href="#accueil">' + esc(s.label) + "</a></li>";
        return;
      }
      html += '<li><button class="nav__top" type="button" data-sec="' + s.id + '" aria-expanded="false">' +
        esc(s.court || s.label) + '<span class="nav__caret" aria-hidden="true"></span></button><ul class="nav__sub">' +
        '<li><a href="' + href(s.id) + '"><strong>' + esc(s.label) + "</strong></a></li>" +
        s.pages.map(function (p) {
          return '<li><a data-page="' + s.id + "/" + p.id + '" href="' + href(s.id, p.id) + '">' + esc(p.titre) + "</a></li>";
        }).join("") + "</ul></li>";
    });
    nav.innerHTML = html + "</ul>";

    nav.addEventListener("click", function (e) {
      var btn = e.target.closest("button.nav__top");
      if (btn) {
        var li = btn.parentNode, open = !li.classList.contains("open");
        nav.querySelectorAll("li.open").forEach(function (o) { o.classList.remove("open"); o.firstChild.setAttribute("aria-expanded", "false"); });
        if (open) { li.classList.add("open"); btn.setAttribute("aria-expanded", "true"); }
        return;
      }
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target))
        nav.querySelectorAll("li.open").forEach(function (o) { o.classList.remove("open"); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { nav.querySelectorAll("li.open").forEach(function (o) { o.classList.remove("open"); }); closeMenu(); }
    });
    menuBtn.addEventListener("click", function () {
      var open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    });
  }
  function closeMenu() {
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    menuBtn.setAttribute("aria-expanded", "false");
    nav.querySelectorAll("li.open").forEach(function (o) { o.classList.remove("open"); });
  }

  /* ---------- Icônes ---------- */
  var ICO = {
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
    chat: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1z"/><path d="M9 10.5c.5 2 2 3.5 4.5 4.3"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    prev: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>'
  };
  function ico(n) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + ICO[n] + "</svg>"; }
  function dateFr(iso) { var d = new Date(iso + "T12:00:00"); return d.getDate() + " " + MOIS[d.getMonth()] + " " + d.getFullYear(); }
  function lecture(t) { return Math.max(1, Math.round(String(t || "").split(/\s+/).length / 200)) + " min de lecture"; }

  function buildFooter() {
    document.getElementById("year").textContent = new Date().getFullYear();
    document.getElementById("footer-links").innerHTML = S.sections.map(function (s) {
      return '<a href="' + href(s.pages.length ? s.id : "") + '">' + esc(s.label) + "</a>";
    }).join("") + '<a href="#membres--compte"><b>👥 Espace membres</b></a>' +
      (/MWPlusApp/.test(navigator.userAgent) ? "" : '<a href="#contact--application"><b>📱 Application Android</b></a>');
    var R = S.reseaux || {}, tel = (S.telephone || "").trim(), wa = (S.whatsapp || "").trim();
    function bloc(icon, label, valeur, lien) {
      return '<div class="contactbar__item"><span class="contactbar__ico">' + ico(icon) + "</span><div><small>" + label + "</small>" +
        (lien ? '<a href="' + esc(lien) + '">' + esc(valeur) + "</a>" : "<b>" + esc(valeur) + "</b>") + "</div></div>";
    }
    var reseaux = [["facebook", "Facebook", "f"], ["instagram", "Instagram", "ig"], ["youtube", "YouTube", "▶"], ["tiktok", "TikTok", "♪"]]
      .filter(function (r) { return R[r[0]]; })
      .map(function (r) { return '<a class="social" href="' + esc(R[r[0]]) + '" target="_blank" rel="noopener" aria-label="' + r[1] + '">' + r[2] + "</a>"; }).join("");
    document.getElementById("contactbar").innerHTML =
      (wa ? bloc("chat", "WhatsApp", wa, "https://wa.me/" + wa.replace(/\D/g, "")) : "") +
      bloc("mail", "E-mail", S.emailContact, "mailto:" + S.emailContact) +
      (tel ? bloc("phone", "Téléphone", tel, "tel:" + tel.replace(/\s/g, "")) : "") +
      '<form class="newsletter" name="newsletter" id="newsletter"><label for="nl-email">Recevez les nouvelles de la culture wê par e-mail</label>' +
      '<input type="hidden" name="form-name" value="newsletter"><p class="hp" aria-hidden="true"><input name="bot-field" tabindex="-1" autocomplete="off"></p>' +
      '<div class="newsletter__row"><input class="input" id="nl-email" name="email" type="email" required placeholder="Votre e-mail" autocomplete="email">' +
      '<button class="btn btn--brand btn--sm" type="submit">S’inscrire</button></div><small class="newsletter__msg" role="status"></small></form>' +
      (reseaux ? '<div class="contactbar__social"><small>Suivez-nous</small><div>' + reseaux + "</div></div>" : "");
    var nl = document.getElementById("newsletter");
    nl.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = nl.querySelector(".newsletter__msg");
      if (!nl.reportValidity()) return;
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(nl)).toString() })
        .then(function (r) { if (!r.ok) throw 0; nl.reset(); msg.textContent = "Merci, votre inscription est enregistrée."; })
        .catch(function () { msg.textContent = "L’inscription n’a pas abouti. Écrivez-nous à " + S.emailContact + "."; });
    });
  }

  /* ---------- Briques ---------- */
  function sectionCard(s) {
    return '<a class="card card--rubrique" href="' + href(s.id) + '">' +
      '<span class="card__media">' + (s.image ? '<img src="' + esc(s.image) + '" alt="" loading="lazy">' : '<span class="card__motif" aria-hidden="true"></span>') + "</span>" +
      '<span class="card__body"><h3>' + esc(s.label) + "</h3><p>" + esc(s.intro) + '</p><span class="chips">' +
      s.pages.slice(0, 3).map(function (p) { return '<span class="chip">' + esc(p.titre) + "</span>"; }).join("") +
      (s.pages.length > 3 ? '<span class="chip">+' + (s.pages.length - 3) + "</span>" : "") +
      '</span><span class="card__more">Explorer ' + ico("arrow") + "</span></span></a>";
  }
  function newsItem(n) {
    var d = new Date(n.date + "T12:00:00");
    return '<article class="news__item"><div class="news__date"><b>' + d.getDate() + "</b><span>" + MOIS[d.getMonth()] + " " + d.getFullYear() +
      '</span></div><div><span class="tag">' + esc(n.categorie) + (n.lieu ? " · " + esc(n.lieu) : "") + "</span><h3>" + esc(n.titre) +
      "</h3><p>" + esc(n.resume) + "</p>" + (n.image ? '<img class="news__img" src="' + esc(n.image) + '" alt="" loading="lazy">' : "") + "</div></article>";
  }
  function newsSorted() { return S.actualites.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }); }
  function pageHead(eyebrow, title, intro, crumbs) {
    return '<header class="pagehead"><div class="wrap">' + (crumbs ? '<nav class="crumbs" aria-label="Fil d’Ariane">' + crumbs + "</nav>" : "") +
      '<p class="eyebrow">' + esc(eyebrow) + "</p><h1>" + esc(title) + "</h1>" + (intro ? "<p>" + esc(intro) + "</p>" : "") + "</div></header>";
  }
  var aCompleter = '<div class="notice"><p><strong>Rubrique en construction</strong>Cette page attend vos contributions : textes, photos, enregistrements, corrections. ' +
    '<a href="#contact--proposer">Proposer un contenu</a></p></div>';

  /* Publications : actualités d'abord, puis pages illustrées */
  function publications() {
    var news = newsSorted().map(function (n) {
      return { image: n.image, tag: n.categorie, titre: n.titre, lien: n.lien || "#actualites", date: n.date, meta: lecture(n.resume) };
    });
    var pages = [];
    rubriques.forEach(function (s) {
      s.pages.forEach(function (p) {
        if (p.image) pages.push({ image: p.image, tag: s.court || s.label, titre: p.titre, lien: href(s.id, p.id), meta: lecture(p.texte) });
      });
    });
    return { news: news, pages: pages };
  }
  function pubCard(x) {
    return '<a class="pub" href="' + esc(x.lien) + '"><span class="pub__media">' +
      (x.image ? '<img src="' + esc(x.image) + '" alt="" loading="lazy">' : "") + '<span class="pill">' + esc(x.tag) + "</span></span>" +
      '<span class="pub__body"><h3>' + esc(x.titre) + '</h3><span class="pub__meta">' +
      (x.date ? "<span>" + ico("cal") + dateFr(x.date) + "</span>" : "") + "<span>" + ico("clock") + esc(x.meta) + "</span></span></span></a>";
  }

  /* ---------- Carrousel ---------- */
  var timer = null;
  function carousel(slides) {
    if (!slides.length) return '<div class="slider slider--logo"><img src="assets/logo.webp" alt="Logo MW+"></div>';
    return '<div class="slider" id="slider" aria-roledescription="carrousel" aria-label="À la une">' +
      slides.map(function (d, i) {
        return '<a class="slide' + (i ? "" : " is-active") + '" href="' + esc(d.lien || "#accueil") + '" aria-roledescription="diapositive" aria-label="' + (i + 1) + " sur " + slides.length + '"' + (i ? ' tabindex="-1" aria-hidden="true"' : "") + ">" +
          '<img src="' + esc(d.image) + '" alt="" ' + (i ? 'loading="lazy"' : "") + '><span class="slide__shade"></span><span class="slide__text">' +
          '<span class="pill pill--light">' + esc(d.etiquette) + "</span><h2>" + esc(d.titre) + "</h2><p>" + esc(d.texte) + "</p></span>" +
          (d.credit ? '<small class="slide__credit">' + esc(d.credit) + "</small>" : "") + "</a>";
      }).join("") +
      (slides.length > 1 ? '<button class="slider__nav slider__nav--prev" type="button" aria-label="Diapositive précédente">' + ico("prev") + "</button>" +
        '<button class="slider__nav slider__nav--next" type="button" aria-label="Diapositive suivante">' + ico("next") + "</button>" +
        '<div class="slider__dots">' + slides.map(function (d, i) {
          return '<button type="button" aria-label="Afficher : ' + esc(d.titre) + '"' + (i ? "" : ' aria-current="true"') + "></button>";
        }).join("") + "</div>" : "") + "</div>";
  }
  function startCarousel() {
    clearInterval(timer);
    var el = document.getElementById("slider");
    if (!el) return;
    var slides = el.querySelectorAll(".slide"), dots = el.querySelectorAll(".slider__dots button"), cur = 0;
    if (slides.length < 2) return;
    function show(n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === cur;
        s.classList.toggle("is-active", on);
        on ? s.removeAttribute("aria-hidden") : s.setAttribute("aria-hidden", "true");
        s.tabIndex = on ? 0 : -1;
      });
      dots.forEach(function (d, i) { i === cur ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current"); });
    }
    dots.forEach(function (d, i) { d.addEventListener("click", function () { show(i); }); });
    el.querySelector(".slider__nav--prev").addEventListener("click", function () { show(cur - 1); });
    el.querySelector(".slider__nav--next").addEventListener("click", function () { show(cur + 1); });
    var calme = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function play() { if (!calme) { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 6000); } }
    el.addEventListener("mouseenter", function () { clearInterval(timer); });
    el.addEventListener("mouseleave", play);
    el.addEventListener("focusin", function () { clearInterval(timer); });
    var x0 = null;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { show(cur + (dx < 0 ? 1 : -1)); play(); }
    });
    play();
  }

  /* ---------- Pages ---------- */
  function renderHome() {
    document.title = "MW+ · Portail culturel wê";
    var A = S.accueil || {}, P = publications();
    var cartes = P.news.concat(P.pages).slice(0, 4);
    var forts = P.pages.slice(0, 4);
    main.innerHTML =
      '<section class="hero2"><div class="wrap hero2__grid"><div class="hero2__text">' +
      '<span class="pill">' + esc(A.etiquette || "Culture wê") + "</span>" +
      "<h1>" + esc(A.titre) + (A.titreAccent ? " <em>" + esc(A.titreAccent) + "</em>" : "") + "</h1>" +
      '<p class="lead">' + esc(A.texte) + "</p>" +
      '<div class="hero__actions"><a class="btn btn--brand" href="#culture">Découvrir la culture ' + ico("arrow") + '</a>' +
      '<a class="btn btn--line" href="#tourisme--villages">Explorer nos villages ' + ico("pin") + "</a></div></div>" +
      carousel(S.une || []) + "</div></section>" +

      '<section class="villes"><div class="wrap villes__row"><ul class="villes__list" aria-label="Villes du pays wê">' +
      (A.villes || []).map(function (v) {
        return '<li><a href="#ville--' + slug(v) + '"><span class="villes__pin">' + ico("pin") + "</span>" + esc(v) + "</a></li>";
      }).join("") + '</ul><div class="villes__links"><a href="#tourisme--villages">' + ico("grid") + "<span>Tous les villages</span></a>" +
      '<a href="#actualites--evenements">' + ico("cal") + "<span>Agenda</span></a></div></div></section>" +

      '<section class="section section--tight"><div class="wrap layout2"><div class="layout2__main">' +
      '<div class="section__head"><h2>Dernières publications</h2><a class="link-more" href="#actualites">Voir tout ' + ico("arrow") + "</a></div>" +
      '<div class="pubs">' + cartes.map(pubCard).join("") + "</div></div>" +
      '<aside class="forts" aria-labelledby="forts-titre"><h2 id="forts-titre">Temps forts</h2><ul>' +
      forts.map(function (x) {
        return '<li><a href="' + esc(x.lien) + '"><img src="' + esc(x.image) + '" alt="" loading="lazy"><span><span class="tag">' + esc(x.tag) +
          "</span><b>" + esc(x.titre) + "</b><small>" + ico("clock") + esc(x.meta) + "</small></span></a></li>";
      }).join("") + '</ul><a class="link-more" href="#culture">Plus de culture ' + ico("arrow") + "</a></aside></div></section>" +

      '<section class="section section--tight"><div class="wrap"><div class="section__head"><div><p class="eyebrow">Vitrine</p><h2>Produits et savoir-faire wê</h2></div>' +
      '<a class="link-more" href="#contact--partenaire">Mettre mon produit en avant ' + ico("arrow") + '</a></div><div class="vitrine" id="vitrine"><p class="muted">Chargement…</p></div></div></section>' +

      '<section class="section section--tight"><div class="wrap"><div class="invite-chat"><div class="invite-chat__texte">' +
      '<p class="eyebrow">Communauté</p><h2>Rejoignez la conversation</h2>' +
      "<p>Retrouvez les wê de votre ville et de la diaspora, échangez des nouvelles, organisez vos événements et écrivez-vous en privé. L’inscription est gratuite.</p>" +
      '<div class="hero__actions"><a class="btn btn--gold" href="#membres--discussions">' + ico("chat") + " Entrer dans la discussion</a>" +
      '<a class="btn btn--ghost" href="#membres--compte">Créer mon compte</a></div></div>' +
      '<div class="invite-chat__salons"><p class="invite-chat__label">Choisissez votre salon</p><div class="invite-chat__liste">' +
      [{ id: "general", nom: "Général" }].concat(villesListe()).map(function (v) {
        return '<a class="salon-chip" href="#membres--discussions" data-salon="' + v.id + '"><span aria-hidden="true">#</span>' + esc(v.nom) + "</a>";
      }).join("") + "</div>" +
      '<div class="bulles" aria-hidden="true"><span class="bulle">Qui sera à la fête de génération à Duékoué ?</span>' +
      '<span class="bulle bulle--moi">Moi ! On se retrouve au quartier Carrefour 🙌🏾</span></div></div></div></div></section>' +

      '<section class="section section--tight"><div class="wrap"><div class="section__head"><h2>Toutes les rubriques</h2></div>' +
      '<div class="grid grid--rubriques">' + rubriques.map(sectionCard).join("") + "</div></div></section>" +

      '<section class="section section--tight"><div class="wrap"><div class="cta"><div><h2>Gardiens de la mémoire, à vous la parole</h2>' +
      "<p>Un conte, un proverbe, une photo d’archive, un mot wê, l’histoire de votre village : chaque contribution enrichit le patrimoine commun.</p></div>" +
      '<a class="btn btn--gold" href="#contact--proposer">Proposer un contenu</a></div></div></section>';
    startCarousel();
    remplirVitrine();
    main.querySelectorAll("[data-salon]").forEach(function (a) {
      a.addEventListener("click", function () { if (window.MWMembres && window.MWMembres.salon) window.MWMembres.salon(a.dataset.salon); });
    });
  }

  /* ---------- Vitrine des produits ---------- */
  function remplirVitrine() {
    lire("vitrine.json").then(function (d) {
      var el = document.getElementById("vitrine"); if (!el) return;
      var L = (d.produits || []).filter(function (x) { return x.nom; });
      var appel = '<a class="produit produit--appel" href="#contact--partenaire"><span class="produit__plus" aria-hidden="true">+</span>' +
        "<b>Votre produit ici</b><span>Artisan, commerçant, producteur : faites découvrir votre savoir-faire à toute la communauté wê.</span>" +
        '<span class="card__more">Devenir partenaire ' + ico("arrow") + "</span></a>";
      el.innerHTML = L.map(function (x) {
        var tel = String(x.whatsapp || "").replace(/\D/g, "");
        return '<article class="produit">' + (x.image ? '<img src="' + esc(x.image) + '" alt="" loading="lazy">' : '<span class="produit__img-vide" aria-hidden="true">★</span>') +
          '<div class="produit__corps">' + (x.categorie ? '<span class="tag">' + esc(x.categorie) + "</span>" : "") + "<h3>" + esc(x.nom) + "</h3>" +
          '<p class="muted">' + esc([x.vendeur, x.ville].filter(Boolean).join(" · ")) + "</p>" +
          (x.description ? "<p>" + esc(x.description) + "</p>" : "") +
          '<div class="produit__pied">' + (x.prix ? '<b class="produit__prix">' + esc(x.prix) + "</b>" : "<span></span>") +
          (tel ? '<a class="btn btn--brand btn--sm" href="https://wa.me/' + tel + "?text=" + encodeURIComponent("Bonjour, je vous contacte depuis MW+ au sujet de : " + x.nom) + '" target="_blank" rel="noopener">Commander</a>' :
            x.lien ? '<a class="btn btn--brand btn--sm" href="' + esc(x.lien) + '" target="_blank" rel="noopener">Voir</a>' : "") +
          "</div></div></article>";
      }).join("") + appel;
    }).catch(function () { var el = document.getElementById("vitrine"); if (el) el.innerHTML = ""; });
  }

  /* ---------- Recherche ---------- */
  function renderSearch() {
    document.title = "Rechercher · MW+";
    main.innerHTML = pageHead("Recherche", "Rechercher sur le portail", "Une page, une actualité, un mot du dictionnaire, une entreprise…") +
      '<section class="section section--tight"><div class="wrap" style="max-width:820px"><div class="search" role="search">' +
      '<input class="input" id="q" type="search" placeholder="Ex. : masques, Duékoué, proverbes…" aria-label="Rechercher"></div><div id="results"></div></div></section>';
    var q = document.getElementById("q"), out = document.getElementById("results");
    var index = [];
    rubriques.forEach(function (s) {
      s.pages.forEach(function (p) { index.push({ t: p.titre, d: p.chapo, x: p.texte, l: href(s.id, p.id), g: s.label }); });
    });
    S.actualites.forEach(function (n) { index.push({ t: n.titre, d: n.resume, x: n.lieu, l: n.lien || "#actualites", g: "Actualité · " + dateFr(n.date) }); });
    S.dictionnaire.forEach(function (e) { index.push({ t: e.fr + " → " + e.we, d: e.exemple, x: e.categorie, l: "#langue--dictionnaire", g: "Dictionnaire" }); });
    S.annuaire.forEach(function (e) { index.push({ t: e.nom, d: e.activite + " · " + e.ville, x: e.description, l: "#business--annuaire", g: "Annuaire" }); });
    function run() {
      var t = norm(q.value).trim();
      if (t.length < 2) { out.innerHTML = '<p class="muted">Tapez au moins deux lettres.</p>'; return; }
      var r = index.filter(function (i) { return norm([i.t, i.d, i.x].join(" ")).indexOf(t) > -1; });
      out.innerHTML = r.length ? '<p class="muted">' + r.length + " résultat" + (r.length > 1 ? "s" : "") + '</p><ul class="results">' + r.map(function (i) {
        return '<li><a href="' + i.l + '"><span class="tag">' + esc(i.g) + "</span><b>" + esc(i.t) + "</b>" + (i.d ? "<span>" + esc(i.d) + "</span>" : "") + "</a></li>";
      }).join("") + "</ul>" : '<div class="empty">Aucun résultat pour « ' + esc(q.value) + ' ».</div>';
    }
    q.addEventListener("input", run); run(); q.focus();
  }

  function renderSection(s) {
    document.title = s.label + " · MW+";
    main.innerHTML = pageHead("Rubrique", s.label, s.intro, '<a href="#accueil">Accueil</a> › ' + esc(s.label)) +
      '<section class="section"><div class="wrap"><div class="grid">' +
      s.pages.map(function (p, i) {
        return '<a class="card" href="' + href(s.id, p.id) + '"><span class="card__num">' + (i + 1) + "</span><h3>" + esc(p.titre) + "</h3><p>" +
          esc(p.chapo) + '</p><span class="card__more">Lire →</span></a>';
      }).join("") + "</div></div></section>";
  }

  function renderPage(s, p) {
    document.title = p.titre + " · MW+";
    var body = "";
    switch (p.type) {
      case "dictionnaire": body = dictionnaire(p); break;
      case "actualites": body = actualites(p); break;
      case "annuaire": body = annuaire(p); break;
      case "formulaire": body = formulaire(p); break;
      case "application": body = application(); break;
      case "musique": body = '<p><a class="btn btn--brand btn--sm" href="#membres--proposer">Proposer un morceau</a></p><div class="search" role="search"><input class="input" id="q" type="search" placeholder="Titre, artiste, album…" aria-label="Rechercher un morceau">' +
        '<select class="select" id="artiste" aria-label="Artiste"><option value="">Tous les artistes</option></select></div><div id="results" class="titres"><p class="muted">Chargement…</p></div>'; break;
      case "villes": body = figure(p.image, p.titre, p.credit, p.creditUrl) + paras(p.texte) + '<div class="grid villes-grid" id="villes-grid"><p class="muted">Chargement des villes…</p></div>'; break;
      default:
        body = figure(p.image, p.titre, p.credit, p.creditUrl) + paras(p.texte) + (p.aCompleter ? aCompleter : "");
    }
    main.innerHTML = pageHead(s.label, p.titre, p.chapo,
      '<a href="#accueil">Accueil</a> › <a href="' + href(s.id) + '">' + esc(s.label) + "</a> › " + esc(p.titre)) +
      '<div class="layout"><aside class="sidenav" aria-label="' + esc(s.label) + '"><h2>' + esc(s.court || s.label) + "</h2><ul>" +
      s.pages.map(function (q) {
        return '<li><a href="' + href(s.id, q.id) + '"' + (q.id === p.id ? ' aria-current="page"' : "") + ">" + esc(q.titre) + "</a></li>";
      }).join("") + '</ul></aside><article class="article">' + body + "</article></div>";
    var cur = main.querySelector('.sidenav a[aria-current="page"]');
    if (cur && cur.scrollIntoView && window.innerWidth <= 860) cur.scrollIntoView({ block: "nearest", inline: "center" });
    if (p.type && hooks[p.type]) hooks[p.type](p);
  }

  /* Dictionnaire */
  function dictionnaire(p) {
    return paras(p.texte) +
      '<div class="search" role="search"><input class="input" id="q" type="search" placeholder="Rechercher un mot (français ou wê)…" aria-label="Rechercher un mot">' +
      '<select class="select" id="cat" aria-label="Catégorie"><option value="">Toutes les catégories</option>' +
      uniq(S.dictionnaire.map(function (e) { return e.categorie; })).map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") +
      '</select></div><div id="results"></div>';
  }
  function uniq(a) { return a.filter(function (x, i) { return x && a.indexOf(x) === i; }).sort(); }

  /* Actualités */
  function actualites(p) {
    var list = newsSorted().filter(function (n) { return !p.filtre || n.categorie === p.filtre; });
    return list.length ? '<div class="news">' + list.map(newsItem).join("") + "</div>"
      : '<div class="empty"><strong>Rien à afficher pour le moment</strong>Une information à partager ? <a href="#contact--proposer">Envoyez-la-nous</a>.</div>';
  }

  /* Annuaire */
  function annuaire(p) {
    return '<div class="search" role="search"><input class="input" id="q" type="search" placeholder="Nom, activité, ville…" aria-label="Rechercher dans l’annuaire">' +
      '<select class="select" id="ville" aria-label="Ville"><option value="">Toutes les villes</option>' +
      uniq(S.annuaire.map(function (e) { return e.ville; })).map(function (c) { return "<option>" + esc(c) + "</option>"; }).join("") +
      '</select></div><div id="results"></div>';
  }

  var hooks = {
    actualites: function (p) {
      if (p.filtre !== "Événement" || !window.MWMembres) return;
      var d = document.createElement("section"); d.className = "agenda";
      document.querySelector(".article").appendChild(d); window.MWMembres.agenda(d);
    },
    musique: function () {
      var q = document.getElementById("q"), sel = document.getElementById("artiste"), out = document.getElementById("results");
      var membres = window.MWMembres ? window.MWMembres.publies("musique") : Promise.resolve([]);
      Promise.all([lire("musique.json"), membres]).then(function (r) {
        var d = r[0];
        var T = (d.titres || []).concat(r[1].map(function (p) {
          return { titre: p.titre, artiste: p.artiste, album: p.album, annee: p.annee, youtube: p.youtube, telechargement: false, texte: "", membre: p.auteurNom };
        })).filter(function (t) { return t.titre && (t.audio || t.audioUrl || t.youtube); });
        sel.innerHTML += uniq(T.map(function (t) { return t.artiste; })).map(function (a) { return "<option>" + esc(a) + "</option>"; }).join("");
        function run() {
          var t = norm(q.value), a = sel.value;
          var r = T.filter(function (x) { return (!a || x.artiste === a) && (!t || norm([x.titre, x.artiste, x.album, x.genre].join(" ")).indexOf(t) > -1); });
          if (!T.length) { out.innerHTML = '<div class="empty"><strong>Les premiers titres arrivent bientôt</strong>Artiste wê ? <a href="#contact--proposer">Proposez votre musique</a>.</div>'; return; }
          out.innerHTML = r.length ? r.map(function (x) {
            var src = x.audio || x.audioUrl, yt = idYoutube(x.youtube);
            var pochette = x.image || (yt ? "https://i.ytimg.com/vi/" + yt + "/hqdefault.jpg" : "");
            return '<article class="titre">' + (pochette ? '<img src="' + esc(pochette) + '" alt="" loading="lazy">' : '<span class="titre__note" aria-hidden="true">♪</span>') +
              '<div class="titre__corps"><h3>' + esc(x.titre) + "</h3><p>" + esc([x.artiste, x.album, x.annee, x.genre].filter(Boolean).join(" · ")) +
              (x.membre ? " · proposé par " + esc(x.membre) : "") + "</p>" +
              (src ? '<audio controls preload="none" src="' + esc(src) + '"></audio>' :
                yt ? '<button type="button" class="yt" data-yt="' + yt + '" aria-label="Écouter ' + esc(x.titre) + '"><img src="https://i.ytimg.com/vi/' + yt + '/hqdefault.jpg" alt="" loading="lazy"><span class="yt__play">▶ Écouter</span></button>' : "") +
              '<div class="titre__actions">' +
              (src && x.telechargement ? '<a class="btn btn--brand btn--sm" href="' + esc(src) + '" download>Télécharger</a>' : "") +
              (x.youtube ? '<a class="btn btn--line btn--sm" href="' + esc(x.youtube) + '" target="_blank" rel="noopener">Voir sur YouTube</a>' : "") +
              "</div>" + (x.texte ? '<details><summary>Paroles et présentation</summary>' + paras(x.texte) + "</details>" : "") + "</div></article>";
          }).join("") : '<div class="empty">Aucun morceau ne correspond.</div>';
        }
        q.addEventListener("input", run); sel.addEventListener("change", run); run();
        // lecture YouTube intégrée : la vidéo ne se charge qu'au clic
        out.addEventListener("click", function (e) {
          var b = e.target.closest(".yt");
          if (!b) return;
          out.querySelectorAll("iframe.yt__frame").forEach(function (f) { f.remove(); });
          out.querySelectorAll(".yt[hidden]").forEach(function (x) { x.hidden = false; });
          var f = document.createElement("iframe");
          f.className = "yt__frame"; f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true;
          f.title = "Lecteur YouTube"; f.src = "https://www.youtube-nocookie.com/embed/" + b.dataset.yt + "?autoplay=1&rel=0";
          b.hidden = true; b.parentNode.insertBefore(f, b);
          out.querySelectorAll("audio").forEach(function (a) { a.pause(); });
        });
        // un seul morceau à la fois
        out.addEventListener("play", function (e) { out.querySelectorAll("audio").forEach(function (a) { if (a !== e.target) a.pause(); }); }, true);
      }).catch(function () { out.innerHTML = '<div class="empty">La liste des morceaux n’a pas pu être chargée.</div>'; });
    },
    villes: function () {
      Promise.all(villesListe().map(function (v) {
        return chargerVille(v.id).catch(function () { return { id: v.id, nom: v.nom, quartiers: [], acteurs: [] }; });
      })).then(function (list) {
        var g = document.getElementById("villes-grid");
        if (g) g.innerHTML = list.map(villeCard).join("");
      });
    },
    dictionnaire: function () {
      var q = document.getElementById("q"), cat = document.getElementById("cat"), out = document.getElementById("results");
      function run() {
        var t = norm(q.value), c = cat.value;
        var r = S.dictionnaire.filter(function (e) {
          return (!c || e.categorie === c) && (!t || norm(e.fr).indexOf(t) > -1 || norm(e.we).indexOf(t) > -1);
        }).sort(function (a, b) { return a.fr.localeCompare(b.fr, "fr"); });
        if (!S.dictionnaire.length) {
          out.innerHTML = '<div class="empty"><strong>Le dictionnaire est en cours de constitution</strong>Locuteurs du wê, proposez vos premiers mots : ' +
            'le mot en français, sa traduction, la variante (guéré, wobé, canton) et un exemple.<br><br><a class="btn btn--gold" href="#contact--proposer">Proposer un mot</a></div>';
          return;
        }
        out.innerHTML = r.length ? '<p class="muted">' + r.length + " mot" + (r.length > 1 ? "s" : "") + '</p><div class="table-scroll"><table class="dict"><thead><tr><th>Français</th><th>Wê</th><th>Catégorie</th><th>Exemple</th></tr></thead><tbody>' +
          r.map(function (e) {
            return "<tr><td>" + esc(e.fr) + '</td><td class="we">' + esc(e.we) + (e.variante ? ' <span class="chip">' + esc(e.variante) + "</span>" : "") +
              "</td><td>" + esc(e.categorie) + "</td><td>" + esc(e.exemple) + "</td></tr>";
          }).join("") + "</tbody></table></div>"
          : '<div class="empty">Aucun résultat. <a href="#contact--proposer">Proposer ce mot</a></div>';
      }
      q.addEventListener("input", run); cat.addEventListener("change", run); run();
    },
    annuaire: function (p) {
      var q = document.getElementById("q"), ville = document.getElementById("ville"), out = document.getElementById("results");
      function run() {
        var t = norm(q.value), v = ville.value;
        var r = S.annuaire.filter(function (e) {
          return (!p.filtre || e.categorie === p.filtre) && (!v || e.ville === v) &&
            (!t || norm([e.nom, e.activite, e.ville, e.description].join(" ")).indexOf(t) > -1);
        });
        out.innerHTML = r.length ? '<div class="grid">' + r.map(function (e) {
          return '<div class="card"><span class="tag">' + esc(e.categorie) + "</span><h3>" + esc(e.nom) + "</h3><p>" + esc(e.activite) + " · " + esc(e.ville) +
            "</p>" + (e.description ? "<p>" + esc(e.description) + "</p>" : "") +
            (e.telephone ? '<a class="card__more" href="tel:' + esc(e.telephone.replace(/\s/g, "")) + '">' + esc(e.telephone) + "</a>" : "") + "</div>";
        }).join("") + "</div>"
          : '<div class="empty"><strong>' + (S.annuaire.length ? "Aucun résultat" : "L’annuaire ouvre ses inscriptions") + "</strong>" +
            "Entreprises, commerçants, artisans et entrepreneurs wê : inscrivez gratuitement votre activité.<br><br>" +
            '<a class="btn btn--gold" href="#contact--partenaire">Inscrire mon activité</a></div>';
      }
      q.addEventListener("input", run); ville.addEventListener("change", run); run();
    },
    formulaire: function (p) {
      var f = document.getElementById("form");
      var selVille = f.querySelector('select[name="ville"]'), dl = document.getElementById("dl-quartiers");
      if (selVille && dl) {
        var majQuartiers = function () {
          var v = villesListe().filter(function (x) { return x.nom === selVille.value; })[0];
          dl.innerHTML = "";
          if (v) chargerVille(v.id).then(function (d) {
            dl.innerHTML = d.quartiers.map(function (q) { return '<option value="' + esc(q.nom) + '">'; }).join("");
          }).catch(function () {});
        };
        selVille.addEventListener("change", majQuartiers); majQuartiers();
      }
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!f.reportValidity()) return;
        var d = new FormData(f), lignes = [], btn = f.querySelector('button[type="submit"]');
        btn.disabled = true; btn.textContent = "Envoi en cours…";
        fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(d).toString() })
          .then(function (r) {
            if (!r.ok) throw new Error(r.status);
            f.innerHTML = '<div class="form__sent" role="status"><strong>Merci, votre message a bien été envoyé.</strong>' +
              "<p>L’équipe MW+ le lira et vous répondra si nécessaire. Les contributions sont relues avant publication.</p>" +
              '<a class="btn btn--line" href="#accueil">Retour à l’accueil</a></div>';
          })
          .catch(function () { btn.disabled = false; btn.textContent = "Envoyer"; secours(); });
        function secours() {
        d.forEach(function (v, k) { if (k !== "sujet" && k !== "form-name" && k !== "bot-field" && v) lignes.push(k.charAt(0).toUpperCase() + k.slice(1) + " : " + v); });
        var sujet = "[MW+] " + (d.get("sujet") || p.titre);
        var texte = "Objet : " + sujet + "\n\n" + lignes.join("\n\n");
        var ok = document.getElementById("form-ok");
        ok.querySelector("textarea").value = texte;
        ok.querySelector("a.btn").href = "mailto:" + S.emailContact + "?subject=" + encodeURIComponent(sujet) + "&body=" + encodeURIComponent(lignes.join("\n\n"));
        ok.hidden = false;
        ok.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
      document.getElementById("form-copy").addEventListener("click", function () {
        var ta = document.getElementById("form-msg"), b = this;
        function done() { b.textContent = "Message copié"; }
        try { navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); }); } catch (err) { ta.select(); }
      });
    }
  };

  /* Formulaires : envoyés par Netlify Forms (copie de secours si l’envoi échoue) */
  function formulaire(p) {
    var pv = prefill; prefill = {};
    var champs = {
      activite:
        (pv.type === "quartier" ? '<p class="form__intro">Merci ! Choisissez le quartier où se trouve <b>' + esc(pv.nom) + "</b>. Ajoutez une adresse ou un repère si vous le pouvez.</p>" : "") +
        '<div class="row"><label>Nom de l’activité ou de l’entreprise<input class="input" name="nom" required value="' + esc(pv.nom || "") + '"></label>' +
        '<label>Secteur<select class="select input" name="secteur" required>' + SECTEURS.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + "</select></label></div>" +
        '<div class="row"><label>Ville<select class="select input" name="ville" required>' + villesListe().map(function (v) {
          return "<option" + (v.nom === pv.ville ? " selected" : "") + ">" + esc(v.nom) + "</option>"; }).join("") + "</select></label>" +
        '<label>Quartier<input class="input" name="quartier" list="dl-quartiers" autocomplete="off" placeholder="Choisir ou écrire" value="' + esc(pv.quartier || "") + '"' + (pv.type === "quartier" ? " required" : "") + '><datalist id="dl-quartiers"></datalist></label></div>' +
        '<div class="row"><label>Adresse ou repère <span class="hint">(ex. : près du marché central)</span><input class="input" name="adresse"></label>' +
        '<label>Téléphone<input class="input" name="telephone" type="tel" autocomplete="tel"></label></div>' +
        '<div class="row"><label>Responsable<input class="input" name="responsable" autocomplete="name"></label>' +
        '<label>E-mail <span class="hint">(facultatif)</span><input class="input" name="email" type="email" autocomplete="email"></label></div>' +
        '<label>Description de l’activité<textarea class="input" name="description" rows="4"></textarea></label>' +
        '<label>S’agit-il d’une correction ?<select class="select input" name="type"><option>Nouvelle inscription</option><option' + (pv.type === "quartier" ? " selected" : "") + '>Correction d’une fiche existante</option><option>Signaler une activité fermée</option></select></label>' +
        '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:400"><input type="checkbox" name="accord" value="oui" required> Je confirme que ces informations sont exactes et j’accepte leur publication sur le portail.</label>',
      contact:
        '<div class="row"><label>Nom<input class="input" name="nom" required autocomplete="name"></label>' +
        '<label>E-mail<input class="input" name="email" type="email" required autocomplete="email"></label></div>' +
        '<label>Sujet<input class="input" name="sujet" required></label>' +
        '<label>Message<textarea class="input" name="message" rows="6" required></textarea></label>',
      partenaire:
        '<div class="row"><label>Structure<input class="input" name="structure" required></label>' +
        '<label>Personne à contacter<input class="input" name="contact" required autocomplete="name"></label></div>' +
        '<div class="row"><label>E-mail<input class="input" name="email" type="email" required autocomplete="email"></label>' +
        '<label>Téléphone<input class="input" name="telephone" type="tel" autocomplete="tel"></label></div>' +
        '<div class="row"><label>Type de partenariat<select class="select input" name="partenariat"><option>Inscription à l’annuaire</option><option>Publicité</option><option>Sponsoring d’événement</option><option>Partenariat institutionnel</option><option>Autre</option></select></label>' +
        '<label>Ville<input class="input" name="ville"></label></div>' +
        '<label>Présentation et projet<textarea class="input" name="projet" rows="5" required></textarea></label>',
      contenu:
        '<div class="row"><label>Nom<input class="input" name="nom" required autocomplete="name"></label>' +
        '<label>E-mail ou téléphone<input class="input" name="contact" required></label></div>' +
        '<div class="row"><label>Type de contenu<select class="select input" name="sujet"><option>Mot pour le dictionnaire</option><option>Proverbe ou expression</option><option>Conte ou légende</option><option>Histoire d’un village</option><option>Personnalité</option><option>Photo, vidéo ou audio</option><option>Archive</option><option>Actualité ou événement</option><option>Correction</option><option>Autre</option></select></label>' +
        '<label>Rubrique concernée<select class="select input" name="rubrique">' + rubriques.map(function (s) { return "<option>" + esc(s.label) + "</option>"; }).join("") + "</select></label></div>" +
        '<div class="row"><label>Village / canton<input class="input" name="village"></label><label>Source <span class="hint">(qui vous l’a transmis ?)</span><input class="input" name="source"></label></div>' +
        '<label>Votre contribution <span class="hint">Pour un mot : français, wê, variante, exemple. Pour un fichier, nous vous répondrons avec un lien d’envoi.</span><textarea class="input" name="contribution" rows="7" required></textarea></label>' +
        '<label style="display:flex;gap:8px;align-items:flex-start;font-weight:400"><input type="checkbox" name="accord" value="oui" required> J’accepte que ce contenu soit publié sur le portail, avec mention de son auteur.</label>'
    }[p.formulaire];
    return '<form class="form" id="form" name="' + p.formulaire + '" novalidate>' +
      '<input type="hidden" name="form-name" value="' + p.formulaire + '">' +
      '<p class="hp" aria-hidden="true"><label>Ne pas remplir <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>' + champs +
      '<div><button class="btn btn--gold" type="submit">Envoyer</button></div>' +
      '<div class="form__ok" id="form-ok" hidden><p><strong>L’envoi automatique n’a pas fonctionné.</strong> Envoyez votre message à <b class="sel">' + esc(S.emailContact) +
      '</b> depuis votre messagerie : copiez-le ci-dessous ou ouvrez directement votre application d’e-mail.</p>' +
      '<textarea class="input" id="form-msg" rows="7" readonly aria-label="Message à envoyer"></textarea>' +
      '<div class="form__actions"><button class="btn btn--line" type="button" id="form-copy">Copier le message</button>' +
      '<a class="btn btn--gold" href="#">Ouvrir ma messagerie</a></div></div></form>';
  }

  /* ---------- Villes, quartiers et acteurs économiques ---------- */
  var SECTEURS = ["Santé", "Pharmacie", "Commerce", "Restauration", "Hôtellerie & hébergement", "Agriculture & coopératives",
    "Éducation", "Transport", "Énergie & carburant", "BTP & construction", "Informatique & télécoms", "Banque & finance",
    "Artisanat", "Beauté & mode", "Culture & loisirs", "Administration & services publics", "Autres services"];
  var villesCache = {}, prefill = {};
  function slug(s) { return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function villesListe() { return ((S.accueil || {}).villes || []).map(function (v) { return { nom: v, id: slug(v) }; }); }
  function chargerVille(id) {
    if (villesCache[id]) return Promise.resolve(villesCache[id]);
    return lire("villes/" + id + ".json").then(function (v) {
      v.id = id; v.quartiers = v.quartiers || []; v.acteurs = v.acteurs || []; villesCache[id] = v; return v;
    });
  }
  function villeCard(v) {
    var n = v.acteurs.length, q = v.quartiers.length;
    return '<a class="card ville-card" href="#ville--' + v.id + '"><span class="ville-card__pin">' + ico("pin") + "</span><h3>" + esc(v.nom) + "</h3>" +
      '<p class="muted">Région : ' + esc(v.region || "") + "</p>" +
      (n || q ? '<p class="ville-card__stats">' + (q ? "<b>" + q + "</b> quartiers" : "Quartiers à recenser") + " · <b>" + n + "</b> acteurs recensés</p>"
        : '<p class="ville-card__stats">Recensement à venir</p>') +
      '<span class="card__more">Voir la ville ' + ico("arrow") + "</span></a>";
  }

  function renderVille(id) {
    var base = villesListe().filter(function (v) { return v.id === id; })[0];
    if (!base) { renderNotFound(); return; }
    document.title = base.nom + " · MW+";
    main.innerHTML = pageHead("Nos villes", base.nom, "Chargement…", '<a href="#accueil">Accueil</a> › <a href="#tourisme--villages">Nos villages</a> › ' + esc(base.nom));
    chargerVille(id).then(function (v) {
      if (location.hash !== "#ville--" + id) return;
      var etat = { quartier: "", secteur: "", q: "" };
      var compteQ = {}, compteS = {};
      v.acteurs.forEach(function (a) {
        compteQ[a.quartier || ""] = (compteQ[a.quartier || ""] || 0) + 1;
        compteS[a.secteur] = (compteS[a.secteur] || 0) + 1;
      });
      var secteurs = SECTEURS.concat(uniq(v.acteurs.map(function (a) { return a.secteur; })).filter(function (s) { return SECTEURS.indexOf(s) < 0; }));
      var sansQuartier = compteQ[""] || 0;
      main.innerHTML = pageHead("Région du " + (v.region || ""), v.nom, v.presentation || "Le recensement des quartiers et des activités de cette ville commence bientôt.",
          '<a href="#accueil">Accueil</a> › <a href="#tourisme--villages">Nos villages</a> › ' + esc(v.nom)) +
        '<section class="section section--tight"><div class="wrap ville">' +
        '<div class="ville__stats"><div><b>' + v.quartiers.length + "</b><span>quartiers</span></div><div><b>" + v.acteurs.length +
        "</b><span>acteurs recensés</span></div><div><b>" + Object.keys(compteS).length + "</b><span>secteurs représentés</span></div>" +
        '<a class="btn btn--brand" href="#business--inscrire" data-ville="' + esc(v.nom) + '">Inscrire mon activité</a></div>' +

        (!v.quartiers.length ? '<h2 class="ville__h">Quartiers</h2><div class="empty"><strong>Les quartiers de ' + esc(v.nom) + " restent à recenser</strong>Vous habitez la ville ? " +
          '<a href="#contact--proposer">Envoyez-nous la liste des quartiers</a>.</div>' : "") +
        (v.quartiers.length ? '<h2 class="ville__h">Quartiers</h2><div class="qgrid" id="quartiers">' +
          '<button type="button" class="qchip" aria-pressed="true" data-q="">Toute la ville <small>' + v.acteurs.length + "</small></button>" +
          v.quartiers.map(function (q) {
            return '<button type="button" class="qchip" aria-pressed="false" data-q="' + esc(q.nom) + '" title="' + esc(q.description || "") + '">' + esc(q.nom) +
              " <small>" + (compteQ[q.nom] || 0) + "</small></button>";
          }).join("") + "</div>" +
          (v.sourcesQuartiers && v.sourcesQuartiers.length ? '<p class="ville__src">Liste des quartiers : ' + v.sourcesQuartiers.map(function (s) {
            return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.titre) + "</a>";
          }).join(", ") + "</p>" : "") +
          (sansQuartier ? '<p class="ville__src">' + sansQuartier + " acteur" + (sansQuartier > 1 ? "s" : "") + " dont le quartier reste à préciser.</p>" : "") : "") +

        '<h2 class="ville__h">Secteurs d’activité</h2><div class="sgrid" id="secteurs">' +
        secteurs.map(function (s) {
          var n = compteS[s] || 0;
          return '<button type="button" class="schip' + (n ? "" : " is-empty") + '" aria-pressed="false" data-s="' + esc(s) + '"><span>' + esc(s) + "</span><b>" + n + "</b></button>";
        }).join("") + "</div>" +

        '<div class="search" role="search"><input class="input" id="q" type="search" placeholder="Rechercher un nom, une activité, une adresse…" aria-label="Rechercher un acteur"></div>' +
        '<p class="muted" id="ville-count"></p><div class="acteurs" id="acteurs"></div>' +
        '<div class="notice"><p><strong>Annuaire en construction</strong>Les fiches viennent d’annuaires et d’articles publics, citées à chaque fois. ' +
        "Elles portent la mention « À vérifier » tant que l’acteur ne les a pas confirmées. Une erreur, un oubli ? " +
        '<a href="#business--inscrire" data-ville="' + esc(v.nom) + '">Inscrivez ou corrigez une activité</a>.</p></div></div></section>';

      var out = document.getElementById("acteurs"), count = document.getElementById("ville-count");
      function fiche(a) {
        var tel = (a.telephone || "").split("/").map(function (t) { return t.trim(); }).filter(Boolean);
        return '<article class="acteur"><div class="acteur__top"><span class="pill">' + esc(a.secteur) + "</span>" +
          (a.verifie ? '<span class="badge badge--ok">Vérifié</span>' : '<span class="badge">À vérifier</span>') + "</div>" +
          "<h3>" + esc(a.nom) + "</h3>" + (a.activite ? '<p class="acteur__act">' + esc(a.activite) + "</p>" : "") +
          '<ul class="acteur__infos">' +
          '<li>' + ico("pin") + "<span>" + esc([a.quartier ? "Quartier " + a.quartier : "Quartier à préciser", a.adresse].filter(Boolean).join(" · ")) + "</span></li>" +
          tel.map(function (t) { return "<li>" + ico("phone") + '<a href="tel:' + esc(t.replace(/\s/g, "")) + '">' + esc(t) + "</a></li>"; }).join("") +
          "</ul>" + (a.description ? '<p class="acteur__desc">' + esc(a.description) + "</p>" : "") +
          (!a.quartier ? '<a class="acteur__fix" href="#business--inscrire" data-ville="' + esc(v.nom) + '" data-nom="' + esc(a.nom) + '" data-type="quartier">' + ico("pin") + "Je connais son quartier</a>" : "") +
          (a.source ? '<p class="acteur__src">Source : ' + (a.sourceUrl ? '<a href="' + esc(a.sourceUrl) + '" target="_blank" rel="noopener">' + esc(a.source) + "</a>" : esc(a.source)) + "</p>" : "") +
          "</article>";
      }
      function run() {
        var t = norm(etat.q);
        var r = v.acteurs.filter(function (a) {
          return (!etat.quartier || a.quartier === etat.quartier) && (!etat.secteur || a.secteur === etat.secteur) &&
            (!t || norm([a.nom, a.activite, a.adresse, a.quartier, a.description].join(" ")).indexOf(t) > -1);
        }).sort(function (a, b) { return a.secteur === b.secteur ? a.nom.localeCompare(b.nom, "fr") : SECTEURS.indexOf(a.secteur) - SECTEURS.indexOf(b.secteur); });
        count.textContent = r.length + " acteur" + (r.length > 1 ? "s" : "") +
          (etat.quartier ? " · quartier " + etat.quartier : "") + (etat.secteur ? " · " + etat.secteur : "");
        out.innerHTML = r.length ? r.map(fiche).join("") :
          '<div class="empty"><strong>Aucun acteur recensé ici pour l’instant</strong>Vous en connaissez un ? <a href="#business--inscrire" data-ville="' +
          esc(v.nom) + '" data-quartier="' + esc(etat.quartier) + '">Inscrivez-le</a>.</div>';
      }
      main.onclick = function (e) {
        var b = e.target.closest("[data-q], [data-s]");
        if (!b) return;
        if (b.hasAttribute("data-q")) {
          etat.quartier = b.dataset.q;
          main.querySelectorAll("[data-q]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        } else {
          etat.secteur = etat.secteur === b.dataset.s ? "" : b.dataset.s;
          main.querySelectorAll("[data-s]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.dataset.s === etat.secteur)); });
        }
        run();
      };
      document.getElementById("q").addEventListener("input", function () { etat.q = this.value; run(); });
      run();
    }).catch(function () {
      main.innerHTML = pageHead("Nos villes", base.nom, "Cette ville n’a pas encore de fiche.") +
        '<section class="section"><div class="wrap"><a class="btn btn--brand" href="#business--inscrire">Inscrire une activité</a></div></section>';
    });
  }
  // Pré-remplissage du formulaire d'inscription depuis une page de ville
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-ville]");
    if (a) prefill = { ville: a.dataset.ville, quartier: a.dataset.quartier || "", nom: a.dataset.nom || "", type: a.dataset.type || "" };
  });

  function idYoutube(u) {
    var m = String(u || "").match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  }

  /* ---------- Application mobile ---------- */
  var DANS_APP = /MWPlusApp/.test(navigator.userAgent);
  function application() {
    var a = S.application || {};
    if (DANS_APP) return '<div class="notice"><p><strong>Vous utilisez déjà l’application MW+.</strong>Elle se met à jour toute seule : chaque nouveauté publiée sur le portail y apparaît immédiatement.</p></div>';
    return '<div class="appli"><img src="assets/logo-192.png" alt="" width="96" height="96"><div><h2>MW+ pour Android</h2>' +
      '<p class="muted">Version ' + esc(a.version) + " · " + esc(a.taille) + " · Android 7 ou plus récent</p>" +
      '<a class="btn btn--brand" href="' + esc(a.fichier) + '" download>Télécharger l’application</a></div></div>' +
      '<h2 class="ville__h">Installer en 4 étapes</h2><ol class="etapes">' +
      "<li><b>Téléchargez</b> le fichier avec le bouton ci-dessus, depuis votre téléphone Android.</li>" +
      "<li><b>Ouvrez</b> le fichier téléchargé (notification « Téléchargement terminé » ou application <i>Fichiers</i>).</li>" +
      "<li>Si le téléphone demande l’autorisation, appuyez sur <b>Paramètres</b> puis activez <b>« Autoriser cette source »</b>, et revenez en arrière.</li>" +
      "<li>Appuyez sur <b>Installer</b>, puis sur <b>Ouvrir</b>. L’icône MW+ apparaît avec vos autres applications.</li></ol>" +
      '<div class="notice"><p><strong>Pourquoi ce message de sécurité ?</strong>L’application n’est pas encore sur le Play Store : Android demande donc une confirmation. ' +
      "Elle ne demande qu’un accès à internet, rien d’autre (ni contacts, ni photos, ni position).</p></div>" +
      "<p>Sur iPhone, ouvrez le portail dans Safari, appuyez sur <b>Partager</b> puis <b>« Sur l’écran d’accueil »</b> : MW+ s’ajoute comme une application.</p>";
  }

  function renderNotFound() {
    document.title = "Page introuvable · MW+";
    main.innerHTML = pageHead("Erreur", "Page introuvable", "Cette page n’existe pas ou a été déplacée.") +
      '<section class="section"><div class="wrap"><a class="btn btn--gold" href="#accueil">Retour à l’accueil</a></div></section>';
  }

  /* ---------- Routeur ---------- */
  function route() {
    if (location.hash === "#main") return;
    var parts = location.hash.replace(/^#\/?/, "").split(/--|\//).filter(Boolean);
    var s = parts[0] ? section(parts[0]) : null;
    clearInterval(timer);
    main.onclick = null;
    document.body.classList.toggle("sur-membres", /^#membres/.test(location.hash));
    if (window.MWMembres) window.MWMembres.quitter();
    if (!parts.length || (s && s.id === "accueil")) renderHome();
    else if (parts[0] === "recherche") renderSearch();
    else if (parts[0] === "ville") renderVille(parts[1]);
    else if (parts[0] === "membres") { if (window.MWMembres) window.MWMembres.render(parts[1]); else renderNotFound(); }
    else if (!s) renderNotFound();
    else if (!parts[1]) renderSection(s);
    else {
      var p = s.pages.find(function (x) { return x.id === parts[1]; });
      p ? renderPage(s, p) : renderNotFound();
    }
    var cur = s && s.pages.length ? s.id : "accueil";
    nav.querySelectorAll(".nav__top").forEach(function (a) { a.setAttribute("aria-current", String(a.dataset.sec === cur)); });
    nav.querySelectorAll("[data-page]").forEach(function (a) {
      a.toggleAttribute("aria-current", a.dataset.page === parts.slice(0, 2).join("/"));
      if (a.hasAttribute("aria-current")) a.setAttribute("aria-current", "page");
    });
    closeMenu();
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  /* Outils partagés avec membres.js */
  window.MW = { esc: esc, norm: norm, pageHead: pageHead, main: main, idYoutube: idYoutube, dansApp: DANS_APP,
    S: function () { return S; }, villes: function () { return villesListe(); } };

  /* ---------- Chargement du contenu ---------- */
  function lire(f) {
    return fetch("content/" + f, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(f); return r.json();
    });
  }
  Promise.all([lire("site.json"), lire("actualites.json"), lire("dictionnaire.json"), lire("annuaire.json"), lire("une.json")]
    .concat(RUBRIQUES.map(function (id) { return lire("rubriques/" + id + ".json"); })))
    .then(function (r) {
      S = r[0];
      S.actualites = (r[1].articles || []).filter(function (a) { return a.date && a.titre; });
      S.dictionnaire = r[2].entrees || [];
      S.annuaire = r[3].entreprises || [];
      S.une = (r[4].diapositives || []).filter(function (d) { return d.image && d.titre; });
      rubriques = RUBRIQUES.map(function (id, i) {
        var x = r[5 + i]; x.id = id; x.pages = x.pages || []; return x;
      });
      S.sections = [{ id: "accueil", label: "Accueil", pages: [] }].concat(rubriques);
      buildNav();
      buildFooter();
      window.addEventListener("hashchange", route);
      route();
    })
    .catch(function () {
      main.innerHTML = '<section class="section"><div class="wrap"><div class="empty"><strong>Le contenu n’a pas pu être chargé</strong>' +
        "Vérifiez votre connexion puis rechargez la page.</div></div></section>";
    });
})();
