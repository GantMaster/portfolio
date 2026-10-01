# Firebase setup

The portfolio uses Cloud Firestore document `portfolio/public` for published content. Visitors can read only this document; only the administrator UID may write it. Firestore stores content metadata, not media files.

Firebase Hosting publishes the repository root except `assets/videos/**`. Images and small assets are hosted on Firebase; videos in `assets/videos/` are fetched from GitHub Raw. Pushes to `feature/portfolio-refresh` deploy the live Hosting channel and Firestore Rules; pushes to `main` do not. Before the first automated deploy, enable Firebase Hosting once in the Firebase Console so the default `gant-design.web.app` site exists.

The GitHub Actions workflow needs the repository secret `FIREBASE_SERVICE_ACCOUNT`, containing a Firebase deployment service-account JSON key. Add it in GitHub → repository **Settings → Secrets and variables → Actions → New repository secret**. Never commit the key or paste it into chat. After the first deployment, add `gant-design.web.app` to Firebase Authentication → Settings → Authorized domains if it is not already listed.

## One-time console steps

1. In Firebase Console → Authentication → Users, create an administrator user if one does not already exist. Do not add public registration to the website.
2. The administrator UID is already set in `firestore.rules`. The GitHub Actions workflow publishes these rules on every push to `feature/portfolio-refresh`; do not replace them with broader console rules.
3. In Authentication settings, add the deployed site hostname to Authorized domains if it is not already listed.
4. Visit `/login/`, sign in, load the editor, and save once to create `portfolio/public`. The public portfolio switches to Firestore content after this document exists.

The browser Firebase config in `firebase-config.js` is not a secret. Firestore Rules are the access-control boundary. Never put a service-account JSON, R2 access key, or Cloudflare API token in frontend files.

## Content shape

The initial content shape is in `portfolio-defaults.js`. `texts` stores Russian and English copy. `companies`, `skills`, `projects`, and `links` are ordered arrays. A company or skill may use `iconUrl`; a project uses `src`, `tab` (`motion` or `modeling`), `order`, and `visible`. Relative image paths resolve from the website root. Video paths under `assets/videos/` resolve to the configured GitHub Raw repository and branch; update that mapping in `script.js` and `login/admin.js` when changing repository or branch. Absolute HTTPS URLs can also be used for externally hosted assets.

The CI script `scripts/generate-assets-manifest.mjs` recursively indexes supported files under `assets/videos/` and writes `assets-manifest.json` for the admin editor. Newly detected files are added to the content list hidden by default. Removing a video from Git removes its entry during the next admin load; save the resulting content to apply that removal to Firestore. The public site filters hidden projects before creating media elements, and video requests are lazy-loaded near the viewport.

## Cloudflare media

Direct upload/delete from the admin is intentionally not enabled. Add/remove videos in Git and let CI regenerate the manifest; visitors fetch active videos from GitHub Raw, not Firebase Storage. For a later move to object storage, add a trusted upload service that verifies the Firebase ID token and issues short-lived, object-specific upload URLs. Store storage credentials only as server-side secrets. GitHub Raw is a convenient free starting point, not a dedicated production CDN guarantee.
