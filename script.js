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
        video.preload = 'metadata'; // Быстрее загружаем только метаданные
        video.controlsList = 'nodownload nofullscreen noremoteplayback';
        video.disablePictureInPicture = true;
        video.setAttribute('oncontextmenu', 'return false;');
        video.setAttribute('ondragstart', 'return false;');
        
        // Показываем видео сразу с низкой непрозрачностью
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.zIndex = '1';
        video.style.opacity = '0.3'; // Показываем видео сразу, но полупрозрачно
        
        // Создаем элемент превью (будет показываться поверх видео)
        const thumbnail = document.createElement('div');
        thumbnail.className = 'video-thumbnail';
        thumbnail.style.cssText = 'width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 2; background: transparent; display: flex; align-items: center; justify-content: center;';
        
        // Создаем превью изображение внутри
        const thumbnailImg = document.createElement('img');
        thumbnailImg.style.cssText = 'width: 100%; height: 100%; object-fit: cover; display: block; opacity: 0; transition: opacity 0.3s ease;';
        thumbnailImg.setAttribute('oncontextmenu', 'return false;');
        thumbnailImg.setAttribute('ondragstart', 'return false;');
        thumbnailImg.draggable = false;
        thumbnail.appendChild(thumbnailImg);
        
        let posterDataUrl = null;
        let hasPlayed = false;
        
        // Функция для создания превью (быстрая версия)
        const createPoster = function() {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                try {
                    const canvas = document.createElement('canvas');
                    // Используем меньший размер для быстрого создания
                    const scale = 0.5; // Уменьшаем размер для скорости
                    canvas.width = Math.floor(video.videoWidth * scale);
                    canvas.height = Math.floor(video.videoHeight * scale);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    posterDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    thumbnailImg.src = posterDataUrl;
                    thumbnailImg.style.opacity = '1'; // Показываем превью
                    video.style.opacity = '0'; // Скрываем видео
                    video.poster = posterDataUrl;
                } catch (e) {
                    // Если canvas не работает, показываем видео напрямую
                    thumbnail.style.display = 'none';
                    video.style.opacity = '1';
                }
            }
        };
        
        // Быстрое создание превью при загрузке метаданных
        video.addEventListener('loadedmetadata', function() {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                // Сразу пытаемся получить первый кадр
                video.currentTime = 0.05; // Очень маленькое значение для скорости
            }
        }, { once: true });
        
        video.addEventListener('seeked', createPoster, { once: true });
        
        // Fallback: если не удалось создать превью быстро
        video.addEventListener('loadeddata', function() {
            if (!posterDataUrl && video.readyState >= 2 && video.videoWidth > 0) {
                // Пытаемся еще раз создать превью
                video.currentTime = 0.05;
            } else if (!posterDataUrl) {
                // Если превью не создалось, показываем видео напрямую
                thumbnail.style.display = 'none';
                video.style.opacity = '1';
            }
        }, { once: true });
        
        // Клик для воспроизведения/паузы
        const playPause = function() {
            if (video.paused) {
                video.play().then(() => {
                    hasPlayed = true;
                    thumbnailImg.style.opacity = '0';
                    thumbnail.style.pointerEvents = 'none';
                    video.style.opacity = '1';
                    video.muted = false; // Включаем звук при воспроизведении
                }).catch(() => {
                    // Если автоплей заблокирован
                });
            } else {
                video.pause();
                if (posterDataUrl) {
                    thumbnailImg.style.opacity = '1';
                    thumbnail.style.pointerEvents = 'auto';
                    video.style.opacity = '0';
                }
            }
        };
        
        video.addEventListener('click', playPause);
        thumbnail.addEventListener('click', playPause);
        
        // Скрываем превью когда видео играет
        video.addEventListener('play', function() {
            thumbnailImg.style.opacity = '0';
            thumbnail.style.pointerEvents = 'none';
            video.style.opacity = '1';
        });
        
        video.addEventListener('pause', function() {
            if (hasPlayed && posterDataUrl) {
                thumbnailImg.style.opacity = '1';
                thumbnail.style.pointerEvents = 'auto';
                video.style.opacity = '0';
            }
        });
        
        // Если превью не создалось, показываем видео через небольшую задержку
        setTimeout(() => {
            if (!posterDataUrl && video.readyState >= 1) {
                thumbnail.style.display = 'none';
                video.style.opacity = '1';
            }
        }, 500);
        
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
