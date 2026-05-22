/**
 * Aura Wallet - Архитектурное финтех PWA-приложение
 */

// Безопасное чтение из localStorage (чтобы избежать зависания при пустом хранилище)
const getLocalStorageData = (key, defaultValue) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error("Ошибка чтения localStorage для ключа " + key, e);
        return defaultValue;
    }
};

// Хранилище данных (State)
const state = {
    theme: localStorage.getItem('aura-theme') || 'dark-theme',
    isAuth: false,
    cards: getLocalStorageData('aura-cards', [
        { id: 1, type: 'AURA PREMIUM', number: '•••• •••• •••• 4200', holder: 'ALEXANDER V', expiry: '12/29', rawNumber: '5412750012344200' }
    ]),
    transactions: getLocalStorageData('aura-tx', [
        { id: 101, merchant: 'Супермаркет Магнит', amount: '- 542.00 ₽', date: 'Сегодня, 14:23', icon: 'shopping_bag' },
        { id: 102, merchant: 'Starbucks Coffee', amount: '- 320.00 ₽', date: 'Вчера, 09:11', icon: 'local_cafe' },
        { id: 103, merchant: 'Пополнение карты', amount: '+ 10 000.00 ₽', date: '18 Мая, 18:40', icon: 'arrow_downward' }
    ])
};

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderTransactions();
    setupNavigation();
    setupEventHandlers();
    
    // ПРИНУДИТЕЛЬНЫЙ ПЕРЕХОД: убираем Splash-screen через 2.2 секунды
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const auth = document.getElementById('auth-screen');
        
        if (splash && auth) {
            splash.classList.remove('active');
            splash.style.display = 'none'; // Полностью скрываем элемент из DOM-дерева
            auth.classList.add('active');
            console.log("Splash screen успешно скрыт. Переход на экран авторизации.");
        } else {
            console.error("Критические элементы UI не найдены в DOM!");
        }
    }, 2200);
});

// Настройка темы
function initTheme() {
    document.body.className = state.theme;
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.innerHTML = state.theme === 'dark-theme' ? 
            `<i class="material-icons-round">light_mode</i>` : `<i class="material-icons-round">dark_mode</i>`;
    }
}

// Рендеринг транзакций
function renderTransactions() {
    const container = document.getElementById('transaction-container');
    if (!container) return;
    
    container.innerHTML = state.transactions.map(tx => `
        <div class="transaction-item">
            <div class="tx-left">
                <div class="tx-icon"><i class="material-icons-round">${tx.icon}</i></div>
                <div class="tx-info">
                    <h4>${tx.merchant}</h4>
                    <span>${tx.date}</span>
                </div>
            </div>
            <div class="tx-amount ${tx.amount.startsWith('+') ? '' : 'negative'}">${tx.amount}</div>
        </div>
    `).join('');
}

// Навигация (SPA)
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const currentItem = e.currentTarget;
            const targetViewId = currentItem.getAttribute('data-target');
            
            navItems.forEach(btn => btn.classList.remove('active'));
            currentItem.classList.add('active');
            
            document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
            const targetView = document.getElementById(targetViewId);
            if (targetView) targetView.classList.add('active');
        });
    });
}

// Обработчики событий
function setupEventHandlers() {
    // Вход в приложение
    const btnBiometric = document.getElementById('btn-biometric');
    const btnDemoLogin = document.getElementById('btn-demo-login');
    
    if (btnBiometric) btnBiometric.addEventListener('click', runBiometricAuth);
    if (btnDemoLogin) btnDemoLogin.addEventListener('click', runBiometricAuth);

    // Переключение темы
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            state.theme = state.theme === 'dark-theme' ? 'light-theme' : 'dark-theme';
            localStorage.setItem('aura-theme', state.theme);
            initTheme();
        });
    }

    // Поворот карты
    const btnFlip = document.getElementById('btn-flip');
    if (btnFlip) {
        btnFlip.addEventListener('click', () => {
            const card = document.getElementById('main-card');
            if (card) card.classList.toggle('flipped');
        });
    }

    // NFC Оплата
    const btnPayNfc = document.getElementById('btn-pay-nfc');
    if (btnPayNfc) btnPayNfc.addEventListener('click', triggerNFCPaymentProcess);
    
    const closeNfcBtn = document.getElementById('close-nfc-btn');
    if (closeNfcBtn) {
        closeNfcBtn.addEventListener('click', () => {
            document.getElementById('nfc-overlay').classList.remove('active');
        });
    }

    // Закрытие экрана успеха
    const btnSuccessClose = document.getElementById('btn-success-close');
    if (btnSuccessClose) {
        btnSuccessClose.addEventListener('click', () => {
            document.getElementById('success-overlay').classList.remove('active');
        });
    }

    // Добавление карты
    const addCardForm = document.getElementById('add-card-form');
    if (addCardForm) addCardForm.addEventListener('submit', handleAddCard);

    // Очистка кэша
    const btnClearCache = document.getElementById('btn-clear-cache');
    if (btnClearCache) {
        btnClearCache.addEventListener('click', () => {
            localStorage.clear();
            showNotification('Данные очищены', 'Приложение перезагрузится');
            setTimeout(() => location.reload(), 1500);
        });
    }
}

// Биометрия
function runBiometricAuth() {
    const btn = document.getElementById('btn-biometric');
    if (btn) btn.innerText = "Проверка...";
    
    setTimeout(() => {
        state.isAuth = true;
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-container').classList.remove('hidden');
        showNotification('Доступ разрешен', 'Добро пожаловать в Aura Wallet');
    }, 1000);
}

// Симуляция NFC
function triggerNFCPaymentProcess() {
    if (state.cards.length === 0) {
        showNotification('Ошибка оплаты', 'Сначала добавьте платежную карту');
        return;
    }
    
    const activeCard = state.cards[0];
    document.getElementById('nfc-card-name').innerText = activeCard.type;
    document.getElementById('nfc-card-num').innerText = activeCard.number.slice(-9);
    
    document.getElementById('nfc-overlay').classList.add('active');

    setTimeout(() => {
        document.querySelector('.status-text').innerText = "Передача данных токена...";
        
        setTimeout(() => {
            document.getElementById('nfc-overlay').classList.remove('active');
            
            const sum = (Math.random() * 1500 + 50).toFixed(2);
            const merchants = ['Перекресток', 'ВкусВилл', 'Яндекс Такси', 'Додо Пицца'];
            const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
            
            const newTx = {
                id: Date.now(),
                merchant: randomMerchant,
                amount: `- ${sum} ₽`,
                date: 'Сегодня, только что',
                icon: 'payment'
            };
            state.transactions.unshift(newTx);
            localStorage.setItem('aura-tx', JSON.stringify(state.transactions));
            renderTransactions();

            document.getElementById('success-amount').innerText = `- ${sum} ₽`;
            document.getElementById('success-merchant-name').innerText = randomMerchant;
            document.getElementById('success-overlay').classList.add('active');
            
            document.querySelector('.status-text').innerText = "Поднесите smartphone к терминалу";
        }, 1500);
    }, 2500);
}

// Добавление карты
function handleAddCard(e) {
    e.preventDefault();
    
    const rawNumber = document.getElementById('input-card-number').value.replace(/\s/g, '');
    const expiry = document.getElementById('input-card-expiry').value;
    const holder = document.getElementById('input-card-holder').value;
    
    if (rawNumber.length < 16) {
        showNotification('Ошибка', 'Некорректный номер карты');
        return;
    }

    const last4 = rawNumber.slice(-4);
    const tokenizedMask = `•••• •••• •••• ${last4}`;

    const newCard = {
        id: Date.now(),
        type: 'AURA DIGITAL',
        number: tokenizedMask,
        holder: holder.toUpperCase(),
        expiry: expiry,
        rawNumber: rawNumber
    };

    state.cards.unshift(newCard);
    localStorage.setItem('aura-cards', JSON.stringify(state.cards));
    
    document.querySelector('.bank-name').innerText = newCard.type;
    document.querySelector('.card-number').innerText = newCard.number;
    document.querySelector('.card-holder').innerText = newCard.holder;
    document.querySelector('.card-expiry').innerText = newCard.expiry;

    showNotification('Успешно', 'Карта добавлена в Aura Pay');
    document.getElementById('add-card-form').reset();
    
    document.querySelector('.nav-item[data-target="view-wallet"]').click();
}

// Оповещения
function showNotification(title, message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-message').innerText = message;
    
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// АВТОМАТИЧЕСКАЯ РЕГИСТРАЦИЯ SERVICE WORKER
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('Service Worker зарегистрирован!', reg.scope))
            .catch(err => console.error('Ошибка Service Worker:', err));
    });
}
