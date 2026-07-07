document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // ДАННЫЕ
    // =========================

    const motionFiles = [
        '15.mp4', '5.mp4', 
        '8.mp4',
        '17.mp4','3.mp4', '18.mp4',
        '7.mp4',
        '16.mp4','6.mp4','9.mp4','2.mp4','1.mp4','4.mp4',
        '10.mp4','3.jpg','4.jpg','1.jpg',
    ];

    const modelingFiles = [
        'modeling/chest.jpg',
        'modeling/cherep.jpg',
        'modeling/budka.jpg',
        'modeling/zhuk.jpg',
        'modeling/starik.jpg',
        'modeling/tykva2.jpg',
        'modeling/lampa.jpg',
        'modeling/avatar.jpg',
        'modeling/Robot.jpg',
        'modeling/maska.mp4',
        'modeling/koza.jpg',
        'modeling/twitch.jpg',
        'modeling/zhabka.jpg',
        'modeling/malchik.jpg',
    ];

    const videoGrid = document.getElementById('videoGrid');
    let currentTab = 'motion';
    let activeVideo = null;

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
                video.src = mediaFile;
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
                img.src = mediaFile;
                img.alt = mediaFile;

                img.style.cssText = isSquare
                    ? 'height:100%;width:auto;object-fit:contain;'
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
        imageModalImg.src = src;
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
