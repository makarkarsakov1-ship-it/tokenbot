/**
 * Aura Wallet - Процессинговая логика приложения (2026)
 */

// Локальное реактивное состояние
const state = {
    theme: localStorage.getItem('aura_theme') || 'dark-theme',
    soundEnabled: JSON.parse(localStorage.getItem('aura_sound') !== null ? localStorage.getItem('aura_sound') : 'true'),
    vibeEnabled: JSON.parse(localStorage.getItem('aura_vibe') !== null ? localStorage.getItem('aura_vibe') : 'true'),
    cards: JSON.parse(localStorage.getItem('aura_cards')) || [
        { id: 1, holder: 'ALEXANDER V', expiry: '12/29', maskNumber: '•••• •••• •••• 4200' }
    ],
    txHistory: [
        { id: 1, store: 'Супермаркет Магнит', cost: '- 412.00 ₽', date: 'Сегодня, 10:45' },
        { id: 2, store: 'Кофейня Surf Coffee', cost: '- 280.00 ₽', date: 'Вчера, 18:20' }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    applySystemConfiguration();
    initSpaRouter();
    renderTransactionsList();
    renderCardsStack();
    bindInteractiveEvents();
});

// Инициализация конфигурации
function applySystemConfiguration() {
    document.body.className = state.theme;
    
    // Выставляем чекбоксы в интерфейсе
    document.getElementById('toggle-theme').checked = (state.theme === 'dark-theme');
    document.getElementById('toggle-sound').checked = state.soundEnabled;
    document.getElementById('toggle-vibration').checked = state.vibeEnabled;
    
    // Обновляем базовый вид главной карты
    if(state.cards.length > 0) {
        updateMainCardDisplay(state.cards[0]);
    }
}

// Роутинг без задержек (SPA)
function initSpaRouter() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetView = e.currentTarget.getAttribute('data-view');
            
            navButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
            
            e.currentTarget.classList.add('active');
            document.getElementById(targetView).classList.add('active');
            
            triggerHapticFeedback(15); // Лёгкий клик при переходе
        });
    });
}

// Связывание событий
function bindInteractiveEvents() {
    // Поворот карты
    document.getElementById('btn-flip-card').addEventListener('click', () => {
        document.getElementById('main-card').classList.toggle('flipped');
        triggerHapticFeedback(20);
    });

    // Кнопка оплаты (Поднести к терминалу)
    document.getElementById('btn-pay-terminal').addEventListener('click', triggerNFCEmulationProcess);
    document.getElementById('btn-cancel-nfc').addEventListener('click', () => {
        document.getElementById('overlay-nfc').classList.remove('active');
    });

    document.getElementById('btn-close-success').addEventListener('click', () => {
        document.getElementById('overlay-success').classList.remove('active');
    });

    // Обработка создания новой карты
    document.getElementById('card-creation-form').addEventListener('submit', handleFormSubmitCard);

    // Настройки
    document.getElementById('toggle-theme').addEventListener('change', (e) => {
        state.theme = e.target.checked ? 'dark-theme' : 'light-theme';
        localStorage.setItem('aura_theme', state.theme);
        document.body.className = state.theme;
        triggerHapticFeedback(30);
    });

    document.getElementById('toggle-sound').addEventListener('change', (e) => {
        state.soundEnabled = e.target.checked;
        localStorage.setItem('aura_sound', state.soundEnabled);
    });

    document.getElementById('toggle-vibration').addEventListener('change', (e) => {
        state.vibeEnabled = e.target.checked;
    });

    // Аккордеон FAQ
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const item = e.currentTarget.parentElement;
            item.classList.toggle('open');
            triggerHapticFeedback(20);
        });
    });

    // Поддержка по SMS
    document.getElementById('btn-support-sms').addEventListener('click', () => {
        window.location.href = "sms:+79635307955?body=Здравствуйте, у меня вопрос по приложению Aura Wallet:";
    });
}

// Эмуляция бесконтактного списания (HCE)
function triggerNFCEmulationProcess() {
    if(state.cards.length === 0) {
        alert("Пожалуйста, добавьте карту во вкладке Добавить");
        return;
    }
    
    const activeCard = state.cards[0];
    document.getElementById('nfc-preview-digits').innerText = activeCard.maskNumber;
    
    // Показываем радар
    document.getElementById('overlay-nfc').classList.add('active');
    
    // Цикл удержания у воображаемого терминала (2.5 сек)
    setTimeout(() => {
        document.getElementById('overlay-nfc').classList.remove('active');
        
        // Генерация чека покупки
        const finalCost = (Math.random() * 1800 + 45).toFixed(2) + " ₽";
        const randomStores = ["Супермаркет Магнит", "ВкусВилл", "Ресторан Вкусно и точка", "Яндекс Такси", "АЗС Газпромнефть"];
        const chosenStore = randomStores[Math.floor(Math.random() * randomStores.length)];
        
        // Обновление DOM чека
        document.getElementById('receipt-amount').innerText = `- ${finalCost}`;
        document.getElementById('receipt-merchant').innerText = chosenStore;
        
        // Включение окна успешного завершения
        document.getElementById('overlay-success').classList.add('active');
        
        // Сигналы
        triggerHapticFeedback([100, 50, 100]); // Двойной сильный виброотклик терминала
        playTransactionSound();
        
        // Добавляем в историю
        const currentTimestamp = "Сегодня, " + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        state.txHistory.unshift({ id: Date.now(), store: chosenStore, cost: `- ${finalCost}`, date: currentTimestamp });
        renderTransactionsList();
        
    }, 2500);
}

// Сохранение карты
function handleFormSubmitCard(e) {
    e.preventDefault();
    
    const rawNumber = document.getElementById('form-card-num').value.replace(/\s/g, '');
    const expiry = document.getElementById('form-card-exp').value;
    const holder = document.getElementById('form-card-holder').value.toUpperCase();
    
    if(rawNumber.length < 16) {
        alert("Номер карты должен содержать не менее 16 цифр");
        return;
    }

    const masked = `•••• •••• •••• ${rawNumber.slice(-4)}`;
    const newCardObj = { id: Date.now(), holder, expiry, maskNumber: masked };
    
    state.cards.unshift(newCardObj);
    localStorage.setItem('aura_cards', JSON.stringify(state.cards));
    
    renderCardsStack();
    updateMainCardDisplay(newCardObj);
    document.getElementById('card-creation-form').reset();
    
    // Перебрасываем на экран кошелька
    document.querySelector('.nav-btn[data-view="view-main"]').click();
}

// Удаление карты
function deleteSavedCard(id) {
    state.cards = state.cards.filter(c => c.id !== id);
    localStorage.setItem('aura_cards', JSON.stringify(state.cards));
    renderCardsStack();
    
    if(state.cards.length > 0) {
        updateMainCardDisplay(state.cards[0]);
    } else {
        document.getElementById('display-card-number').innerText = "НЕТ ДОСТУПНЫХ КАРТ";
        document.getElementById('display-card-holder').innerText = "EMPTY";
        document.getElementById('display-card-expiry').innerText = "••/••";
    }
    triggerHapticFeedback(60);
}

// Хелперы рендеринга
function updateMainCardDisplay(card) {
    document.getElementById('display-card-number').innerText = card.maskNumber;
    document.getElementById('display-card-holder').innerText = card.holder;
    document.getElementById('display-card-expiry').innerText = card.expiry;
}

function renderCardsStack() {
    const box = document.getElementById('wallet-cards-container');
    if(!box) return;
    
    if(state.cards.length === 0) {
        box.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">Нет привязанных карт</div>`;
        return;
    }
    
    box.innerHTML = state.cards.map(c => `
        <div class="saved-card-item">
            <div class="sc-meta">
                <h4>${c.holder}</h4>
                <p>${c.maskNumber}</p>
            </div>
            <button class="btn-delete-card" onclick="deleteSavedCard(${c.id})">
                <i class="material-icons-round">delete</i>
            </button>
        </div>
    `).join('');
}

function renderTransactionsList() {
    const list = document.getElementById('main-tx-container');
    if(!list) return;
    list.innerHTML = state.txHistory.map(t => `
        <div class="tx-card">
            <div class="tx-info-block">
                <div class="tx-icon-frame"><i class="material-icons-round">payment</i></div>
                <div class="tx-text">
                    <h4>${t.store}</h4>
                    <span>${t.date}</span>
                </div>
            </div>
            <div class="tx-value">${t.cost}</div>
        </div>
    `).join('');
}

// Локальный синтез звука (Web Audio API)
function playTransactionSound() {
    if(!state.soundEnabled) return;
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Высокий чистый тон
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        
        oscillator.start();
        // Плавное затухание
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        oscillator.stop(audioCtx.currentTime + 0.4);
    } catch(e) {
        console.log("Audio API не поддерживается текущим браузером");
    }
}

// Виброотклик через Нативный интерфейс Android (Vibration API)
function triggerHapticFeedback(pattern) {
    if (state.vibeEnabled && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}
