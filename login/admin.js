import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { auth, db } from "../firebase-client.js";
import { portfolioDefaults } from "../portfolio-defaults.js";

const loginPanel = document.querySelector("#loginPanel");
const editorPanel = document.querySelector("#editorPanel");
const loginForm = document.querySelector("#loginForm");
const loginMessage = document.querySelector("#loginMessage");
const saveMessage = document.querySelector("#saveMessage");
const editorContent = document.querySelector("#editorContent");
const saveButton = document.querySelector("#saveButton");
const reloadButton = document.querySelector("#reloadButton");
const documentRef = doc(db, "portfolio", "public");
const languages = ["ru", "en"];
const textFields = [
    ["pageTitle", "Заголовок вкладки браузера"],
    ["name", "Имя"],
    ["role", "Специализация и опыт"],
    ["description", "Короткое описание"],
    ["workedWith", "Подпись компаний"],
    ["skills", "Подпись навыков"],
    ["motion", "Название вкладки с моушн-дизайном"],
    ["modeling", "Название вкладки с моделингом"],
];

let content = normalizeContent(portfolioDefaults);
let activeSection = "meta";
let activeCollection = "texts";
let documentExists = false;
let dirty = false;
let mediaManifest = [];
let manifestStatus = "";
let draggedProjectId = "";
let manifestChanged = false;
let previewObserver;

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function normalizeContent(source = {}) {
    return {
        texts: Object.fromEntries(languages.map(lang => [
            lang,
            { ...clone(portfolioDefaults.texts[lang]), ...(source.texts?.[lang] || {}) },
        ])),
        companies: Array.isArray(source.companies) ? clone(source.companies) : clone(portfolioDefaults.companies),
        skills: Array.isArray(source.skills) ? clone(source.skills) : clone(portfolioDefaults.skills),
        projects: Array.isArray(source.projects) ? clone(source.projects) : clone(portfolioDefaults.projects),
        links: Array.isArray(source.links) ? clone(source.links) : clone(portfolioDefaults.links),
    };
}

function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
}

function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("error", isError);
}

function markDirty() {
    dirty = true;
    showMessage(saveMessage, "Есть несохранённые изменения.");
}

function field(label, path, value, options = {}) {
    const { type = "text", wide = false, placeholder = "", rows = 3 } = options;
    const classes = `field${wide ? " field-wide" : ""}`;
    const safePath = escapeHtml(path);
    if (type === "checkbox") {
        return `<label class="check-field"><input type="checkbox" data-path="${safePath}" ${value !== false ? "checked" : ""}><span>${escapeHtml(label)}</span></label>`;
    }
    if (type === "textarea") {
        return `<label class="${classes}"><span>${escapeHtml(label)}</span><textarea rows="${rows}" data-path="${safePath}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value ?? "")}</textarea></label>`;
    }
    if (type === "color") {
        const color = /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#858ce8";
        return `<label class="color-field"><span>${escapeHtml(label)}</span><input type="color" data-path="${safePath}" value="${escapeHtml(color)}"></label>`;
    }
    return `<label class="${classes}"><span>${escapeHtml(label)}</span><input type="${type}" data-path="${safePath}" value="${escapeHtml(value ?? "")}" placeholder="${escapeHtml(placeholder)}"></label>`;
}

function localizedFields(path, value, labels) {
    return languages.map(lang => field(`${labels[lang]} · ${lang.toUpperCase()}`, `${path}.${lang}`, value?.[lang] || "", {
        type: "text",
        wide: true,
    })).join("");
}

function sectionHeading(title, description, addLabel = "") {
    return `<div class="section-heading"><div><h2>${title}</h2><p>${description}</p></div>${addLabel ? '<button class="secondary-button" type="button" data-action="add">+ ' + addLabel + "</button>" : ""}</div>`;
}

function renderTexts() {
    return `${sectionHeading("Тексты и информация", "Заполните русский и английский варианты — переключатель языка на сайте использует их автоматически.")}
        <div class="language-columns">${languages.map(lang => `
            <section class="content-card language-card">
                <h3>${lang === "ru" ? "Русский" : "English"}</h3>
                <div class="field-grid">${textFields.map(([key, label]) => field(label, `texts.${lang}.${key}`, content.texts[lang][key] || "", {
                    type: key === "description" ? "textarea" : "text",
                    wide: key === "description",
                })).join("")}</div>
            </section>`).join("")}</div>`;
}

function moveButtons(kind, key, position, length, removable = true) {
    return `<div class="item-controls">
        <button class="icon-button" type="button" data-action="move" data-kind="${kind}" data-key="${escapeHtml(key)}" data-direction="-1" aria-label="Переместить выше" ${position === 0 ? "disabled" : ""}>↑</button>
        <button class="icon-button" type="button" data-action="move" data-kind="${kind}" data-key="${escapeHtml(key)}" data-direction="1" aria-label="Переместить ниже" ${position === length - 1 ? "disabled" : ""}>↓</button>
        ${removable ? `<button class="icon-button danger-button" type="button" data-action="remove" data-kind="${kind}" data-key="${escapeHtml(key)}" aria-label="Удалить">×</button>` : ""}
    </div>`;
}

function sortedProjects(tab) {
    return content.projects
        .filter(project => project.tab === tab)
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}

function renderProject(project, tab, position, length) {
    const key = project.id;
    const index = content.projects.indexOf(project);
    const src = String(project.src || "");
    const fileName = src.split("/").pop();
    const local = src.startsWith("assets/");
    const previewSrc = local ? `../${src}` : src;
    const isVideo = /\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i.test(src);
    const preview = isVideo
        ? `<video src="${escapeHtml(previewSrc)}" muted loop playsinline preload="none"></video>`
        : `<img src="${escapeHtml(previewSrc)}" alt="" loading="lazy">`;
    return `<article class="compact-row project-row${project.visible === false ? " is-hidden" : ""}" data-project-id="${escapeHtml(key)}" draggable="true">
        <span class="drag-grip" aria-hidden="true">⠿</span><span class="project-thumb">${preview}</span>
        <span class="row-order">${position + 1}</span>
        <div class="row-title"><strong>${escapeHtml(fileName || "Новый проект")}</strong><small>${escapeHtml(src || "Путь к файлу не задан")}</small></div>
        <label class="sr-only" for="project-order-${escapeHtml(key)}">Порядок</label><input class="order-input" id="project-order-${escapeHtml(key)}" type="number" min="1" value="${position + 1}" data-project-order="${escapeHtml(key)}">
        <label class="sr-only" for="project-tab-${escapeHtml(key)}">Вкладка</label><select class="row-select" id="project-tab-${escapeHtml(key)}" data-path="projects.${index}.tab"><option value="motion" ${tab === "motion" ? "selected" : ""}>Креативы</option><option value="modeling" ${tab === "modeling" ? "selected" : ""}>Моделинг</option></select>
        <label class="row-visible" title="Показывать на сайте"><input type="checkbox" data-path="projects.${index}.visible" ${project.visible !== false ? "checked" : ""}><span>Сайт</span></label>
        ${moveButtons("projects", key, position, length, !local)}
        <details class="row-edit"><summary>Изменить</summary><div class="row-edit-fields">${field("Путь или URL", `projects.${index}.src`, src, { wide: true, placeholder: "assets/videos/example.mp4 или https://…" })}</div></details>
    </article>`;
}

function renderProjects() {
    const groups = [["motion", "Моушн-дизайн и креативы"], ["modeling", "3D-моделинг"]];
    return `${sectionHeading("Контент портфолио", "Перетаскивайте строки или задавайте номер; новые файлы из Git добавляются скрытыми.", "проект")}
        <p class="section-hint">${escapeHtml(manifestStatus || "Каталог файлов появится после сборки сайта.")} · <code>assets/videos/</code></p>
        ${groups.map(([tab, title]) => {
            const projects = sortedProjects(tab);
            return `<section class="collection-group"><h3>${title}<span>${projects.length}</span></h3><div class="compact-list" data-project-list="${tab}">${projects.length ? projects.map((project, index) => renderProject(project, tab, index, projects.length)).join("") : '<p class="empty-state">В этой вкладке пока нет проектов.</p>'}</div></section>`;
        }).join("")}`;
}

function renderCompanies() {
    return `${sectionHeading("Компании", "Управляйте названиями, порядком, цветами и собственными иконками.", "компанию")}
        <div class="compact-list">${content.companies.map((item, index) => `<details class="compact-row"><summary class="compact-summary"><span class="row-order">${index + 1}</span><span class="row-title"><strong>${escapeHtml(item.names?.ru || item.names?.en || "Без названия")}</strong><small>${escapeHtml(item.mark || "Компания")}</small></span>${moveButtons("companies", index, index, content.companies.length)}</summary><div class="row-edit-fields"><div class="field-grid">
                ${localizedFields(`companies.${index}.names`, item.names || { ru: item.name || "", en: item.name || "" }, { ru: "Название", en: "Name" })}
                ${field("Короткая метка", `companies.${index}.mark`, item.mark || "", { placeholder: "Например, CG" })}
                ${field("Цвет фона", `companies.${index}.color`, item.color || "#5962a4", { type: "color" })}
                ${field("Цвет метки", `companies.${index}.textColor`, item.textColor || "#ffffff", { type: "color" })}
                ${field("URL иконки (необязательно)", `companies.${index}.iconUrl`, item.iconUrl || "", { wide: true, placeholder: "assets/images/company.png или https://…" })}
                ${field("Показывать на сайте", `companies.${index}.visible`, item.visible, { type: "checkbox" })}
            </div></div></details>`).join("") || '<p class="empty-state">Компаний пока нет.</p>'}</div>`;
}

function renderSkills() {
    return `${sectionHeading("Навыки", "Можно менять названия для обоих языков, порядок, цвет и иконку.", "навык")}
        <div class="compact-list">${content.skills.map((item, index) => `<details class="compact-row"><summary class="compact-summary"><span class="row-order">${index + 1}</span><span class="row-title"><strong>${escapeHtml(item.names?.ru || item.names?.en || item.name || "Без названия")}</strong><small>Навык</small></span>${moveButtons("skills", index, index, content.skills.length)}</summary><div class="row-edit-fields"><div class="field-grid">
                ${localizedFields(`skills.${index}.names`, item.names || { ru: item.name || "", en: item.name || "" }, { ru: "Название", en: "Name" })}
                ${field("Цвет", `skills.${index}.color`, item.color || "#858ce8", { type: "color" })}
                ${field("URL иконки (необязательно)", `skills.${index}.iconUrl`, item.iconUrl || "", { wide: true, placeholder: "assets/images/icon.png или https://…" })}
                ${field("Показывать на сайте", `skills.${index}.visible`, item.visible, { type: "checkbox" })}
            </div></div></details>`).join("") || '<p class="empty-state">Навыков пока нет.</p>'}</div>`;
}

function renderLinks() {
    return `${sectionHeading("Кнопки и ссылки", "Первая видимая ссылка используется как главная контактная кнопка. Остальные выводятся рядом как дополнительные.", "кнопку")}
        <div class="compact-list">${content.links.map((link, index) => `<details class="compact-row"><summary class="compact-summary"><span class="row-order">${index + 1}</span><span class="row-title"><strong>${escapeHtml(link.label?.ru || link.label?.en || "Без подписи")}</strong><small>${escapeHtml(link.href || "Ссылка не задана")}</small></span>${moveButtons("links", index, index, content.links.length)}</summary><div class="row-edit-fields"><div class="field-grid">
                ${localizedFields(`links.${index}.label`, typeof link.label === "object" ? link.label : { ru: link.label || "", en: link.label || "" }, { ru: "Подпись", en: "Label" })}
                ${field("Адрес", `links.${index}.href`, link.href || "", { wide: true, placeholder: "https://…" })}
                ${field("URL иконки (необязательно)", `links.${index}.iconUrl`, link.iconUrl || "", { wide: true, placeholder: "assets/images/icon.svg или https://…" })}
                ${field("Показывать на сайте", `links.${index}.visible`, link.visible, { type: "checkbox" })}
            </div></div></details>`).join("") || '<p class="empty-state">Кнопок пока нет.</p>'}</div>`;
}

function renderSection() {
    document.querySelectorAll(".editor-tab").forEach(button => {
        button.classList.toggle("active", button.dataset.section === activeSection);
    });
    const isContent = activeSection === "content";
    document.querySelectorAll(".editor-tab").forEach(button => button.setAttribute("aria-selected", String(button.dataset.section === activeSection)));
    editorContent.innerHTML = isContent
        ? renderProjects()
        : `<nav class="collection-tabs" aria-label="Разделы метаданных">${[["texts", "Информация"], ["companies", "Компании"], ["skills", "Навыки"], ["links", "Кнопки и ссылки"]].map(([key, label]) => `<button class="collection-tab${activeCollection === key ? " active" : ""}" type="button" data-collection="${key}">${label}</button>`).join("")}</nav>${({ texts: renderTexts, companies: renderCompanies, skills: renderSkills, links: renderLinks })[activeCollection]()}`;
    activateVisibleVideoPreviews();
}

function activateVisibleVideoPreviews() {
    previewObserver?.disconnect();
    const videos = editorContent.querySelectorAll(".project-thumb video");
    if (!("IntersectionObserver" in window)) {
        videos.forEach(video => {
            video.preload = "metadata";
            video.play().catch(() => {});
        });
        return;
    }
    previewObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.preload = "metadata";
                entry.target.play().catch(() => {});
            } else {
                entry.target.pause();
            }
        }
    }, { rootMargin: "120px 0px", threshold: 0.1 });
    videos.forEach(video => previewObserver.observe(video));
}

function setPath(path, value) {
    const parts = path.split(".");
    let target = content;
    for (const part of parts.slice(0, -1)) target = target[part];
    target[parts.at(-1)] = value;
}

function addItem() {
    if (activeSection === "content") {
        const tab = "motion";
        const order = sortedProjects(tab).length;
        content.projects.push({ id: `project-${Date.now()}`, tab, src: "", order, visible: true });
    } else if (activeSection === "meta" && activeCollection === "companies") {
        content.companies.push({ names: { ru: "", en: "" }, mark: "", color: "#5962a4", textColor: "#ffffff", iconUrl: "", visible: true });
    } else if (activeSection === "meta" && activeCollection === "skills") {
        content.skills.push({ name: "", names: { ru: "", en: "" }, color: "#858ce8", iconUrl: "", visible: true });
    } else if (activeSection === "meta" && activeCollection === "links") {
        content.links.push({ label: { ru: "", en: "" }, href: "", iconUrl: "", visible: true });
    }
    markDirty();
    renderSection();
    editorContent.querySelector(".compact-row:last-of-type")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function removeItem(kind, key) {
    const items = content[kind];
    const index = kind === "projects" ? items.findIndex(item => item.id === key) : Number(key);
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    if (kind === "projects") {
        sortedProjects("motion").forEach((item, order) => { item.order = order; });
        sortedProjects("modeling").forEach((item, order) => { item.order = order; });
    }
    markDirty();
    renderSection();
}

function moveItem(kind, key, direction) {
    const items = content[kind];
    if (kind === "projects") {
        const item = items.find(project => project.id === key);
        if (!item) return;
        const group = sortedProjects(item.tab);
        const index = group.indexOf(item);
        const target = index + direction;
        if (target < 0 || target >= group.length) return;
        [group[index], group[target]] = [group[target], group[index]];
        group.forEach((project, order) => { project.order = order; });
    } else {
        const index = Number(key);
        const target = index + direction;
        if (target < 0 || target >= items.length) return;
        [items[index], items[target]] = [items[target], items[index]];
    }
    markDirty();
    renderSection();
}

function validateContent(value) {
    for (const lang of languages) {
        for (const [key, label] of textFields) {
            if (typeof value.texts[lang][key] !== "string") throw new Error(`${label}: заполните текст на ${lang.toUpperCase()}.`);
        }
    }
    const ids = new Set();
    for (const project of value.projects) {
        if (!project.id || !project.src?.trim() || !["motion", "modeling"].includes(project.tab)) {
            throw new Error("У каждого проекта должны быть ID, путь/URL файла и вкладка.");
        }
        if (/^javascript:/i.test(project.src.trim())) throw new Error("Недопустимый адрес файла проекта.");
        if (ids.has(project.id)) throw new Error(`Повторяется ID проекта: ${project.id}`);
        ids.add(project.id);
    }
    for (const link of value.links) {
        if (!link.href?.trim()) throw new Error("У каждой кнопки должен быть адрес. Удалите пустые кнопки или заполните ссылку.");
        if (/^javascript:/i.test(link.href.trim())) throw new Error("Недопустимый адрес кнопки.");
    }
}

async function loadContent() {
    reloadButton.disabled = true;
    showMessage(saveMessage, "Загружаю данные…");
    try {
        const response = await fetch("../assets-manifest.json", { cache: "no-store" });
        if (!response.ok) throw new Error("manifest unavailable");
        mediaManifest = await response.json();
    } catch {
        mediaManifest = [];
    }
    try {
        const snapshot = await getDoc(documentRef);
        documentExists = snapshot.exists();
        content = normalizeContent(documentExists ? snapshot.data() : portfolioDefaults);
        reconcileMedia();
        dirty = manifestChanged;
        renderSection();
        showMessage(saveMessage, manifestChanged
            ? "Каталог Git изменился: сохраните его, чтобы обновить список портфолио в Firestore."
            : documentExists
            ? "Данные загружены. Все изменения будут опубликованы после сохранения."
            : "В базе ещё нет контента: показаны текущие данные портфолио. Первое сохранение создаст документ.");
    } catch (error) {
        content = normalizeContent(portfolioDefaults);
        reconcileMedia();
        dirty = manifestChanged;
        renderSection();
        const message = error.code === "permission-denied"
            ? "Firestore отклонил чтение portfolio/public. Откройте gant-design → Firestore Database → Rules, опубликуйте актуальные правила и проверьте, что выбрана база (default)."
            : `Не удалось загрузить данные из Firestore (${error.code || "ошибка сети"}).`;
        showMessage(saveMessage, message, true);
    } finally {
        reloadButton.disabled = false;
    }
}

function reconcileMedia() {
    manifestChanged = false;
    if (!mediaManifest.length) {
        manifestStatus = "Каталог Git недоступен — можно редактировать текущие проекты вручную.";
        return;
    }
    const available = new Set(mediaManifest.map(item => item.src));
    const before = content.projects.length;
    content.projects = content.projects.filter(project => !project.src?.startsWith("assets/videos/") || !/\.(mp4|webm|mov|avi|mkv)$/i.test(project.src) || available.has(project.src));
    const removed = before - content.projects.length;
    const used = new Set(content.projects.map(project => project.src));
    let added = 0;
    for (const media of mediaManifest) {
        if (used.has(media.src)) continue;
        const id = `asset-${media.src.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
        content.projects.push({ id, src: media.src, tab: media.suggestedTab, order: sortedProjects(media.suggestedTab).length, visible: false });
        used.add(media.src);
        added++;
    }
    manifestChanged = Boolean(added || removed);
    manifestStatus = `Git: ${mediaManifest.length} видео · добавлено ${added} · удалено ${removed}. Новые файлы скрыты до включения.`;
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
        const message = error.code === "auth/invalid-credential" ? "Неверный email или пароль."
            : error.code === "auth/too-many-requests" ? "Слишком много попыток. Попробуйте позже."
                : "Не удалось войти. Проверьте данные и настройки Firebase Authentication.";
        showMessage(loginMessage, message, true);
    } finally {
        button.disabled = false;
    }
});

onAuthStateChanged(auth, async user => {
    loginPanel.hidden = Boolean(user);
    editorPanel.hidden = !user;
    if (!user) return;
    document.querySelector("#userLabel").textContent = `Вы вошли как ${user.email || "администратор"}`;
    await loadContent();
});

document.querySelector("#logoutButton").addEventListener("click", () => signOut(auth));
reloadButton.addEventListener("click", loadContent);
document.querySelectorAll(".editor-tab").forEach(button => button.addEventListener("click", () => {
    activeSection = button.dataset.section;
    renderSection();
}));

editorContent.addEventListener("click", event => {
    const collectionTab = event.target.closest("[data-collection]");
    if (collectionTab) {
        activeCollection = collectionTab.dataset.collection;
        renderSection();
        return;
    }
    if (event.target.closest(".item-controls")) event.preventDefault();
});

editorContent.addEventListener("dragstart", event => {
    const row = event.target.closest(".project-row");
    if (!row) return;
    draggedProjectId = row.dataset.projectId;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", draggedProjectId);
    row.classList.add("is-dragging");
});
editorContent.addEventListener("dragover", event => {
    const row = event.target.closest(".project-row");
    if (!row || row.dataset.projectId === draggedProjectId) return;
    event.preventDefault();
    row.classList.add("drop-target");
});
editorContent.addEventListener("dragleave", event => event.target.closest(".project-row")?.classList.remove("drop-target"));
editorContent.addEventListener("drop", event => {
    const targetRow = event.target.closest(".project-row");
    if (!targetRow || !draggedProjectId) return;
    event.preventDefault();
    const dragged = content.projects.find(item => item.id === draggedProjectId);
    const target = content.projects.find(item => item.id === targetRow.dataset.projectId);
    if (!dragged || !target) return;
    const previousTab = dragged.tab;
    const group = sortedProjects(target.tab);
    const oldIndex = group.indexOf(dragged);
    if (oldIndex >= 0) group.splice(oldIndex, 1);
    const targetIndex = group.indexOf(target);
    dragged.tab = target.tab;
    group.splice(targetIndex, 0, dragged);
    group.forEach((item, order) => { item.order = order; });
    if (previousTab !== target.tab) sortedProjects(previousTab).forEach((item, order) => { item.order = order; });
    draggedProjectId = "";
    markDirty();
    renderSection();
});
editorContent.addEventListener("dragend", () => {
    draggedProjectId = "";
    editorContent.querySelectorAll(".is-dragging, .drop-target").forEach(row => row.classList.remove("is-dragging", "drop-target"));
});

editorContent.addEventListener("input", event => {
    const control = event.target.closest("[data-path]");
    if (!control || control.type === "checkbox") return;
    setPath(control.dataset.path, control.value);
    markDirty();
});

editorContent.addEventListener("change", event => {
    const orderInput = event.target.closest("[data-project-order]");
    if (orderInput) {
        const project = content.projects.find(item => item.id === orderInput.dataset.projectOrder);
        if (!project) return;
        const group = sortedProjects(project.tab);
        const current = group.indexOf(project);
        const target = Math.max(0, Math.min(group.length - 1, Number(orderInput.value) - 1));
        group.splice(current, 1);
        group.splice(target, 0, project);
        group.forEach((item, order) => { item.order = order; });
        markDirty();
        renderSection();
        return;
    }
    const control = event.target.closest("[data-path]");
    if (!control) return;
    setPath(control.dataset.path, control.type === "checkbox" ? control.checked : control.value);
    markDirty();
    if (control.dataset.path.endsWith(".tab")) renderSection();
});

editorContent.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    if (button.dataset.action === "add") addItem();
    if (button.dataset.action === "remove") removeItem(button.dataset.kind, button.dataset.key);
    if (button.dataset.action === "move") moveItem(button.dataset.kind, button.dataset.key, Number(button.dataset.direction));
});

saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    try {
        validateContent(content);
        await setDoc(documentRef, { ...content, updatedAt: serverTimestamp() });
        documentExists = true;
        dirty = false;
        showMessage(saveMessage, "Сохранено — обновите портфолио, чтобы увидеть изменения.");
    } catch (error) {
        const message = error.code === "permission-denied"
            ? "Запись запрещена. Убедитесь, что правила Firestore опубликованы и UID совпадает с аккаунтом."
            : error.message || "Не удалось сохранить данные.";
        showMessage(saveMessage, message, true);
    } finally {
        saveButton.disabled = false;
    }
});

window.addEventListener("beforeunload", event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
});
