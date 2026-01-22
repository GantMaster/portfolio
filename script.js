// Список медиа файлов для первой вкладки (Моушндизайн & Креативы)
const motionFiles = [
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

// Список медиа файлов для второй вкладки (Моделирование)
// Добавьте свои файлы для моделирования сюда
const modelingFiles = [
    '1.jpg',
    '2.jpg',
    '7.jpg',
    '8.jpg',
    '9.jpg',
    '11.jpg',
    '6.jpg',
    '5.jpg',
    '5.png',
    '14.mp4',
    '10.jpg',
    '3.jpg',
    

];

const videoGrid = document.getElementById('videoGrid');
let currentTab = 'motion';

// Проверяем тип файла
function isVideoFile(filename) {
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

function isImageFile(filename) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
}

// Функция для создания медиа элементов
function createMediaItems(files, isSquare = false) {
    // Очищаем сетку
    videoGrid.innerHTML = '';
    
    // Меняем класс сетки в зависимости от типа
    if (isSquare) {
        videoGrid.classList.add('square-grid');
    } else {
        videoGrid.classList.remove('square-grid');
    }
    
    files.forEach(mediaFile => {
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
        
        // Показываем видео сразу с большей непрозрачностью
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.zIndex = '1';
        video.style.opacity = '0.7'; // Показываем видео сразу, более видимо
        
        // Создаем элемент превью (будет показываться поверх видео)
        const thumbnail = document.createElement('div');
        thumbnail.className = 'video-thumbnail';
        thumbnail.style.cssText = 'width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 2; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); display: flex; align-items: center; justify-content: center;';
        
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
        
        // Для квадратной сетки - растягиваем по высоте с пустотами по бокам
        if (isSquare) {
            img.style.width = 'auto';
            img.style.height = '100%';
            img.style.maxWidth = '100%';
            img.style.objectFit = 'contain';
        } else {
            // Для вертикальной сетки - как обычно
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
        }
        
        img.style.cursor = 'pointer';
        img.setAttribute('oncontextmenu', 'return false;');
        img.setAttribute('ondragstart', 'return false;');
        img.draggable = false;
        
        // Обработчик клика для открытия в полноэкранном режиме
        img.addEventListener('click', function() {
            openImageModal(mediaFile);
        });
        
        mediaItem.appendChild(img);
    }
    
    videoGrid.appendChild(mediaItem);
    });
}

// Переключение вкладок
const tabButtons = document.querySelectorAll('.tab-button');
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const tab = this.getAttribute('data-tab');
        
        // Убираем активный класс у всех кнопок
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // Добавляем активный класс текущей кнопке
        this.classList.add('active');
        
        // Сохраняем текущую вкладку
        currentTab = tab;
        
        // Загружаем соответствующие файлы
        if (tab === 'motion') {
            createMediaItems(motionFiles, false);
        } else if (tab === 'modeling') {
            createMediaItems(modelingFiles, true);
        }
    });
});

// Загружаем первую вкладку по умолчанию
createMediaItems(motionFiles, false);

// Функции для модального окна изображений
function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('imageModalImg');
    modalImg.src = imageSrc;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Блокируем прокрутку фона
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Восстанавливаем прокрутку
}

// Обработчики для модального окна
const imageModal = document.getElementById('imageModal');
const imageModalClose = document.getElementById('imageModalClose');
const imageModalBackdrop = imageModal.querySelector('.image-modal-backdrop');

// Закрытие по клику на крестик
imageModalClose.addEventListener('click', closeImageModal);

// Закрытие по клику на фон
imageModalBackdrop.addEventListener('click', closeImageModal);

// Закрытие по клику на само изображение
const imageModalImg = document.getElementById('imageModalImg');
imageModalImg.addEventListener('click', function(e) {
    e.stopPropagation(); // Предотвращаем закрытие при клике на изображение
});

// Закрытие по клавише Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && imageModal.classList.contains('active')) {
        closeImageModal();
    }
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
