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
