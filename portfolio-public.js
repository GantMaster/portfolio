import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "./firebase-client.js";
import { portfolioDefaults } from "./portfolio-defaults.js";

if (document.readyState === "loading") {
    await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
}

let content = portfolioDefaults;
try {
    const snapshot = await getDoc(doc(db, "portfolio", "public"));
    if (snapshot.exists()) content = snapshot.data();
} catch (error) {
    console.warn("Portfolio content is using the built-in version; Firestore could not be read.", error.code || error);
}

window.__loadedPortfolioContent = content;
document.dispatchEvent(new CustomEvent("portfolio:content", { detail: content }));
