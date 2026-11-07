# MW+ · Portail culturel wê

Site internet du peuple wê : histoire, langue, culture, musique, tourisme, médiathèque, actualités, annuaire Wê Business et contact.

- **Site** : fichiers statiques (`index.html`, `styles.css`, `app.js`), aucune compilation.
- **Contenu** : dossier `content/` (fichiers JSON), modifié depuis l'espace administrateur.
- **Espace administrateur** : `/admin/` (Decap CMS). Chaque publication enregistre une modification dans ce dépôt GitHub ; le site se met à jour tout seul en une minute environ.
- **Formulaires** : envoyés par Netlify Forms (contact, partenaire, contenu).

## Mise en ligne (une seule fois, environ 20 minutes)

### 1. Héberger le site sur Netlify
1. Créez un compte gratuit sur netlify.com avec votre compte GitHub.
2. **Add new project → Import an existing project → GitHub**, choisissez ce dépôt.
3. Laissez la commande de build vide, dossier de publication : `.` → **Deploy**.
4. Le site est en ligne à une adresse du type `https://mw-plus.netlify.app` (modifiable dans *Project configuration → Change project name*).

### 2. Activer les formulaires
1. Dans Netlify : **Forms → Enable form detection**, puis relancez un déploiement (*Deploys → Trigger deploy*).
2. Les trois formulaires `contact`, `partenaire` et `contenu` apparaissent dans l'onglet **Forms** : tous les messages y sont conservés.
3. Pour les recevoir par e-mail : **Project configuration → Notifications → Emails and webhooks → Form submission notifications → Add notification → Email notification**, puis indiquez votre adresse.

### 3. Activer l'espace administrateur
1. Sur GitHub : **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Application name : `MW+ Administration`
   - Homepage URL : l'adresse de votre site
   - Authorization callback URL : `https://api.netlify.com/auth/done`
   - Enregistrez, puis générez un *Client secret*.
2. Dans Netlify : **Project configuration → Access & security → OAuth → Install provider → GitHub**, collez le *Client ID* et le *Client secret*.
3. Ouvrez `https://votre-site/admin/` et cliquez sur **Se connecter avec GitHub**.
4. Pour donner l'accès à d'autres personnes : ajoutez leur compte GitHub comme collaborateur du dépôt (**Settings → Collaborators**). Personne d'autre ne peut publier.

Si le dépôt ne s'appelle pas `hermanndedelobly-lab/portail-mw-plus`, corrigez la ligne `repo:` dans `admin/config.yml`.

### 4. Nom de domaine (facultatif)
Achetez un nom (par exemple `mondewe.ci` ou `mw-plus.com`), puis dans Netlify : **Domain management → Add a domain** et suivez les indications. Le certificat HTTPS est fourni gratuitement.

## Utiliser l'espace administrateur
- **Actualités** : ajouter un article (date, catégorie, titre, résumé, image).
- **Dictionnaire** : ajouter des mots français-wê.
- **Annuaire Wê Business** : ajouter des entreprises, commerçants, artisans.
- **Rubriques et pages** : modifier les textes et images de chaque rubrique, ajouter ou retirer des pages. Laissez une ligne vide entre deux paragraphes. Décochez « Rubrique en construction » quand une page est complète.
- **Réglages du site** : nom, devise, texte de la page d'accueil, e-mail de secours.

## Tester sur un ordinateur
```
npx decap-server        # dans le dossier du site, laisser ouvert
python3 -m http.server  # dans un second terminal
```
Puis ouvrir `http://localhost:8000/` (site) et `http://localhost:8000/admin/` (administration, sans connexion GitHub : les modifications sont écrites directement dans `content/`).
