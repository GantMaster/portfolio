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
        video.muted = false;
        video.loop = true;
        video.playsInline = true;
        video.controlsList = 'nodownload nofullscreen noremoteplayback';
        video.disablePictureInPicture = true;
        video.setAttribute('oncontextmenu', 'return false;');
        video.setAttribute('ondragstart', 'return false;');
        
        // Клик для воспроизведения/паузы
        video.addEventListener('click', function() {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });
        
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
