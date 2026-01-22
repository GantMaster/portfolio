document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // ДАННЫЕ
    // =========================

    const motionFiles = [
        '5.mp4','8.mp4','7.mp4','3.jpg','4.jpg','1.jpg',
        '3.mp4','9.mp4','6.mp4','2.mp4','1.mp4','4.mp4',
        '10.mp4','12.mp4','13.mp4','11.mp4',
    ];

    const modelingFiles = [
        '1(1).jpg','2(1).jpg','7.jpg','8.jpg','9.jpg','11.jpg',
        '6.jpg','5.jpg','5(1).jpg','14.mp4','10.jpg','3(1).jpg',
    ];

    const videoGrid = document.getElementById('videoGrid');
    let currentTab = 'motion';

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

    // =========================
    // MEDIA CREATION
    // =========================

    function createMediaItems(files, isSquare = false) {
        videoGrid.innerHTML = '';
        videoGrid.classList.toggle('square-grid', isSquare);

        // Показываем loader
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.remove('hidden');
        }

        let loadedCount = 0;
        const totalFiles = files.length;

        // Если файлов нет, сразу скрываем loader
        if (totalFiles === 0 && loader) {
            loader.classList.add('hidden');
            return;
        }

        function checkAllLoaded() {
            loadedCount++;
            if (loadedCount >= totalFiles && loader) {
                // Небольшая задержка для плавности
                setTimeout(() => {
                    loader.classList.add('hidden');
                }, 300);
            }
        }

        files.forEach(mediaFile => {
            const mediaItem = document.createElement('div');
            mediaItem.className = 'video-item';

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
                }, { once:true });

                video.addEventListener('seeked', createPoster, { once:true });

                // Отслеживаем загрузку видео
                video.addEventListener('loadeddata', checkAllLoaded, { once: true });
                video.addEventListener('error', checkAllLoaded, { once: true });

                // ---------- PLAY/PAUSE + Z-INDEX + FINAL FIX ----------
                function togglePlay() {
                    if (video.paused) {
                        video.play().then(() => {
                            hasPlayed = true;
                            video.style.zIndex = '3';
                            thumbnail.style.zIndex = '2';
                            thumbImg.style.opacity = '0';
                            video.style.opacity = '1';
                            video.muted = false;
                        });
                    } else {
                        video.pause();
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
                    video.style.zIndex = '3';
                    thumbnail.style.zIndex = '2';
                    thumbImg.style.opacity = '0';
                    video.style.opacity = '1';
                });

                video.addEventListener('pause', () => {
                    if (!hasPlayed) {
                        video.style.zIndex = '1';
                        thumbnail.style.zIndex = '2';
                        thumbImg.style.opacity = '1';
                        video.style.opacity = '0';
                    }
                    // если hasPlayed = true, оставляем последний кадр и не показываем превью
                });

                mediaItem.append(thumbnail, video);
            }

            // ---------- IMAGE ----------
            else if (isImageFile(mediaFile)) {
                const img = document.createElement('img');
                img.src = mediaFile;
                img.alt = mediaFile;

                img.style.cssText = isSquare
                    ? 'height:100%;width:auto;object-fit:contain;'
                    : 'width:100%;height:100%;object-fit:cover;';

                // Отслеживаем загрузку изображения
                img.addEventListener('load', checkAllLoaded, { once: true });
                img.addEventListener('error', checkAllLoaded, { once: true });

                img.addEventListener('click', () => openImageModal(mediaFile));
                mediaItem.appendChild(img);
            }

            videoGrid.appendChild(mediaItem);
        });
    }

    // =========================
    // TABS
    // =========================

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            if (currentTab === 'motion') createMediaItems(motionFiles,false);
            if (currentTab === 'modeling') createMediaItems(modelingFiles,true);
        });
    });

    createMediaItems(motionFiles,false);

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
