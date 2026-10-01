import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { auth, db } from "./firebase-client.js";

const contentRef = doc(db, "portfolio", "public");

function mergeDefaults(defaults, saved) {
    if (!defaults || typeof defaults !== "object" || Array.isArray(defaults)) {
        return saved === undefined ? structuredClone(defaults) : saved;
    }
    const result = { ...defaults };
    for (const [key, value] of Object.entries(saved || {})) {
        result[key] = key in defaults && value && typeof value === "object" && !Array.isArray(value)
            ? mergeDefaults(defaults[key], value)
            : value;
    }
    return result;
}

/** Load the document and report whether it exists. Arrays replace their defaults as a whole. */
export async function loadPortfolioRecord(defaults) {
    const snapshot = await getDoc(contentRef);
    return {
        exists: snapshot.exists(),
        content: snapshot.exists() ? mergeDefaults(defaults, snapshot.data()) : structuredClone(defaults),
    };
}

/** Public-site read: use built-in defaults if Firestore is unavailable. */
export async function loadPortfolio(defaults) {
    try {
        const { content } = await loadPortfolioRecord(defaults);
        return content;
    } catch (error) {
        console.warn("Portfolio is using built-in defaults; Firestore could not be read.", error.code || error);
        return structuredClone(defaults);
    }
}

/** Render data before revealing the page so default HTML cannot flash first. */
export async function bootstrapPortfolio({ defaults, render, contentElement, loadingElement }) {
    if (typeof render !== "function") throw new TypeError("bootstrapPortfolio requires a render function.");
    contentElement?.setAttribute("aria-busy", "true");
    const content = await loadPortfolio(defaults);
    await render(content);
    contentElement?.removeAttribute("data-loading");
    contentElement?.setAttribute("aria-busy", "false");
    loadingElement?.setAttribute("hidden", "");
    return content;
}

/** Subscribe to auth state for a custom admin screen. */
export function observeAdmin(callback) {
    return onAuthStateChanged(auth, callback);
}

export function signInAdmin(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

export function signOutAdmin() {
    return signOut(auth);
}

/** Firestore Rules remain the authorization boundary; this is only a UX guard. */
export async function savePortfolio(content, validate = value => value) {
    if (!auth.currentUser) throw new Error("Sign in before saving portfolio content.");
    const safeContent = validate(content);
    await setDoc(contentRef, { ...safeContent, updatedAt: serverTimestamp() });
}
