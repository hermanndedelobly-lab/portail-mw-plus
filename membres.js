/* MW+ · Espace membres : comptes, discussions, messages privés, propositions et modération.
   Données dans Firebase (Authentication + Firestore). La configuration est dans content/site.json
   (« firebase » et « moderateurs ») ; les règles de sécurité sont dans firestore.rules. */
(function () {
  "use strict";
  var MW = window.MW;
  var VERSION = "10.14.1", BASE = "https://www.gstatic.com/firebasejs/" + VERSION + "/";
  var fb = null, auth = null, db = null, user = null, profil = null, pret = null;
  var ecoutes = [], salon = "general", convOuverte = null, ongletCourant = null;

  function esc(s) { return MW.esc(s); }
  function S() { return MW.S(); }
  function $(id) { return document.getElementById(id); }

  /* ---------- Démarrage de Firebase (chargé seulement quand on en a besoin) ---------- */
  function config() { var c = S().firebase || {}; return c.apiKey && c.projectId ? c : null; }
  function charger(src) {
    return new Promise(function (ok, ko) {
      var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s);
    });
  }
  function demarrer() {
    if (pret) return pret;
    var c = config();
    if (!c) return Promise.reject(new Error("non-configure"));
    pret = (window.firebase && window.firebase.firestore ? Promise.resolve() :
      charger(BASE + "firebase-app-compat.js").then(function () {
        return Promise.all([charger(BASE + "firebase-auth-compat.js"), charger(BASE + "firebase-firestore-compat.js")]);
      })).then(function () {
        fb = window.firebase;
        if (!fb.apps.length) fb.initializeApp(c);
        auth = fb.auth(); db = fb.firestore();
        return new Promise(function (ok) {
          var premier = true;
          auth.onAuthStateChanged(function (u) {
            user = u;
            chargerProfil().then(function () {
              majEntete();
              if (premier) { premier = false; ok(); } else if (ongletCourant) vue(ongletCourant);
            });
          });
        });
      });
    pret.catch(function () { pret = null; });
    return pret;
  }
  function chargerProfil() {
    if (!user) { profil = null; return Promise.resolve(); }
    return db.collection("profils").doc(user.uid).get().then(function (d) { profil = d.exists ? d.data() : null; })
      .catch(function () { profil = null; });
  }
  function estAdmin() {
    return !!(user && user.email && (S().moderateurs || []).map(function (e) { return e.toLowerCase(); }).indexOf(user.email.toLowerCase()) > -1);
  }
  function maintenant() { return fb.firestore.FieldValue.serverTimestamp(); }
  function quand(t) {
    var d = t && t.toDate ? t.toDate() : new Date();
    var j = new Date(); var memeJour = d.toDateString() === j.toDateString();
    return (memeJour ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " · ") +
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  function couper() { ecoutes.forEach(function (f) { try { f(); } catch (e) {} }); ecoutes = []; }
  function erreur(e) {
    var m = (e && e.code) || "";
    var T = {
      "auth/invalid-email": "Adresse e-mail invalide.",
      "auth/email-already-in-use": "Un compte existe déjà avec cette adresse : connectez-vous.",
      "auth/weak-password": "Mot de passe trop court : 6 caractères au minimum.",
      "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
      "auth/wrong-password": "E-mail ou mot de passe incorrect.",
      "auth/user-not-found": "Aucun compte avec cette adresse.",
      "auth/too-many-requests": "Trop d'essais : patientez quelques minutes.",
      "auth/popup-closed-by-user": "Connexion annulée.",
      "auth/network-request-failed": "Pas de connexion internet.",
      "permission-denied": "Action non autorisée."
    };
    return T[m] || "Une erreur est survenue. Réessayez dans un instant.";
  }

  /* ---------- Bouton « Mon compte » de l'en-tête ---------- */
  function majEntete() {
    var b = $("btn-compte"); if (!b) return;
    b.classList.toggle("is-connecte", !!user);
    b.setAttribute("aria-label", user ? "Mon espace membre (connecté)" : "Espace membres : se connecter");
  }

  /* ---------- Page « Espace membres » ---------- */
  var ONGLETS = [["compte", "Mon compte"], ["discussions", "Discussions"], ["messages", "Messages privés"], ["proposer", "Proposer"], ["moderation", "Modération"]];
  function render(onglet) {
    couper();
    onglet = onglet || "compte";
    ongletCourant = onglet;
    document.title = "Espace membres · MW+";
    MW.main.innerHTML = MW.pageHead("Communauté", "Espace membres",
      "Discutez avec la communauté wê, écrivez en privé et proposez musiques et événements.",
      '<a href="#accueil">Accueil</a> › Espace membres') +
      '<section class="section section--tight"><div class="wrap membres"><nav class="onglets" id="onglets" aria-label="Espace membres"></nav>' +
      '<div id="mb" class="mb"><p class="muted">Chargement…</p></div></div></section>';
    demarrer().then(function () { vue(onglet); }).catch(function (e) {
      $("onglets").innerHTML = "";
      $("mb").innerHTML = e && e.message === "non-configure" ?
        '<div class="empty"><strong>L’espace membres ouvre bientôt</strong>Inscription, discussions et propositions seront disponibles dans quelques jours.</div>' :
        '<div class="empty"><strong>Connexion impossible</strong>Vérifiez votre connexion internet puis rechargez la page.</div>';
    });
  }
  function vue(onglet) {
    couper();
    ongletCourant = onglet;
    $("onglets").innerHTML = ONGLETS.filter(function (o) { return o[0] !== "moderation" || estAdmin(); }).map(function (o) {
      return '<a href="#membres--' + o[0] + '"' + (o[0] === onglet ? ' aria-current="page"' : "") + ">" + o[1] + "</a>";
    }).join("");
    var el = $("mb");
    if (onglet !== "compte" && (!user || !profil)) { el.innerHTML = invitation(onglet); return; }
    ({ compte: vueCompte, discussions: vueDiscussions, messages: vueMessages, proposer: vueProposer, moderation: vueModeration }[onglet] || vueCompte)(el);
  }
  function invitation(onglet) {
    var quoi = { discussions: "participer aux discussions", messages: "écrire en privé", proposer: "proposer une musique ou un événement", moderation: "accéder à la modération" }[onglet] || "continuer";
    return '<div class="empty"><strong>Connectez-vous pour ' + quoi + '</strong>L’inscription est gratuite et prend une minute.<br><br>' +
      '<a class="btn btn--brand" href="#membres--compte">Se connecter ou s’inscrire</a></div>';
  }
  function optionsVilles(sel) {
    return '<option value="">Choisir…</option>' + MW.villes().map(function (v) {
      return "<option" + (v.nom === sel ? " selected" : "") + ">" + esc(v.nom) + "</option>";
    }).join("") + "<option" + (sel === "Autre ville / diaspora" ? " selected" : "") + ">Autre ville / diaspora</option>";
  }

  /* ---------- Mon compte ---------- */
  function vueCompte(el) {
    if (!user) {
      el.innerHTML = '<div class="mb__duo">' +
        '<form class="form" id="f-connexion"><h2>Se connecter</h2>' +
        '<label>E-mail<input class="input" name="email" type="email" required autocomplete="email"></label>' +
        '<label>Mot de passe<input class="input" name="mdp" type="password" required autocomplete="current-password"></label>' +
        '<div class="form__actions"><button class="btn btn--brand" type="submit">Se connecter</button><button class="btn btn--line" type="button" id="b-oubli">Mot de passe oublié</button></div>' +
        (MW.dansApp ? "" : '<p class="ou">ou</p><button class="btn btn--line btn--google" type="button" id="b-google">Continuer avec Google</button>') +
        '<p class="mb__msg" role="status"></p></form>' +
        '<form class="form" id="f-inscription"><h2>Créer un compte</h2>' +
        '<label>Votre nom ou pseudo<input class="input" name="nom" required maxlength="40" autocomplete="nickname"></label>' +
        '<label>Votre ville<select class="select input" name="ville">' + optionsVilles("") + "</select></label>" +
        '<label>E-mail<input class="input" name="email" type="email" required autocomplete="email"></label>' +
        '<label>Mot de passe <span class="hint">(6 caractères minimum)</span><input class="input" name="mdp" type="password" required minlength="6" autocomplete="new-password"></label>' +
        '<label class="case"><input type="checkbox" name="charte" required> J’accepte la charte : respect, pas d’insultes ni de propos haineux, pas de publicité abusive. Les messages peuvent être modérés.</label>' +
        '<button class="btn btn--brand" type="submit">Créer mon compte</button><p class="mb__msg" role="status"></p></form></div>';
      var fc = $("f-connexion"), fi = $("f-inscription");
      fc.addEventListener("submit", function (e) {
        e.preventDefault(); var m = fc.querySelector(".mb__msg"); m.textContent = "Connexion…";
        auth.signInWithEmailAndPassword(fc.email.value.trim(), fc.mdp.value).catch(function (x) { m.textContent = erreur(x); });
      });
      $("b-oubli").addEventListener("click", function () {
        var m = fc.querySelector(".mb__msg"), em = fc.email.value.trim();
        if (!em) { m.textContent = "Écrivez d’abord votre e-mail ci-dessus."; fc.email.focus(); return; }
        auth.sendPasswordResetEmail(em).then(function () { m.textContent = "E-mail envoyé : suivez le lien pour choisir un nouveau mot de passe."; })
          .catch(function (x) { m.textContent = erreur(x); });
      });
      var g = $("b-google");
      if (g) g.addEventListener("click", function () {
        auth.signInWithPopup(new fb.auth.GoogleAuthProvider()).catch(function (x) { fc.querySelector(".mb__msg").textContent = erreur(x); });
      });
      fi.addEventListener("submit", function (e) {
        e.preventDefault(); if (!fi.reportValidity()) return;
        var m = fi.querySelector(".mb__msg"); m.textContent = "Création du compte…";
        var nom = fi.nom.value.trim(), ville = fi.ville.value;
        auth.createUserWithEmailAndPassword(fi.email.value.trim(), fi.mdp.value).then(function (r) {
          return db.collection("profils").doc(r.user.uid).set({ nom: nom, ville: ville, creeLe: maintenant() });
        }).then(function () { return chargerProfil(); }).then(function () { vue("compte"); })
          .catch(function (x) { m.textContent = erreur(x); });
      });
      return;
    }
    if (!profil) {
      el.innerHTML = '<form class="form" id="f-profil"><h2>Bienvenue !</h2><p>Choisissez le nom affiché dans les discussions.</p>' +
        '<label>Votre nom ou pseudo<input class="input" name="nom" required maxlength="40" value="' + esc(user.displayName || "") + '"></label>' +
        '<label>Votre ville<select class="select input" name="ville">' + optionsVilles("") + "</select></label>" +
        '<label class="case"><input type="checkbox" name="charte" required> J’accepte la charte : respect, pas d’insultes ni de propos haineux, pas de publicité abusive.</label>' +
        '<button class="btn btn--brand" type="submit">Enregistrer</button><p class="mb__msg" role="status"></p></form>';
      var fp = $("f-profil");
      fp.addEventListener("submit", function (e) {
        e.preventDefault(); if (!fp.reportValidity()) return;
        db.collection("profils").doc(user.uid).set({ nom: fp.nom.value.trim(), ville: fp.ville.value, creeLe: maintenant() })
          .then(chargerProfil).then(function () { vue("compte"); })
          .catch(function (x) { fp.querySelector(".mb__msg").textContent = erreur(x); });
      });
      return;
    }
    el.innerHTML = '<div class="carte-profil"><span class="avatar" aria-hidden="true">' + esc(profil.nom.charAt(0).toUpperCase()) + "</span><div><h2>" + esc(profil.nom) + "</h2>" +
      '<p class="muted">' + esc([profil.ville, user.email].filter(Boolean).join(" · ")) + (estAdmin() ? ' · <b>Modérateur</b>' : "") + "</p></div>" +
      '<button class="btn btn--line btn--sm" type="button" id="b-deco">Se déconnecter</button></div>' +
      '<div class="raccourcis"><a class="card" href="#membres--discussions"><h3>Discussions</h3><p>Salon général et salons des villes.</p></a>' +
      '<a class="card" href="#membres--messages"><h3>Messages privés</h3><p>Vos conversations.</p></a>' +
      '<a class="card" href="#membres--proposer"><h3>Proposer</h3><p>Une musique ou un événement.</p></a></div>' +
      '<h2 class="ville__h">Mes propositions</h2><div id="mes-props"><p class="muted">Chargement…</p></div>';
    $("b-deco").addEventListener("click", function () { auth.signOut(); });
    db.collection("propositions").where("auteur", "==", user.uid).get().then(function (q) {
      var L = q.docs.map(function (d) { return d.data(); }).sort(parDate);
      $("mes-props").innerHTML = L.length ? '<ul class="liste-props">' + L.map(function (p) {
        return "<li><span class=\"badge" + (p.statut === "publie" ? " badge--ok" : "") + '">' + ({ attente: "En attente", publie: "Publié", refuse: "Non retenu" }[p.statut] || p.statut) +
          "</span> " + (p.type === "musique" ? "🎵 " : "📅 ") + esc(p.titre) + "</li>";
      }).join("") + "</ul>" : '<p class="muted">Aucune proposition pour l’instant. <a href="#membres--proposer">Proposer une musique ou un événement</a>.</p>';
    }).catch(function () { $("mes-props").innerHTML = ""; });
  }
  function parDate(a, b) {
    var x = a.creeLe && a.creeLe.toMillis ? a.creeLe.toMillis() : Date.now(), y = b.creeLe && b.creeLe.toMillis ? b.creeLe.toMillis() : Date.now();
    return y - x;
  }

  /* ---------- Discussions (salons) ---------- */
  function vueDiscussions(el) {
    var salons = [{ id: "general", nom: "Général" }].concat(MW.villes());
    el.innerHTML = '<div class="salons" role="tablist">' + salons.map(function (s) {
      return '<button type="button" class="qchip" data-salon="' + s.id + '" aria-pressed="' + (s.id === salon) + '">' + esc(s.nom) + "</button>";
    }).join("") + '</div><div class="chat"><div class="chat__fil" id="fil" aria-live="polite"><p class="muted">Chargement…</p></div>' + saisie("f-salon", "Écrire dans le salon…") + "</div>";
    el.querySelector(".salons").addEventListener("click", function (e) {
      var b = e.target.closest("[data-salon]"); if (!b) return;
      salon = b.dataset.salon; vue("discussions");
    });
    var ref = db.collection("salons").doc(salon).collection("messages");
    ecoutes.push(ref.orderBy("creeLe", "desc").limit(100).onSnapshot(function (q) {
      var L = q.docs.map(function (d) { var m = d.data(); m.id = d.id; return m; }).reverse();
      afficherFil(L, function (m) {
        return (m.uid !== user.uid ? '<button type="button" class="lien" data-prive="' + esc(m.uid) + '" data-nom="' + esc(m.nom) + '">Écrire en privé</button>' +
          '<button type="button" class="lien" data-signaler="' + m.id + '">Signaler</button>' : "") +
          (m.uid === user.uid || estAdmin() ? '<button type="button" class="lien" data-suppr="' + m.id + '">Supprimer</button>' : "");
      });
    }, function () { $("fil").innerHTML = '<p class="muted">Impossible de charger les messages.</p>'; }));
    $("fil").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.prive) ouvrirPrive(b.dataset.prive, b.dataset.nom);
      if (b.dataset.suppr) ref.doc(b.dataset.suppr).delete().catch(function () {});
      if (b.dataset.signaler) {
        var msg = b.closest(".msg").querySelector(".msg__texte").textContent;
        db.collection("signalements").add({ chemin: "salons/" + salon + "/messages/" + b.dataset.signaler, texte: msg.slice(0, 500), par: user.uid, creeLe: maintenant() })
          .then(function () { b.textContent = "Signalé, merci"; b.disabled = true; });
      }
    });
    brancherSaisie("f-salon", function (t) { return ref.add({ uid: user.uid, nom: profil.nom, ville: profil.ville || "", texte: t, creeLe: maintenant() }); });
  }
  function saisie(id, ph) {
    return '<form class="chat__saisie" id="' + id + '"><textarea class="input" name="t" rows="1" maxlength="1000" required placeholder="' + ph + '" aria-label="' + ph + '"></textarea>' +
      '<button class="btn btn--brand" type="submit">Envoyer</button></form>';
  }
  function brancherSaisie(id, envoyer) {
    var f = $(id), ta = f.t;
    ta.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 700) { e.preventDefault(); f.requestSubmit(); } });
    f.addEventListener("submit", function (e) {
      e.preventDefault(); var t = ta.value.trim(); if (!t) return;
      ta.value = ""; envoyer(t).catch(function (x) { ta.value = t; alerteChat(erreur(x)); });
    });
  }
  function alerteChat(t) { var f = $("fil"); if (f) f.insertAdjacentHTML("beforeend", '<p class="chat__err">' + esc(t) + "</p>"); }
  function afficherFil(L, actions) {
    var f = $("fil"); if (!f) return;
    var enBas = f.scrollHeight - f.scrollTop - f.clientHeight < 80;
    f.innerHTML = L.length ? L.map(function (m) {
      var moi = m.uid === user.uid;
      return '<div class="msg' + (moi ? " msg--moi" : "") + '"><div class="msg__tete"><b>' + esc(m.nom) + "</b>" + (m.ville ? " · " + esc(m.ville) : "") +
        ' <time>' + quand(m.creeLe) + '</time></div><p class="msg__texte">' + esc(m.texte) + '</p><div class="msg__actions">' + actions(m) + "</div></div>";
    }).join("") : '<p class="muted chat__vide">Aucun message pour l’instant. Lancez la conversation !</p>';
    if (enBas || !f.dataset.vu) { f.scrollTop = f.scrollHeight; f.dataset.vu = "1"; }
  }

  /* ---------- Messages privés ---------- */
  function idConv(a, b) { return [a, b].sort().join("_"); }
  function ouvrirPrive(autre, nomAutre) {
    var id = idConv(user.uid, autre), noms = {};
    noms[user.uid] = profil.nom; noms[autre] = nomAutre;
    db.collection("conversations").doc(id).set({ membres: [user.uid, autre].sort(), noms: noms, majLe: maintenant() }, { merge: true })
      .then(function () { convOuverte = id; if (location.hash === "#membres--messages") vue("messages"); else location.hash = "#membres--messages"; })
      .catch(function (x) { alerteChat(erreur(x)); });
  }
  function vueMessages(el) {
    el.innerHTML = '<div class="prives"><aside class="prives__liste" id="convs"><p class="muted">Chargement…</p></aside><div class="prives__conv" id="conv"></div></div>';
    ecoutes.push(db.collection("conversations").where("membres", "array-contains", user.uid).onSnapshot(function (q) {
      var L = q.docs.map(function (d) { var c = d.data(); c.id = d.id; return c; }).sort(function (a, b) {
        return (b.majLe && b.majLe.toMillis ? b.majLe.toMillis() : Date.now()) - (a.majLe && a.majLe.toMillis ? a.majLe.toMillis() : Date.now());
      });
      $("convs").innerHTML = L.length ? L.map(function (c) {
        var autre = c.membres.filter(function (u) { return u !== user.uid; })[0];
        return '<button type="button" class="conv' + (c.id === convOuverte ? " is-on" : "") + '" data-conv="' + c.id + '"><b>' + esc((c.noms || {})[autre] || "Membre") +
          "</b><span>" + esc(c.dernier || "Nouvelle conversation") + "</span></button>";
      }).join("") : '<p class="muted">Aucune conversation. Dans les <a href="#membres--discussions">Discussions</a>, touchez « Écrire en privé » sous le message d’un membre.</p>';
      if (convOuverte && !$("fil")) ouvrirConv(convOuverte, L);
    }, function () { $("convs").innerHTML = '<p class="muted">Impossible de charger vos conversations.</p>'; }));
    $("convs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-conv]"); if (!b) return;
      convOuverte = b.dataset.conv; vue("messages");
    });
  }
  function ouvrirConv(id) {
    var ref = db.collection("conversations").doc(id);
    $("conv").innerHTML = '<div class="chat"><div class="chat__fil" id="fil"><p class="muted">Chargement…</p></div>' + saisie("f-prive", "Votre message…") + "</div>";
    $("conv").scrollIntoView({ block: "nearest" });
    ecoutes.push(ref.collection("messages").orderBy("creeLe", "desc").limit(200).onSnapshot(function (q) {
      afficherFil(q.docs.map(function (d) { return d.data(); }).reverse(), function () { return ""; });
    }, function () { $("fil").innerHTML = '<p class="muted">Impossible de charger cette conversation.</p>'; }));
    brancherSaisie("f-prive", function (t) {
      return ref.collection("messages").add({ uid: user.uid, nom: profil.nom, texte: t, creeLe: maintenant() }).then(function () {
        return ref.update({ dernier: t.slice(0, 80), majLe: maintenant() });
      });
    });
  }

  /* ---------- Proposer une musique ou un événement ---------- */
  function vueProposer(el) {
    el.innerHTML = '<div class="mb__duo">' +
      '<form class="form" id="f-musique"><h2>🎵 Proposer une musique</h2>' +
      '<label>Lien YouTube <span class="hint">(Partager → Copier le lien, puis collez ici)</span><input class="input" name="youtube" type="url" required placeholder="https://youtu.be/…" inputmode="url"></label>' +
      '<div id="apercu" class="apercu" hidden></div>' +
      '<label>Titre du morceau<input class="input" name="titre" required maxlength="120"></label>' +
      '<label>Artiste<input class="input" name="artiste" required maxlength="80"></label>' +
      '<div class="row"><label>Album ou single <span class="hint">(facultatif)</span><input class="input" name="album" maxlength="80"></label>' +
      '<label>Année <span class="hint">(facultatif)</span><input class="input" name="annee" inputmode="numeric" maxlength="4"></label></div>' +
      '<label class="case"><input type="checkbox" name="accord" required> Je suis l’artiste, ou l’artiste est d’accord pour que ce morceau soit sur MW+.</label>' +
      '<button class="btn btn--brand" type="submit">Envoyer la proposition</button><p class="mb__msg" role="status"></p></form>' +
      '<form class="form" id="f-evenement"><h2>📅 Proposer un événement</h2>' +
      '<label>Nom de l’événement<input class="input" name="titre" required maxlength="120" placeholder="Ex. : Fête des générations, concert, funérailles…"></label>' +
      '<div class="row"><label>Date<input class="input" name="date" type="date" required></label><label>Heure <span class="hint">(facultatif)</span><input class="input" name="heure" type="time"></label></div>' +
      '<div class="row"><label>Ville<select class="select input" name="ville" required>' + optionsVilles(profil.ville) + '</select></label><label>Lieu précis<input class="input" name="lieu" maxlength="120" placeholder="Quartier, village, salle…"></label></div>' +
      '<label>Description<textarea class="input" name="description" rows="4" maxlength="1500"></textarea></label>' +
      '<label>Contact <span class="hint">(facultatif, affiché publiquement)</span><input class="input" name="contact" maxlength="80"></label>' +
      '<button class="btn btn--brand" type="submit">Envoyer la proposition</button><p class="mb__msg" role="status"></p></form></div>';
    var fm = $("f-musique"), fe = $("f-evenement");
    var verifie = "";
    fm.youtube.addEventListener("input", function () {
      var id = MW.idYoutube(fm.youtube.value), ap = $("apercu");
      if (!id) { ap.hidden = true; return; }
      if (id === verifie) return; verifie = id;
      ap.hidden = false;
      ap.innerHTML = '<img src="https://i.ytimg.com/vi/' + id + '/mqdefault.jpg" alt=""><span class="muted">Recherche du titre…</span>';
      fetch("https://noembed.com/embed?url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id))
        .then(function (r) { return r.json(); }).then(function (d) {
          if (!d || !d.title) throw 0;
          var t = d.title.replace(/\s*[([][^)\]]*(clip|officiel|official|vid[ée]o|audio|lyrics?|paroles|hd|4k)[^)\]]*[)\]]/gi, "").trim(), a = "";
          var m = t.match(/^(.+?)\s+[-–—]\s+(.+)$/); if (m) { a = m[1]; t = m[2]; }
          if (!fm.titre.value) fm.titre.value = t.trim();
          if (!fm.artiste.value) fm.artiste.value = (a || d.author_name || "").trim();
          ap.querySelector("span").textContent = "Titre trouvé : vérifiez et corrigez si besoin.";
        }).catch(function () { ap.querySelector("span").textContent = "Écrivez le titre et l’artiste ci-dessous."; });
    });
    fm.addEventListener("submit", function (e) {
      e.preventDefault(); if (!fm.reportValidity()) return;
      var id = MW.idYoutube(fm.youtube.value), msg = fm.querySelector(".mb__msg");
      if (!id) { msg.textContent = "Ce lien n’est pas un lien YouTube valide."; return; }
      envoyerProposition({ type: "musique", youtube: "https://youtu.be/" + id, ytId: id, titre: fm.titre.value.trim(), artiste: fm.artiste.value.trim(),
        album: fm.album.value.trim(), annee: fm.annee.value.trim(), accord: true }, fm);
    });
    fe.addEventListener("submit", function (e) {
      e.preventDefault(); if (!fe.reportValidity()) return;
      envoyerProposition({ type: "evenement", titre: fe.titre.value.trim(), date: fe.date.value, heure: fe.heure.value, ville: fe.ville.value,
        lieu: fe.lieu.value.trim(), description: fe.description.value.trim(), contact: fe.contact.value.trim() }, fe);
    });
  }
  function envoyerProposition(p, form) {
    var msg = form.querySelector(".mb__msg"), b = form.querySelector('button[type="submit"]');
    p.statut = "attente"; p.auteur = user.uid; p.auteurNom = profil.nom; p.creeLe = maintenant();
    b.disabled = true; msg.textContent = "Envoi…";
    db.collection("propositions").add(p).then(function () {
      form.reset(); var ap = $("apercu"); if (ap) ap.hidden = true;
      msg.textContent = "Merci ! Votre proposition sera publiée après validation.";
      // Prévenir le modérateur par e-mail (Netlify Forms)
      var d = new URLSearchParams({ "form-name": "proposition", type: p.type === "musique" ? "Musique" : "Événement", titre: p.titre, auteur: p.auteurNom });
      fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: d.toString() }).catch(function () {});
    }).catch(function (x) { msg.textContent = erreur(x); }).then(function () { b.disabled = false; });
  }

  /* ---------- Modération ---------- */
  function vueModeration(el) {
    if (!estAdmin()) { el.innerHTML = invitation("moderation"); return; }
    el.innerHTML = '<h2 class="ville__h">Propositions en attente</h2><div id="attente"><p class="muted">Chargement…</p></div>' +
      '<h2 class="ville__h">Messages signalés</h2><div id="signal"><p class="muted">Chargement…</p></div>' +
      '<h2 class="ville__h">Déjà publiés</h2><div id="publies"><p class="muted">Chargement…</p></div>';
    function carte(p, actions) {
      var info = p.type === "musique" ? esc(p.artiste) + (p.album ? " · " + esc(p.album) : "") + (p.annee ? " · " + esc(p.annee) : "") +
        ' · <a href="' + esc(p.youtube) + '" target="_blank" rel="noopener">Voir la vidéo</a>' :
        esc(dateLongue(p.date)) + (p.heure ? " à " + esc(p.heure) : "") + " · " + esc([p.ville, p.lieu].filter(Boolean).join(", "));
      return '<article class="prop">' + (p.type === "musique" ? '<img src="https://i.ytimg.com/vi/' + esc(p.ytId) + '/mqdefault.jpg" alt="">' : '<span class="prop__ico">📅</span>') +
        '<div><h3>' + esc(p.titre) + "</h3><p>" + info + "</p>" + (p.description ? '<p class="muted">' + esc(p.description) + "</p>" : "") +
        '<p class="muted">Proposé par ' + esc(p.auteurNom) + "</p><div class=\"titre__actions\">" + actions + "</div></div></article>";
    }
    ecoutes.push(db.collection("propositions").where("statut", "==", "attente").onSnapshot(function (q) {
      $("attente").innerHTML = q.empty ? '<p class="muted">Rien à valider. 👍</p>' : q.docs.map(function (d) {
        return carte(d.data(), '<button class="btn btn--brand btn--sm" data-pub="' + d.id + '">Publier</button><button class="btn btn--line btn--sm" data-ref="' + d.id + '">Refuser</button>');
      }).join("");
    }));
    ecoutes.push(db.collection("propositions").where("statut", "==", "publie").onSnapshot(function (q) {
      $("publies").innerHTML = q.empty ? '<p class="muted">Aucune publication.</p>' : q.docs.map(function (d) {
        return carte(d.data(), '<button class="btn btn--line btn--sm" data-ref="' + d.id + '">Retirer du site</button>');
      }).join("");
    }));
    ecoutes.push(db.collection("signalements").onSnapshot(function (q) {
      $("signal").innerHTML = q.empty ? '<p class="muted">Aucun signalement.</p>' : q.docs.map(function (d) {
        var s = d.data();
        return '<article class="prop"><span class="prop__ico">⚠️</span><div><p>« ' + esc(s.texte) + ' »</p><div class="titre__actions">' +
          '<button class="btn btn--brand btn--sm" data-supprmsg="' + esc(s.chemin) + '" data-sig="' + d.id + '">Supprimer le message</button>' +
          '<button class="btn btn--line btn--sm" data-ignorer="' + d.id + '">Ignorer</button></div></div></article>';
      }).join("");
    }));
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var P = db.collection("propositions");
      if (b.dataset.pub) P.doc(b.dataset.pub).update({ statut: "publie", valideLe: maintenant() });
      if (b.dataset.ref) P.doc(b.dataset.ref).update({ statut: "refuse", valideLe: maintenant() });
      if (b.dataset.supprmsg) db.doc(b.dataset.supprmsg).delete().then(function () { return db.collection("signalements").doc(b.dataset.sig).delete(); });
      if (b.dataset.ignorer) db.collection("signalements").doc(b.dataset.ignorer).delete();
    });
  }
  function dateLongue(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  /* ---------- Contenus publiés, pour les pages Musique et Événements ---------- */
  function publies(type) {
    if (!config()) return Promise.resolve([]);
    return demarrer().then(function () {
      return db.collection("propositions").where("statut", "==", "publie").get();
    }).then(function (q) {
      return q.docs.map(function (d) { return d.data(); }).filter(function (p) { return p.type === type; });
    }).catch(function () { return []; });
  }
  function agenda(el) {
    var auj = new Date().toISOString().slice(0, 10);
    el.innerHTML = '<div class="section__head"><h2>Agenda de la communauté</h2><a class="btn btn--brand btn--sm" href="#membres--proposer">Proposer un événement</a></div><div id="agenda-liste"><p class="muted">Chargement…</p></div>';
    publies("evenement").then(function (L) {
      L = L.filter(function (e) { return e.date >= auj; }).sort(function (a, b) { return (a.date + a.heure).localeCompare(b.date + b.heure); });
      $("agenda-liste").innerHTML = L.length ? '<div class="news">' + L.map(function (e) {
        var d = new Date(e.date + "T12:00:00");
        return '<article class="news__item"><div class="news__date"><b>' + d.getDate() + "</b><span>" + d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) +
          '</span></div><div><span class="tag">' + esc([e.ville, e.lieu].filter(Boolean).join(" · ")) + (e.heure ? " · " + esc(e.heure) : "") + "</span><h3>" + esc(e.titre) + "</h3>" +
          (e.description ? "<p>" + esc(e.description) + "</p>" : "") + (e.contact ? "<p><b>Contact :</b> " + esc(e.contact) + "</p>" : "") + "</div></article>";
      }).join("") + "</div>" : '<p class="muted">Aucun événement à venir pour l’instant.</p>';
    });
  }

  window.MWMembres = { render: render, quitter: couper, publies: publies, agenda: agenda, actif: function () { return !!config(); } };
})();
