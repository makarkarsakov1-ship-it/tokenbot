/**
 * Aura Wallet - Архитектурное финтех PWA-приложение (Mock-реализация)
 */

// Хранилище данных (Mock State)
const state = {
    theme: localStorage.getItem('aura-theme') || 'dark-theme',
    isAuth: false,
    cards: JSON.parse(localStorage.getItem('aura-cards')) || [
        { id: 1, type: 'AURA PREMIUM', number: '•••• •••• •••• 4200', holder: 'ALEXANDER V', expiry: '12/29', rawNumber: '5412750012344200' }
    ],
    transactions: JSON.parse(localStorage.getItem('aura-tx')) || [
        { id: 101, merchant: 'Supermarket Magnit', amount: '- 542.00 ₽', date: 'Сегодня, 14:23', icon: 'shopping_bag' },
        { id: 102, merchant: 'Starbucks Coffee', amount: '- 320.00 ₽', date: 'Вчера, 09:11', icon: 'local_cafe' },
        { id: 103, merchant: 'Пополнение карты', amount: '+ 10 000.00 ₽', date: '18 Мая, 18:40', icon: 'arrow_downward' }
    ],
    settings: {
        biometry: true,
        hceEnabled: true
    }
};

// Инициализация при полной загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderTransactions();
    setupNavigation();
    setupEventHandlers();
    
    // Имитация загрузки Сплэш-экрана
    setTimeout(() => {
        document.getElementById('splash-screen').classList.remove('active');
        document.getElementById('auth-screen').classList.add('active');
    }, 2200);
});

// Настройка темы
function initTheme() {
    document.body.className = state.theme;
    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn.innerHTML = state.theme === 'dark-theme' ? 
        `<i class="material-icons-round">light_mode</i>` : `<i class="material-icons-round">dark_mode</i>`;
}

// Рендеринг транзакций
function renderTransactions() {
    const container = document.getElementById('transaction-container');
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

// Роутинг экранов (SPA-навигация)
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const currentItem = e.currentTarget;
            const targetViewId = currentItem.getAttribute('data-target');
            
            // Смена активного класса на кнопках таббара
            navItems.forEach(btn => btn.classList.remove('active'));
            currentItem.classList.add('active');
            
            // Смена экранов
            document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
            document.getElementById(targetViewId).classList.add('active');
        });
    });
}

// Настройка обработчиков событий
function setupEventHandlers() {
    // Демо-авторизация (Имитация Face ID)
    document.getElementById('btn-biometric').addEventListener('click', runBiometricAuth);
    document.getElementById('btn-demo-login').addEventListener('click', runBiometricAuth);

    // Переключение темы
    document.getElementById('theme-toggle').addEventListener('click', () => {
        state.theme = state.theme === 'dark-theme' ? 'light-theme' : 'dark-theme';
        localStorage.setItem('aura-theme', state.theme);
        initTheme();
    });

    // Анимация переворота карты
    document.getElementById('btn-flip').addEventListener('click', () => {
        document.getElementById('main-card').classList.toggle('flipped');
    });

    // Вызов оверлея NFC оплаты
    document.getElementById('btn-pay-nfc').addEventListener('click', triggerNFCPaymentProcess);
    document.getElementById('close-nfc-btn').addEventListener('click', () => {
        document.getElementById('nfc-overlay').classList.remove('active');
    });

    // Обработка закрытия экрана успеха
    document.getElementById('btn-success-close').addEventListener('click', () => {
        document.getElementById('success-overlay').classList.remove('active');
    });

    // Добавление новой карты (Токенизация)
    document.getElementById('add-card-form').addEventListener('submit', handleAddCard);

    // Сброс кэша в настройках
    document.getElementById('btn-clear-cache').addEventListener('click', () => {
        localStorage.clear();
        showNotification('Данные очищены', 'Приложение перезагрузится');
        setTimeout(() => location.reload(), 1500);
    });
}

// Имитация биометрического входа
function runBiometricAuth() {
    const btn = document.getElementById('btn-biometric');
    btn.innerText = "Проверка...";
    
    // Имитируем задержку сканирования отпечатка/лица
    setTimeout(() => {
        state.isAuth = true;
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('app-container').classList.remove('hidden');
        showNotification('Доступ разрешен', 'Добро пожаловать в Aura Wallet');
    }, 1200);
}

/**
 * ИМИТАЦИЯ ТЕХНОЛОГИЙ NFC И ТОКЕНИЗАЦИИ (Архитектурные заглушки)
 */
function triggerNFCPaymentProcess() {
    if(state.cards.length === 0) {
        showNotification('Ошибка оплаты', 'Сначала добавьте платежную карту');
        return;
    }
    
    const activeCard = state.cards[0];
    document.getElementById('nfc-card-name').innerText = activeCard.type;
    document.getElementById('nfc-card-num').innerText = activeCard.number.slice(-9);
    
    // Показываем экран "Поднесите к терминалу"
    document.getElementById('nfc-overlay').classList.add('active');

    // Имитация обнаружения терминала (Host Card Emulation / HCE Trigger)
    setTimeout(() => {
        const hceEngine = new AuraHCEMockEngine();
        const paymentToken = hceEngine.generatePaymentToken(activeCard.rawNumber);
        
        document.querySelector('.status-text').innerText = "Передача данных токена...";
        
        // Имитируем процессинг банка
        setTimeout(() => {
            document.getElementById('nfc-overlay').classList.remove('active');
            
            // Генерируем фейковую покупку
            const sum = (Math.random() * 1500 + 50).toFixed(2);
            const merchants = ['Кофе Хауз', 'ВкусВилл', 'АЗС Газпромнефть', 'Яндекс Такси'];
            const randomMerchant = merchants[Math.floor(Math.random() * merchants.length)];
            
            // Запись в стейт новой транзакции
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

            // Вывод экрана успешной оплаты
            document.getElementById('success-amount').innerText = `- ${sum} ₽`;
            document.getElementById('success-merchant-name').innerText = randomMerchant;
            document.getElementById('success-overlay').classList.add('active');
            
            // Сбрасываем текст состояния NFC на исходный
            document.querySelector('.status-text').innerText = "Поднесите смартфон к терминалу";
            
        }, 1500);
    }, 3000); // 3 секунды ожидания "прикладывания" телефона
}

// Обработка формы создания карты и её токенизация
function handleAddCard(e) {
    e.preventDefault();
    
    const rawNumber = document.getElementById('input-card-number').value.replace(/\s/g, '');
    const expiry = document.getElementById('input-card-expiry').value;
    const holder = document.getElementById('input-card-holder').value;
    
    if (rawNumber.length < 16) {
        showNotification('Ошибка', 'Некорректный номер карты');
        return;
    }

    // Имитируем архитектуру токенизации (Token Service Provider типа Visa Token Service / MDES / Mir Token)
    const tsp = new AuraTokenServiceProvider();
    const tokenizedMask = tsp.tokenizeCardNumber(rawNumber);

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
    
    // Обновляем визуальный интерфейс главной карты данными только что созданной
    document.querySelector('.bank-name').innerText = newCard.type;
    document.querySelector('.card-number').innerText = newCard.number;
    document.querySelector('.card-holder').innerText = newCard.holder;
    document.querySelector('.card-expiry').innerText = newCard.expiry;

    showNotification('Успешно', 'Карта защищена и добавлена в Aura Pay');
    document.getElementById('add-card-form').reset();
    
    // Возвращаемся на кошелек
    document.querySelector('.nav-item[data-target="view-wallet"]').click();
}

// Система кастомных PUSH/Toast UI уведомлений
function showNotification(title, message) {
    const toast = document.getElementById('toast-notification');
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-message').innerText = message;
    
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3500);
}

/**
 * ИМИТАЦИОННЫЕ ИНЖЕНЕРНЫЕ КЛАССЫ (ЗАГОТОВКИ ДЛЯ ПОДКЛЮЧЕНИЯ БАНКОВСКИХ SDK)
 */
class AuraTokenServiceProvider {
    // Имитация процесса превращения PAN (номера карты) в токен (DPAN)
    tokenizeCardNumber(pan) {
        const last4 = pan.slice(-4);
        // Возвращаем токенизированную маску
        return `•••• •••• •••• ${last4}`;
    }
}

class AuraHCEMockEngine {
    // Эмуляция Host Card Emulation на Android для обмена APDU-командами с POS-терминалом по стандарту ISO 7816
    generatePaymentToken(rawCardNumber) {
        console.log("HCE Session initialized. Exchanging APDU cryptograms...");
        // В реальности здесь генерируется одноразовый сессионный ключ (cryptogram) на базе системного Keystore
        return "MOCK_CRYPTO_TOKEN_SHA256_" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
}
