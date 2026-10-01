# Firebase setup

The portfolio uses Cloud Firestore document `portfolio/public` for published content. Visitors can read only this document; only the administrator UID may write it.

Firebase Hosting is configured to publish the repository root, including the `assets/` media files. Pushes to `feature/portfolio-refresh` deploy the live Hosting channel; pushes to `main` do not. Before the first automated deploy, enable Firebase Hosting once in the Firebase Console so the default `gant-design.web.app` site exists.

The GitHub Actions workflow needs the repository secret `FIREBASE_SERVICE_ACCOUNT`, containing a Firebase deployment service-account JSON key. Add it in GitHub → repository **Settings → Secrets and variables → Actions → New repository secret**. Never commit the key or paste it into chat. After the first deployment, add `gant-design.web.app` to Firebase Authentication → Settings → Authorized domains if it is not already listed.

## One-time console steps

1. In Firebase Console → Authentication → Users, create an administrator user if one does not already exist. Do not add public registration to the website.
2. Open the site over HTTPS (or `http://localhost` while developing) and visit `/login/`. Sign in. The dashboard displays the account UID.
3. In Firebase Console → Firestore Database → Rules, paste `firestore.rules`, replace `REPLACE_WITH_ADMIN_UID` with the UID shown in the dashboard, and publish the rules.
4. In Authentication → Settings → Authorized domains, add the deployed site hostname before testing production sign-in.
5. Return to `/login/`, load the editor and save once to create `portfolio/public`. The public portfolio switches to Firestore content after this document exists.

The browser Firebase config in `firebase-config.js` is not a secret. Firestore Rules are the access-control boundary. Never put a service-account JSON, R2 access key, or Cloudflare API token in frontend files.

## Content shape

The initial content shape is in `portfolio-defaults.js`. `texts` stores Russian and English copy. `companies`, `skills`, `projects`, and `links` are ordered arrays. A company or skill may use `iconUrl`; a project uses `src`, `tab` (`motion` or `modeling`), `order`, and `visible`. Relative project paths resolve from the website root; absolute HTTPS URLs can be used for externally hosted assets.

## Cloudflare media

R2 upload is intentionally not enabled yet. For production uploads, add a Cloudflare Worker or Pages Function that verifies the Firebase ID token and returns a short-lived, object-specific R2 upload URL. Store the R2 credentials only as Worker secrets. Until an R2 bucket and delivery hostname are configured, existing local media paths continue to work.
