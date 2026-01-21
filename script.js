// Список медиа файлов (видео и изображения)
const mediaFiles = [
    '5.mp4',
    '8.mp4',
    '7.mp4',
    '3.png',
    '4.png',
    '1.png',
    '3.mp4',
    '9.mp4',
    '6.mp4',
    '2.mp4',
    '1.mp4',
    '4.mp4',
    '10.mp4',
    '12.mp4',
    '13.mp4',
    '11.mp4',
    
];

const videoGrid = document.getElementById('videoGrid');

// Проверяем тип файла
function isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

function isImageFile(filename) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

// Создаем элементы медиа
mediaFiles.forEach(mediaFile => {
    const mediaItem = document.createElement('div');
    mediaItem.className = 'video-item';
    
    if (isVideoFile(mediaFile)) {
        // Создаем видео элемент
        const video = document.createElement('video');
        video.src = mediaFile;
        video.controls = false;
        video.muted = true; // Muted для автозагрузки на мобильных
        video.loop = true;
        video.playsInline = true;
        video.preload = 'auto'; // Загружаем видео полностью для показа первого кадра
        video.controlsList = 'nodownload nofullscreen noremoteplayback';
        video.disablePictureInPicture = true;
        video.setAttribute('oncontextmenu', 'return false;');
        video.setAttribute('ondragstart', 'return false;');
        
        // Создаем элемент превью (будет показываться поверх видео)
        const thumbnail = document.createElement('div');
        thumbnail.className = 'video-thumbnail';
        thumbnail.style.cssText = 'width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 2; background: #000; display: flex; align-items: center; justify-content: center;';
        
        // Создаем превью изображение внутри
        const thumbnailImg = document.createElement('img');
        thumbnailImg.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block;';
        thumbnailImg.setAttribute('oncontextmenu', 'return false;');
        thumbnailImg.setAttribute('ondragstart', 'return false;');
        thumbnailImg.draggable = false;
        thumbnail.appendChild(thumbnailImg);
        
        let posterDataUrl = null;
        let hasPlayed = false;
        
        // Функция для создания превью
        const createPoster = function() {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    posterDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    thumbnailImg.src = posterDataUrl;
                    video.poster = posterDataUrl;
                } catch (e) {
                    // Если canvas не работает (например, в Telegram браузере)
                    // Показываем видео с preload="auto" и используем первый кадр
                    video.preload = 'auto';
                    // Показываем черный экран с индикатором загрузки
                    thumbnail.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)';
                }
            }
        };
        
        // Пытаемся создать превью при загрузке метаданных
        video.addEventListener('loadedmetadata', function() {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                video.currentTime = 0.1;
            } else {
                // Если метаданные не загрузились, пробуем загрузить видео полностью
                video.preload = 'auto';
            }
        }, { once: true });
        
        video.addEventListener('seeked', createPoster, { once: true });
        
        // Fallback: если не удалось создать превью
        video.addEventListener('loadeddata', function() {
            if (!posterDataUrl && video.readyState >= 2) {
                setTimeout(() => {
                    if (video.videoWidth > 0) {
                        video.currentTime = 0.1;
                    } else {
                        // Если видео не загружается, показываем placeholder
                        thumbnail.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)';
                    }
                }, 300);
            }
        }, { once: true });
        
        // Показываем превью, скрываем при воспроизведении
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.zIndex = '1';
        
        // Клик для воспроизведения/паузы
        const playPause = function() {
            if (video.paused) {
                video.play().then(() => {
                    hasPlayed = true;
                    thumbnail.style.opacity = '0';
                    thumbnail.style.pointerEvents = 'none';
                    video.muted = false; // Включаем звук при воспроизведении
                }).catch(() => {
                    // Если автоплей заблокирован
                });
            } else {
                video.pause();
                thumbnail.style.opacity = '1';
                thumbnail.style.pointerEvents = 'auto';
            }
        };
        
        video.addEventListener('click', playPause);
        thumbnail.addEventListener('click', playPause);
        
        // Скрываем превью когда видео играет
        video.addEventListener('play', function() {
            thumbnail.style.opacity = '0';
            thumbnail.style.pointerEvents = 'none';
        });
        
        video.addEventListener('pause', function() {
            if (hasPlayed) {
                thumbnail.style.opacity = '1';
                thumbnail.style.pointerEvents = 'auto';
            }
        });
        
        // Если видео загрузилось и готово к воспроизведению, но превью не создалось
        video.addEventListener('canplay', function() {
            if (!posterDataUrl && !hasPlayed) {
                // Показываем видео напрямую, если превью не создалось
                // Устанавливаем первый кадр как превью
                try {
                    video.currentTime = 0;
                    setTimeout(() => {
                        if (video.readyState >= 2) {
                            const canvas = document.createElement('canvas');
                            canvas.width = video.videoWidth || 1080;
                            canvas.height = video.videoHeight || 1920;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                            thumbnailImg.src = dataUrl;
                            posterDataUrl = dataUrl;
                        } else {
                            // Если не получилось, просто скрываем превью и показываем видео
                            thumbnail.style.opacity = '0';
                        }
                    }, 100);
                } catch (e) {
                    // Если canvas не работает, просто скрываем превью
                    thumbnail.style.opacity = '0';
                }
            }
        });
        
        // Дополнительная проверка - если видео загрузилось, но превью нет
        video.addEventListener('loadeddata', function() {
            if (!posterDataUrl && video.readyState >= 2 && video.videoWidth > 0) {
                setTimeout(() => {
                    if (!posterDataUrl) {
                        // Пытаемся еще раз создать превью
                        video.currentTime = 0.1;
                    }
                }, 500);
            }
        });
        
        mediaItem.appendChild(thumbnail);
        mediaItem.appendChild(video);
    } else if (isImageFile(mediaFile)) {
        // Создаем изображение
        const img = document.createElement('img');
        img.src = mediaFile;
        img.alt = mediaFile;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.setAttribute('oncontextmenu', 'return false;');
        img.setAttribute('ondragstart', 'return false;');
        img.draggable = false;
        mediaItem.appendChild(img);
    }
    
    videoGrid.appendChild(mediaItem);
});

// Блокировка правой кнопки мыши и других способов скачивания
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// Блокировка выделения текста
document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
});

// Блокировка перетаскивания
document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
});

// Блокировка горячих клавиш (Ctrl+S, Ctrl+P и т.д.)
document.addEventListener('keydown', function(e) {
    // Блокируем Ctrl+S (сохранение)
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
    }
    // Блокируем Ctrl+P (печать)
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        return false;
    }
    // Блокируем F12 (DevTools)
    if (e.key === 'F12') {
        e.preventDefault();
        return false;
    }
    // Блокируем Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
    }
    // Блокируем Ctrl+Shift+C (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
    }
    // Блокируем Ctrl+U (просмотр исходного кода)
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
    }
});
