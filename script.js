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
        video.preload = 'metadata'; // Загружаем метаданные и первый кадр
        video.controlsList = 'nodownload nofullscreen noremoteplayback';
        video.disablePictureInPicture = true;
        video.setAttribute('oncontextmenu', 'return false;');
        video.setAttribute('ondragstart', 'return false;');
        
        // Создаем превью из первого кадра
        const thumbnail = document.createElement('img');
        thumbnail.className = 'video-thumbnail';
        thumbnail.style.cssText = 'width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; z-index: 1;';
        thumbnail.setAttribute('oncontextmenu', 'return false;');
        thumbnail.setAttribute('ondragstart', 'return false;');
        thumbnail.draggable = false;
        
        // Создаем превью при загрузке метаданных
        video.addEventListener('loadedmetadata', function() {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                video.currentTime = 0.1;
            }
        }, { once: true });
        
        video.addEventListener('seeked', function() {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 1080;
                canvas.height = video.videoHeight || 1920;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                thumbnail.src = canvas.toDataURL('image/jpeg', 0.8);
            } catch (e) {
                console.log('Не удалось создать превью:', e);
                // Если не удалось создать превью, просто скрываем его
                thumbnail.style.display = 'none';
            }
        }, { once: true });
        
        // Fallback: если видео загрузилось, но превью не создалось
        video.addEventListener('loadeddata', function() {
            if (!thumbnail.src && video.readyState >= 2) {
                // Пытаемся создать превью еще раз
                setTimeout(() => {
                    if (video.videoWidth > 0) {
                        video.currentTime = 0.1;
                    }
                }, 100);
            }
        }, { once: true });
        
        // Показываем превью, скрываем при воспроизведении
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.zIndex = '2';
        
        // Клик для воспроизведения/паузы
        const playPause = function() {
            if (video.paused) {
                video.play().then(() => {
                    thumbnail.style.opacity = '0';
                    video.muted = false; // Включаем звук при воспроизведении
                }).catch(() => {
                    // Если автоплей заблокирован, просто показываем превью
                });
            } else {
                video.pause();
                thumbnail.style.opacity = '1';
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
            thumbnail.style.opacity = '1';
            thumbnail.style.pointerEvents = 'auto';
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
