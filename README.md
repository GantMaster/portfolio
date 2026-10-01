# GantMaster Portfolio

Статичное двуязычное портфолио с Firebase CMS. README фиксирует архитектуру и принятые решения, чтобы основу можно было перенести на следующий сайт без повторного расследования.

## Архитектура

- `index.html`, `style.css`, `script.js` — публичный сайт без сборщика и backend-сервера.
- `portfolio-defaults.js` — начальные данные и запасной контент.
- `portfolio-public.js` — читает `portfolio/public` из Firestore; если документа нет или база недоступна, сайт использует defaults.
- `login/` — CMS с входом через Firebase Authentication (email/password) и редактированием данных Firestore.
- `firestore.rules` — посетителям разрешено читать только документ `portfolio/public`; запись разрешена только вошедшему администратору с заданным UID.
- `assets-manifest.json` — генерируемый в CI каталог медиа для CMS, не редактируется вручную.
- `assets/images/` и небольшие статические ресурсы публикуются в Firebase Hosting. `assets/videos/**` исключён из деплоя Firebase.

## Медиа

Видео хранятся в Git в `assets/videos/`, а посетителям отдаются напрямую с GitHub Raw. `script.js` строит URL вида `https://raw.githubusercontent.com/GantMaster/portfolio/feature/portfolio-refresh/assets/videos/...`. Для нового проекта необходимо заменить владельца, репозиторий и ветку в URL-логике публичного сайта и CMS. GitHub Raw удобен как бесплатный старт, но не является гарантированным CDN.

В CI `scripts/generate-assets-manifest.mjs` рекурсивно сканирует `assets/videos/` и создаёт manifest. CMS сверяет его с Firestore: новые файлы добавляются скрытыми, отсутствующие в Git видео удаляются из списка проектов. Чтобы применить найденные изменения каталога, владелец сохраняет их из CMS. Публичный сайт отбрасывает элементы `visible: false` до создания медиаблоков; видео подгружаются лениво по приближении к экрану.

Добавление видео: положить файл в `assets/videos/`, запушить production-ветку, открыть CMS, назначить вкладку и порядок, включить показ и сохранить. Удаление: удалить файл из Git, запушить, открыть CMS и сохранить обновлённый каталог. CMS не загружает медиа в Firebase Storage.

## Данные CMS

Firestore хранит один документ `portfolio/public`: `texts.ru/en` для текстов, массивы `companies`, `skills`, `links` для метаданных и `projects` для медиа-плиток. Проект содержит `id`, `src`, `tab` (`motion`/`modeling`), `order`, `visible`. Сохранение CMS записывает документ целиком. Встроенные defaults позволяют сайту работать до первого сохранения и при временной ошибке чтения.

Первый экран ждёт чтения Firestore: статичная HTML-разметка с начальными текстами и цветами скрыта, пока `portfolio:content` не обновит UI. Поэтому пользователь не видит мигания старых цветов/текстов перед данными базы. Если документ отсутствует или чтение завершается ошибкой, после попытки показываются defaults как fallback; это не означает, что CMS сохранила их в Firestore.

В CMS редактор разделён на вкладки «Мета» и «Контент». Медиа показаны компактной адаптивной сеткой с drag-and-drop, номером порядка и кнопками перемещения; превью не запускаются до приближения к области просмотра. Сохранение закреплено справа по центру экрана на desktop и переносится вниз на узком экране.

## Деплой и безопасность

Workflow `.github/workflows/firebase-hosting.yml` публикует live Hosting и Firestore Rules при push в `feature/portfolio-refresh`; `main` сейчас не деплоится. Workflow генерирует manifest и ставит версию сайта по номеру запуска CI. Для GitHub Actions нужен secret `FIREBASE_SERVICE_ACCOUNT` с JSON ключом сервисного аккаунта. Не коммитить его. Firebase Web config в `firebase-config.js` публичен по назначению; защиту обеспечивают Authentication и Firestore Rules.

Настройка Firebase описана в [FIREBASE_SETUP.md](FIREBASE_SETUP.md). Для следующего сайта использовать [шаблон движка портфолио](templates/portfolio-engine/README.md).

Важное при переносе: заменить Firebase project config, admin UID в Firestore Rules, имя документа при необходимости, GitHub repository/branch для Raw media, deploy branch/project ID в workflow, hostname, media folders/extensions и defaults. Публичную регистрацию в CMS не включать. `debug.log` — локальный Firebase CLI лог; он игнорируется Git.

## Проверки

- После правок запускать `git diff --check` и проверять соответствующий сценарий в браузере.
- Для deploy проверять каждый шаг Actions: Hosting и Firestore Rules публикуются отдельными операциями.
- Проверять прямой вход и обновление страниц `/ru` и `/en`.
- Проверять, что скрытые медиа не запрашиваются публичным сайтом, а новые/удалённые файлы обнаруживаются manifest-ом.
