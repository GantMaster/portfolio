import { portfolioDefaults } from "./defaults.js";
import {
    loadPortfolioRecord,
    observeAdmin,
    savePortfolio,
    signInAdmin,
    signOutAdmin,
} from "./portfolio-engine.js";

const loginPanel = document.querySelector("#login-panel");
const editorPanel = document.querySelector("#editor-panel");
const loginForm = document.querySelector("#login-form");
const jsonInput = document.querySelector("#content-json");
const saveButton = document.querySelector("#save-button");
const status = document.querySelector("#status");
const userLabel = document.querySelector("#user-label");
let contentLoaded = false;

function showStatus(message, error = false) {
    status.textContent = message;
    status.classList.toggle("error", error);
}

observeAdmin(async user => {
    loginPanel.hidden = Boolean(user);
    editorPanel.hidden = !user;
    userLabel.textContent = user?.email || "";
    saveButton.disabled = true;
    contentLoaded = false;
    if (!user) return;

    showStatus("Loading content…");
    try {
        const record = await loadPortfolioRecord(portfolioDefaults);
        jsonInput.value = JSON.stringify(record.content, null, 2);
        contentLoaded = true;
        saveButton.disabled = false;
        showStatus(record.exists ? "Content loaded." : "No saved document yet. Defaults loaded; save to publish them.");
    } catch (error) {
        showStatus(`Could not read Firestore (${error.code || error.message}). Saving is disabled to protect existing content.`, true);
    }
});

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(loginForm);
    const button = loginForm.querySelector("button[type=submit]");
    button.disabled = true;
    try {
        await signInAdmin(form.get("email"), form.get("password"));
    } catch (error) {
        alert(`Sign-in failed: ${error.code || error.message}`);
    } finally {
        button.disabled = false;
    }
});

document.querySelector("#logout-button").addEventListener("click", () => signOutAdmin());

saveButton.addEventListener("click", async () => {
    if (!contentLoaded) return;
    saveButton.disabled = true;
    try {
        const content = JSON.parse(jsonInput.value);
        if (!content || Array.isArray(content) || typeof content !== "object") {
            throw new Error("The document root must be a JSON object.");
        }
        await savePortfolio(content);
        showStatus("Saved. Refresh the public site to see the changes.");
    } catch (error) {
        showStatus(error instanceof SyntaxError ? `Invalid JSON: ${error.message}` : error.message, true);
    } finally {
        saveButton.disabled = false;
    }
});
