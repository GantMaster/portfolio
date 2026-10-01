import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase-client.js";

if (document.readyState === "loading") {
    await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
}

try {
    const snapshot = await getDoc(doc(db, "portfolio", "public"));
    if (snapshot.exists()) {
        window.__loadedPortfolioContent = snapshot.data();
        document.dispatchEvent(new CustomEvent("portfolio:content", { detail: window.__loadedPortfolioContent }));
    }
} catch (error) {
    // The static portfolio remains available from its built-in defaults if Firebase is
    // unreachable or public-read rules have not been published yet.
    console.warn("Portfolio content is using the built-in version; Firestore could not be read.", error.code || error);
}
