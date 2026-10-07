# Шаблон: движок портфолио

План переноса CMS-портфолио на новый сайт. Это стартовая архитектура, не универсальная библиотека: оставляй только нужные разделы и расширяй по реальным требованиям проекта.

Папка `engine/` содержит переносимые исходники, не только описание. Скопируй её в корень нового сайта и создай `engine/config.js` из `engine/config.example.js`. Публичную отрисовку и конкретные поля CMS подключи к своим страницам: они зависят от дизайна нового портфолио.

### Что лежит в engine/

- `portfolio-engine.js` — Firestore read с fallback на defaults, Firebase Auth sign-in/sign-out и защищённый UX-вызов сохранения.
- `portfolio-engine.js` экспортирует `bootstrapPortfolio()`: ждёт Firebase read, рендерит данные и только потом раскрывает страницу.
- `public-loader.css` — полноэкранное loading-состояние, скрытие контента до готовности и reduced-motion вариант спиннера.
- `firebase-client.js`, `config.example.js` — инициализация Firebase.
- `defaults.example.js` — пример начальных данных.
- `admin.html`, `admin.css`, `admin.js` — минимальная рабочая CMS с входом владельца и JSON-редактором; используй как стартовую админку или как каркас для UI с плитками.
- `firestore.rules.example`, `firebase.json.example` — правила доступа и базовая конфигурация хостинга.
- `media.config.example.mjs`, `generate-media-manifest.mjs` — папки медиа и генератор JSON-каталога.
- `firebase-hosting.yml.example` — заготовка GitHub Actions для deploy.

Для первого запуска скопируй `defaults.example.js` как `defaults.js`, `config.example.js` как `config.js`, `firestore.rules.example` в корень как `firestore.rules`, `firebase.json.example` в корень как `firebase.json`, а workflow в `.github/workflows/firebase-hosting.yml`. Замени все значения `REPLACE_WITH_...` до deploy. Открой `engine/admin.html` для CMS.

Подключение публичного модуля после копирования defaults как `engine/defaults.js`. В HTML загрузчик должен стоять сразу, а весь динамический контент помести в `data-portfolio-content` с начальным `data-loading`. Не рендери defaults заранее отдельным вызовом: bootstrap сначала прочитает Firestore, затем вызовет render и покажет страницу.

```js
import { portfolioDefaults } from "./engine/defaults.js";
import { bootstrapPortfolio } from "./engine/portfolio-engine.js";

await bootstrapPortfolio({
  defaults: portfolioDefaults,
  contentElement: document.querySelector("[data-portfolio-content]"),
  loadingElement: document.querySelector("[data-portfolio-loader]"),
  render: content => renderPortfolio(content), // функция под дизайн конкретного сайта
});
```

Разметка загрузчика: `<div data-portfolio-loader role="status" aria-live="polite"><span class="portfolio-loading-spinner" aria-hidden="true"></span><span>Loading portfolio…</span></div>`. Подключи `public-loader.css`. `bootstrapPortfolio()` снимает `data-loading` и скрывает спиннер только после рендера. При успешном запросе первым виден Firestore-контент; при отсутствии документа или ошибке чтения `loadPortfolio()` отдаёт defaults и страница показывает их после рендера.

CMS подключает `observeAdmin`, `signInAdmin`, `signOutAdmin` и `savePortfolio` из `portfolio-engine.js`; UI редактора остаётся проектным.

## Базовая схема

1. **Публичная страница** — статические HTML/CSS/JS. Она читает опубликованные данные, отбрасывает `visible: false` и не имеет прав записи.
2. **Defaults и нормализация** — начальное содержимое и заполнение отсутствующих необязательных полей, чтобы обновление схемы не ломало старый документ.
3. **CMS** — Firebase Auth для входа, редактор данных, проверка обязательных значений и запись опубликованного документа.
4. **Firestore Rules** — анонимному посетителю только `get` публичного документа; `list` запрещён; запись только авторизованному UID владельца.
5. **Каталог медиа** — CI сканирует папку файлов и генерирует JSON manifest. CMS добавляет новые файлы скрытыми и обнаруживает удалённые. Изменения записей Firestore применяются после явного сохранения владельцем.
6. **Хостинг и CI** — один явно выбранный production branch, автоматическое создание manifest, публикация сайта и правил доступа. Секрет service account хранится только в GitHub Actions secrets.

## Минимальная модель данных

```js
{
  texts: { ru: {}, en: {} },
  links: [{ id, label: { ru, en }, href, visible: true, order: 0 }],
  projects: [{ id, src, category, visible: false, order: 0 }]
}
```

Добавляй компании, навыки, описания, теги и другие поля только если они нужны макету. Используй стабильные `id`, отдельный `order` внутри группы, проверяй обязательные поля и запрещай опасные URL-схемы вроде `javascript:`. Реши заранее, хранит CMS один компактный документ или отдельные записи в коллекциях.

## Чеклист нового проекта

1. Зафиксировать секции и дизайн нового сайта. Не переносить старые поля, если новый сайт их не использует.
2. Подготовить defaults с данными нового владельца и связать их со всеми видимыми блоками страницы.
3. Создать отдельный Firebase project: Web App config, Firestore, Email/Password Auth и пользователя-владельца.
4. Настроить Firestore Rules. Заменить admin UID и проверить: публичное чтение работает, анонимная запись запрещена, запись владельца проходит.
5. Подстроить CMS под фактическую схему. Сортировка должна иметь drag-and-drop и доступные кнопки перемещения как альтернативу.
6. Выбрать media origin. Картинки можно хостить вместе с сайтом. Для больших файлов использовать CDN/object storage или GitHub Raw для небольшого старта, учитывая публичность, лимиты и отсутствие CDN-гарантий.
7. Если каталог файлов строится из Git, добавить CI-скрипт manifest и проверить, что каталог публикуется. Исключать файлы из Firebase deploy только если они действительно доступны на внешнем media origin.
8. Добавить workflow для нужной production-ветки, Firebase project/site ID и secret `FIREBASE_SERVICE_ACCOUNT`. Не помещать ключи service account или object storage в frontend или Git.
9. Настроить локаль/маршруты так, чтобы `/ru` и `/en` открывались напрямую и переживали refresh без ненужного редиректа на `index.html?lang=...`.
10. Проверить end-to-end: при замедленном Firestore первым виден loader, дефолтный HTML не мелькает; после чтения отображаются данные базы; нет документа/ошибка чтения → defaults только после попытки; вход владельца → загрузка/редактирование/сохранение; посетитель → только публичное чтение; скрытая плитка → нет запроса медиа; добавленный/удалённый Git-файл → обновление manifest и списка; deploy → свежая версия видна в индикаторе сайта.

## Что заменить при переносе текущей реализации

| Настройка | Файлы исходного проекта |
| --- | --- |
| Firebase project/Web config | `firebase-config.js`, workflow |
| UID владельца и имя документа | `firestore.rules`, `login/admin.js`, `portfolio-public.js` |
| GitHub repository/branch для Raw media | `script.js`, `login/admin.js` |
| production branch и Firebase project ID | `.github/workflows/firebase-hosting.yml` |
| папки, типы и расширения файлов | `scripts/generate-assets-manifest.mjs` |
| URL rewrites и исключения Firebase Hosting | `firebase.json` |
| начальная схема данных и визуальное отображение | `portfolio-defaults.js`, `script.js`, `login/admin.js` |
| версия сайта при релизе | workflow `Stamp deployment version` и version marker в `index.html` |

## Ограничения и возможные расширения

- Git-based media не даёт загрузку файлов непосредственно в CMS. Это экономит на Firebase Storage, но требует доступа к Git. Для прямой загрузки нужен доверенный backend/Worker, проверяющий Firebase ID token и выдающий временный URL для конкретного объекта.
- GitHub Raw подходит для прототипа и небольшого портфолио, но не гарантирует поведение production CDN. При росте трафика можно сменить только media origin, оставив CMS и модель данных.
- Один документ Firestore прост для небольшого сайта, но при больших массивах или нескольких редакторах может потребоваться разбиение данных и контроль конфликтующих изменений.
- Полезные дальнейшие улучшения по запросу: черновики и preview, история публикаций, миграции схемы, проверка допустимых доменов, оптимизация/транскодирование медиа.

Сначала переносить работающий минимальный вариант. Не добавлять Storage, сложный backend или универсальную систему плагинов, пока этого не требуют реальные задачи.
