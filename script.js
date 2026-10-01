document.addEventListener('DOMContentLoaded', () => {

    // Запоминаем реальный адрес страницы ДО того, как переключение языка
    // подменит его в адресной строке на /en/ или /ru/ — иначе все
    // относительные пути к видео/картинкам (они добавляются в DOM позже)
    // начнут резолвиться от несуществующей папки /en/ и ломаться.
    const SITE_BASE = document.baseURI;

    const LANG_KEY = 'site_lang';
    const translations = {
        ru: {
            pageTitle: 'Портфолио — Максим Аскеров', portfolio: 'Портфолио',
            telegram: 'Написать в Telegram', name: 'Максим Аскеров',
            role: '3D Motion Designer · 4+ года опыта',
            introDescription: 'Ролики и креативы для игр, приложений и брендов, 3D-моделирование и анимация.',
            workedWith: 'Работал с', skills: 'Навыки', motion: 'Моушндизайн & Креативы', modeling: 'Моделирование',
        },
        en: {
            pageTitle: 'Portfolio — Maxim Askerov', portfolio: 'Portfolio',
            telegram: 'Message me on Telegram', name: 'Maxim Askerov',
            role: '3D Motion Designer · 4+ years of experience',
            introDescription: 'Videos and creatives for games, apps and brands, 3D modeling and animation.',
            workedWith: 'Worked with', skills: 'Skills', motion: 'Motion Design & Creatives', modeling: '3D Modeling',
        },
    };

    const urlLang = new URLSearchParams(location.search).get('lang');
    let currentLang = translations[urlLang]
        ? urlLang
        : (translations[localStorage.getItem(LANG_KEY)] ? localStorage.getItem(LANG_KEY) : 'ru');
    const languageMenu = document.querySelector('.language-menu');
    const languageCurrent = document.querySelector('.language-current');
    const languageOptions = document.querySelector('.language-options');
    const languageButtons = [...document.querySelectorAll('.language-option[data-lang], .mobile-language-button[data-lang]')];
    const hoverLanguageMenu = window.matchMedia('(hover: hover) and (pointer: fine)');
    let languageCloseTimer = 0;

    // Если попали сюда через редирект-заглушку /en/ или /ru/ (там урл на
    // мгновение превращается в index.html?lang=en) — сразу же приводим
    // адресную строку обратно к красивому /en/, без ?lang=.
    if (urlLang === 'en' || urlLang === 'ru') {
        updateUrlForLang(urlLang);
    }

    function applyLanguage(lang) {
        currentLang = translations[lang] ? lang : 'ru';
        const dictionary = translations[currentLang];
        document.documentElement.lang = currentLang;
        document.title = dictionary.pageTitle;
        localStorage.setItem(LANG_KEY, currentLang);

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const text = dictionary[el.dataset.i18n];
            if (text !== undefined) el.textContent = text;
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const title = dictionary[el.dataset.i18nTitle];
            if (title !== undefined) el.title = title;
        });

        const currentLanguageLabel = document.querySelector('[data-current-language]');
        const currentLanguageFlag = document.querySelector('[data-current-flag]');
        if (currentLanguageLabel) currentLanguageLabel.textContent = currentLang.toUpperCase();
        if (currentLanguageFlag) currentLanguageFlag.className = `language-flag language-flag-${currentLang}`;

        languageButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    }

    // Переводит адресную строку в /en/ или /ru/, чтобы ссылку можно было
    // сразу скопировать и отправить — работает только на главной странице,
    // т.к. только для неё заведены редирект-заглушки /en/ и /ru/.
    function updateUrlForLang(lang) {
        try {
            let path = location.pathname.replace(/\/(en|ru)\/?$/, '/').replace(/index\.html$/, '');
            if (!path.endsWith('/')) path += '/';
            history.replaceState(null, '', path + lang + '/' + location.hash);
        } catch {}
    }

    function closeLanguageMenu() {
        if (!languageOptions || !languageCurrent) return;
        languageOptions.hidden = true;
        languageCurrent.setAttribute('aria-expanded', 'false');
    }

    function openLanguageMenu() {
        if (!languageOptions || !languageCurrent) return;
        languageOptions.hidden = false;
        languageCurrent.setAttribute('aria-expanded', 'true');
    }

    languageCurrent?.addEventListener('click', event => {
        if (!languageOptions) return;
        if (hoverLanguageMenu.matches && event.detail > 0) return;
        const isOpen = languageCurrent.getAttribute('aria-expanded') === 'true';
        if (isOpen) closeLanguageMenu();
        else openLanguageMenu();
    });

    languageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            applyLanguage(btn.dataset.lang);
            updateUrlForLang(currentLang);
            closeLanguageMenu();
        });
    });

    languageMenu?.addEventListener('pointerenter', () => {
        if (!hoverLanguageMenu.matches) return;
        window.clearTimeout(languageCloseTimer);
        openLanguageMenu();
    });

    languageMenu?.addEventListener('pointerleave', () => {
        if (!hoverLanguageMenu.matches) return;
        languageCloseTimer = window.setTimeout(closeLanguageMenu, 140);
    });

    document.addEventListener('click', event => {
        const target = event.target instanceof Element ? event.target : null;
        if (languageMenu && target && !languageMenu.contains(target)) closeLanguageMenu();
    });

    languageMenu?.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeLanguageMenu();
            languageCurrent?.focus();
        }
    });

    applyLanguage(currentLang);

    const siteHeader = document.querySelector('.site-header');
    const headerSentinel = document.querySelector('.header-sentinel');
    if (siteHeader && headerSentinel) {
        const headerObserver = new IntersectionObserver(([entry]) => {
            siteHeader.classList.toggle('is-scrolled', !entry.isIntersecting);
        }, { threshold: 0 });
        headerObserver.observe(headerSentinel);
    }

    const backgroundCanvas = document.getElementById('procedural-bg');
    const backgroundContext = backgroundCanvas?.getContext('2d');
    if (backgroundCanvas && backgroundContext) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const coarsePointer = window.matchMedia('(pointer: coarse)');
        const pointer = { x: -1000, y: -1000, influence: 0 };
        const pointerFlow = { x: 0, y: 0 };
        const pointerTarget = { x: -1000, y: -1000, active: false };
        let width = 0;
        let height = 0;
        let frame = 0;
        let startedAt = performance.now();
        let lastFrame = 0;
        let lastDrawAt = 0;
        let touchContact = false;
        let touchReleaseTimer = 0;
        let clickReleaseTimer = 0;
        let clickImpulse = 0;
        let clickImpulseTarget = 0;
        let pointerInitialized = false;

        function resizeBackground() {
            cancelAnimationFrame(frame);
            frame = 0;
            const ratio = Math.min(window.devicePixelRatio || 1, 1);
            width = window.innerWidth;
            height = window.innerHeight;
            backgroundCanvas.width = Math.round(width * ratio);
            backgroundCanvas.height = Math.round(height * ratio);
            backgroundContext.setTransform(ratio, 0, 0, ratio, 0, 0);

            const sideSpace = Math.max(18, (width - Math.min(width - 48, 1400)) * 0.5);
            const topSpace = Math.min(height * 0.08, 38);
            drawBackground(performance.now(), false);
            if (!reducedMotion.matches && document.visibilityState === 'visible') {
                frame = requestAnimationFrame(drawBackground);
            }
        }

        const cursorOffset = { x: 0, y: 0 };

        function getCursorOffset(x, y, radius, strength) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const distance = Math.hypot(dx, dy);
            const normalizedDistance = distance / radius;
            const airEnvelope = Math.exp(-2.2 * normalizedDistance * normalizedDistance)
                * (1 - Math.exp(-distance / (radius * 0.14)));
            const airflow = airEnvelope * strength * pointer.influence;
            const clickPush = airEnvelope * strength * 0.55 * clickImpulse;
            cursorOffset.x = pointerFlow.x * airflow + (distance ? dx / distance * clickPush : 0);
            cursorOffset.y = pointerFlow.y * airflow + (distance ? dy / distance * clickPush : 0);
            return cursorOffset;
        }

        function drawMotionTrails(time, sideSpace) {
            const context = backgroundContext;
            const mobile = coarsePointer.matches;
            const sampleCount = mobile ? 32 : 48;
            const lanePositions = mobile ? [0.18, 0.54, 0.9] : [0.13, 0.37, 0.63, 0.87];
            const laneCount = lanePositions.length;
            const lanePosition = lane => lanePositions[lane];
            const bendScale = mobile ? 0.12 : 0.08;
            const reactionRadius = mobile
                ? Math.max(190, width * 0.58)
                : Math.max(150, Math.min(230, height * 0.22));
            const reactionStrength = mobile ? 16 : 34;
            context.lineWidth = mobile ? 0.85 : 0.75;
            for (let side = 0; side < 2; side++) {
                for (let lane = 0; lane < laneCount; lane++) {
                    context.beginPath();
                    for (let sample = 0; sample <= sampleCount; sample++) {
                        const progress = sample / sampleCount;
                        const y = progress * height;
                        const baseBend = Math.sin(progress * 7 + time * 0.12 + lane * 1.45) * sideSpace * bendScale;
                        const baseX = side === 0
                            ? sideSpace * lanePosition(lane) + baseBend
                            : width - sideSpace * lanePosition(lane) - baseBend;
                        const offset = getCursorOffset(baseX, y, reactionRadius, reactionStrength);
                        const x = baseX + offset.x;
                        const shiftedY = y + offset.y;
                        if (sample === 0) context.moveTo(x, shiftedY);
                        else context.lineTo(x, shiftedY);
                    }
                    context.strokeStyle = `rgba(126, 136, 216, ${Math.max(0.052, 0.095 - lane * 0.012)})`;
                    context.stroke();

                }
            }

            context.beginPath();
            for (let side = 0; side < 2; side++) {
                for (let lane = 0; lane < laneCount; lane++) {
                    const progress = (time * 0.018 + lane * 0.29) % 1;
                    const bend = Math.sin(progress * 7 + time * 0.12 + lane * 1.45) * sideSpace * bendScale;
                    const inset = sideSpace * lanePosition(lane) + bend;
                    const baseX = side === 0 ? inset : width - inset;
                    const baseY = progress * height;
                    const offset = getCursorOffset(baseX, baseY, reactionRadius, reactionStrength);
                    const x = baseX + offset.x;
                    const y = baseY + offset.y;
                    context.moveTo(x + 1.1, y);
                    context.arc(x, y, 1.1, 0, Math.PI * 2);
                }
            }
            context.fillStyle = 'rgba(151, 160, 224, 0.19)';
            context.fill();

        }

        function drawProceduralBackground(time) {
            const context = backgroundContext;
            const sideSpace = Math.max(18, (width - Math.min(width - 48, 1400)) * 0.5);
            const topSpace = Math.min(height * 0.08, 38);
            context.save();
            context.beginPath();
            context.rect(0, 0, sideSpace, height);
            context.rect(width - sideSpace, 0, sideSpace, height);
            context.rect(0, 0, width, topSpace);
            context.rect(0, height - topSpace, width, topSpace);
            context.clip();

            drawMotionTrails(time, sideSpace);
            context.restore();
        }

        function drawBackground(now, scheduleNextFrame = true) {
            const maxFps = coarsePointer.matches ? 20 : 24;
            if (scheduleNextFrame && !reducedMotion.matches && now - lastDrawAt < 1000 / maxFps) {
                frame = requestAnimationFrame(drawBackground);
                return;
            }
            lastDrawAt = now;
            const time = reducedMotion.matches ? 0 : (now - startedAt) / 1000;
            const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 0.05) : 0;
            lastFrame = now;
            const positionEase = 1 - Math.exp(-delta * 4.2);
            const previousX = pointer.x;
            const previousY = pointer.y;
            pointer.influence += ((pointerTarget.active ? 1 : 0) - pointer.influence) * (1 - Math.exp(-delta * 3.2));
            pointer.x += (pointerTarget.x - pointer.x) * positionEase;
            pointer.y += (pointerTarget.y - pointer.y) * positionEase;
            const flowEase = 1 - Math.exp(-delta * 7);
            let flowTargetX = delta ? (pointer.x - previousX) / delta / 700 : 0;
            let flowTargetY = delta ? (pointer.y - previousY) / delta / 700 : 0;
            const flowTargetLength = Math.hypot(flowTargetX, flowTargetY);
            if (flowTargetLength > 1) {
                flowTargetX /= flowTargetLength;
                flowTargetY /= flowTargetLength;
            }
            pointerFlow.x += (flowTargetX - pointerFlow.x) * flowEase;
            pointerFlow.y += (flowTargetY - pointerFlow.y) * flowEase;
            const impulseEase = 1 - Math.exp(-delta * (clickImpulseTarget > clickImpulse ? 5 : 2.4));
            clickImpulse += (clickImpulseTarget - clickImpulse) * impulseEase;
            backgroundContext.clearRect(0, 0, width, height);

            drawProceduralBackground(time);
            frame = 0;
            if (scheduleNextFrame && !reducedMotion.matches && document.visibilityState === 'visible') {
                frame = requestAnimationFrame(drawBackground);
            }
        }

        window.addEventListener('pointermove', event => {
            if (reducedMotion.matches) return;
            if (event.pointerType === 'touch' && !touchContact) return;
            if (!pointerInitialized) {
                pointer.x = event.clientX;
                pointer.y = event.clientY;
                pointerInitialized = true;
            }
            pointerTarget.x = event.clientX;
            pointerTarget.y = event.clientY;
            pointerTarget.active = true;
        }, { passive: true });

        window.addEventListener('pointerdown', event => {
            if (reducedMotion.matches) return;
            if (event.pointerType === 'touch') {
                touchContact = true;
                window.clearTimeout(touchReleaseTimer);
            } else {
                if (event.button !== 0) return;
            }
            if (!pointerInitialized) {
                pointer.x = event.clientX;
                pointer.y = event.clientY;
                pointerInitialized = true;
            }
            window.clearTimeout(clickReleaseTimer);
            clickImpulseTarget = event.pointerType === 'touch' ? 0.65 : 0.85;
            clickReleaseTimer = window.setTimeout(() => {
                clickImpulseTarget = 0;
            }, 180);
            pointerTarget.x = event.clientX;
            pointerTarget.y = event.clientY;
            pointerTarget.active = true;
        }, { passive: true });

        const releaseTouchPointer = event => {
            if (event.pointerType !== 'touch') return;
            touchContact = false;
            touchReleaseTimer = window.setTimeout(() => {
                pointerTarget.active = false;
            }, 180);
        };
        window.addEventListener('pointerup', releaseTouchPointer, { passive: true });
        window.addEventListener('pointercancel', releaseTouchPointer, { passive: true });

        window.addEventListener('pointerout', event => {
            if (event.pointerType !== 'touch' && event.relatedTarget === null) pointerTarget.active = false;
        }, { passive: true });

        window.addEventListener('resize', resizeBackground, { passive: true });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                cancelAnimationFrame(frame);
                frame = 0;
            } else if (!reducedMotion.matches && !frame) {
                frame = requestAnimationFrame(drawBackground);
            }
        });
        reducedMotion.addEventListener?.('change', () => {
            cancelAnimationFrame(frame);
            frame = 0;
            if (!reducedMotion.matches && document.visibilityState === 'visible') {
                frame = requestAnimationFrame(drawBackground);
            } else {
                drawBackground(performance.now());
            }
        });

        resizeBackground();
    }

    // =========================

    let motionFiles = [
        'assets/videos/15.mp4', 'assets/videos/5.mp4',
        'assets/videos/8.mp4',
        'assets/videos/17.mp4','assets/videos/3.mp4', 'assets/videos/18.mp4',
        'assets/videos/7.mp4',
        'assets/videos/16.mp4','assets/videos/6.mp4','assets/videos/9.mp4','assets/videos/2.mp4','assets/videos/1.mp4','assets/videos/4.mp4',
        'assets/videos/10.mp4','assets/images/3.jpg','assets/images/4.jpg','assets/images/1.jpg',
    ];

    let modelingFiles = [
        'assets/images/modeling/chest.jpg',
        'assets/images/modeling/cherep.jpg',
        'assets/images/modeling/budka.jpg',
        'assets/images/modeling/zhuk.jpg',
        'assets/images/modeling/starik.jpg',
        'assets/images/modeling/tykva2.jpg',
        'assets/images/modeling/lampa.jpg',
        'assets/images/modeling/avatar.jpg',
        'assets/images/modeling/Robot.jpg',
        'assets/videos/modeling/maska.mp4',
        'assets/images/modeling/koza.jpg',
        'assets/images/modeling/twitch.jpg',
        'assets/images/modeling/zhabka.jpg',
        'assets/images/modeling/malchik.jpg',
    ];

    const videoGrid = document.getElementById('videoGrid');
    let currentTab = 'motion';
    let activeVideo = null;

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    if (!videoGrid) {
        console.error('videoGrid not found');
        return;
    }

    // =========================
    // HELPERS
    // =========================

    function isVideoFile(filename) {
        return ['.mp4','.webm','.mov','.avi','.mkv']
            .some(ext => filename.toLowerCase().endsWith(ext));
    }

    function isImageFile(filename) {
        return ['.png','.jpg','.jpeg','.gif','.webp','.svg']
            .some(ext => filename.toLowerCase().endsWith(ext));
    }

    function hasPlayIcon(filename) {
        return ['.mp4', '.webm', '.mov']
            .some(ext => filename.toLowerCase().endsWith(ext));
    }

    function pauseOtherVideos(currentVideo) {
        videoGrid.querySelectorAll('video').forEach(v => {
            if (v !== currentVideo && !v.paused) v.pause();
        });
    }

    function setPlayIconVisible(playIcon, visible) {
        if (playIcon) playIcon.classList.toggle('hidden', !visible);
    }

    // =========================
    // MEDIA CREATION
    // =========================

    function createMediaItems(files, isSquare = false) {
        videoGrid.innerHTML = '';
        videoGrid.classList.toggle('square-grid', isSquare);
        activeVideo = null;

        files.forEach(mediaFile => {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'video-item';

            // Создаём индикатор загрузки
            const loader = document.createElement('div');
            loader.className = 'media-loader';
            const spinner = document.createElement('div');
            spinner.className = 'media-loader-spinner';
            loader.appendChild(spinner);
            mediaItem.appendChild(loader);

            // ---------- VIDEO ----------
            if (isVideoFile(mediaFile)) {
                const video = document.createElement('video');
                video.src = new URL(mediaFile, SITE_BASE).href;
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.preload = 'metadata';
                video.controls = false;
                video.controlsList = 'nodownload nofullscreen noremoteplayback';
                video.disablePictureInPicture = true;

                video.style.cssText = `
                    position:absolute;
                    inset:0;
                    z-index:1;
                    opacity:0.7;
                `;

                const thumbnail = document.createElement('div');
                thumbnail.className = 'video-thumbnail';
                thumbnail.style.cssText = `
                    position:absolute;
                    inset:0;
                    z-index:2;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:linear-gradient(135deg,#1a1a1a,#2a2a2a);
                `;

                const thumbImg = document.createElement('img');
                thumbImg.style.cssText = `
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    opacity:0;
                    transition:opacity .3s;
                `;
                thumbnail.appendChild(thumbImg);

                const playIcon = hasPlayIcon(mediaFile) ? document.createElement('div') : null;
                if (playIcon) {
                    playIcon.className = 'video-play-icon';
                    playIcon.setAttribute('aria-hidden', 'true');
                    const playShape = document.createElement('span');
                    playShape.className = 'video-play-icon-shape';
                    playIcon.appendChild(playShape);
                }

                let poster = null;
                let hasPlayed = false;

                function createPoster() {
                    if (!video.videoWidth) return;
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth * 0.5;
                        canvas.height = video.videoHeight * 0.5;
                        canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
                        poster = canvas.toDataURL('image/jpeg',0.7);
                        thumbImg.src = poster;
                        thumbImg.style.opacity = '1';
                        video.style.opacity = '0';
                        video.poster = poster;
                    } catch {
                        thumbnail.remove();
                        video.style.opacity = '1';
                    }
                }

                video.addEventListener('loadedmetadata', () => {
                    video.currentTime = 0.05;
                    // Скрываем индикатор загрузки когда метаданные загружены
                    loader.classList.add('hidden');
                    // В режиме "водопада" (моделирование) все слои внутри видео абсолютно
                    // спозиционированы, поэтому карточке нужно явно задать пропорции кадра
                    if (isSquare && video.videoWidth && video.videoHeight) {
                        mediaItem.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
                    }
                }, { once:true });

                // Обработка ошибок загрузки
                video.addEventListener('error', () => {
                    loader.classList.add('hidden');
                }, { once:true });

                video.addEventListener('seeked', createPoster, { once:true });

                // ---------- PLAY/PAUSE + Z-INDEX + FINAL FIX ----------
                function togglePlay() {
                    if (video.paused) {
                        pauseOtherVideos(video);
                        video.play().then(() => {
                            hasPlayed = true;
                            activeVideo = video;
                            video.style.zIndex = '3';
                            thumbnail.style.zIndex = '2';
                            thumbImg.style.opacity = '0';
                            video.style.opacity = '1';
                            video.muted = false;
                            setPlayIconVisible(playIcon, false);
                        });
                    } else {
                        video.pause();
                        if (activeVideo === video) activeVideo = null;
                        setPlayIconVisible(playIcon, true);
                        // превью показываем только если видео ещё не воспроизведено
                        if (!hasPlayed) {
                            video.style.zIndex = '1';
                            thumbnail.style.zIndex = '2';
                            thumbImg.style.opacity = '1';
                            video.style.opacity = '0';
                        }
                    }
                }

                video.addEventListener('click', togglePlay);
                thumbnail.addEventListener('click', togglePlay);

                video.addEventListener('play', () => {
                    pauseOtherVideos(video);
                    activeVideo = video;
                    video.style.zIndex = '3';
                    thumbnail.style.zIndex = '2';
                    thumbImg.style.opacity = '0';
                    video.style.opacity = '1';
                    setPlayIconVisible(playIcon, false);
                });

                video.addEventListener('pause', () => {
                    if (activeVideo === video) activeVideo = null;
                    setPlayIconVisible(playIcon, true);
                    if (!hasPlayed) {
                        video.style.zIndex = '1';
                        thumbnail.style.zIndex = '2';
                        thumbImg.style.opacity = '1';
                        video.style.opacity = '0';
                    }
                    // если hasPlayed = true, оставляем последний кадр и не показываем превью
                });

                mediaItem.append(thumbnail, video);
                if (playIcon) mediaItem.appendChild(playIcon);
            }

            // ---------- IMAGE ----------
            else if (isImageFile(mediaFile)) {
                const img = document.createElement('img');
                img.src = new URL(mediaFile, SITE_BASE).href;
                img.alt = mediaFile;

                img.style.cssText = isSquare
                    ? 'width:100%;height:auto;display:block;'
                    : 'width:100%;height:100%;object-fit:cover;';

                // Скрываем индикатор загрузки когда изображение загружено
                img.addEventListener('load', () => {
                    loader.classList.add('hidden');
                }, { once:true });

                // Обработка ошибок загрузки
                img.addEventListener('error', () => {
                    loader.classList.add('hidden');
                }, { once:true });

                img.addEventListener('click', () => openImageModal(mediaFile));
                mediaItem.appendChild(img);
            }

            videoGrid.appendChild(mediaItem);
        });
    }

    // =========================
    // TABS
    // =========================

    const VALID_TABS = ['motion', 'modeling'];

    function getTabFromHash() {
        const hash = location.hash.slice(1);
        return VALID_TABS.includes(hash) ? hash : 'motion';
    }

    function switchTab(tab) {
        if (!VALID_TABS.includes(tab)) tab = 'motion';
        currentTab = tab;

        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        if (tab === 'motion') createMediaItems(motionFiles, false);
        if (tab === 'modeling') createMediaItems(modelingFiles, true);
    }

    function renderMetaItems(container, items, type, lang) {
        if (!container) return;
        container.replaceChildren();
        items.filter(item => item.visible !== false).forEach(item => {
            const chip = document.createElement('span');
            chip.className = type === 'company' ? 'company-chip' : 'skill-dot-tag';
            if (type === 'company') {
                const logo = document.createElement('span');
                logo.className = 'company-chip-logo';
                logo.style.backgroundColor = item.color || '#5962a4';
                if (item.textColor) logo.style.color = item.textColor;
                if (item.iconUrl) {
                    const icon = document.createElement('img');
                    icon.src = item.iconUrl;
                    icon.alt = '';
                    icon.loading = 'lazy';
                    logo.replaceChildren(icon);
                } else logo.textContent = item.mark || item.name || '?';
                chip.append(logo, document.createTextNode(item.names?.[lang] || item.name || ''));
            } else {
                const dot = document.createElement('span');
                dot.className = 'skill-dot';
                dot.style.backgroundColor = item.color || '#858ce8';
                if (item.iconUrl) {
                    const icon = document.createElement('img');
                    icon.src = item.iconUrl;
                    icon.alt = '';
                    icon.loading = 'lazy';
                    dot.replaceChildren(icon);
                }
                chip.append(dot, document.createTextNode(item.names?.[lang] || item.name || ''));
            }
            container.appendChild(chip);
        });
    }

    function renderCustomLinks(links, lang) {
        const mainLink = document.querySelector('.header-actions > .contact-btn');
        const footerLink = document.querySelector('.footer-link');
        const extraLinks = document.getElementById('custom-links');
        const visible = links.filter(link => link.visible !== false);
        if (mainLink) mainLink.hidden = visible.length === 0;
        if (footerLink) {
            footerLink.hidden = visible.length === 0;
            if (visible[0]) {
                footerLink.href = visible[0].href || '#';
                footerLink.textContent = visible[0].label?.[lang] || visible[0].label || visible[0].href || 'Link';
            }
        }
        if (mainLink && visible[0]) {
            mainLink.href = visible[0].href || '#';
            const label = mainLink.querySelector('[data-i18n="telegram"]');
            if (label) label.textContent = visible[0].label?.[lang] || visible[0].label || visible[0].href || 'Link';
            const telegramIcon = mainLink.querySelector('.contact-btn-icon');
            let customIcon = mainLink.querySelector('.custom-button-icon');
            if (visible[0].iconUrl && label) {
                if (!customIcon) {
                    customIcon = document.createElement('img');
                    customIcon.className = 'custom-button-icon';
                    customIcon.alt = '';
                    customIcon.loading = 'lazy';
                    label.before(customIcon);
                }
                customIcon.src = visible[0].iconUrl;
                if (telegramIcon) telegramIcon.hidden = true;
            } else {
                customIcon?.remove();
                if (telegramIcon) telegramIcon.hidden = false;
            }
        }
        if (!extraLinks) return;
        extraLinks.replaceChildren();
        visible.slice(1).forEach(link => {
            const anchor = document.createElement('a');
            anchor.className = 'contact-btn custom-contact-btn';
            anchor.href = link.href || '#';
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            const label = link.label?.[lang] || link.label || link.href || 'Link';
            anchor.setAttribute('aria-label', label);
            anchor.title = label;
            if (link.iconUrl) {
                const icon = document.createElement('img');
                icon.src = link.iconUrl;
                icon.alt = '';
                icon.loading = 'lazy';
                anchor.prepend(icon);
            } else {
                const mark = document.createElement('span');
                mark.className = 'custom-link-mark';
                mark.setAttribute('aria-hidden', 'true');
                mark.textContent = '↗';
                anchor.appendChild(mark);
            }
            const text = document.createElement('span');
            text.className = 'custom-link-label';
            text.textContent = label;
            anchor.appendChild(text);
            extraLinks.appendChild(anchor);
        });
    }

    document.addEventListener('portfolio:content', event => {
        const content = event.detail;
        if (!content || !content.texts || !Array.isArray(content.projects)) return;
        window.__portfolioContent = content;
        ['ru', 'en'].forEach(lang => {
            const text = content.texts[lang];
            if (!text) return;
            Object.assign(translations[lang], {
                pageTitle: text.pageTitle ?? translations[lang].pageTitle,
                name: text.name ?? translations[lang].name,
                role: text.role ?? translations[lang].role,
                introDescription: text.description ?? translations[lang].introDescription,
                workedWith: text.workedWith ?? translations[lang].workedWith,
                skills: text.skills ?? translations[lang].skills,
                motion: text.motion ?? translations[lang].motion,
                modeling: text.modeling ?? translations[lang].modeling,
            });
            const firstLink = content.links?.find(link => link.visible !== false);
            if (firstLink) translations[lang].telegram = firstLink.label?.[lang] || firstLink.label || translations[lang].telegram;
        });
        if (Array.isArray(content.companies)) renderMetaItems(document.querySelector('.company-row'), content.companies, 'company', currentLang);
        if (Array.isArray(content.skills)) renderMetaItems(document.querySelector('.skill-row'), content.skills, 'skill', currentLang);
        const projects = content.projects.filter(project => project.visible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        motionFiles = projects.filter(project => project.tab === 'motion').map(project => project.src);
        modelingFiles = projects.filter(project => project.tab === 'modeling').map(project => project.src);
        applyLanguage(currentLang);
        if (Array.isArray(content.links)) renderCustomLinks(content.links, currentLang);
        switchTab(currentTab);
    });

    if (window.__loadedPortfolioContent) {
        document.dispatchEvent(new CustomEvent('portfolio:content', { detail: window.__loadedPortfolioContent }));
    }

    document.addEventListener('portfolio:language', event => {
        const content = window.__portfolioContent;
        if (!content) return;
        if (Array.isArray(content.companies)) renderMetaItems(document.querySelector('.company-row'), content.companies, 'company', event.detail);
        if (Array.isArray(content.skills)) renderMetaItems(document.querySelector('.skill-row'), content.skills, 'skill', event.detail);
        if (Array.isArray(content.links)) renderCustomLinks(content.links, event.detail);
    });

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const tab = btn.dataset.tab;
            if (location.hash !== `#${tab}`) {
                location.hash = tab;
            } else {
                switchTab(tab);
            }
        });
    });

    window.addEventListener('hashchange', () => switchTab(getTabFromHash()));

    switchTab(getTabFromHash());

    // =========================
    // MODAL
    // =========================

    const imageModal = document.getElementById('imageModal');
    const imageModalImg = document.getElementById('imageModalImg');

    function openImageModal(src) {
        imageModalImg.src = new URL(src, SITE_BASE).href;
        imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeImageModal() {
        imageModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    document.getElementById('imageModalClose')?.addEventListener('click', closeImageModal);
    imageModal?.querySelector('.image-modal-backdrop')?.addEventListener('click', closeImageModal);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && imageModal.classList.contains('active')) {
            closeImageModal();
        }
    });

});
