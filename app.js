/* ============================================
   AURA WALLET — app.js
   Архитектура: MVC + Mock API layer
   Версия: 1.0
   ============================================ */

'use strict';

/* ============================================
   MOCK API — ЗАГОТОВКА ДЛЯ ИНТЕГРАЦИИ
   ============================================ */

/**
 * MockNFC — заглушка NFC Host Card Emulation
 * TODO: Заменить на реальный WebNFC API / Android HCE
 */
const MockNFC = {
  isSupported: () => 'NDEFReader' in window,
  
  async startEmulation(tokenData) {
    console.log('[NFC] Эмуляция карты запущена:', tokenData);
    // TODO: navigator.nfc.push() / Android HCE Intent
    return { success: true, sessionId: generateId() };
  },

  async stopEmulation() {
    console.log('[NFC] Эмуляция остановлена');
    return { success: true };
  }
};

/**
 * MockTokenizer — заглушка токенизации карт (PCI DSS)
 * TODO: Интеграция с Visa Token Service / Mastercard MDES
 */
const MockTokenizer = {
  async tokenize(cardData) {
    console.log('[Tokenizer] Токенизация карты...');
    await delay(800);
    // TODO: Реальная токенизация через банковский SDK
    return {
      token: 'TOK_' + generateId(),
      last4: cardData.number.slice(-4),
      network: detectNetwork(cardData.number),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };
  }
};

/**
 * MockPaymentProcessor — заглушка платёжного процессора
 * TODO: Интеграция с Google Pay API / банковским эквайрингом
 */
const MockPaymentProcessor = {
  async processPayment({ token, amount, currency, terminalId }) {
    console.log('[Payment] Обработка платежа...', { amount, currency });
    await delay(1500 + Math.random() * 1000);

    // Симуляция 95% успеха
    if (Math.random() < 0.05) {
      throw new Error('DECLINED: Insufficient funds');
    }

    return {
      transactionId: 'TXN_' + generateId(),
      status: 'approved',
      amount,
      currency,
      timestamp: new Date().toISOString(),
      authCode: Math.random().toString(36).substr(2, 6).toUpperCase()
    };
  }
};

/**
 * MockBankBackend — заглушка банковского бэкенда
 * TODO: REST API / OpenBanking PSD2 интеграция
 */
const MockBankBackend = {
  baseUrl: 'https://api.aura-bank.example.com/v1', // placeholder

  async getBalance(cardToken) {
    await delay(300);
    return { balance: 47832.50, currency: 'RUB', available: 45000 };
  },

  async getTransactions(cardToken, limit = 20) {
    await delay(400);
    return MOCK_DATA.transactions;
  },

  async addCard(encryptedCardData) {
    await delay(1200);
    // TODO: RSA шифрование + банковский API
    return { success: true, cardId: 'CARD_' + generateId() };
  }
};

/* ============================================
   MOCK ДАННЫЕ
   ============================================ */
const MOCK_DATA = {
  user: {
    id: 'USR_001',
    name: 'Максим Орлов',
    email: 'max.orlov@mail.ru',
    phone: '+7 (999) 123-45-67',
    avatar: '🧑‍💻',
    tier: 'AURA Pro',
    joinDate: '2023-06-15'
  },

  cards: [
    {
      id: 'CARD_001',
      name: 'AURA Platinum',
      number: '4532 1234 5678 9012',
      holder: 'MAXIM ORLOV',
      expiry: '12/27',
      cvv: '***',
      balance: 47832.50,
      currency: 'RUB',
      theme: 'card-theme-violet',
      network: 'visa',
      isDefault: true,
      token: 'TOK_' + generateId()
    },
    {
      id: 'CARD_002',
      name: 'Мир Debit',
      number: '2202 5566 7788 9900',
      holder: 'MAXIM ORLOV',
      expiry: '08/26',
      cvv: '***',
      balance: 12450.00,
      currency: 'RUB',
      theme: 'card-theme-dark',
      network: 'mir',
      isDefault: false,
      token: 'TOK_' + generateId()
    },
    {
      id: 'CARD_003',
      name: 'AURA Travel',
      number: '5421 3344 5566 7788',
      holder: 'MAXIM ORLOV',
      expiry: '03/28',
      cvv: '***',
      balance: 8920.00,
      currency: 'USD',
      theme: 'card-theme-aurora',
      network: 'mastercard',
      isDefault: false,
      token: 'TOK_' + generateId()
    }
  ],

  transactions: [
    { id: 'TX_001', merchant: 'Яндекс Еда', category: 'food', amount: -890, date: 'Сегодня, 13:24', icon: '🍕', status: 'completed' },
    { id: 'TX_002', merchant: 'Пополнение', category: 'income', amount: +50000, date: 'Сегодня, 10:00', icon: '💳', status: 'completed' },
    { id: 'TX_003', merchant: 'Wildberries', category: 'shopping', amount: -3420, date: 'Вчера, 18:42', icon: '🛍️', status: 'completed' },
    { id: 'TX_004', merchant: 'Metro Cash & Carry', category: 'shopping', amount: -2150, date: 'Вчера, 15:10', icon: '🛒', status: 'completed' },
    { id: 'TX_005', merchant: 'Netflix', category: 'entertainment', amount: -899, date: 'Вчера, 08:00', icon: '🎬', status: 'completed' },
    { id: 'TX_006', merchant: 'Аптека Ригла', category: 'health', amount: -680, date: '20 мая', icon: '💊', status: 'completed' },
    { id: 'TX_007', merchant: 'Shell', category: 'transport', amount: -2400, date: '20 мая', icon: '⛽', status: 'completed' },
    { id: 'TX_008', merchant: 'Spotify', category: 'entertainment', amount: -299, date: '19 мая', icon: '🎵', status: 'completed' },
    { id: 'TX_009', merchant: 'Перевод от Анны', category: 'income', amount: +5000, date: '19 мая', icon: '👤', status: 'completed' },
    { id: 'TX_010', merchant: 'Кофемания', category: 'food', amount: -520, date: '18 мая', icon: '☕', status: 'completed' },
  ]
};

/* ============================================
   STATE MANAGEMENT
   ============================================ */
const AppState = {
  currentScreen: 'splash',
  currentTab: 'home',
  selectedCard: MOCK_DATA.cards[0],
  theme: localStorage.getItem('aura_theme') || 'dark',
  isAuthenticated: localStorage.getItem('aura_auth') === 'true',
  cards: [],
  transactions: [],
  nfcActive: false,
  paymentInProgress: false,

  load() {
    const saved = localStorage.getItem('aura_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.cards = parsed.cards || [...MOCK_DATA.cards];
        this.transactions = parsed.transactions || [...MOCK_DATA.transactions];
      } catch(e) {
        this.cards = [...MOCK_DATA.cards];
        this.transactions = [...MOCK_DATA.transactions];
      }
    } else {
      this.cards = [...MOCK_DATA.cards];
      this.transactions = [...MOCK_DATA.transactions];
    }
  },

  save() {
    const data = {
      cards: this.cards,
      transactions: this.transactions.slice(0, 50)
    };
    localStorage.setItem('aura_state', JSON.stringify(data));
  },

  addCard(card) {
    this.cards.push(card);
    this.save();
  },

  addTransaction(tx) {
    this.transactions.unshift(tx);
    this.save();
  }
};

/* ============================================
   UTILITIES
   ============================================ */
function generateId() {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatAmount(amount, currency = 'RUB') {
  const abs = Math.abs(amount);
  const sign = amount >= 0 ? '+' : '−';
  if (currency === 'RUB') return `${sign}${abs.toLocaleString('ru-RU')} ₽`;
  if (currency === 'USD') return `${sign}$${abs.toFixed(2)}`;
  return `${sign}${abs}`;
}

function formatBalance(amount, currency = 'RUB') {
  if (currency === 'RUB') return `${amount.toLocaleString('ru-RU')} ₽`;
  if (currency === 'USD') return `$${amount.toFixed(2)}`;
  return `${amount}`;
}

function maskCard(number) {
  const clean = number.replace(/\s/g, '');
  return `•••• •••• •••• ${clean.slice(-4)}`;
}

function detectNetwork(number) {
  const clean = number.replace(/\s/g, '');
  if (clean.startsWith('4')) return 'visa';
  if (clean.startsWith('5') || clean.startsWith('2')) return 'mastercard';
  if (clean.startsWith('2202') || clean.startsWith('2200')) return 'mir';
  return 'unknown';
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/* ============================================
   NAVIGATION
   ============================================ */
const Router = {
  history: [],

  go(screenId, options = {}) {
    const prev = document.querySelector('.screen.active');
    const next = document.getElementById('screen-' + screenId);
    if (!next || next === prev) return;

    if (prev) {
      prev.classList.remove('active');
      if (!options.replace) this.history.push(prev.id.replace('screen-', ''));
    }

    next.classList.remove('slide-left');
    next.classList.add('active');
    AppState.currentScreen = screenId;
  },

  back() {
    if (this.history.length === 0) return;
    const prevId = this.history.pop();
    const curr = document.querySelector('.screen.active');
    const prev = document.getElementById('screen-' + prevId);
    if (!prev) return;

    if (curr) {
      curr.classList.remove('active');
      curr.classList.add('slide-left');
      setTimeout(() => curr.classList.remove('slide-left'), 400);
    }

    prev.classList.add('active');
    AppState.currentScreen = prevId;
  }
};

const TabRouter = {
  switchTo(tabId) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const panel = document.getElementById('tab-' + tabId);
    const navItem = document.querySelector(`[data-tab="${tabId}"]`);

    if (panel) panel.classList.add('active');
    if (navItem) navItem.classList.add('active');
    AppState.currentTab = tabId;
  }
};

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */
const Toast = {
  show(title, message, icon = '🔔', duration = 3500) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

/* ============================================
   LOADING
   ============================================ */
const Loading = {
  show(text = 'Обработка...') {
    const overlay = document.getElementById('loading-overlay');
    overlay.querySelector('.loading-text').textContent = text;
    overlay.classList.add('show');
  },

  hide() {
    document.getElementById('loading-overlay').classList.remove('show');
  }
};

/* ============================================
   THEME MANAGER
   ============================================ */
const ThemeManager = {
  init() {
    this.apply(AppState.theme);
  },

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    AppState.theme = theme;
    localStorage.setItem('aura_theme', theme);

    // Обновляем meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#0a0a0f' : '#f5f5fa';

    // Обновляем переключатели
    document.querySelectorAll('[data-theme-toggle]').forEach(el => {
      el.classList.toggle('on', theme === 'light');
    });
  },

  toggle() {
    this.apply(AppState.theme === 'dark' ? 'light' : 'dark');
    Toast.show(
      AppState.theme === 'light' ? 'Светлая тема' : 'Тёмная тема',
      'Настройки внешнего вида сохранены',
      AppState.theme === 'light' ? '☀️' : '🌙'
    );
  }
};

/* ============================================
   CLOCK
   ============================================ */
function updateClock() {
  document.querySelectorAll('.status-time').forEach(el => {
    el.textContent = getCurrentTime();
  });
}

/* ============================================
   UI RENDERERS
   ============================================ */
const UI = {
  // Рендер карточки карты
  renderCard(card, options = {}) {
    const networkHTML = card.network === 'mastercard'
      ? `<div class="card-network-circles"><div class="circle-left"></div><div class="circle-right"></div></div>`
      : card.network === 'mir'
      ? `<span style="color:white;font-weight:700;font-size:12px;">МИР</span>`
      : `<span style="color:white;font-weight:700;font-size:13px;font-style:italic;">VISA</span>`;

    return `
      <div class="bank-card ${options.small ? 'small' : ''}" data-card-id="${card.id}" onclick="CardController.flip('${card.id}', this)">
        <div class="bank-card-inner">
          <div class="bank-card-front ${card.theme}">
            <div class="card-mesh"></div>
            <div class="card-pattern"></div>
            <div class="card-chip"></div>
            <div class="card-contactless">⊙</div>
            <div class="card-number">${card.number}</div>
            <div class="card-bottom">
              <div>
                <div class="card-holder">${card.holder}</div>
              </div>
              <div class="card-expiry-wrap">
                <div class="card-expiry-label">VALID THRU</div>
                <div class="card-expiry">${card.expiry}</div>
              </div>
            </div>
            <div class="card-network" style="bottom:16px;right:22px;position:absolute">
              ${networkHTML}
            </div>
          </div>
          <div class="bank-card-back ${card.theme}">
            <div class="card-mesh"></div>
            <div class="card-back-stripe"></div>
            <div class="card-cvv-wrap">
              <div class="card-cvv-label">CVV/CVC</div>
              <div class="card-cvv-box">
                <span class="card-cvv">•••</span>
              </div>
            </div>
            <div style="position:absolute;bottom:20px;left:22px;right:22px;display:flex;justify-content:space-between;align-items:center">
              <span style="color:rgba(255,255,255,0.6);font-size:11px;">${card.name}</span>
              ${networkHTML}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Рендер транзакции
  renderTransaction(tx) {
    const isCredit = tx.amount > 0;
    const amountStr = isCredit
      ? `+${tx.amount.toLocaleString('ru-RU')} ₽`
      : `−${Math.abs(tx.amount).toLocaleString('ru-RU')} ₽`;
    return `
      <div class="tx-item" onclick="UI.showTxDetail('${tx.id}')">
        <div class="tx-icon">${tx.icon}</div>
        <div class="tx-details">
          <div class="tx-merchant">${tx.merchant}</div>
          <div class="tx-date">${tx.date}</div>
        </div>
        <div class="tx-amount ${isCredit ? 'credit' : 'debit'}">${amountStr}</div>
      </div>
    `;
  },

  showTxDetail(txId) {
    const tx = AppState.transactions.find(t => t.id === txId);
    if (!tx) return;
    Toast.show(tx.merchant, `${tx.amount > 0 ? '+' : ''}${tx.amount.toLocaleString('ru-RU')} ₽ · ${tx.date}`, tx.icon);
  },

  // Рендер домашнего экрана
  renderHome() {
    const card = AppState.selectedCard || AppState.cards[0];
    const recentTxs = AppState.transactions.slice(0, 4);

    // Карусель карточек
    const cardsEl = document.getElementById('cards-carousel');
    if (cardsEl) {
      const addCardHTML = `
        <div class="card-add" onclick="Router.go('add-card')">
          <div class="card-add-icon">＋</div>
          <span>Добавить карту</span>
        </div>
      `;
      cardsEl.innerHTML = AppState.cards.map(c => this.renderCard(c)).join('') + addCardHTML;
    }

    // Баланс
    const balanceEl = document.getElementById('home-balance');
    if (balanceEl && card) {
      balanceEl.textContent = formatBalance(card.balance, card.currency);
    }

    // Транзакции
    const txEl = document.getElementById('recent-transactions');
    if (txEl) {
      txEl.innerHTML = recentTxs.map(tx => this.renderTransaction(tx)).join('');
    }

    // Имя
    const nameEl = document.getElementById('home-name');
    if (nameEl) nameEl.textContent = MOCK_DATA.user.name.split(' ')[0];
  },

  renderCards() {
    const el = document.getElementById('cards-list');
    if (!el) return;

    el.innerHTML = AppState.cards.map(card => `
      <div class="card-list-item" onclick="CardController.select('${card.id}')">
        <div class="card-list-preview ${card.theme}" style="box-shadow: 0 4px 12px rgba(0,0,0,0.3)"></div>
        <div class="card-list-info">
          <div class="card-list-name">${card.name}</div>
          <div class="card-list-num">${maskCard(card.number)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <div class="card-list-balance">${formatBalance(card.balance, card.currency)}</div>
          ${card.isDefault ? '<div class="card-default-badge">По умолчанию</div>' : ''}
        </div>
      </div>
    `).join('');
  },

  renderHistory() {
    const el = document.getElementById('history-list');
    if (!el) return;

    // Группировка по дате
    const groups = {};
    AppState.transactions.forEach(tx => {
      const key = tx.date.split(',')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    el.innerHTML = Object.entries(groups).map(([date, txs]) => `
      <div class="tx-group">
        <div class="tx-group-date">${date}</div>
        ${txs.map(tx => this.renderTransaction(tx)).join('')}
      </div>
    `).join('');
  },

  renderProfile() {
    const user = MOCK_DATA.user;
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const totalEl = document.getElementById('stat-total');
    const cardsEl = document.getElementById('stat-cards');

    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (totalEl) totalEl.textContent = `${AppState.transactions.length}`;
    if (cardsEl) cardsEl.textContent = `${AppState.cards.length}`;
  },

  updateNFCCard() {
    const card = AppState.selectedCard || AppState.cards[0];
    if (!card) return;

    const preview = document.getElementById('nfc-card-preview');
    const name = document.getElementById('nfc-card-name');
    const num = document.getElementById('nfc-card-num');

    if (preview) preview.className = `nfc-card-preview ${card.theme}`;
    if (name) name.textContent = card.name;
    if (num) num.textContent = maskCard(card.number);
  }
};

/* ============================================
   CARD CONTROLLER
   ============================================ */
const CardController = {
  flip(cardId, element) {
    const cardEl = element.closest('.bank-card');
    if (!cardEl) return;
    cardEl.classList.toggle('flipped');
  },

  select(cardId) {
    const card = AppState.cards.find(c => c.id === cardId);
    if (card) {
      AppState.selectedCard = card;
      Toast.show('Карта выбрана', card.name, '💳');
      UI.updateNFCCard();
      UI.renderHome();
    }
  },

  async addCard(formData) {
    Loading.show('Добавление карты...');
    try {
      // Токенизация
      const token = await MockTokenizer.tokenize(formData);
      
      // Добавление в бэкенд
      const result = await MockBankBackend.addCard(token);

      const newCard = {
        id: result.cardId,
        name: formData.name || 'Новая карта',
        number: formData.number,
        holder: MOCK_DATA.user.name.toUpperCase(),
        expiry: formData.expiry,
        cvv: '***',
        balance: 0,
        currency: 'RUB',
        theme: formData.theme || 'card-theme-violet',
        network: detectNetwork(formData.number),
        isDefault: false,
        token: token.token
      };

      AppState.addCard(newCard);
      Loading.hide();
      Toast.show('Карта добавлена', newCard.name + ' успешно привязана', '✅');
      Router.back();
      UI.renderHome();
      UI.renderCards();
    } catch (err) {
      Loading.hide();
      Toast.show('Ошибка', err.message, '❌');
    }
  }
};

/* ============================================
   PAYMENT CONTROLLER
   ============================================ */
const PaymentController = {
  async startNFC() {
    if (AppState.paymentInProgress) return;
    AppState.nfcActive = true;

    // Симуляция поиска терминала
    await delay(2000 + Math.random() * 2000);

    if (!AppState.nfcActive) return; // Отменено

    // Симуляция платежа
    await this.processPayment({
      merchant: 'Лукойл АЗС',
      amount: Math.floor(Math.random() * 3000) + 500,
      terminalId: 'TERM_' + generateId()
    });
  },

  async processPayment({ merchant, amount, terminalId }) {
    AppState.paymentInProgress = true;
    Loading.show('Обработка оплаты...');

    try {
      const card = AppState.selectedCard || AppState.cards[0];

      const result = await MockPaymentProcessor.processPayment({
        token: card.token,
        amount,
        currency: 'RUB',
        terminalId
      });

      // Добавляем транзакцию
      const tx = {
        id: 'TX_' + generateId(),
        merchant,
        category: 'payment',
        amount: -amount,
        date: 'Только что',
        icon: '💳',
        status: 'completed',
        authCode: result.authCode
      };
      AppState.addTransaction(tx);

      // Обновляем баланс карты
      card.balance -= amount;
      AppState.save();

      Loading.hide();
      AppState.paymentInProgress = false;
      AppState.nfcActive = false;

      this.showSuccess({ merchant, amount, authCode: result.authCode });
    } catch (err) {
      Loading.hide();
      AppState.paymentInProgress = false;
      AppState.nfcActive = false;
      Toast.show('Платёж отклонён', 'Попробуйте ещё раз', '❌');
    }
  },

  showSuccess({ merchant, amount, authCode }) {
    // Заполняем экран успеха
    document.getElementById('success-amount').textContent = `−${amount.toLocaleString('ru-RU')} ₽`;
    document.getElementById('success-merchant').textContent = merchant;
    document.getElementById('success-authcode').textContent = authCode;
    document.getElementById('success-card').textContent = maskCard(AppState.selectedCard?.number || '');
    document.getElementById('success-time').textContent = new Date().toLocaleTimeString('ru-RU');

    Router.go('success');
    this.scheduleNotification(merchant, amount);
  },

  scheduleNotification(merchant, amount) {
    setTimeout(() => {
      Toast.show(
        '💜 AURA Pay',
        `Оплачено ${amount.toLocaleString('ru-RU')} ₽ · ${merchant}`,
        '✅'
      );
    }, 500);
  },

  stopNFC() {
    AppState.nfcActive = false;
    AppState.paymentInProgress = false;
    MockNFC.stopEmulation();
  },

  // Mock платёж для демо
  async demoPayment() {
    const merchants = ['Пятёрочка', 'Кофе Хауз', 'Burger King', 'Subway', 'ВкусВилл'];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const amount = Math.floor(Math.random() * 2000) + 100;
    await this.processPayment({ merchant, amount, terminalId: 'DEMO' });
  }
};

/* ============================================
   BIOMETRIC AUTH
   ============================================ */
const BiometricAuth = {
  show(type = 'faceid') {
    const modal = document.getElementById('biometric-modal');
    const title = document.getElementById('biometric-title');
    const icon = document.getElementById('biometric-icon-large');
    const desc = document.getElementById('biometric-desc');

    if (type === 'faceid') {
      title.textContent = 'Face ID';
      icon.textContent = '👤';
      desc.textContent = 'Поднесите телефон к лицу для авторизации';
    } else {
      title.textContent = 'Touch ID';
      icon.textContent = '👆';
      desc.textContent = 'Приложите палец к сенсору';
    }

    modal.classList.add('show');
    this.simulate();
  },

  simulate() {
    setTimeout(() => {
      this.success();
    }, 2000);
  },

  success() {
    const modal = document.getElementById('biometric-modal');
    modal.classList.remove('show');

    localStorage.setItem('aura_auth', 'true');
    AppState.isAuthenticated = true;
    Router.go('main', { replace: true });
    UI.renderHome();
    UI.renderCards();
    UI.renderHistory();
    UI.renderProfile();
    UI.updateNFCCard();

    setTimeout(() => {
      Toast.show('Добро пожаловать!', MOCK_DATA.user.name, '👋');
    }, 500);
  },

  cancel() {
    document.getElementById('biometric-modal').classList.remove('show');
  }
};

/* ============================================
   AUTH CONTROLLER
   ============================================ */
const AuthController = {
  login(phone, password) {
    if (phone.length < 10 || password.length < 4) {
      Toast.show('Ошибка', 'Введите корректные данные', '⚠️');
      return;
    }

    Loading.show('Вход в систему...');
    delay(1200).then(() => {
      Loading.hide();
      localStorage.setItem('aura_auth', 'true');
      AppState.isAuthenticated = true;
      Router.go('main', { replace: true });
      UI.renderHome();
      UI.renderCards();
      UI.renderHistory();
      UI.renderProfile();
      UI.updateNFCCard();

      setTimeout(() => {
        Toast.show('Добро пожаловать!', MOCK_DATA.user.name, '👋');
      }, 500);
    });
  },

  logout() {
    localStorage.removeItem('aura_auth');
    AppState.isAuthenticated = false;
    Router.go('auth', { replace: true });
    Toast.show('Вы вышли', 'До свидания!', '👋');
  }
};

/* ============================================
   ADD CARD FORM
   ============================================ */
const AddCardController = {
  selectedTheme: 'card-theme-violet',

  updatePreview() {
    const preview = document.getElementById('card-preview-live');
    if (!preview) return;

    const num1 = document.getElementById('cn1')?.value || '****';
    const num2 = document.getElementById('cn2')?.value || '****';
    const num3 = document.getElementById('cn3')?.value || '****';
    const num4 = document.getElementById('cn4')?.value || '****';
    const exp = document.getElementById('card-expiry-input')?.value || 'MM/YY';
    const name = document.getElementById('card-name-input')?.value || 'CARD NAME';

    preview.className = `card-preview-live ${this.selectedTheme}`;
    preview.innerHTML = `
      <div class="card-mesh"></div>
      <div class="card-pattern"></div>
      <div class="card-chip"></div>
      <div class="card-contactless">⊙</div>
      <div class="card-number" style="bottom:50px;left:22px;position:absolute;font-family:var(--font-display);font-size:15px;color:rgba(255,255,255,0.9);letter-spacing:3px">${num1} ${num2} ${num3} ${num4}</div>
      <div style="position:absolute;bottom:18px;left:22px">
        <div style="font-size:10px;color:rgba(255,255,255,0.6)">VALID THRU</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.9);font-weight:600">${exp}</div>
      </div>
      <div style="position:absolute;bottom:22px;right:22px;font-size:12px;color:rgba(255,255,255,0.7);text-transform:uppercase">${name}</div>
    `;
  },

  selectTheme(theme, el) {
    this.selectedTheme = theme;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    el.classList.add('selected');
    this.updatePreview();
  },

  submit() {
    const num = [
      document.getElementById('cn1')?.value,
      document.getElementById('cn2')?.value,
      document.getElementById('cn3')?.value,
      document.getElementById('cn4')?.value
    ].join(' ');

    const expiry = document.getElementById('card-expiry-input')?.value;
    const cvv = document.getElementById('card-cvv-input')?.value;
    const name = document.getElementById('card-name-input')?.value || 'Новая карта';

    if (num.replace(/\s/g, '').length < 16) {
      Toast.show('Ошибка', 'Введите номер карты', '⚠️'); return;
    }
    if (!expiry || expiry.length < 5) {
      Toast.show('Ошибка', 'Введите срок действия', '⚠️'); return;
    }
    if (!cvv || cvv.length < 3) {
      Toast.show('Ошибка', 'Введите CVV', '⚠️'); return;
    }

    CardController.addCard({
      number: num,
      expiry,
      cvv,
      name,
      theme: this.selectedTheme
    });
  }
};

/* ============================================
   EVENT LISTENERS
   ============================================ */
function initEventListeners() {
  // Bottom navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      if (tab) TabRouter.switchTo(tab);
    });
  });

  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Auto-format card inputs
  ['cn1', 'cn2', 'cn3', 'cn4'].forEach((id, idx) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').slice(0, 4);
      AddCardController.updatePreview();
      if (this.value.length === 4 && idx < 3) {
        document.getElementById(['cn1','cn2','cn3','cn4'][idx + 1])?.focus();
      }
    });
  });

  // Expiry format
  const expiryEl = document.getElementById('card-expiry-input');
  if (expiryEl) {
    expiryEl.addEventListener('input', function() {
      let v = this.value.replace(/\D/g, '');
      if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2,4);
      this.value = v;
      AddCardController.updatePreview();
    });
  }

  // CVV
  const cvvEl = document.getElementById('card-cvv-input');
  if (cvvEl) {
    cvvEl.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').slice(0, 3);
    });
  }

  // Card name
  const cardNameEl = document.getElementById('card-name-input');
  if (cardNameEl) {
    cardNameEl.addEventListener('input', () => AddCardController.updatePreview());
  }

  // Phone input format
  const phoneEl = document.getElementById('auth-phone');
  if (phoneEl) {
    phoneEl.addEventListener('input', function() {
      let v = this.value.replace(/\D/g, '');
      if (v.startsWith('7') || v.startsWith('8')) v = v.slice(1);
      if (v.length <= 10) {
        let formatted = '+7';
        if (v.length > 0) formatted += ' (' + v.slice(0, 3);
        if (v.length > 3) formatted += ') ' + v.slice(3, 6);
        if (v.length > 6) formatted += '-' + v.slice(6, 8);
        if (v.length > 8) formatted += '-' + v.slice(8, 10);
        this.value = formatted;
      }
    });
  }

  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('show');
        BiometricAuth.cancel();
        PaymentController.stopNFC();
        if (typeof SettingsModal !== 'undefined') SettingsModal.close();
      }
    });
  });
}

/* ============================================
   PWA INSTALL
   ============================================ */
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  
  // Показываем кнопку установки
  setTimeout(() => {
    Toast.show('Установить приложение', 'AURA Wallet доступен для установки', '📱');
  }, 3000);
});

function installPWA() {
  if (!deferredInstallPrompt) {
    Toast.show('Уже установлено', 'AURA Wallet запущен как приложение', '✅');
    return;
  }
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(result => {
    if (result.outcome === 'accepted') {
      Toast.show('Установлено!', 'AURA Wallet добавлен на рабочий стол', '🎉');
    }
    deferredInstallPrompt = null;
  });
}

/* ============================================
   SERVICE WORKER REGISTRATION
   ============================================ */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('[SW] Зарегистрирован:', reg.scope))
      .catch(err => console.warn('[SW] Ошибка регистрации:', err));
  }
}

/* ============================================
   APP INITIALIZATION
   ============================================ */
async function initApp() {
  // Загрузка состояния
  AppState.load();
  
  // Применяем тему
  ThemeManager.init();

  // Обновляем часы
  updateClock();
  setInterval(updateClock, 30000);

  // Инициализируем обработчики
  initEventListeners();

  // Показываем splash
  Router.go('splash');

  // Симулируем загрузку
  await delay(2200);

  // Переход на авторизацию или главный экран
  if (AppState.isAuthenticated) {
    Router.go('main', { replace: true });
    UI.renderHome();
    UI.renderCards();
    UI.renderHistory();
    UI.renderProfile();
    UI.updateNFCCard();
  } else {
    Router.go('auth', { replace: true });
  }

  // Регистрируем SW
  registerServiceWorker();
}

// Запуск
document.addEventListener('DOMContentLoaded', initApp);

/* ============================================
   PHONE PAY CONTROLLER — Tilt to Pay
   ============================================ */
const PhonePayController = {
  _tiltHandler: null,
  _holdInterval: null,
  _progress: 0,
  _done: false,

  open() {
    this._done = false;
    this._progress = 0;

    // Show card info
    const card = AppState.selectedCard || AppState.cards[0];
    const lbl = document.getElementById('phone-pay-card-label');
    if (lbl && card) lbl.textContent = '\u2022\u2022\u2022\u2022 ' + card.number.replace(/\s/g,'').slice(-4) + ' \u00b7 ' + card.name;

    // Reset UI
    const input = document.getElementById('phone-pay-amount-input');
    if (input) input.value = '';
    this._setProgress(0);
    document.getElementById('phone-pay-step-input').style.display = '';
    document.getElementById('phone-pay-success').style.display = 'none';

    Router.go('phone-pay');
    this._startTilt();
    this._bindHoldBtn();
  },

  _setProgress(pct) {
    this._progress = pct;
    const fill = document.getElementById('tilt-bar-fill');
    const pctEl = document.getElementById('tilt-pct');
    const phoneWrap = document.getElementById('tilt-phone-wrap');
    if (fill) {
      fill.style.width = pct + '%';
      if (pct >= 100) fill.classList.add('done');
      else fill.classList.remove('done');
    }
    if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    if (phoneWrap) phoneWrap.style.transform = 'rotate(' + (pct * 0.55) + 'deg)';
  },

  _startTilt() {
    if (this._tiltHandler) window.removeEventListener('deviceorientation', this._tiltHandler);

    const handler = (e) => {
      if (this._done) return;
      const amount = parseFloat(document.getElementById('phone-pay-amount-input').value);
      if (!amount || amount <= 0) return;

      // beta: device tilts forward = beta goes negative from 0
      const beta = e.beta || 0;
      const forward = Math.max(0, -beta); // 0..60 expected range
      const pct = Math.min(100, forward / 55 * 100);
      this._setProgress(pct);
      if (pct >= 100) this._confirm();
    };

    this._tiltHandler = handler;

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(s => { if (s === 'granted') window.addEventListener('deviceorientation', handler); })
          .catch(() => {}); // fallback: use hold btn
      } else {
        window.addEventListener('deviceorientation', handler);
      }
    }
  },

  _bindHoldBtn() {
    const btn = document.getElementById('tilt-hold-btn');
    if (!btn) return;
    btn.onpointerdown = () => {
      if (this._holdInterval) return;
      this._holdInterval = setInterval(() => {
        if (this._done) { clearInterval(this._holdInterval); this._holdInterval = null; return; }
        const amount = parseFloat(document.getElementById('phone-pay-amount-input').value);
        if (!amount || amount <= 0) {
          Toast.show('\u041e\u0448\u0438\u0431\u043a\u0430', '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0441\u0443\u043c\u043c\u0443', '\u26a0\ufe0f');
          clearInterval(this._holdInterval); this._holdInterval = null; return;
        }
        const newPct = Math.min(100, this._progress + 2.5);
        this._setProgress(newPct);
        if (newPct >= 100) {
          clearInterval(this._holdInterval); this._holdInterval = null;
          this._confirm();
        }
      }, 40);
    };
    const stop = () => { clearInterval(this._holdInterval); this._holdInterval = null; };
    btn.onpointerup = stop;
    btn.onpointerleave = stop;
    btn.onpointercancel = stop;
  },

  async _confirm() {
    if (this._done) return;
    this._done = true;
    if (this._tiltHandler) { window.removeEventListener('deviceorientation', this._tiltHandler); this._tiltHandler = null; }

    const amount = parseFloat(document.getElementById('phone-pay-amount-input').value);
    const card = AppState.selectedCard || AppState.cards[0];

    Loading.show('\u041e\u0431\u0440\u0430\u0431\u043e\u0442\u043a\u0430 \u043e\u043f\u043b\u0430\u0442\u044b...');
    await delay(1400);
    Loading.hide();

    // Add transaction
    const tx = {
      id: 'TX_' + generateId(),
      merchant: '\u041e\u043f\u043b\u0430\u0442\u0430 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u043e\u043c',
      category: 'payment',
      amount: -amount,
      date: '\u0422\u043e\u043b\u044c\u043a\u043e \u0447\u0442\u043e',
      icon: '\ud83d\udcf1',
      status: 'completed',
      authCode: generateId().slice(0,6)
    };
    AppState.addTransaction(tx);
    if (card) { card.balance -= amount; AppState.save(); }

    // Show success
    document.getElementById('phone-pay-step-input').style.display = 'none';
    const successEl = document.getElementById('phone-pay-success');
    successEl.style.display = 'flex';

    // Set amount
    const amtEl = document.getElementById('pps-amount');
    if (amtEl) amtEl.textContent = amount.toLocaleString('ru-RU') + ' \u20bd';

    // Animate SVG circle
    const circle = document.getElementById('pps-circle-fill');
    if (circle) {
      const c = 2 * Math.PI * 54;
      circle.style.strokeDasharray = c;
      circle.style.strokeDashoffset = c;
      requestAnimationFrame(() => {
        circle.style.transition = 'stroke-dashoffset 0.85s cubic-bezier(0.4,0,0.2,1)';
        circle.style.strokeDashoffset = '0';
      });
    }

    setTimeout(() => {
      const chk = document.getElementById('pps-checkmark');
      if (chk) chk.classList.add('visible');
    }, 650);

    setTimeout(() => {
      const lbl = document.getElementById('pps-label');
      if (lbl) lbl.classList.add('visible');
    }, 950);

    // Confetti
    this._spawnConfetti();
  },

  _spawnConfetti() {
    const container = document.getElementById('pps-confetti');
    if (!container) return;
    const colors = ['#7B2EFF','#00D68F','#FFAA00','#FF4D6A','#fff'];
    for (let i = 0; i < 35; i++) {
      const d = document.createElement('div');
      d.className = 'confetti-dot';
      d.style.cssText = [
        'left:' + (10 + Math.random() * 80) + '%',
        'top:' + (-10 + Math.random() * 20) + 'px',
        'background:' + colors[Math.floor(Math.random() * colors.length)],
        'width:' + (5 + Math.random() * 7) + 'px',
        'height:' + (5 + Math.random() * 7) + 'px',
        'border-radius:' + (Math.random() > 0.5 ? '50%' : '2px'),
        'animation-duration:' + (1.8 + Math.random() * 2.2) + 's',
        'animation-delay:' + (Math.random() * 0.6) + 's'
      ].join(';');
      container.appendChild(d);
      setTimeout(() => d.remove(), 4000);
    }
  },

  cancel() {
    if (this._tiltHandler) { window.removeEventListener('deviceorientation', this._tiltHandler); this._tiltHandler = null; }
    if (this._holdInterval) { clearInterval(this._holdInterval); this._holdInterval = null; }
    this._done = false;
    Router.back();
  },

  goHome() {
    this.cancel();
    Router.go('main', { replace: true });
    UI.renderHome();
  }
};

/* ============================================
   SETTINGS CONTROLLER — toggles
   ============================================ */
const SettingsController = {
  toggle(el, key) {
    const isOn = el.classList.toggle('on');
    const label = el.previousElementSibling?.querySelector('.settings-label')?.textContent || key;
    Toast.show(label, isOn ? '\u0412\u043a\u043b\u044e\u0447\u0435\u043d\u043e' : '\u041e\u0442\u043a\u043b\u044e\u0447\u0435\u043d\u043e', isOn ? '\u2705' : '\u274c');
  }
};

/* ============================================
   SETTINGS MODAL
   ============================================ */
const SettingsModal = {
  _content: {
    personal: {
      title: '\ud83d\udc64 \u041b\u0438\u0447\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435',
      rows: [
        ['\u0418\u043c\u044f', '\u041c\u0430\u043a\u0441\u0438\u043c \u041e\u0440\u043b\u043e\u0432'],
        ['\u0422\u0435\u043b\u0435\u0444\u043e\u043d', '+7 (999) 123-45-67'],
        ['Email', 'max.orlov@mail.ru'],
        ['\u0414\u0430\u0442\u0430 \u0440\u043e\u0436\u0434\u0435\u043d\u0438\u044f', '15.06.1995'],
        ['\u0413\u0440\u0430\u0436\u0434\u0430\u043d\u0441\u0442\u0432\u043e', '\ud83c\uddf7\ud83c\uddfa \u0420\u043e\u0441\u0441\u0438\u044f']
      ]
    },
    verify: {
      title: '\u2705 \u0412\u0435\u0440\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f KYC',
      rows: [
        ['\u041f\u0430\u0441\u043f\u043e\u0440\u0442 \u0420\u0424', '\u2713 \u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043d'],
        ['\u0421\u041d\u0418\u041b\u0421', '\u2713 \u041f\u0440\u0438\u0432\u044f\u0437\u0430\u043d'],
        ['\u0418\u041d\u041d', '\u23f3 \u041e\u0436\u0438\u0434\u0430\u0435\u0442'],
        ['\u0423\u0440\u043e\u0432\u0435\u043d\u044c', 'Level 2 \u2014 \u0434\u043e 600 000 \u20bd/\u0441\u0443\u0442'],
        ['\u041b\u0438\u043c\u0438\u0442 \u043f\u0435\u0440\u0435\u0432\u043e\u0434\u0430', '150 000 \u20bd/\u043c\u0435\u0441']
      ]
    },
    referral: {
      title: '\ud83c\udf81 \u0420\u0435\u0444\u0435\u0440\u0430\u043b\u044c\u043d\u0430\u044f \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430',
      rows: [
        ['\u0412\u0430\u0448 \u043a\u043e\u0434', 'AURA-M4K4R'],
        ['\u041f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u043e \u0434\u0440\u0443\u0437\u0435\u0439', '3'],
        ['\u0417\u0430\u0440\u0430\u0431\u043e\u0442\u0430\u043d\u043e', '+1 500 \u20bd'],
        ['\u0411\u043e\u043d\u0443\u0441 \u0437\u0430 \u0434\u0440\u0443\u0433\u0430', '500 \u20bd']
      ]
    },
    pin: {
      title: '\ud83d\udd22 PIN-\u043a\u043e\u0434',
      rows: [
        ['\u0422\u0435\u043a\u0443\u0449\u0438\u0439 PIN', '\u2022\u2022\u2022\u2022\u2022\u2022'],
        ['\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u044f\u044f \u0441\u043c\u0435\u043d\u0430', '3 \u043d\u0435\u0434\u0435\u043b\u0438 \u043d\u0430\u0437\u0430\u0434'],
        ['\u0421\u043b\u043e\u0436\u043d\u043e\u0441\u0442\u044c', '\u0412\u044b\u0441\u043e\u043a\u0430\u044f'],
        ['\u0411\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u043a\u0430 \u043f\u043e\u0441\u043b\u0435', '5 \u043f\u043e\u043f\u044b\u0442\u043e\u043a']
      ],
      action: { label: '\u0421\u043c\u0435\u043d\u0438\u0442\u044c PIN', cls: 'primary' }
    },
    '2fa': {
      title: '\ud83d\udee1\ufe0f \u0414\u0432\u0443\u0445\u0444\u0430\u043a\u0442\u043e\u0440\u043d\u0430\u044f \u0437\u0430\u0449\u0438\u0442\u0430',
      rows: [
        ['\u0421\u0442\u0430\u0442\u0443\u0441', '\u2705 \u0412\u043a\u043b\u044e\u0447\u0435\u043d\u0430'],
        ['\u041c\u0435\u0442\u043e\u0434', 'SMS \u043d\u0430 +7 (999) ***-45-67'],
        ['\u0420\u0435\u0437\u0435\u0440\u0432\u043d\u044b\u0435 \u043a\u043e\u0434\u044b', '8 \u043a\u043e\u0434\u043e\u0432'],
        ['\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0435\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435', '\u0421\u0435\u0433\u043e\u0434\u043d\u044f 10:12']
      ]
    },
    sessions: {
      title: '\ud83d\udccd \u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u0441\u0435\u0441\u0441\u0438\u0438',
      rows: [
        ['iPhone 12 \u2014 \u041c\u043e\u0441\u043a\u0432\u0430', '\u2022 \u0421\u0435\u0439\u0447\u0430\u0441'],
        ['Chrome \u2014 \u041c\u043e\u0441\u043a\u0432\u0430', '2 \u0434\u043d\u044f \u043d\u0430\u0437\u0430\u0434'],
        ['\u0412\u0441\u0435\u0433\u043e \u0443\u0441\u0442\u0440\u043e\u0439\u0441\u0442\u0432', '2']
      ],
      action: { label: '\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044c \u0434\u0440\u0443\u0433\u0438\u0435 \u0441\u0435\u0441\u0441\u0438\u0438', cls: 'danger' }
    },
    limits: {
      title: '\ud83d\udcca \u041b\u0438\u043c\u0438\u0442\u044b',
      rows: [
        ['\u0414\u043d\u0435\u0432\u043d\u043e\u0439 \u043b\u0438\u043c\u0438\u0442', '100 000 \u20bd'],
        ['\u041e\u0434\u043d\u0430 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u044f', '30 000 \u20bd'],
        ['\u0411\u0435\u0437 \u043f\u0438\u043d-\u043a\u043e\u0434\u0430', '\u0434\u043e 3 000 \u20bd'],
        ['\u041c\u0435\u0441\u044f\u0447\u043d\u043e', '500 000 \u20bd'],
        ['\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u043e \u0441\u0435\u0433\u043e\u0434\u043d\u044f', '4 200 \u20bd / 100 000 \u20bd']
      ],
      action: { label: '\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u043b\u0438\u043c\u0438\u0442\u044b', cls: 'primary' }
    },
    sbp: {
      title: '\u26a1 \u0421\u0411\u041f',
      rows: [
        ['\u0421\u0442\u0430\u0442\u0443\u0441', '\u2705 \u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d'],
        ['\u0411\u0430\u043d\u043a \u043f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e', 'AURA Bank'],
        ['\u041f\u0440\u0438\u0432\u044f\u0437\u0430\u043d\u043d\u044b\u0439 \u0442\u0435\u043b\u0435\u0444\u043e\u043d', '+7 (999) 123-45-67'],
        ['\u041e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0435', '100 000 \u20bd/\u0441\u0443\u0442'],
        ['\u041a\u043e\u043c\u0438\u0441\u0441\u0438\u044f', '0%']
      ]
    },
    cashback: {
      title: '\ud83d\udcb0 \u041a\u044d\u0448\u0431\u044d\u043a',
      rows: [
        ['\u041d\u0430\u043a\u043e\u043f\u043b\u0435\u043d\u043e', '2 340 \u20bd'],
        ['\u0427\u0435\u043a\u0430\u0448\u043d\u0438\u0446\u044b / \u043a\u0430\u0444\u0435', '5%'],
        ['\u0421\u0443\u043f\u0435\u0440\u043c\u0430\u0440\u043a\u0435\u0442\u044b', '2%'],
        ['\u041e\u0441\u0442\u0430\u043b\u044c\u043d\u044b\u0435', '1%'],
        ['\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430', 'AURA Pro Max']
      ],
      action: { label: '\u0412\u044b\u0432\u0435\u0441\u0442\u0438 \u043a\u044d\u0448\u0431\u044d\u043a', cls: 'primary' }
    },
    split: {
      title: '\ud83c\udf55 \u0420\u0430\u0437\u0434\u0435\u043b\u0438\u0442\u044c \u0441\u0447\u0451\u0442',
      rows: [
        ['\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 \u0441\u0447\u0451\u0442', '4 200 \u20bd \u2014 5 \u0447\u0435\u043b.'],
        ['\u0412\u0430\u0448\u0430 \u0434\u043e\u043b\u044f', '840 \u20bd'],
        ['\u0421\u043f\u043e\u0441\u043e\u0431', '\u041f\u043e\u0440\u043e\u0432\u043d\u0443, QR, \u0421\u0411\u041f']
      ],
      action: { label: '\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0437\u0430\u043f\u0440\u043e\u0441', cls: 'primary' }
    },
    export: {
      title: '\ud83d\udce5 \u042d\u043a\u0441\u043f\u043e\u0440\u0442',
      rows: [
        ['\u0424\u043e\u0440\u043c\u0430\u0442', 'CSV, PDF, XLSX'],
        ['\u041f\u0435\u0440\u0438\u043e\u0434', '\u041b\u044e\u0431\u043e\u0439'],
        ['\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 \u044d\u043a\u0441\u043f\u043e\u0440\u0442', '15 \u043c\u0430\u044f 2026']
      ],
      action: { label: '\u0421\u043a\u0430\u0447\u0430\u0442\u044c \u0432\u044b\u043f\u0438\u0441\u043a\u0443 (PDF)', cls: 'primary' }
    },
    delete: {
      title: '\ud83d\uddd1\ufe0f \u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442',
      rows: [
        ['\u0414\u0430\u043d\u043d\u044b\u0435', '\u0411\u0443\u0434\u0443\u0442 \u0443\u0434\u0430\u043b\u0435\u043d\u044b'],
        ['\u041a\u0430\u0440\u0442\u044b', '\u0411\u0443\u0434\u0443\u0442 \u043e\u0442\u0432\u044f\u0437\u0430\u043d\u044b'],
        ['\u0411\u0430\u043b\u0430\u043d\u0441', '\u041d\u0435\u043e\u0431\u0445\u043e\u0434\u0438\u043c\u043e \u0432\u044b\u0432\u0435\u0441\u0442\u0438'],
        ['\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435', '\u041d\u0435\u043e\u0431\u0440\u0430\u0442\u0438\u043c\u043e']
      ],
      action: { label: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442', cls: 'danger' }
    },
    about: {
      title: '\u2139\ufe0f \u041e \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0438',
      rows: [
        ['\u0412\u0435\u0440\u0441\u0438\u044f', '1.0.0 (build 42)'],
        ['\u041f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430', 'PWA / Web App'],
        ['\u0420\u0430\u0437\u0440\u0430\u0431\u043e\u0442\u0447\u0438\u043a', 'AURA Technologies'],
        ['\u041b\u0438\u0446\u0435\u043d\u0437\u0438\u044f', 'MIT'],
        ['\u0428\u0438\u0444\u0440\u043e\u0432\u0430\u043d\u0438\u0435', 'TLS 1.3 + AES-256']
      ]
    }
  },

  show(key) {
    const cfg = this._content[key];
    if (!cfg) { Toast.show('\u0421\u043a\u043e\u0440\u043e', '\u041f\u0440\u0438\u0434\u0451\u0442 \u0432 \u043e\u0431\u043d\u043e\u0432\u043b\u0435\u043d\u0438\u0438', '\ud83d\udd27'); return; }

    const rows = (cfg.rows || []).map(([l, v]) =>
      '<div class="smodal-field"><div class="smodal-label">' + l + '</div><div class="smodal-val">' + v + '</div></div>'
    ).join('');

    const actionBtn = cfg.action
      ? '<button class="smodal-action ' + cfg.action.cls + '" onclick="Toast.show(\'' + cfg.action.label + '\',\'\u0421\u043a\u043e\u0440\u043e \u0431\u0443\u0434\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e\',\'✨\')">' + cfg.action.label + '</button>'
      : '';

    document.getElementById('settings-modal-body').innerHTML =
      '<div class="smodal-title">' + cfg.title + '</div>' + rows + actionBtn;

    document.getElementById('settings-modal').classList.add('show');
  },

  close() {
    document.getElementById('settings-modal').classList.remove('show');
  }
};
