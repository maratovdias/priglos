// Инициализация карты 2GIS
function initMap() {
    // Координаты ресторана "Sadu Grand Hall" в Алматы
    const LAT = 43.251467;
    const LNG = 76.75248;
    
    // Проверяем, загружен ли 2GIS API
    if (typeof DG === 'undefined') {
        console.warn('2GIS API не загружен, показываем fallback');
        showMapFallback();
        return;
    }
    
    // Инициализируем карту через 2GIS loader
    DG.then(function () {
        try {
            // Создаём карту в контейнере с центром на указанных координатах
            const map = DG.map('map', {
                center: [LAT, LNG],
                zoom: 16
            });

            // Добавляем маркер и попап
            const marker = DG.marker([LAT, LNG]).addTo(map);
            marker.bindPopup('<b>Sadu Grand Hall</b><br>Алматы қ.<br>16 қараша 2025, 17:00').openPopup();

            // Добавим контролы (масштаб и локатор)
            DG.control.zoom({ position: 'topright' }).addTo(map);
            DG.control.locate({ position: 'topright' }).addTo(map);

            // Скрываем индикатор загрузки
            hideMapLoading();
            
            console.log('Карта 2GIS успешно инициализирована');
        } catch (error) {
            console.error('Ошибка при инициализации карты 2GIS:', error);
            showMapFallback();
        }
    });
}

// Скрытие индикатора загрузки карты
function hideMapLoading() {
    const loadingElement = document.getElementById('map-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// Fallback для карты, если 2GIS не загрузился
function showMapFallback() {
    const mapContainer = document.getElementById('map');
    hideMapLoading();
    
    mapContainer.innerHTML = `
        <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(244, 228, 188, 0.1));
            border-radius: 15px;
            text-align: center;
            padding: 20px;
        ">
            <div style="
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #D4AF37, #F4E4BC);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 15px;
                font-size: 24px;
            ">📍</div>
            <h4 style="color: #D4AF37; margin: 0 0 10px 0; font-family: 'KZ Balmoral', serif;">Sadu Grand Hall</h4>
            <p style="margin: 0 0 5px 0; color: #2c2c2c;">г. Алматы</p>
            <p style="margin: 0; font-size: 14px; color: #666;">16 ноября 2025, 17:00</p>
            <p style="margin: 15px 0 0 0; font-size: 12px; color: #999;">Карта временно недоступна</p>
        </div>
    `;
}

// Обработка RSVP
function handleRSVP(response) {
    const messageDiv = document.getElementById('rsvp-message');
    const buttons = document.querySelectorAll('.rsvp-btn');
    const nameInput = document.getElementById('guestName');
    const guestName = nameInput.value.trim();
    
    // Проверяем, введено ли имя
    if (!guestName) {
        messageDiv.textContent = 'Пожалуйста, введите ваше имя и фамилию';
        messageDiv.className = 'rsvp-message info show';
        nameInput.focus();
        return;
    }
    
    // Убираем активное состояние с всех кнопок
    buttons.forEach(btn => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '';
    });
    
    // Добавляем активное состояние к нажатой кнопке
    const clickedBtn = event.target.closest('.rsvp-btn');
    clickedBtn.style.transform = 'scale(0.95)';
    clickedBtn.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    
    // Создаем эффект ripple
    createRippleEffect(clickedBtn, event);
    
    // Показываем сообщение
    messageDiv.classList.remove('show');
    
    setTimeout(() => {
        if (response === 'yes') {
            messageDiv.textContent = `Спасибо, ${guestName}! Мы рады, что вы придете на праздник!`;
            messageDiv.className = 'rsvp-message success show';
            
            // Добавляем гостя в список
            addGuestToList(guestName, response);
        } else {
            messageDiv.textContent = `Жаль, что вы не сможете прийти, ${guestName}. Будем скучать!`;
            messageDiv.className = 'rsvp-message info show';
        }
    }, 100);
    
    // Сохраняем ответ в localStorage
    const rsvpData = {
        name: guestName,
        response: response,
        date: new Date().toISOString()
    };
    localStorage.setItem('rsvpResponse', JSON.stringify(rsvpData));
    
    // Очищаем поле ввода
    nameInput.value = '';
}

// Загрузка сохраненного RSVP ответа
function loadSavedRSVP() {
    const savedData = localStorage.getItem('rsvpResponse');
    
    if (savedData) {
        try {
            const rsvpData = JSON.parse(savedData);
            const responseDate = new Date(rsvpData.date);
            const now = new Date();
            const daysDiff = (now - responseDate) / (1000 * 60 * 60 * 24);
            
            // Показываем сохраненный ответ только если он был сделан недавно (в течение 30 дней)
            if (daysDiff < 30) {
                const messageDiv = document.getElementById('rsvp-message');
                const buttons = document.querySelectorAll('.rsvp-btn');
                const nameInput = document.getElementById('guestName');
                
                // Заполняем поле имени
                nameInput.value = rsvpData.name;
                
                // Подсвечиваем соответствующую кнопку
                buttons.forEach(btn => {
                    if ((rsvpData.response === 'yes' && btn.classList.contains('yes-btn')) ||
                        (rsvpData.response === 'no' && btn.classList.contains('no-btn'))) {
                        btn.style.border = '2px solid #D4AF37';
                        btn.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.5)';
                    }
                });
                
                // Показываем сохраненное сообщение
                if (rsvpData.response === 'yes') {
                    messageDiv.textContent = `Вы уже подтвердили участие, ${rsvpData.name}! Спасибо!`;
                    messageDiv.className = 'rsvp-message success show';
                } else {
                    messageDiv.textContent = `Вы уже сообщили, что не сможете прийти, ${rsvpData.name}.`;
                    messageDiv.className = 'rsvp-message info show';
                }
            }
        } catch (e) {
            console.error('Ошибка при загрузке сохраненных данных:', e);
        }
    }
}

// Создание эффекта ripple
function createRippleEffect(button, event) {
    const ripple = button.querySelector('.btn-ripple');
    if (ripple) {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.animation = 'none';
        ripple.offsetHeight; // Trigger reflow
        ripple.style.animation = 'ripple 0.6s linear';
    }
}

// Добавление гостя в список
function addGuestToList(name, response) {
    if (response === 'yes') {
        const guests = JSON.parse(localStorage.getItem('guestsList') || '[]');
        const newGuest = {
            name: name,
            date: new Date().toISOString(),
            id: Date.now()
        };
        
        // Проверяем, нет ли уже такого гостя
        const existingGuest = guests.find(guest => guest.name.toLowerCase() === name.toLowerCase());
        if (!existingGuest) {
            guests.push(newGuest);
            localStorage.setItem('guestsList', JSON.stringify(guests));
            
            // Обновляем статистику
            updateGuestsStats();
        }
    }
}

// Обновление статистики гостей
function updateGuestsStats() {
    const guests = JSON.parse(localStorage.getItem('guestsList') || '[]');
    const statsNumber = document.querySelector('.stats-number');
    if (statsNumber) {
        statsNumber.textContent = guests.length;
        // Анимация обновления
        statsNumber.style.transform = 'scale(1.2)';
        setTimeout(() => {
            statsNumber.style.transform = 'scale(1)';
        }, 300);
    }
}

// Показать список гостей
function showGuestsList() {
    const modal = document.getElementById('guestsModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Загружаем список гостей
    loadGuestsList();
    
    // Блокируем прокрутку фона
    document.body.style.overflow = 'hidden';
}

// Закрыть список гостей
function closeGuestsList() {
    const modal = document.getElementById('guestsModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    
    // Разблокируем прокрутку фона
    document.body.style.overflow = 'auto';
}

// Загрузка списка гостей
function loadGuestsList() {
    const guests = JSON.parse(localStorage.getItem('guestsList') || '[]');
    const guestsList = document.getElementById('guestsList');
    const totalGuests = document.getElementById('totalGuests');
    const confirmedGuests = document.getElementById('confirmedGuests');
    
    // Обновляем статистику
    if (totalGuests) totalGuests.textContent = guests.length;
    if (confirmedGuests) confirmedGuests.textContent = guests.length;
    
    // Обновляем статистику в RSVP секции
    const statsNumber = document.querySelector('.stats-number');
    if (statsNumber) statsNumber.textContent = guests.length;
    
    // Очищаем список
    guestsList.innerHTML = '';
    
    if (guests.length === 0) {
        guestsList.innerHTML = `
            <div class="no-guests">
                <div class="no-guests-icon">👥</div>
                <p>Пока никто не подтвердил участие</p>
            </div>
        `;
    } else {
        // Сортируем гостей по дате (новые сверху)
        const sortedGuests = guests.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedGuests.forEach((guest, index) => {
            const guestItem = document.createElement('div');
            guestItem.className = 'guest-item';
            guestItem.style.animationDelay = `${index * 0.1}s`;
            
            const initials = getInitials(guest.name);
            const timeAgo = getTimeAgo(guest.date);
            
            guestItem.innerHTML = `
                <div class="guest-avatar">${initials}</div>
                <div class="guest-name">${guest.name}</div>
                <div class="guest-time">${timeAgo}</div>
            `;
            
            guestsList.appendChild(guestItem);
        });
    }
}

// Получение инициалов имени
function getInitials(name) {
    return name.split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
}

// Получение времени назад
function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'только что';
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ч назад`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU');
}

// Анимация появления элементов при прокрутке
function animateOnScroll() {
    const elements = document.querySelectorAll('.info-item, .sponsor, .artists, .rsvp-section, .contacts');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Плавная прокрутка к секциям
function smoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Добавление эффекта печатания для заголовка
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Функция плавной прокрутки к секции
function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Инициализация всех функций при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем карту
    initMap();
    
    // Загружаем сохраненный RSVP
    loadSavedRSVP();
    
    // Добавляем анимации
    animateOnScroll();
    
    // Добавляем плавную прокрутку
    smoothScroll();
    
    // Эффект печатания для имени
    const nameElement = document.querySelector('.name');
    if (nameElement) {
        const originalText = nameElement.textContent;
        typeWriter(nameElement, originalText, 150);
    }
    
    // Инициализируем галерею
    initGallery();
    
    // Добавляем обработчики для модального окна
    const modal = document.getElementById('guestsModal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeGuestsList();
        }
    });
    
    // Закрытие модального окна по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeGuestsList();
        }
    });
    
    // Добавляем эффект hover для карточек
    const cards = document.querySelectorAll('.info-item, .sponsor, .artists');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Добавляем эффект клика для кнопок
    const buttons = document.querySelectorAll('.rsvp-btn, .map-link');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
});

// Обработка изменения размера окна
window.addEventListener('resize', function() {
    // Пересоздаем карту при изменении размера
    if (window.innerWidth < 768) {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.style.height = '250px';
        }
    } else {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.style.height = '300px';
        }
    }
});

// Добавляем эффект параллакса для декоративных элементов
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.milk-splash');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Слайд-шоу галерея
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.slide');
const indicators = document.querySelectorAll('.indicator');
const totalSlides = slides.length;

// Функция для смены слайда
function changeSlide(direction) {
    // Убираем активный класс с текущего слайда и индикатора
    slides[currentSlideIndex].classList.remove('active');
    indicators[currentSlideIndex].classList.remove('active');
    
    // Вычисляем новый индекс слайда
    currentSlideIndex += direction;
    
    // Проверяем границы
    if (currentSlideIndex >= totalSlides) {
        currentSlideIndex = 0;
    } else if (currentSlideIndex < 0) {
        currentSlideIndex = totalSlides - 1;
    }
    
    // Добавляем активный класс к новому слайду и индикатору
    slides[currentSlideIndex].classList.add('active');
    indicators[currentSlideIndex].classList.add('active');
}

// Функция для перехода к конкретному слайду
function currentSlide(slideNumber) {
    // Убираем активный класс с текущего слайда и индикатора
    slides[currentSlideIndex].classList.remove('active');
    indicators[currentSlideIndex].classList.remove('active');
    
    // Устанавливаем новый индекс
    currentSlideIndex = slideNumber - 1;
    
    // Добавляем активный класс к новому слайду и индикатору
    slides[currentSlideIndex].classList.add('active');
    indicators[currentSlideIndex].classList.add('active');
}

// Автоматическое переключение слайдов
let slideInterval;

function startSlideShow() {
    slideInterval = setInterval(() => {
        changeSlide(1);
    }, 4000); // Переключаем каждые 4 секунды
}

function stopSlideShow() {
    clearInterval(slideInterval);
}

// Инициализация слайд-шоу
function initGallery() {
    // Запускаем автоматическое переключение
    startSlideShow();
    
    // Останавливаем автоматическое переключение при наведении
    const galleryContainer = document.querySelector('.gallery-container');
    if (galleryContainer) {
        galleryContainer.addEventListener('mouseenter', stopSlideShow);
        galleryContainer.addEventListener('mouseleave', startSlideShow);
    }
    
    // Добавляем поддержку клавиатуры
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            changeSlide(-1);
        } else if (e.key === 'ArrowRight') {
            changeSlide(1);
        }
    });
    
    // Добавляем поддержку свайпов на мобильных устройствах
    let startX = 0;
    let endX = 0;
    
    galleryContainer.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
    });
    
    galleryContainer.addEventListener('touchend', function(e) {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = startX - endX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Свайп влево - следующий слайд
                changeSlide(1);
            } else {
                // Свайп вправо - предыдущий слайд
                changeSlide(-1);
            }
        }
    }
}
