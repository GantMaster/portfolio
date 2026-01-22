document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // ДАННЫЕ
    // =========================

    const motionFiles = [
        '5.mp4','8.mp4','7.mp4','3.png','4.png','1.png',
        '3.mp4','9.mp4','6.mp4','2.mp4','1.mp4','4.mp4',
        '10.mp4','12.mp4','13.mp4','11.mp4',
    ];

    const modelingFiles = [
        '1.jpg','2.jpg','7.jpg','8.jpg','9.jpg','11.jpg',
        '6.jpg','5.jpg','5.png','14.mp4','10.jpg','3.jpg',
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

                function togglePlay() {
                    if (video.paused) {
                        video.play().then(() => {
                            hasPlayed = true;
                            thumbImg.style.opacity = '0';
                            video.style.opacity = '1';
                            video.muted = false;
                        });
                    } else {
                        video.pause();
                        if (poster) {
                            thumbImg.style.opacity = '1';
                            video.style.opacity = '0';
                        }
                    }
                }

                video.addEventListener('click', togglePlay);
                thumbnail.addEventListener('click', togglePlay);

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
            document.querySelectorAll('.tab-button')
                .forEach(b => b.classList.remove('active'));

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
    imageModal?.querySelector('.image-modal-backdrop')
        ?.addEventListener('click', closeImageModal);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && imageModal.classList.contains('active')) {
            closeImageModal();
        }
    });

});
