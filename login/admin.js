import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, db } from "../firebase-client.js";
import { portfolioDefaults } from "../portfolio-defaults.js";

const loginPanel = document.querySelector("#loginPanel");
const editorPanel = document.querySelector("#editorPanel");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const saveMessage = document.querySelector("#saveMessage");
const contentEditor = document.querySelector("#contentEditor");
const saveButton = document.querySelector("#saveButton");
const documentRef = doc(db, "portfolio", "public");

function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("error", isError);
}

function readableAuthError(error) {
    const messages = {
        "auth/invalid-credential": "Неверный email или пароль.",
        "auth/invalid-email": "Проверьте адрес электронной почты.",
        "auth/too-many-requests": "Слишком много попыток. Попробуйте позже.",
        "auth/network-request-failed": "Не удалось подключиться. Проверьте интернет.",
    };
    return messages[error.code] || "Не удалось войти. Проверьте данные и настройки Firebase Authentication.";
}

function validateContent(content) {
    if (!content || typeof content !== "object" || Array.isArray(content)) throw new Error("Корень JSON должен быть объектом.");
    for (const key of ["texts", "companies", "skills", "projects", "links"]) {
        if (!(key in content)) throw new Error(`Не найден обязательный раздел: ${key}`);
    }
    if (!content.texts.ru || !content.texts.en) throw new Error("В разделе texts должны быть переводы ru и en.");
    for (const key of ["companies", "skills", "projects", "links"]) {
        if (!Array.isArray(content[key])) throw new Error(`${key} должен быть массивом.`);
    }
    for (const project of content.projects) {
        if (!project.id || !project.src || !["motion", "modeling"].includes(project.tab)) {
            throw new Error("У каждого проекта нужны id, src и tab со значением motion или modeling.");
        }
    }
}

async function loadContent() {
    showMessage(saveMessage, "Загружаю данные…");
    try {
        const snapshot = await getDoc(documentRef);
        const content = snapshot.exists() ? snapshot.data() : portfolioDefaults;
        contentEditor.value = JSON.stringify(content, null, 2);
        showMessage(saveMessage, snapshot.exists() ? "Данные загружены из Firestore." : "Документ пока пуст: показана исходная структура сайта.");
    } catch (error) {
        showMessage(saveMessage, error.code === "permission-denied"
            ? "Нет доступа к Firestore. Опубликуйте firestore.rules и замените REPLACE_WITH_ADMIN_UID на UID своего аккаунта."
            : "Не удалось загрузить данные из Firestore. Проверьте настройки и правила.", true);
    }
}

loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const button = loginForm.querySelector("button[type=submit]");
    button.disabled = true;
    showMessage(loginMessage, "Выполняю вход…");
    try {
        await signInWithEmailAndPassword(auth, formData.get("email"), formData.get("password"));
    } catch (error) {
        showMessage(loginMessage, readableAuthError(error), true);
    } finally {
        button.disabled = false;
    }
});

onAuthStateChanged(auth, async user => {
    loginPanel.hidden = Boolean(user);
    editorPanel.hidden = !user;
    if (!user) return;
    document.querySelector("#userLabel").textContent = `Вошли как ${user.email || "администратор"} · UID: ${user.uid}`;
    await loadContent();
});

document.querySelector("#logoutButton").addEventListener("click", () => signOut(auth));
document.querySelector("#reloadButton").addEventListener("click", loadContent);
saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    try {
        const content = JSON.parse(contentEditor.value);
        validateContent(content);
        await setDoc(documentRef, { ...content, updatedAt: serverTimestamp() });
        showMessage(saveMessage, "Сохранено. Обновите портфолио, чтобы проверить изменения.");
    } catch (error) {
        const message = error instanceof SyntaxError ? "JSON содержит синтаксическую ошибку — проверьте скобки и кавычки." : error.message;
        showMessage(saveMessage, error.code === "permission-denied"
            ? "Запись запрещена. В firestore.rules должен быть указан ваш UID администратора."
            : message, true);
    } finally {
        saveButton.disabled = false;
    }
});
