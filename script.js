// script.js (type="module") — объединяет ваш оригинальный код + Firebase Realtime DB

// ------------------------ Firebase (modular) ------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";
import { getDatabase, ref, push, onValue, get, child } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Ваша конфигурация (вы присылали её)
const firebaseConfig = {
  apiKey: "AIzaSyD62fO9Gofm5kdcu7-lU2zpGooWxaulz-w",
  authDomain: "priglos-94cb0.firebaseapp.com",
  databaseURL: "https://priglos-94cb0-default-rtdb.firebaseio.com", // <- добавлено
  projectId: "priglos-94cb0",
  storageBucket: "priglos-94cb0.firebasestorage.app",
  messagingSenderId: "1032782433233",
  appId: "1:1032782433233:web:3ee64fc64ee691dcb7aef0",
  measurementId: "G-SECGY65S4E"
};


// Инициализация Firebase
const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch(e) { /* analytics может не работать в некоторых окружениях */ }
const db = getDatabase(app);

// ------------------------ Утилиты ------------------------
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    })[s];
  });
}

function getInitials(name) {
  return (name || '').split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}

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

// ------------------------ Firebase: запись и realtime подписка ------------------------
function saveGuestToFirebase(name) {
  const normalized = name.trim();
  if (!normalized) return Promise.reject(new Error('Empty name'));
  const guestsRef = ref(db, 'guests');
  const newRef = push(guestsRef);
  const guestObj = {
    id: newRef.key,
    name: normalized,
    date: new Date().toISOString()
  };
  return newRef.set(guestObj).then(() => guestObj);
}

let guestsListener = null;
let guestsCache = []; // локальная копия для удобства

function subscribeGuestsRealtime(onUpdate) {
  const guestsRef = ref(db, 'guests');
  if (guestsListener) {
    // onValue не возвращает функцию off в модульной версии — используем onValue и затем off через ref/db API
    // но onValue возвращает unsubscribe function in modular SDK; здесь мы used onValue from compat-like import,
    // so we keep guestsListener as the callback to be able to call onValue again safely.
  }
  guestsListener = onValue(guestsRef, snapshot => {
    const val = snapshot.val() || {};
    const arr = Object.values(val);
    arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    guestsCache = arr;
    onUpdate(arr);
  }, err => {
    console.error('Firebase onValue error:', err);
    onUpdate([]);
  });
}

// получить разово (если нужно)
async function fetchGuestsOnce() {
  const dbRef = ref(db);
  try {
    const snap = await get(child(dbRef, 'guests'));
    const val = snap.exists() ? snap.val() : {};
    const arr = Object.values(val);
    arr.sort((a,b)=> new Date(b.date)-new Date(a.date));
    guestsCache = arr;
    return arr;
  } catch(e) {
    console.error('fetchGuestsOnce error', e);
    return [];
  }
}

// ------------------------ Рендер списка гостей и статистика ------------------------
function renderGuestsList(guests) {
  const guestsList = document.getElementById('guestsList');
  const totalGuestsEls = document.querySelectorAll('.totalGuests');
  const confirmedGuests = document.getElementById('confirmedGuests');
  const statsNumber = document.querySelector('.stats-number');

  totalGuestsEls.forEach(el => el.textContent = guests.length);
  if (confirmedGuests) confirmedGuests.textContent = guests.length;
  if (statsNumber) statsNumber.textContent = guests.length;

  if (!guestsList) return;
  guestsList.innerHTML = '';

  if (guests.length === 0) {
    guestsList.innerHTML = `
      <div class="no-guests">
        <div class="no-guests-icon">👥</div>
        <p>Пока никто не подтвердил участие</p>
      </div>`;
    return;
  }

  guests.forEach((guest, index) => {
    const guestItem = document.createElement('div');
    guestItem.className = 'guest-item';
    guestItem.style.animationDelay = `${index * 0.05}s`;

    const initials = getInitials(guest.name);
    const timeAgo = getTimeAgo(guest.date);

    guestItem.innerHTML = `
      <div class="guest-avatar">${escapeHtml(initials)}</div>
      <div class="guest-name">${escapeHtml(guest.name)}</div>
      <div class="guest-time">${escapeHtml(timeAgo)}</div>
    `;
    guestsList.appendChild(guestItem);
  });
}

// ------------------------ Ваши существующие функции (карту и UI) ------------------------

// Инициализация карты 2GIS
function initMap() {
    const LAT = 43.251467;
    const LNG = 76.75248;
    if (typeof DG === 'undefined') {
        console.warn('2GIS API не загружен, показываем fallback');
        showMapFallback();
        return;
    }
    DG.then(function () {
        try {
            const map = DG.map('map', { center: [LAT, LNG], zoom: 16 });
            const marker = DG.marker([LAT, LNG]).addTo(map);
            marker.bindPopup('<b>Sadu Grand Hall</b><br>Алматы қ.<br>16 қараша 2025, 17:00').openPopup();
            DG.control.zoom({ position: 'topright' }).addTo(map);
            DG.control.locate({ position: 'topright' }).addTo(map);
            hideMapLoading();
            console.log('Карта 2GIS успешно инициализирована');
        } catch (error) {
            console.error('Ошибка при инициализации карты 2GIS:', error);
            showMapFallback();
        }
    });
}

function hideMapLoading() {
    const loadingElement = document.getElementById('map-loading');
    if (loadingElement) loadingElement.style.display = 'none';
}

function showMapFallback() {
    const mapContainer = document.getElementById('map');
    hideMapLoading();
    mapContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:linear-gradient(135deg, rgba(212,175,55,0.1), rgba(244,228,188,0.1));border-radius:15px;text-align:center;padding:20px;">
            <div style="width:60px;height:60px;background:linear-gradient(135deg,#D4AF37,#F4E4BC);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:15px;font-size:24px;">📍</div>
            <h4 style="color:#D4AF37;margin:0 0 10px 0;font-family:'KZ Balmoral', serif;">Sadu Grand Hall</h4>
            <p style="margin:0 0 5px 0;color:#2c2c2c;">г. Алматы</p>
            <p style="margin:0;font-size:14px;color:#666;">16 ноября 2025, 17:00</p>
            <p style="margin:15px 0 0 0;font-size:12px;color:#999;">Карта временно недоступна</p>
        </div>
    `;
}

// ------------------------ RSVP: обработка, ripple, сохранение ------------------------

// Обработка RSVP — изменил сигнатуру, теперь принимает event
async function handleRSVP(response, event) {
    const messageDiv = document.getElementById('rsvp-message');
    const buttons = document.querySelectorAll('.rsvp-btn');
    const nameInput = document.getElementById('guestName');
    const guestName = nameInput.value.trim();

    if (!guestName) {
        messageDiv.textContent = 'Пожалуйста, введите ваше имя и фамилию';
        messageDiv.className = 'rsvp-message info show';
        nameInput.focus();
        return;
    }

    // визуальная реакция кнопок
    buttons.forEach(btn => { btn.style.transform = 'scale(1)'; btn.style.boxShadow = ''; });

    const clickedBtn = event && event.target ? event.target.closest('.rsvp-btn') : null;
    if (clickedBtn) {
        clickedBtn.style.transform = 'scale(0.95)';
        clickedBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        createRippleEffect(clickedBtn, event);
    }

    messageDiv.classList.remove('show');

    setTimeout(async () => {
        if (response === 'yes') {
            messageDiv.textContent = `Спасибо, ${guestName}! Мы рады, что вы придете на праздник!`;
            messageDiv.className = 'rsvp-message success show';

            try {
                // отправляем в Firebase
                const guestObj = await saveGuestToFirebase(guestName);
                // отмечаем локально, чтобы подсветить для текущего посетителя
                localStorage.setItem('rsvpResponse', JSON.stringify({ name: guestName, response: response, date: guestObj.date, id: guestObj.id }));
                // guests обновится через realtime подписку
            } catch (err) {
                console.error('Ошибка при сохранении гостя в Firebase:', err);
                messageDiv.textContent = 'Ошибка при сохранении. Попробуйте ещё раз.';
                messageDiv.className = 'rsvp-message info show';
            }
        } else {
            // при отказе мы просто показываем сообщение — не сохраняем в глобальный список
            messageDiv.textContent = `Жаль, что вы не сможете прийти, ${guestName}. Будем скучать!`;
            messageDiv.className = 'rsvp-message info show';
            // сохраним локально отказ, чтобы подсветить в UI при возврате
            localStorage.setItem('rsvpResponse', JSON.stringify({ name: guestName, response: response, date: new Date().toISOString() }));
        }
    }, 100);

    nameInput.value = '';
}

// Загрузка локального RSVP (для подсветки кнопок текущему посетителю)
function loadSavedRSVP() {
    const savedData = localStorage.getItem('rsvpResponse');
    if (savedData) {
        try {
            const rsvpData = JSON.parse(savedData);
            const responseDate = new Date(rsvpData.date);
            const now = new Date();
            const daysDiff = (now - responseDate) / (1000 * 60 * 60 * 24);

            if (daysDiff < 365) { // будем показывать локально более года — уменьшите при необходимости
                const messageDiv = document.getElementById('rsvp-message');
                const buttons = document.querySelectorAll('.rsvp-btn');
                const nameInput = document.getElementById('guestName');

                // Заполняем поле имени локально (не обязательно)
                nameInput.value = rsvpData.name || '';

                // Подсвечиваем соответствующую кнопку
                buttons.forEach(btn => {
                    if ((rsvpData.response === 'yes' && btn.classList.contains('yes-btn')) ||
                        (rsvpData.response === 'no' && btn.classList.contains('no-btn'))) {
                        btn.style.border = '2px solid #D4AF37';
                        btn.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.5)';
                    }
                });

                // Показываем сообщение
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

function createRippleEffect(button, event) {
    const ripple = button.querySelector('.btn-ripple');
    if (ripple) {
        const rect = button.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.animation = 'none';
        ripple.offsetHeight;
        ripple.style.animation = 'ripple 0.6s linear';
    }
}

// ------------------------ Заменяем старые локальные функции управления списком гостей ------------------------

// Показать список гостей — теперь загружает кеш из Firebase (если уже есть подписка)
function showGuestsList() {
    const modal = document.getElementById('guestsModal');
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // если кеш пуст — загрузим разово
    if (!guestsCache || guestsCache.length === 0) {
        fetchGuestsOnce().then(arr => renderGuestsList(arr)).catch(()=> renderGuestsList([]));
    } else {
        renderGuestsList(guestsCache);
    }
}

function closeGuestsList() {
    const modal = document.getElementById('guestsModal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// loadGuestsList заменён на renderGuestsList (используется внутри showGuestsList и подписки)

// ------------------------ Остальной ваш код (scroll, gallery, etc.) ------------------------

// Анимация прокрутки
function animateOnScroll() {
    const elements = document.querySelectorAll('.info-item, .sponsor, .artists, .rsvp-section, .contacts');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

function smoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

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

function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Инициализация галереи и слайдов (оставил ваш код)
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.slide');
const indicators = document.querySelectorAll('.indicator');
const totalSlides = slides.length || 0;
let slideInterval;
function changeSlide(direction) {
    if (totalSlides === 0) return;
    slides[currentSlideIndex].classList.remove('active');
    indicators[currentSlideIndex].classList.remove('active');
    currentSlideIndex += direction;
    if (currentSlideIndex >= totalSlides) currentSlideIndex = 0;
    else if (currentSlideIndex < 0) currentSlideIndex = totalSlides - 1;
    slides[currentSlideIndex].classList.add('active');
    indicators[currentSlideIndex].classList.add('active');
}
function currentSlide(slideNumber) {
    if (totalSlides === 0) return;
    slides[currentSlideIndex].classList.remove('active');
    indicators[currentSlideIndex].classList.remove('active');
    currentSlideIndex = slideNumber - 1;
    slides[currentSlideIndex].classList.add('active');
    indicators[currentSlideIndex].classList.add('active');
}
function startSlideShow() {
    if (totalSlides === 0) return;
    slideInterval = setInterval(()=> changeSlide(1), 4000);
}
function stopSlideShow() { clearInterval(slideInterval); }
function initGallery() {
    startSlideShow();
    const galleryContainer = document.querySelector('.gallery-container');
    if (galleryContainer) {
        galleryContainer.addEventListener('mouseenter', stopSlideShow);
        galleryContainer.addEventListener('mouseleave', startSlideShow);
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') changeSlide(-1);
        else if (e.key === 'ArrowRight') changeSlide(1);
    });
    // свайпы
    if (galleryContainer) {
      let startX = 0, endX = 0;
      galleryContainer.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; });
      galleryContainer.addEventListener('touchend', function(e){ endX = e.changedTouches[0].clientX; handleSwipe(); });
      function handleSwipe() {
        const swipeThreshold = 50;
        const diff = startX - endX;
        if (Math.abs(diff) > swipeThreshold) {
          if (diff > 0) changeSlide(1); else changeSlide(-1);
        }
      }
    }
}

// Инициализация всех функций при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // карта
    initMap();

    // локальный RSVP (подсветка) — использует localStorage
    loadSavedRSVP();

    // realtime подписка на гостей
    subscribeGuestsRealtime(renderGuestsList);

    // анимации, прокрутка, типинг
    animateOnScroll();
    smoothScroll();
    const nameElement = document.querySelector('.name');
    if (nameElement) { const originalText = nameElement.textContent; typeWriter(nameElement, originalText, 150); }

    // галерея
    initGallery();

    // модалка гостевого списка
    const modal = document.getElementById('guestsModal');
    if (modal) {
        modal.addEventListener('click', function(e) { if (e.target === modal) closeGuestsList(); });
    }
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && modal && modal.classList.contains('show')) closeGuestsList(); });

    // hover эффекты
    const cards = document.querySelectorAll('.info-item, .sponsor, .artists');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function(){ this.style.transform = 'translateY(-5px) scale(1.02)'; });
        card.addEventListener('mouseleave', function(){ this.style.transform = 'translateY(0) scale(1)'; });
    });

    // click эффект на кнопках
    const buttons = document.querySelectorAll('.rsvp-btn, .map-link');
    buttons.forEach(button => {
        button.addEventListener('click', function(){ this.style.transform = 'scale(0.95)'; setTimeout(()=>{ this.style.transform = ''; }, 150); });
    });

    // Кнопка "Тізімді қарау"
    const guestsBtn = document.querySelector('.guests-btn');
    if (guestsBtn) {
        guestsBtn.addEventListener('click', showGuestsList);
    }
});

// обработка resize
window.addEventListener('resize', function() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) return;
    mapContainer.style.height = window.innerWidth < 768 ? '250px' : '300px';
});

// параллакс
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.milk-splash');
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Экспортируем функции в глобальную область (чтобы inline onclick в HTML работали)
window.handleRSVP = handleRSVP;
window.showGuestsList = showGuestsList;
window.closeGuestsList = closeGuestsList;
window.scrollToSection = scrollToSection;
window.changeSlide = changeSlide;
window.currentSlide = currentSlide;
