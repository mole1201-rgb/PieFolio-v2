// 存股理財小幫手 Core Logic (Phase 1 MVP)

// 預設的展示持股名單 (Mock Data Template)
const defaultPortfolio = [
    { name: "元大台灣50", code: "0050", shares: 2500, avgCost: 150.00, currentPrice: 165.20, macro: "growth", tag: "市值型" },
    { name: "國泰永續高股息", code: "00878", shares: 15400, avgCost: 19.50, currentPrice: 22.80, macro: "dividend", tag: "高股息" },
    { name: "富邦台50", code: "006208", shares: 1000, avgCost: 80.00, currentPrice: 91.50, macro: "growth", tag: "市值型" },
    { name: "兆豐金", code: "2886", shares: 5000, avgCost: 35.00, currentPrice: 38.60, macro: "dividend", tag: "金融" },
    { name: "玉山金", code: "2884", shares: 8000, avgCost: 26.50, currentPrice: 28.10, macro: "dividend", tag: "金融" }
];

// 本地端資料庫 (Local Storage): 確保您的資料儲存於瀏覽器，不與朋友共用
let portfolio = [];
const savedPortfolio = localStorage.getItem('myPortfolio');
if (savedPortfolio) {
    try {
        portfolio = JSON.parse(savedPortfolio);
    } catch (e) {
        portfolio = [...defaultPortfolio];
    }
} else {
    portfolio = [...defaultPortfolio];
    localStorage.setItem('myPortfolio', JSON.stringify(portfolio));
}

function savePortfolio() {
    localStorage.setItem('myPortfolio', JSON.stringify(portfolio));
}

// ==========================================
// 市場指數與概況 (Market Indices)
// ==========================================
// 預設全球市場指數
const defaultIndices = [
    { symbol: '^TWII', name: '台灣加權', price: 0, change: 0 },
    { symbol: '^GSPC', name: '標普 500', price: 0, change: 0 },
    { symbol: 'BTC-USD', name: '比特幣', price: 0, change: 0 }
];

let marketIndices = [];
const savedIndices = localStorage.getItem('myMarketIndices');
if (savedIndices) {
    try {
        marketIndices = JSON.parse(savedIndices);
        // 舊版資料過渡，如果發現沒有 symbol 則套用新預設值
        if (marketIndices.length > 0 && !marketIndices[0].symbol) {
            marketIndices = [...defaultIndices];
            saveMarketIndices();
        }
    } catch (e) {
        marketIndices = [...defaultIndices];
    }
} else {
    marketIndices = [...defaultIndices];
    localStorage.setItem('myMarketIndices', JSON.stringify(marketIndices));
}

function saveMarketIndices() {
    localStorage.setItem('myMarketIndices', JSON.stringify(marketIndices));
}

const elements = {
    assetTableBody: document.getElementById('assetTableBody'),
    totalValue: document.getElementById('totalValue'),
    totalProfit: document.getElementById('totalProfit'),
    totalValueChange: document.getElementById('totalValueChange'),
    profitRatio: document.getElementById('profitRatio'),
    addAssetBtn: document.getElementById('addAssetBtn'),
    pieChartMode: document.getElementById('pieChartMode'),

    // Phase 2 Elements
    dividendCalcArea: document.getElementById('dividendCalcArea'),
    totalDividendOutput: document.getElementById('totalDividendOutput'),

    // Add Asset Modal Elements
    addAssetModal: document.getElementById('addAssetModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    addAssetForm: document.getElementById('addAssetForm'),

    // Modal Inputs
    modalTitle: document.getElementById('modalTitle'),

    // Indices Elements
    marketIndicesGrid: document.getElementById('marketIndicesGrid'),
    openIndicesModalBtn: document.getElementById('openIndicesModalBtn'),
    editIndicesModal: document.getElementById('editIndicesModal'),
    closeIndicesModalBtn: document.getElementById('closeIndicesModalBtn'),
    cancelIndicesBtn: document.getElementById('cancelIndicesBtn'),
    saveIndicesBtn: document.getElementById('saveIndicesBtn'),
    indicesEditList: document.getElementById('indicesEditList'),
    addNewIndexBtn: document.getElementById('addNewIndexBtn'),
    assetName: document.getElementById('assetName'),
    assetCode: document.getElementById('assetCode'),
    assetMacro: document.getElementById('assetMacro'),
    assetTag: document.getElementById('assetTag'),
    assetShares: document.getElementById('assetShares'),
    assetCost: document.getElementById('assetCost'),
    assetPrice: document.getElementById('assetPrice'),
    assetTargetReturn: document.getElementById('assetTargetReturn'),
    submitAssetBtn: document.querySelector('#addAssetForm button[type="submit"]'),
    groupSelect: document.getElementById('groupSelect')
};

// ==========================================
// 初始化：設定頁面事件綁定 (移至最前方確保執行)
// ==========================================
function initSettingsEvents() {
    console.log("🚀 [System] Initializing Settings Events...");
    
    // 綁定策略按鈕
    const strategyBtn = document.getElementById('addCustomStrategyBtn');
    if (strategyBtn) {
        strategyBtn.onclick = function() { window.addCustomStrategy(); };
    }

    // 綁定標籤按鈕
    const tagBtn = document.getElementById('addCustomTagBtn');
    if (tagBtn) {
        tagBtn.onclick = function() { window.addCustomTag(); };
    }

    // 支援 Enter 鍵
    const tagInput = document.getElementById('newTagName');
    if (tagInput) {
        tagInput.onkeypress = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.addCustomTag();
            }
        };
    }

    // 當 Modal 開啟時更新標籤推薦
    if (elements.addAssetBtn) {
        elements.addAssetBtn.addEventListener('click', updateTagSuggestions);
    }
}

// 立即嘗試執行一次，並在 DOM 加載後再執行一次
initSettingsEvents();
document.addEventListener('DOMContentLoaded', initSettingsEvents);
window.onload = initSettingsEvents;

// ==========================================
// 核心自訂功能定義 (提前至此確保按鈕點擊有效)
// ==========================================
window.addCustomStrategy = function () {
    console.log("🚀 [System] Add Strategy Clicked");
    try {
        const id = prompt("請輸入策略代碼 (ID，建議用英文字母，如：aggressive):");
        if (!id) return;
        if (customStrategies.find(s => s.id === id)) {
            alert("代碼已存在！");
            return;
        }
        const name = prompt("請輸入顯示名稱 (如：積極型):", "新策略");
        if (!name) return;

        customStrategies.push({ id, name, color: '#60a5fa' });
        saveStrategyConfig();
    } catch (e) {
        console.error("Add Strategy Error:", e);
        alert("新增策略時發生錯誤: " + e.message);
    }
};

window.addCustomTag = function () {
    console.log("🚀 [System] Add Tag Clicked");
    try {
        const input = document.getElementById('newTagName');
        if (!input) return;
        const name = input.value.trim();
        if (!name) return;
        if (customTags.includes(name)) {
            alert("標籤已存在！");
            return;
        }
        customTags.push(name);
        input.value = '';
        saveTagConfig();
    } catch (e) {
        console.error("Add Tag Error:", e);
        alert("新增標籤時發生錯誤: " + e.message);
    }
};

window.updateStrategy = function (index, field, value) {
    customStrategies[index][field] = value;
    saveStrategyConfig();
};

window.deleteCustomStrategy = function (index) {
    if (customStrategies.length <= 1) {
        alert("至少需保留一個策略！");
        return;
    }
    if (confirm(`確定要刪除「${customStrategies[index].name}」嗎？相關資產將可能顯示不正確。`)) {
        customStrategies.splice(index, 1);
        saveStrategyConfig();
    }
};

window.deleteCustomTag = function (index) {
    customTags.splice(index, 1);
    saveTagConfig();
};

function populateStrategySelects() {
    const selects = [elements.groupSelect, elements.assetMacro];
    selects.forEach(sel => {
        if (!sel) return;
        const currentVal = sel.value;
        const isGroupSelect = sel.id === 'groupSelect';

        let html = isGroupSelect ? '<option value="all">所有標的</option>' : '';
        html += customStrategies.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        sel.innerHTML = html;

        if (currentVal) sel.value = currentVal;
    });
}

function renderStrategySettings() {
    const tbody = document.getElementById('strategySettingsTable');
    if (!tbody) return;

    tbody.innerHTML = customStrategies.map((s, index) => `
        <tr>
            <td><code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">${s.id}</code></td>
            <td><input type="text" value="${s.name}" onchange="updateStrategy(${index}, 'name', this.value)" style="width: 100%; background: transparent; border: none; color: var(--text-primary);"></td>
            <td><input type="color" value="${s.color}" onchange="updateStrategy(${index}, 'color', this.value)" style="background: transparent; border: none; cursor: pointer;"></td>
            <td>
                <button class="btn-delete" onclick="deleteCustomStrategy(${index})" style="padding: 4px 8px; font-size: 0.8rem;">刪除</button>
            </td>
        </tr>
    `).join('');
}

function renderTagSettings() {
    const list = document.getElementById('tagSettingsList');
    if (!list) return;

    list.innerHTML = customTags.map((tag, index) => `
        <div style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 16px; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
            ${tag}
            <span onclick="deleteCustomTag(${index})" style="cursor: pointer; opacity: 0.5; font-weight: bold;">&times;</span>
        </div>
    `).join('');
}

// Phase 2: 熱門 ETF 成分股資料 (Mock)
// 加載本地儲存的 ETF 成分股數據，若無則使用預設值
let etfData = JSON.parse(localStorage.getItem('myETFData')) || {
    "0050": [
        { name: "台積電 (2330)", weight: 63.15 },
        { name: "台達電 (2308)", weight: 3.93 },
        { name: "鴻海 (2317)", weight: 3.37 },
        { name: "聯發科 (2454)", weight: 3.23 },
        { name: "日月光投控 (3711)", weight: 1.58 },
        { name: "中信金 (2891)", weight: 1.34 },
        { name: "智邦 (2345)", weight: 1.10 },
        { name: "台光電 (2383)", weight: 1.09 },
        { name: "廣達 (2382)", weight: 1.08 },
        { name: "富邦金 (2881)", weight: 1.05 }
    ],
    // ... 其他預設資料 (略，保持剛才更新的版本)
    "006208": [
        { name: "台積電 (2330)", weight: 53.18 },
        { name: "鴻海 (2317)", weight: 5.61 },
        { name: "聯發科 (2454)", weight: 4.13 },
        { name: "廣達 (2382)", weight: 1.96 },
        { name: "富邦金 (2881)", weight: 1.67 },
        { name: "台達電 (2308)", weight: 1.54 },
        { name: "國泰金 (2882)", weight: 1.41 },
        { name: "中信金 (2891)", weight: 1.37 },
        { name: "日月光投控 (3711)", weight: 1.24 },
        { name: "聯電 (2303)", weight: 1.11 }
    ],
    "00878": [
        { name: "華碩 (2357)", weight: 4.45 },
        { name: "聯發科 (2454)", weight: 4.32 },
        { name: "大聯大 (3702)", weight: 3.95 },
        { name: "廣達 (2382)", weight: 3.82 },
        { name: "仁寶 (2324)", weight: 3.65 },
        { name: "微星 (2377)", weight: 3.42 },
        { name: "光寶科 (2301)", weight: 3.28 },
        { name: "聯詠 (3034)", weight: 3.15 },
        { name: "瑞昱 (2379)", weight: 2.98 },
        { name: "可成 (2474)", weight: 2.85 }
    ],
    "00830": [
        { name: "輝達 NVIDIA (NVDA)", weight: 10.25 },
        { name: "博通 Broadcom (AVGO)", weight: 9.12 },
        { name: "超微 AMD", weight: 7.85 },
        { name: "艾司摩爾 ASML", weight: 4.52 },
        { name: "台積電 ADR (TSM)", weight: 4.25 },
        { name: "美光 Micron", weight: 3.95 },
        { name: "德州儀器 TI", weight: 3.62 },
        { name: "高通 Qualcomm", weight: 3.48 },
        { name: "應用材料 AMAT", weight: 3.15 },
        { name: "英特爾 Intel", weight: 2.85 }
    ],
    "00770": [
        { name: "微軟 Microsoft", weight: 8.52 },
        { name: "蘋果 Apple", weight: 8.15 },
        { name: "亞馬遜 Amazon", weight: 5.42 },
        { name: "輝達 NVIDIA", weight: 5.12 },
        { name: "Alphabet (Google)", weight: 4.85 },
        { name: "Meta (FB)", weight: 3.95 },
        { name: "博通 Broadcom", weight: 3.15 },
        { name: "特斯拉 Tesla", weight: 2.85 },
        { name: "好市多 Costco", weight: 2.42 },
        { name: "Adobe", weight: 1.95 }
    ],
    "00850": [
        { name: "台積電 (2330)", weight: 45.12 },
        { name: "鴻海 (2317)", weight: 6.25 },
        { name: "聯發科 (2454)", weight: 5.18 },
        { name: "台達電 (2308)", weight: 2.15 },
        { name: "聯電 (2303)", weight: 1.95 },
        { name: "富邦金 (2881)", weight: 1.82 },
        { name: "中信金 (2891)", weight: 1.65 },
        { name: "國泰金 (2882)", weight: 1.58 },
        { name: "廣達 (2382)", weight: 1.42 },
        { name: "兆豐金 (2886)", weight: 1.25 }
    ],
    "00858": [
        { name: "蘋果 Apple", weight: 7.15 },
        { name: "微軟 Microsoft", weight: 6.95 },
        { name: "輝達 NVIDIA", weight: 6.25 },
        { name: "亞馬遜 Amazon", weight: 3.52 },
        { name: "Meta (FB)", weight: 2.45 },
        { name: "Alphabet (Google)", weight: 2.12 },
        { name: "柏克夏 Berkshire", weight: 1.85 },
        { name: "禮來 Eli Lilly", weight: 1.62 },
        { name: "博通 Broadcom", weight: 1.45 },
        { name: "摩根大通 JPM", weight: 1.28 }
    ]
};

// 儲存使用者輸入的預估配息
let dividendInputs = {};
const savedDivInputs = localStorage.getItem('myDividendInputs');
if (savedDivInputs) {
    try {
        dividendInputs = JSON.parse(savedDivInputs);
    } catch (e) { }
}

// ==========================================
// 策略與標籤配置 (Strategies & Tags)
// ==========================================
const defaultStrategies = [
    { id: 'growth', name: '成長 (攻擊)', color: '#ef4444' },
    { id: 'dividend', name: '領息 (金流)', color: '#3b82f6' },
    { id: 'defensive', name: '防禦 (穩健)', color: '#f59e0b' },
    { id: 'cash', name: '現金 (備用)', color: '#10b981' }
];

const defaultTags = ['市值型', '高股息', '金融', '債券', '半導體/AI', '電子/傳產', '電信/公用'];

let customStrategies = JSON.parse(localStorage.getItem('myCustomStrategies')) || defaultStrategies;
// 補丁：防止讀取到空陣列導致 UI 崩潰
if (!Array.isArray(customStrategies) || customStrategies.length === 0) {
    customStrategies = defaultStrategies;
}
let customTags = JSON.parse(localStorage.getItem('myCustomTags')) || defaultTags;
if (!Array.isArray(customTags) || customTags.length === 0) {
    customTags = defaultTags;
}

function saveStrategyConfig() {
    localStorage.setItem('myCustomStrategies', JSON.stringify(customStrategies));
    populateStrategySelects();
    renderStrategySettings();
    updateDashboard(); // 重新整理儀表板以套用新顏色/名稱
}

function saveTagConfig() {
    localStorage.setItem('myCustomTags', JSON.stringify(customTags));
    renderTagSettings();
    updateTagSuggestions();
}

function saveDividendInputs() {
    localStorage.setItem('myDividendInputs', JSON.stringify(dividendInputs));
}

let myDividendData = {};
const savedDivData = localStorage.getItem('myDividendData');
if (savedDivData) {
    try {
        myDividendData = JSON.parse(savedDivData);
    } catch (e) { }
}

// 儲存圖表實例
let pieChartInstance = null; // ECharts Macro
let pieTagChartInstance = null; // ECharts Tag
let heatmapInstance = null;

// 台股代碼字典快取 (由 stocks.js 靜態載入，100% 離線可用)
const stockDictionary = window.LOCAL_STOCK_DICT || {};

// 建立反向字典 (名稱 -> 代碼) 以加速查詢
const nameToCodeMap = {};
Object.entries(stockDictionary).forEach(([code, name]) => {
    nameToCodeMap[name] = code;
});


function formatCurrency(num) {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(num);
}

function updateDashboard() {
    elements.assetTableBody.innerHTML = '';

    let totalInvestment = 0;
    let totalMarketValue = 0;
    let filteredPortfolio = [];

    portfolio.forEach((asset, index) => {
        if (!asset) return;
        const selectedGroup = elements.groupSelect ? elements.groupSelect.value : 'all';
        if (selectedGroup !== 'all' && asset.macro !== selectedGroup) return;

        filteredPortfolio.push(asset);

        const investmentCost = asset.shares * asset.avgCost;
        const marketValue = asset.shares * asset.currentPrice;
        const profitLoss = marketValue - investmentCost;
        const isProfit = profitLoss >= 0;

        totalInvestment += investmentCost;
        totalMarketValue += marketValue;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="stock-name">${asset.name}</span>
                <span class="stock-code">${asset.code} <span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; color: var(--text-secondary); margin-left: 4px;">${asset.tag || '無標籤'}</span></span>
            </td>
            <td>${asset.shares.toLocaleString()} 股</td>
            <td>$${asset.avgCost.toFixed(2)}</td>
            <td>$${asset.currentPrice.toFixed(2)}</td>
            <td>${formatCurrency(marketValue)}</td>
            <td class="${isProfit ? 'profit-up' : 'profit-down'}">
                ${isProfit ? '+' : ''}${formatCurrency(profitLoss)}<br/>
                <span style="font-size: 0.8rem;">(${isProfit ? '+' : ''}${((profitLoss / investmentCost) * 100).toFixed(2)}%)</span>
            </td>
            <td>
                <button class="btn-edit" onclick="editAsset(${index})">編輯</button>
                <button class="btn-delete" onclick="deleteAsset(${index})">刪除</button>
            </td>
        `;
        elements.assetTableBody.appendChild(tr);
    });

    const totalProfitLoss = totalMarketValue - totalInvestment;
    const isTotalProfit = totalProfitLoss >= 0;
    const totalRatio = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    // 更新 KPI Cards
    if (elements.totalValue) {
        elements.totalValue.innerHTML = `<span class="currency">TWD</span> ${formatCurrency(totalMarketValue).replace('$', '')}`;
    }

    if (elements.totalProfit) {
        elements.totalProfit.className = `kpi-value ${isTotalProfit ? 'profit-up' : 'profit-down'}`;
        elements.totalProfit.innerHTML = `${isTotalProfit ? '+' : ''}${formatCurrency(totalProfitLoss)}`;
    }

    if (elements.profitRatio) {
        elements.profitRatio.className = `kpi-change ${isTotalProfit ? 'up' : 'down'}`;
        elements.profitRatio.innerText = `${isTotalProfit ? '+' : ''}${totalRatio.toFixed(2)}% 總報酬率`;
    }

    updateCharts(filteredPortfolio);
    updateETFDropdown();
}

function renderMarketIndices() {
    // 更新首頁的橫滑列
    const previewEl = document.getElementById('marketPreviewValues');
    if (previewEl) {
        if (marketIndices.length > 0) {
            previewEl.innerHTML = marketIndices.map(idx => {
                const isUp = idx.change >= 0;
                const changeClass = isUp ? 'up' : 'down';
                const sign = isUp ? '+' : '';

                // 產生 Yahoo Finance 連結
                let yfSymbol = idx.symbol;
                if (/^\d{4,6}$/.test(yfSymbol)) yfSymbol += '.TW';
                const link = `https://tw.stock.yahoo.com/quote/${encodeURIComponent(yfSymbol)}`;

                return `<a href="${link}" target="_blank" style="display: flex; gap: 6px; align-items: center; white-space: nowrap; text-decoration: none; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
                            <span style="color: var(--text-primary); font-weight: 500;">${idx.name}</span>
                            <span class="index-change ${changeClass}" style="background: transparent; padding: 0; font-size: 0.9rem;">
                                ${idx.price.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${sign}${idx.change.toFixed(2)}%)
                            </span>
                        </a>`;
            }).join('<span style="color: rgba(255,255,255,0.2);">|</span>');
        } else {
            previewEl.innerHTML = `<span style="color: var(--text-secondary);">全佈局即時行情</span>`;
        }
    }
}

// 動態更新「熱門成分股」下拉選單，讓使用者輸入的 ETF 自動出現在選單內
function updateETFDropdown() {
    const etfSelect = document.getElementById('etfConstituentSelect');
    if (!etfSelect) return;

    // 預設保留兩個展示用的 ETF
    const availableETFs = [
        { code: '0050', name: '元大台灣50' },
        { code: '00878', name: '國泰永續高股息' }
    ];

    // 加上使用者個人持股中的 ETF
    portfolio.forEach(item => {
        if (item.code.startsWith('00') && !availableETFs.find(e => e.code === item.code)) {
            availableETFs.push({ code: item.code, name: item.name });
        }
    });

    const currentVal = etfSelect.value;

    etfSelect.innerHTML = availableETFs.map(etf =>
        `<option value="${etf.code}">${etf.code} (${etf.name})</option>`
    ).join('');

    // 保持目前選擇，如果原本選擇被刪除，則跳回第一個
    if (availableETFs.find(e => e.code === currentVal)) {
        etfSelect.value = currentVal;
    } else {
        etfSelect.value = availableETFs[0].code;
    }
}

// 監聽重新選擇配息紀錄
const dividendHistorySelect = document.getElementById('dividendHistorySelect');
if (dividendHistorySelect) {
    dividendHistorySelect.addEventListener('change', renderDividendHistory);
}

// 事件監聽
if (elements.groupSelect) {
    elements.groupSelect.addEventListener('change', updateDashboard);
}

// 頁面切換邏輯 (輔助自訂功能跳轉)
window.showSettingsPage = function () {
    // 關閉 Modal
    if (elements.addAssetModal) elements.addAssetModal.classList.remove('active');

    // 切換側邊欄與頁面
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page-section');

    navItems.forEach(item => item.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));

    // 找到「設定」項並啟動 (通常是最後一項)
    const settingsNavItem = Array.from(navItems).find(item => item.innerText.includes('設定'));
    const settingsSection = document.getElementById('page-settings');

    if (settingsNavItem) settingsNavItem.classList.add('active');
    if (settingsSection) settingsSection.classList.add('active');

    // 滾動到自訂區塊
    setTimeout(() => {
        const strategySection = document.querySelector('span[onclick="addCustomStrategy()"]')?.closest('.glass-panel');
        if (strategySection) strategySection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
};

// ==========================================
// 新增、編輯與刪除標的 (CRUD)
// ==========================================

let editingIndex = -1;

// 編輯標的
window.editAsset = function (index) {
    editingIndex = index;
    const asset = portfolio[index];

    // 填入既有資料
    elements.assetName.value = asset.name;
    elements.assetCode.value = asset.code.replace('.TW', ''); // 移除後綴，如果有的話
    elements.assetMacro.value = asset.macro || "growth";
    elements.assetTag.value = asset.tag || "";
    elements.assetShares.value = asset.shares;
    elements.assetCost.value = asset.avgCost;
    elements.assetPrice.value = asset.currentPrice;
    elements.assetTargetReturn.value = ''; // 清空試算欄位

    // 自動試算並顯示預估報酬率
    setTimeout(() => { elements.assetPrice.dispatchEvent(new Event('input')); }, 50);

    // 更改 Modal 狀態
    elements.modalTitle.innerText = "編輯投資標的";
    elements.submitAssetBtn.innerText = "儲存變更";

    elements.addAssetModal.classList.add('active');
};

// 刪除標的
window.deleteAsset = function (index) {
    if (confirm("確定要刪除這筆投資標的嗎？")) {
        portfolio.splice(index, 1);
        savePortfolio(); // 儲存至本機
        updateDashboard();
        renderDividendCalculator();
        renderDividendHistory();
    }
};

// 開啟與關閉 Modal
elements.addAssetBtn.addEventListener('click', () => {
    elements.addAssetModal.classList.add('active');
});

function closeAddAssetModal() {
    elements.addAssetModal.classList.remove('active');
    elements.addAssetForm.reset();
    editingIndex = -1;
    elements.modalTitle.innerText = "新增投資標的";
    elements.submitAssetBtn.innerText = "確認新增";
}

elements.closeModalBtn.addEventListener('click', closeAddAssetModal);
elements.cancelModalBtn.addEventListener('click', closeAddAssetModal);

// 自動帶入股票名稱與智能標籤預測 (輸入代碼後)
function guessAssetCategory(code, name) {
    let macro = 'growth';
    let tag = '成長/傳統';

    // ETF 判斷
    if (code.startsWith('00')) {
        if (name.includes('高股息') || name.includes('優息')) {
            macro = 'dividend'; tag = '高股息';
        } else if (name.includes('美債') || name.includes('債')) {
            macro = 'defensive'; tag = '債券';
        } else {
            macro = 'growth'; tag = '市值型';
        }
        return { macro, tag };
    }

    // 個股判斷
    if (code === '2330' || name.includes('台積電') || name.includes('聯發科') || name.includes('AI') || name.includes('緯創')) {
        macro = 'growth'; tag = '半導體/AI';
    } else if (code.startsWith('28') || name.includes('金')) {
        macro = 'dividend'; tag = '金融股';
    } else if (code === '2412' || name.includes('電信')) {
        macro = 'defensive'; tag = '電信/公用';
    } else {
        macro = 'growth'; tag = '電子/傳產';
    }
    return { macro, tag };
}

// 單一提取 fetch 現價的函數
async function fetchCurrentPrice(symbol) {
    if (!symbol) return null;
    let querySymbol = symbol;
    let isTaiwanStock = false;

    // 如果是純數字代碼，自動視為台股
    if (/^\d{4,6}$/.test(querySymbol) || /^\d{4}B$/.test(querySymbol)) {
        isTaiwanStock = true;
    }

    // --- 策略 A: 如果是台股，優先使用 FinMind API (較穩定且無 CORS 限制) ---
    if (isTaiwanStock) {
        try {
            const stockId = querySymbol.replace('.TW', '').replace('.TWO', '');
            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const startDate = lastWeek.toISOString().split('T')[0];

            // FinMind 不需要 Proxy 即可在瀏覽器端存取 (通常)
            const finMindUrl = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${stockId}&start_date=${startDate}`;
            const res = await fetch(finMindUrl);
            if (res.ok) {
                const data = await res.json();
                if (data && data.data && data.data.length > 0) {
                    const lastData = data.data[data.data.length - 1];
                    return parseFloat(lastData.close);
                }
            }
        } catch (e) {
            console.warn('FinMind fetch failed, falling back to Yahoo', e);
        }
    }

    // --- 策略 B: 使用 Yahoo Finance Chart API (透過備援 Proxy) ---
    if (isTaiwanStock && !querySymbol.includes('.')) {
        querySymbol = `${querySymbol}.TW`;
    }

    const yfUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${querySymbol}?interval=1d&range=5d`;
    try {
        let data = await fetchWithFallback(yfUrl, 6000);

        // 如果 .TW 撈不到現價，重試 .TWO
        if ((!data || !data.chart || !data.chart.result || data.chart.result.length === 0) && querySymbol.endsWith('.TW')) {
            const twoSymbol = querySymbol.replace('.TW', '.TWO');
            const twoUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${twoSymbol}?interval=1d&range=5d`;
            data = await fetchWithFallback(twoUrl, 6000);
        }

        if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
            const meta = data.chart.result[0].meta;
            if (meta && meta.regularMarketPrice) {
                return parseFloat(meta.regularMarketPrice);
            }
        }
    } catch (e) {
        console.warn('fetchCurrentPrice (Yahoo) failed', e);
    }
    return null;
}

// 輔助函式：當代號確定後，自動抓取現價與名稱
async function handleTargetSelected(code, name) {
    if (code) {
        elements.assetCode.value = code;
        if (name) {
            elements.assetName.value = name;
            // 觸發 AI 預測分類
            if (!elements.assetTag.value || elements.assetTag.value === "無標籤") {
                const guess = guessAssetCategory(code, name);
                elements.assetMacro.value = guess.macro;
                elements.assetTag.value = guess.tag;
            }
        }
        // 抓取現價
        elements.assetPrice.placeholder = "正在連線雲端報價...";
        const price = await fetchCurrentPrice(code);
        if (price) {
            elements.assetPrice.value = price.toFixed(2);
            calculateROIFromModal();
            elements.assetPrice.placeholder = "";
        } else {
            elements.assetPrice.placeholder = "抓取失敗，請手動輸入";
        }
    }
}

// 標的名稱 Autocomplete 監聽
const assetNameAutocomplete = document.getElementById('assetNameAutocomplete');
if (elements.assetName && assetNameAutocomplete) {
    elements.assetName.addEventListener('input', (e) => {
        const term = e.target.value.trim();
        const termLower = term.toLowerCase();
        assetNameAutocomplete.innerHTML = '';

        if (!term || !stockDictionary) {
            assetNameAutocomplete.style.display = 'none';
            return;
        }

        // 雙向連動：如果名稱剛好完全符合字典中的某個標的，直接帶出代碼
        if (nameToCodeMap[term]) {
            handleTargetSelected(nameToCodeMap[term], term);
            assetNameAutocomplete.style.display = 'none';
            return;
        }

        const matches = [];
        for (const [code, name] of Object.entries(stockDictionary)) {
            if (code.toLowerCase().includes(termLower) || name.toLowerCase().includes(termLower)) {
                matches.push({ code, name });
            }
            if (matches.length >= 30) break; // 最多顯示 30 筆
        }

        if (matches.length > 0) {
            matches.forEach(m => {
                const item = document.createElement('div');
                item.style.cssText = "padding: 10px 12px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--text-primary); transition: background 0.1s; font-size: 0.95rem; display: flex; justify-content: space-between;";
                item.innerHTML = `<span>${m.name}</span><span style="color: var(--text-secondary); font-size: 0.85rem;">${m.code}</span>`;
                item.addEventListener('mouseenter', () => { item.style.background = 'rgba(255,255,255,0.1)'; });
                item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });
                item.addEventListener('mousedown', (evt) => {
                    // 使用 mousedown 避免 blur 事件提早關閉 autocomplete
                    evt.preventDefault();
                    assetNameAutocomplete.style.display = 'none';
                    handleTargetSelected(m.code, m.name);
                });
                assetNameAutocomplete.appendChild(item);
            });
            assetNameAutocomplete.style.display = 'block';
        } else {
            assetNameAutocomplete.style.display = 'none';
        }
    });

    // 失去焦點或點擊外部時關閉 Autocomplete
    document.addEventListener('mousedown', (e) => {
        if (e.target !== elements.assetName && assetNameAutocomplete && !assetNameAutocomplete.contains(e.target)) {
            assetNameAutocomplete.style.display = 'none';
        }
    });
}

// 手動輸入股票代號時也自動帶入名稱與抓價
let codeTypingTimer;
elements.assetCode.addEventListener('input', (e) => {
    clearTimeout(codeTypingTimer);
    const code = e.target.value.trim();

    // 雙向連動：如果代號完全符合字典，立即帶出名稱 (不等待 timer)
    if (stockDictionary[code]) {
        handleTargetSelected(code, stockDictionary[code]);
        return;
    }

    if (code.length >= 2) {
        codeTypingTimer = setTimeout(() => {
            // 再次檢查 (以防萬一)
            if (stockDictionary[code]) {
                handleTargetSelected(code, stockDictionary[code]);
            } else {
                handleTargetSelected(code, null); // 嘗試直接抓沒有在字典的現價 (如美股)
            }
        }, 800); // 縮短延遲時間，提升反應速度
    }
});

// 確認新增或編輯標的事件
elements.addAssetForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newAsset = {
        name: elements.assetName.value,
        code: elements.assetCode.value,
        macro: elements.assetMacro.value,
        tag: elements.assetTag.value,
        shares: parseInt(elements.assetShares.value, 10),
        avgCost: parseFloat(elements.assetCost.value),
        currentPrice: parseFloat(elements.assetPrice.value)
    };

    if (editingIndex >= 0) {
        // 編輯模式
        portfolio[editingIndex] = newAsset;
    } else {
        // 新增模式
        portfolio.push(newAsset);
    }

    savePortfolio(); // 儲存至本機

    closeAddAssetModal();
    updateDashboard();
    renderDividendCalculator();
    updateDividendHistoryDropdown();
    renderDividendHistory();
});

// ==========================================
// 快速試算邏輯 (現價與報酬率雙向連動)
// ==========================================

function calculateROIFromModal() {
    const cost = parseFloat(elements.assetCost.value);
    const price = parseFloat(elements.assetPrice.value);

    if (!isNaN(cost) && !isNaN(price) && cost > 0) {
        // 報酬率 = ((現價 - 成本) / 成本) * 100
        const returnRate = ((price - cost) / cost) * 100;
        elements.assetTargetReturn.value = returnRate.toFixed(2);
    } else {
        elements.assetTargetReturn.value = '';
    }
}

// 1. 當使用者手動修改了現價 (或透過 API 自動填入)，更新預估報酬率
elements.assetPrice.addEventListener('input', calculateROIFromModal);

// 2. 當使用者手動修改了成本，如果有現價，也更新預估報酬率
elements.assetCost.addEventListener('input', calculateROIFromModal);

// 3. 當使用者手動修改了股數，也觸發一次試算 (雖然 ROI 不變，但確保 UI 一致性)
elements.assetShares.addEventListener('input', calculateROIFromModal);

// 4. 當使用者輸入了預期報酬率，自動推算出現價
elements.assetTargetReturn.addEventListener('input', (e) => {
    const cost = parseFloat(elements.assetCost.value);
    const returnRate = parseFloat(e.target.value);

    if (!isNaN(cost) && !isNaN(returnRate) && cost > 0) {
        // 現價 = 成本 + (成本 * 報酬率 / 100)
        const currentPrice = cost * (1 + returnRate / 100);
        elements.assetPrice.value = currentPrice.toFixed(2);
    }
});

// ==========================================
// Phase 3 圖表實作 (Pie Chart & Heatmap Carousel)
// ==========================================

function getMacroColor(id) {
    const strategy = customStrategies.find(s => s.id === id);
    return strategy ? strategy.color : '#5e6573';
}

function getMacroName(id) {
    const strategy = customStrategies.find(s => s.id === id);
    return strategy ? strategy.name.split(' ')[0] : '未知';
}

// 隨機動態屬性顏色盤 (供產業標籤使用)
const tagPalette = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#6366f1', '#14b8a6'];
let tagColors = {};
let tagColorIdx = 0;

function updateCharts(data) {
    if (data.length === 0) {
        if (pieChartInstance) pieChartInstance.clear();
        if (pieTagChartInstance) pieTagChartInstance.clear();
        if (heatmapInstance) heatmapInstance.clear();
        return;
    }

    // 1. 初始化圖表實例
    if (!pieChartInstance) {
        pieChartInstance = echarts.init(document.getElementById('portfolioMacroPie'));
        window.addEventListener('resize', () => pieChartInstance.resize());
    }
    if (!pieTagChartInstance) {
        pieTagChartInstance = echarts.init(document.getElementById('portfolioTagPie'));
        window.addEventListener('resize', () => pieTagChartInstance.resize());
    }

    // --- A. 核心策略分佈 (Macro Aggregation) ---
    const macroMap = {};
    data.forEach(item => {
        const mv = item.shares * item.currentPrice;
        macroMap[item.macro] = (macroMap[item.macro] || 0) + mv;
    });

    const macroPieData = Object.entries(macroMap).map(([macroId, value]) => {
        const strategy = customStrategies.find(s => s.id === macroId);
        return {
            value: value,
            name: strategy ? strategy.name : macroId,
            itemStyle: { color: getMacroColor(macroId) }
        };
    }).sort((a, b) => b.value - a.value);

    const macroPieOptions = {
        tooltip: { trigger: 'item', formatter: '{b}: <br/>市值 {c} ({d}%)' },
        legend: {
            orient: 'horizontal', bottom: '0%', left: 'center',
            textStyle: { color: '#f0f2f5', fontSize: 11 },
            itemWidth: 10, itemHeight: 10
        },
        series: [{
            name: '核心策略',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '42%'],
            itemStyle: { borderRadius: 4, borderColor: '#0d0f14', borderWidth: 2 },
            label: { show: true, position: 'inside', formatter: '{d}%', color: '#fff', fontSize: 10 },
            data: macroPieData
        }]
    };
    pieChartInstance.setOption(macroPieOptions);

    // --- B. 產業屬性分佈 (Tag Aggregation) ---
    const tagMap = {};
    data.forEach(item => {
        const mv = item.shares * item.currentPrice;
        const tag = item.tag || '未分類';
        tagMap[tag] = (tagMap[tag] || 0) + mv;
    });

    // 重置標籤顏色索引
    tagColors = {};
    tagColorIdx = 0;

    const tagPieData = Object.entries(tagMap).map(([tagName, value]) => {
        if (!tagColors[tagName]) {
            tagColors[tagName] = tagPalette[tagColorIdx % tagPalette.length];
            tagColorIdx++;
        }
        return {
            value: value,
            name: tagName,
            itemStyle: { color: tagColors[tagName] }
        };
    }).sort((a, b) => b.value - a.value);

    const tagPieOptions = {
        tooltip: { trigger: 'item', formatter: '{b}: <br/>市值 {c} ({d}%)' },
        legend: {
            type: 'scroll',
            orient: 'horizontal', bottom: '0%', left: 'center',
            textStyle: { color: '#f0f2f5', fontSize: 11 },
            itemWidth: 10, itemHeight: 10
        },
        series: [{
            name: '產業屬性',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '42%'],
            itemStyle: { borderRadius: 4, borderColor: '#0d0f14', borderWidth: 2 },
            label: { show: true, position: 'inside', formatter: '{d}%', color: '#fff', fontSize: 10 },
            data: tagPieData
        }]
    };
    pieTagChartInstance.setOption(tagPieOptions);

    // --- C. 資產熱力圖 (個股明細) ---
    if (!heatmapInstance) {
        heatmapInstance = echarts.init(document.getElementById('portfolioHeatmap'));
        window.addEventListener('resize', () => heatmapInstance.resize());
    }

    const heatmapData = data.map(item => {
        const marketValue = item.shares * item.currentPrice;
        const dailyChange = item.dailyChangeRatio !== undefined ? item.dailyChangeRatio : 0;

        let baseColor = '#5e6573';
        if (dailyChange > 0) baseColor = '#ef4444';
        else if (dailyChange < 0) baseColor = '#10b981';

        return {
            name: `${item.name}\n${dailyChange > 0 ? '+' : ''}${dailyChange.toFixed(2)}%`,
            value: marketValue,
            itemStyle: { color: baseColor, borderColor: '#1e2128', borderWidth: 2 }
        };
    });

    heatmapInstance.setOption({
        tooltip: {
            formatter: (info) => `${info.name.split('\n')[0]}<br>市值: ${formatCurrency(info.value)}`
        },
        series: [{
            type: 'treemap',
            data: heatmapData,
            width: '100%', height: '100%',
            roam: false, nodeClick: false, breadcrumb: { show: false },
            label: { show: true, formatter: '{b}', color: '#fff', fontSize: 14, fontWeight: 500 },
            itemStyle: { gapWidth: 4, borderColor: '#0d0f14' }
        }]
    });
}

// ==========================================
// Phase 2 功能實作
// ==========================================

function renderDividendCalculator() {
    if (!elements.dividendCalcArea) return;
    elements.dividendCalcArea.innerHTML = '';
    let totalExpected = 0;

    portfolio.forEach(asset => {
        const divInfo = myDividendData[asset.code];
        // 強化版「全球/海外成分股」ETF 識別邏輯 (Yahoo 數據源支援度低)
        const isOverseasETF = asset.code.startsWith('00') && (
            // 包含海外區域或知名指數關鍵字
            asset.name.includes('全球') || asset.name.includes('北美') || asset.name.includes('美國') ||
            asset.name.includes('日本') || asset.name.includes('越南') || asset.name.includes('印度') ||
            asset.name.includes('中國') || asset.name.includes('歐洲') || asset.name.includes('恆生') ||
            asset.name.includes('滬深') || asset.name.includes('上證') || asset.name.includes('費城') ||
            asset.name.includes('NASDAQ') || asset.name.includes('那斯達克') || asset.name.includes('S&P') ||
            asset.name.includes('標普') || asset.name.includes('道瓊') || asset.name.includes('500') ||
            // 或者名稱中完全沒有「台灣/臺灣」字樣的 ETF (通常為海外型)
            (!asset.name.includes('台灣') && !asset.name.includes('臺灣'))
        );

        // --- 識別配息頻率 (舉一反三強化版) ---
        const frequencyMap = {
            "0050": "半年配", "006208": "半年配",
            "00878": "季配", "00919": "季配", "00929": "月配",
            "00850": "季配", "0056": "季配", "00713": "季配",
            "00915": "季配", "00918": "季配", "00934": "月配",
            "00936": "月配", "00940": "月配"
        };

        let freqStr = frequencyMap[asset.code] || "";

        // 如果不在對照表，則根據關鍵字推論
        if (!freqStr) {
            if (asset.name.includes("高股息") || asset.name.includes("優息") || asset.name.includes("精選")) {
                freqStr = "季配";
            } else if (asset.name.includes("債")) {
                freqStr = "月配"; // 多數美債/投資級債 ETF 為月配或季配
            } else {
                freqStr = "同步中";
            }
        }

        // 最後判斷：如果是海外型，強制標為不支援；如果是國內標的但仍無結果，標為無紀錄
        if (isOverseasETF) {
            freqStr = "不支援";
        } else if (divInfo && divInfo.frequency) {
            freqStr = divInfo.frequency; // 若 API 有回傳，以 API 為準
        }

        if (!freqStr || freqStr === "同步中") freqStr = "無紀錄";

        let ytdShare = 0;
        let perShare = 0;
        let strat = dividendInputs[asset.code + '_strat'] || '1y';
        let selectHtml = '';

        if (divInfo && divInfo.averages) {
            ytdShare = divInfo.ytdPerShare || 0;
            freqStr = divInfo.frequency || freqStr;

            if (!divInfo.averages[strat] && strat !== '1y') strat = '1y';
            perShare = divInfo.averages[strat] || 0;

            const makeOpt = (key, label) => {
                if (!divInfo.averages[key]) return '';
                const v = divInfo.averages[key];
                const y = asset.currentPrice > 0 ? (v / asset.currentPrice * 100).toFixed(2) + '%' : '-';
                return `<option value="${key}" ${strat === key ? 'selected' : ''}>${label}: ${v.toFixed(3)} 元 (${y})</option>`;
            };

            selectHtml = `
                <select class="div-strat-select" data-code="${asset.code}" style="background: rgba(255,255,255,0.05); border: 1px solid var(--panel-border); color: #fff; padding: 6px; border-radius: 4px; outline: none; cursor: pointer; width: 100%; max-width: 250px; color-scheme: dark;">
                    ${makeOpt('1y', '近 1 年試算')}
                    ${makeOpt('3y', '近 3 年平均')}
                    ${makeOpt('5y', '近 5 年平均')}
                    ${makeOpt('10y', '近 10 年平均')}
                </select>
            `;
        } else {
            if (divInfo) {
                ytdShare = divInfo.ytdPerShare || 0;
                freqStr = divInfo.frequency || freqStr;
            }
            let manualVal = dividendInputs[asset.code] !== undefined ? dividendInputs[asset.code] : (divInfo ? divInfo.expectedPerShare : '');
            perShare = parseFloat(manualVal) || 0;
            selectHtml = `<input type="number" step="any" class="manual-div-input" data-code="${asset.code}" value="${manualVal}" placeholder="手動輸入" style="width: 100%; max-width: 120px; background: rgba(255,255,255,0.05); color: #fff; border: 1px solid var(--panel-border); padding: 6px; border-radius: 4px;">`;
            if (divInfo && !divInfo.averages) {
                selectHtml += `<br><span style="color:#d1d5db; font-size:0.75rem;">(無歷史均值)</span>`;
            }
        }

        const totalDiv = asset.shares * perShare;
        const ytdTotal = asset.shares * ytdShare; // 今年已領總額
        totalExpected += totalDiv;

        const tr = document.createElement('tr');
        tr.style.borderBottom = "1px solid rgba(255,255,255,0.05)";

        tr.innerHTML = `
            <td style="padding: 12px 8px;">
                <div style="font-weight: 500;">${asset.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${asset.shares.toLocaleString()} 股</div>
            </td>
            <td style="padding: 12px 8px;">
                <span style="background: rgba(59, 130, 246, 0.15); color: #93c5fd; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; white-space: nowrap;">
                    ${freqStr}
                </span>
            </td>
            <td style="padding: 12px 8px; color: #a78bfa;">
                ${ytdShare > 0 ? '$' + ytdShare.toFixed(2) + ' <br><span style="font-size:0.75rem; color:var(--text-secondary);">共 ' + formatCurrency(ytdTotal).replace('$', '') + '</span>' : '-'}
            </td>
            <td style="padding: 12px 8px;">
                ${selectHtml}
            </td>
            <td style="padding: 12px 8px; font-weight: bold; color: var(--color-up); text-align: right;">
                ${formatCurrency(totalDiv)}
            </td>
        `;
        elements.dividendCalcArea.appendChild(tr);
    });

    // 監聽歷史選項變更
    const selects = elements.dividendCalcArea.querySelectorAll('.div-strat-select');
    selects.forEach(sel => {
        sel.addEventListener('change', (e) => {
            const code = e.target.dataset.code;
            dividendInputs[code + '_strat'] = e.target.value;
            saveDividendInputs();
            renderDividendCalculator();
        });
    });

    // 監聽手動輸入變更
    const manualInputs = elements.dividendCalcArea.querySelectorAll('.manual-div-input');
    manualInputs.forEach(inp => {
        inp.addEventListener('input', (e) => {
            const code = e.target.dataset.code;
            dividendInputs[code] = parseFloat(e.target.value) || 0;
            saveDividendInputs();
            calculateTotalDividend();
        });
    });

    calculateTotalDividend(totalExpected);
}

function calculateTotalDividend(total = null) {
    if (total === null) {
        total = 0;
        portfolio.forEach(asset => {
            const divInfo = myDividendData[asset.code];
            let perShare = 0;
            if (divInfo && divInfo.averages) {
                const strat = dividendInputs[asset.code + '_strat'] || '1y';
                perShare = divInfo.averages[strat] || 0;
            } else {
                perShare = parseFloat(dividendInputs[asset.code]) || (divInfo ? divInfo.expectedPerShare : 0) || 0;
            }
            total += asset.shares * perShare;
        });
    }
    if (elements.totalDividendOutput) {
        elements.totalDividendOutput.innerText = formatCurrency(total).replace('$', '') + ' TWD';
    }
}

async function syncDividendData() {
    const btn = document.getElementById('syncDividendBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ 正在拼命抓取資料...';
    }

    const now = Math.floor(Date.now() / 1000);
    // 為了計算長年期均值，抓取過去 10 年以上 (2014 起)
    const fetchStart = Math.floor(new Date('2014-01-01').getTime() / 1000);

    for (let asset of portfolio) {
        let symbol = asset.code;
        // 如果輸入 4 或 5 位數代號，先嘗試抓取 代號.TW
        if (/^\d{4,6}$/.test(symbol) || /^\d{4}B$/.test(symbol)) {
            symbol = `${symbol}.TW`;
        }

        try {
            const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${fetchStart}&period2=${now}&events=div`;
            let data = await fetchWithFallback(url, 15000);

            // 若回傳 404 或無數據，自動改抓 代號.TWO
            if ((!data || !data.chart || !data.chart.result || data.chart.result.length === 0) && symbol.endsWith('.TW')) {
                const twoSymbol = symbol.replace('.TW', '.TWO');
                const twoUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${twoSymbol}?interval=1d&period1=${fetchStart}&period2=${now}&events=div`;
                data = await fetchWithFallback(twoUrl, 15000);
            }

            if (data && data.chart && data.chart.result && data.chart.result[0].events && data.chart.result[0].events.dividends) {
                const divs = data.chart.result[0].events.dividends;
                // 取出所有股息事件，並確保使用原始 amount，不做任何除法
                const divArray = Object.values(divs).map(d => ({
                    date: d.date,
                    amount: parseFloat(d.amount)
                })).sort((a, b) => b.date - a.date); // 最新到最舊

                let freq = '年配';
                let ytdPerShare = 0;
                let avgs = { '1y': 0, '3y': 0, '5y': 0, '10y': 0 };

                if (divArray.length > 0) {
                    const latestDate = divArray[0].date;

                    // 特徵 1: 判斷配息頻率 (以最近一年為界)
                    const oneYearBeforeLatest = latestDate - 365 * 24 * 60 * 60;
                    const pastYearDivs = divArray.filter(d => d.date >= oneYearBeforeLatest);

                    if (pastYearDivs.length >= 10) freq = '月配';
                    else if (pastYearDivs.length >= 3 && pastYearDivs.length <= 6) freq = '季配';
                    else if (pastYearDivs.length == 2) freq = '半年配';
                    else freq = '年配';

                    // 特徵 2: 年度累計法計算
                    const calculateYearlyTotal = (year) => {
                        return divArray
                            .filter(d => new Date(d.date * 1000).getFullYear() === year)
                            .reduce((sum, d) => sum + d.amount, 0);
                    };

                    const currentYear = new Date().getFullYear();
                    ytdPerShare = calculateYearlyTotal(currentYear);
                    const lastYearTotal = calculateYearlyTotal(currentYear - 1);
                    const avg3y = (calculateYearlyTotal(currentYear - 1) + calculateYearlyTotal(currentYear - 2) + calculateYearlyTotal(currentYear - 3)) / 3;
                    const avg5y = (calculateYearlyTotal(currentYear - 1) + calculateYearlyTotal(currentYear - 2) + calculateYearlyTotal(currentYear - 3) + calculateYearlyTotal(currentYear - 4) + calculateYearlyTotal(currentYear - 5)) / 5;
                    const avg10y = (() => {
                        let total = 0;
                        for (let i = 1; i <= 10; i++) total += calculateYearlyTotal(currentYear - i);
                        return total / 10;
                    })();

                    // 如果今年累計已大於去年，則 1y 以今年為主，否則保守採用去年的總和
                    avgs['1y'] = ytdPerShare > lastYearTotal ? ytdPerShare : (lastYearTotal > 0 ? lastYearTotal : ytdPerShare);
                    avgs['3y'] = avg3y;
                    avgs['5y'] = avg5y;
                    avgs['10y'] = avg10y;
                }

                myDividendData[asset.code] = {
                    expectedPerShare: avgs['1y'], // backwards compat
                    ytdPerShare: parseFloat(ytdPerShare.toFixed(3)),
                    frequency: freq,
                    averages: {
                        '1y': parseFloat(avgs['1y'].toFixed(3)),
                        '3y': parseFloat(avgs['3y'].toFixed(3)),
                        '5y': parseFloat(avgs['5y'].toFixed(3)),
                        '10y': parseFloat(avgs['10y'].toFixed(3))
                    },
                    history: divArray // 將完整的歷史存下來，供 renderDividendHistory 使用
                };

                // 不再強制覆寫 dividendInputs，以尊重手動覆寫的數值
            }
        } catch (err) {
            console.error(`Fetch dividend failed for ${asset.code}`, err);
        }
    }

    localStorage.setItem('myDividendData', JSON.stringify(myDividendData));
    saveDividendInputs();

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🔄 同步最新股息資訊';
    }

    renderDividendCalculator();
}

// 渲染成分股 (Phase 2)
function renderConstituents() {
    const list = document.getElementById('constituentsList');
    const selected = document.getElementById('etfConstituentSelect').value;

    if (etfData[selected]) {
        list.innerHTML = etfData[selected].map(stock => `
            <div class="constituent-bar-container">
                <div class="constituent-info">
                    <span>${stock.name}</span>
                    <span>${stock.weight}%</span>
                </div>
                <div class="constituent-track">
                    <div class="constituent-fill" style="width: ${stock.weight}%"></div>
                </div>
            </div>
        `).join('');
    } else {
        // 當使用者選擇了自己輸入的冷門/其他 ETF 時的提示畫面
        list.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px; opacity:0.5;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div style="font-size: 0.95rem;">已為您收錄 ${selected} 的版位</div>
                <div style="font-size: 0.8rem; margin-top: 4px; opacity: 0.7;">（未來升級串接高階券商 API 後，即會自動解鎖最新成分明細）</div>
            </div>
        `;
    }
}


// ==========================================
// 歷年配息紀錄 (Event-Driven Real Data Module)
// ==========================================
function updateDividendHistoryDropdown() {
    const historySelect = document.getElementById('dividendHistorySelect');
    if (!historySelect) return;

    // 只列出使用者目前持有的全部標的
    if (portfolio.length === 0) {
        historySelect.innerHTML = '<option value="">(尚未新增任何標的)</option>';
        return;
    }

    const currentVal = historySelect.value;

    historySelect.innerHTML = portfolio.map(asset =>
        `<option value="${asset.code}">${asset.name} (${asset.code})</option>`
    ).join('');

    if (portfolio.find(a => a.code === currentVal)) {
        historySelect.value = currentVal;
    } else {
        historySelect.value = portfolio[0].code;
    }
}

function renderDividendHistory() {
    const list = document.getElementById('dividendHistoryList');
    const selectEl = document.getElementById('dividendHistorySelect');
    if (!list || !selectEl) return;
    if (!selectEl.value) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 24px;">請先在上方新增投資標的。</div>`;
        return;
    }

    const selectedCode = selectEl.value;
    const realData = myDividendData[selectedCode];
    // 只使用真實數據，移除虛擬假資料生成邏輯
    const historyData = (realData && realData.history && realData.history.length > 0) ? realData.history : null;

    if (historyData) {
        // 依照年份分群計算年度總計
        const yearlyGroups = {};
        historyData.forEach(h => {
            const year = new Date(h.date * 1000).getFullYear();
            if (!yearlyGroups[year]) yearlyGroups[year] = { total: 0, items: [] };
            yearlyGroups[year].total += h.amount;
            yearlyGroups[year].items.push(h);
        });

        // 排序年份 (最新到最舊)
        const sortedYears = Object.keys(yearlyGroups).sort((a, b) => b - a);

        let html = '';
        sortedYears.forEach(year => {
            const group = yearlyGroups[year];
            html += `<div style="margin-bottom: 16px; background: rgba(0,0,0,0.2); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="background: rgba(255,255,255,0.08); padding: 8px 12px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: var(--text-primary); font-size: 1.1rem;">${year} 年度</span>
                            <span style="color: var(--color-up); font-size: 1.05rem;">年度總計: $${group.total.toFixed(3)}</span>
                        </div>`;

            group.items.forEach(h => {
                const d = new Date(h.date * 1000);
                const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

                // 動態反推現價單期殖利率
                let yieldStr = '-';
                const targetAsset = portfolio.find(a => a.code === selectedCode);
                if (targetAsset && targetAsset.currentPrice > 0) {
                    yieldStr = ((h.amount / targetAsset.currentPrice) * 100).toFixed(2) + '%';
                }

                html += `
                <div style="padding: 12px; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid var(--accent-color); border-bottom: 1px solid rgba(255,255,255,0.02);">
                    <div>
                        <div style="font-weight: bold; margin-bottom: 4px; display: flex; align-items: center;">
                            ${dateStr} 
                            <span style="font-size: 0.75rem; background: rgba(16, 185, 129, 0.2); padding: 2px 6px; border-radius: 4px; color: #34d399; margin-left: 8px;">✅ 實績</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">換算現價單期殖利率 ${yieldStr}</div>
                    </div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: var(--color-down);">
                        $${h.amount.toFixed(3)}
                    </div>
                </div>`;
            });
            html += `</div>`;
        });

        list.innerHTML = html;
    } else {
        // 如果沒有真實資料，顯示錯誤提示而不要產生虛擬數據
        list.innerHTML = `
            <div style="text-align: center; padding: 30px; margin-bottom: 12px; color: var(--text-secondary); background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                <div style="font-size: 2rem; margin-bottom: 12px;">⚠️</div>
                <div style="font-size: 1.1rem; font-weight: bold; margin-bottom: 8px;">待同步（點擊更新）</div>
                <div style="font-size: 0.85rem;">目前尚未同步該標的的真實配息數據。<br>請確認網路連線或確保代號正確後，再次點選上方同步按鈕。</div>
            </div>
        `;
    }
}

// ==========================================
// 側邊選單導覽邏輯 (Sidebar Navigation / Tab Switching)
// ==========================================
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        // 先移除所有選取狀態
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        // 為被點擊的項目加上選取狀態
        e.target.classList.add('active');

        // 根據點擊的文字，對應到目標分頁
        const text = e.target.innerText.trim();
        let targetId = '';
        if (text === '資產概況') targetId = 'page-dashboard';
        else if (text === '股息試算器') targetId = 'page-dividend';
        else if (text === '設定') targetId = 'page-settings';

        if (targetId) {
            // 切換分頁顯示狀態 (移除全部的 active)
            document.querySelectorAll('.page-section').forEach(page => page.classList.remove('active'));
            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                targetPage.classList.add('active');

                const headerTitle = document.querySelector('header h1');
                const headerSubtitle = document.querySelector('header .subtitle');

                if (targetId === 'page-dashboard') {
                    if (pieChartInstance) pieChartInstance.resize();
                    if (pieTagChartInstance) pieTagChartInstance.resize();
                    if (heatmapInstance) heatmapInstance.resize();
                    if (headerTitle) headerTitle.innerText = "資產概況";
                } else if (targetId === 'page-dividend') {
                    if (headerTitle) headerTitle.innerText = "股息試算器";
                } else if (targetId === 'page-settings') {
                    if (headerTitle) headerTitle.innerText = "系統設定";
                }
            }
        }
    });
});

// ==========================================
// 初始化執行 (確保順序正確)
// ==========================================
// 1. 先載入自定義配置 (已在上方完成)
// 2. 初始化動態 UI
populateStrategySelects();
renderStrategySettings();
renderTagSettings();
updateTagSuggestions();

// 3. 渲染主儀表板
updateDashboard();
renderDividendCalculator();
renderConstituents();
updateDividendHistoryDropdown();
renderDividendHistory();

// 如果是初次使用或舊版升級（缺少最新資料格式），自動觸發背景同步避免空號滿天飛
if (portfolio.length > 0) {
    const hasData = portfolio.some(a => myDividendData[a.code] && myDividendData[a.code].averages);
    if (!hasData) {
        setTimeout(() => {
            const btn = document.getElementById('syncDividendBtn');
            if (btn) btn.click();
            else syncDividendData();
        }, 1000);
    }
}

// ==========================================
// 市場指數編輯器 (Modal 邏輯)
// ==========================================
let tempIndices = [];

const targetAutoFillMap = {
    "台灣加權": "^TWII", "加權指數": "^TWII", "台股": "^TWII", "^TWII": "台灣加權",
    "標普500": "^GSPC", "標普 500": "^GSPC", "S&P500": "^GSPC", "^GSPC": "標普500",
    "費半": "^SOX", "費城半導體": "^SOX", "^SOX": "費半",
    "那斯達克": "^IXIC", "NASDAQ": "^IXIC", "^IXIC": "那斯達克",
    "道瓊": "^DJI", "道瓊工業": "^DJI", "^DJI": "道瓊",
    "比特幣": "BTC-USD", "BTC": "BTC-USD", "BTC-USD": "比特幣",
    "以太幣": "ETH-USD", "ETH": "ETH-USD", "ETH-USD": "以太幣"
};

let draggedIndex = null;

function renderEditIndicesList() {
    if (!elements.indicesEditList) return;
    elements.indicesEditList.innerHTML = '';
    tempIndices.forEach((idx, i) => {
        const item = document.createElement('div');
        item.style.cssText = "display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; margin-bottom: 8px; flex-wrap: wrap; cursor: grab; transition: background 0.2s;";
        item.draggable = true;

        item.innerHTML = `
            <div style="color: var(--text-secondary); padding-right: 4px; display: flex; align-items: center; justify-content: center; cursor: grab;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 120px;">
                <label style="font-size: 0.75rem; color: var(--text-secondary);">顯示名稱</label>
                <input type="text" class="idx-name" value="${idx.name || ''}" style="width: 100%; border: 1px solid var(--panel-border); background: transparent; color: #fff; padding: 4px 8px; border-radius: 4px;" placeholder="例如: 台灣加權">
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 120px;">
                <label style="font-size: 0.75rem; color: var(--text-secondary);">Yahoo代號</label>
                <input type="text" class="idx-symbol" value="${idx.symbol || ''}" style="width: 100%; border: 1px solid var(--panel-border); background: transparent; color: #fff; padding: 4px 8px; border-radius: 4px;" placeholder="例如: ^TWII 或 2330.TW">
            </div>
            <button class="btn-delete" onclick="removeTempIndex(${i})" style="margin-top: 18px; padding: 4px 10px;">刪除</button>
        `;

        // 拖拉事件綁定 (Drag and Drop)
        item.addEventListener('dragstart', (e) => {
            saveTempInputs();
            draggedIndex = i;
            item.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', i);
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            item.style.background = 'rgba(255,255,255,0.1)';
        });

        item.addEventListener('dragleave', () => {
            item.style.background = 'rgba(0,0,0,0.2)';
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.style.background = 'rgba(0,0,0,0.2)';
            if (draggedIndex === null || draggedIndex === i) return;

            // 重新排序陣列
            const draggedItem = tempIndices.splice(draggedIndex, 1)[0];
            tempIndices.splice(i, 0, draggedItem);

            draggedIndex = null;
            renderEditIndicesList(); // 重新渲染列表
        });

        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
            draggedIndex = null;
            Array.from(elements.indicesEditList.children).forEach(child => {
                child.style.background = 'rgba(0,0,0,0.2)';
            });
        });

        elements.indicesEditList.appendChild(item);
    });

    // 綁定輸入自動補齊事件
    const nameInputs = elements.indicesEditList.querySelectorAll('.idx-name');
    const symbolInputs = elements.indicesEditList.querySelectorAll('.idx-symbol');

    nameInputs.forEach((input, i) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.trim().toUpperCase();
            const mapKey = Object.keys(targetAutoFillMap).find(k => k.toUpperCase() === val);
            if (mapKey && !symbolInputs[i].value.trim()) {
                symbolInputs[i].value = targetAutoFillMap[mapKey];
                tempIndices[i].symbol = targetAutoFillMap[mapKey];
            }
            tempIndices[i].name = e.target.value.trim();
        });
    });

    symbolInputs.forEach((input, i) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value.trim().toUpperCase();
            const mapKey = Object.keys(targetAutoFillMap).find(k => k.toUpperCase() === val);
            if (mapKey && !nameInputs[i].value.trim()) {
                nameInputs[i].value = targetAutoFillMap[mapKey];
                tempIndices[i].name = targetAutoFillMap[mapKey];
            }
            tempIndices[i].symbol = e.target.value.trim().toUpperCase();
        });
    });
}

window.removeTempIndex = function (index) {
    saveTempInputs();
    tempIndices.splice(index, 1);
    renderEditIndicesList();
};

function saveTempInputs() {
    if (!elements.indicesEditList) return;
    const names = elements.indicesEditList.querySelectorAll('.idx-name');
    const symbols = elements.indicesEditList.querySelectorAll('.idx-symbol');

    names.forEach((node, i) => {
        if (tempIndices[i]) {
            let nVal = node.value.trim();
            let sVal = symbols[i].value.trim().toUpperCase();

            // 若有代號沒名稱，嘗試補上名稱
            if (sVal && !nVal) {
                const mapKey = Object.keys(targetAutoFillMap).find(k => k.toUpperCase() === sVal);
                if (mapKey) nVal = targetAutoFillMap[mapKey];
                else if (stockDictionary[sVal.replace('.TW', '')]) nVal = stockDictionary[sVal.replace('.TW', '')];
            }
            // 若有名稱沒代號，嘗試補上代號
            else if (nVal && !sVal) {
                const mapKey = Object.keys(targetAutoFillMap).find(k => k.toUpperCase() === nVal.toUpperCase());
                if (mapKey) sVal = targetAutoFillMap[mapKey];
            }

            tempIndices[i].name = nVal || '未命名標的';
            tempIndices[i].symbol = sVal;
            tempIndices[i].price = tempIndices[i].price || 0;
            tempIndices[i].change = tempIndices[i].change || 0;

            // 寫回輸入框確保存檔狀態正確顯示
            node.value = tempIndices[i].name;
            symbols[i].value = tempIndices[i].symbol;
        }
    });
}

if (elements.openIndicesModalBtn) {
    elements.openIndicesModalBtn.addEventListener('click', () => {
        tempIndices = JSON.parse(JSON.stringify(marketIndices));
        renderEditIndicesList();
        elements.editIndicesModal.classList.add('active');
    });
}

if (elements.addNewIndexBtn) {
    elements.addNewIndexBtn.addEventListener('click', () => {
        saveTempInputs();
        tempIndices.push({ symbol: '', name: '', price: 0, change: 0 });
        renderEditIndicesList();

        // 自動捲動到最下面
        setTimeout(() => {
            elements.indicesEditList.scrollTop = elements.indicesEditList.scrollHeight;
        }, 50);
    });
}

function closeIndicesModal() {
    elements.editIndicesModal.classList.remove('active');
}

if (elements.closeIndicesModalBtn) elements.closeIndicesModalBtn.addEventListener('click', closeIndicesModal);
if (elements.cancelIndicesBtn) elements.cancelIndicesBtn.addEventListener('click', closeIndicesModal);

if (elements.saveIndicesBtn) {
    elements.saveIndicesBtn.addEventListener('click', async () => {
        saveTempInputs();
        marketIndices = JSON.parse(JSON.stringify(tempIndices));
        saveMarketIndices();
        closeIndicesModal();

        const syncBtn = document.getElementById('syncIndicesBtn');
        const originalText = syncBtn ? syncBtn.innerText : '';
        if (syncBtn) { syncBtn.disabled = true; syncBtn.innerText = '🔄 同步中...'; }

        await syncLiveMarketData();

        if (syncBtn) {
            syncBtn.innerText = '✅ 同步完成';
            setTimeout(() => { syncBtn.disabled = false; syncBtn.innerText = originalText; }, 2000);
        }
    });
}

// ==========================================
// 即時市場數據同步 (Live Market API Sync)
// ==========================================
const syncIndicesBtn = document.getElementById('syncIndicesBtn');
if (syncIndicesBtn) {
    syncIndicesBtn.addEventListener('click', async () => {
        syncIndicesBtn.disabled = true;
        const originalText = syncIndicesBtn.innerText;
        syncIndicesBtn.innerText = '🔄 同步中...';

        await syncLiveMarketData();

        syncIndicesBtn.innerText = '✅ 同步完成';
        setTimeout(() => {
            syncIndicesBtn.disabled = false;
            syncIndicesBtn.innerText = originalText;
        }, 3000);
    });
}



// 增強型 CORS Proxy 請求，可自動切換備援 (加入逾時防護)
async function fetchWithFallback(url, timeoutMs = 8000) {
    // 如果是 Yahoo Finance 請求，增加一個 fallback 到 query1
    const urls = [url];
    if (url.includes('query2.finance.yahoo.com')) {
        urls.push(url.replace('query2.finance.yahoo.com', 'query1.finance.yahoo.com'));
    }

    const proxies = [
        (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}&disableCache=${Date.now()}`,
        (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u) => `/.netlify/functions/proxy?url=${encodeURIComponent(u)}`
    ];

    for (let targetUrl of urls) {
        for (let proxy of proxies) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

                const fetchUrl = proxy(targetUrl);
                const res = await fetch(fetchUrl, {
                    cache: "no-store",
                    headers: { 'Accept': 'application/json' },
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                if (res.ok) {
                    const text = await res.text();
                    try {
                        const data = JSON.parse(text);
                        // 檢查是否為有效的 Yahoo Finance 或 TWSE 資料
                        if (data && (data.chart || Array.isArray(data) || data.data)) return data;
                    } catch (parseErr) {
                        // 如果解析 JSON 失敗 (可能是 Proxy 回傳了錯誤訊息字串)
                    }
                }
            } catch (e) {
                // 繼續嘗試下一個 Proxy
            }
        }
    }
    throw new Error("All proxies and fallbacks failed for " + url);
}

// 同步持股清單個股報價 (使用 Yahoo Finance API + 備援 Proxy 避免 CORS 與 SSL 問題)
async function syncPortfolioPrices() {
    let updated = false;

    const promises = portfolio.map(async (asset) => {
        try {
            // 自動為台灣存股代號加上 .TW 後綴 (若為存數字代號)
            let symbol = asset.code;
            if (/^\d{4,6}$/.test(symbol)) {
                symbol = `${symbol}.TW`; // 預設為上市股票
            }

            const yfUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
            let data = await fetchWithFallback(yfUrl);

            // 若找無上市資料 (.TW)，則自動重試上櫃資料 (.TWO)
            if ((!data || !data.chart || !data.chart.result || data.chart.result.length === 0) && symbol.endsWith('.TW')) {
                const twoSymbol = symbol.replace('.TW', '.TWO');
                const twoUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${twoSymbol}?interval=1d&range=5d`;
                data = await fetchWithFallback(twoUrl);
            }

            if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
                const meta = data.chart.result[0].meta;
                if (meta && meta.regularMarketPrice) {
                    asset.currentPrice = parseFloat(meta.regularMarketPrice);
                    // 根據 chartPreviousClose 嚴謹計算日漲跌幅
                    const prevClose = parseFloat(meta.previousClose !== undefined ? meta.previousClose : meta.chartPreviousClose);
                    if (prevClose > 0) {
                        asset.dailyChangeRatio = ((asset.currentPrice - prevClose) / prevClose) * 100;
                    } else {
                        asset.dailyChangeRatio = 0;
                    }
                    updated = true;
                }
            } else {
                if (asset.dailyChangeRatio === undefined) asset.dailyChangeRatio = 0;
            }
        } catch (e) {
            console.warn(`Portfolio Sync failed for ${asset.name}:`, e);
            if (asset.dailyChangeRatio === undefined) asset.dailyChangeRatio = 0;
        }
    });

    await Promise.all(promises);

    if (updated) {
        savePortfolio(); // 記錄價格至 localstorage
        updateDashboard(); // 觸發清單與圖表重新渲染 (含熱力圖與資產狀態)
    }
}

async function syncLiveMarketData() {
    // 平行抓取庫存個股與大盤指數
    const p1 = syncPortfolioPrices();

    const p2 = marketIndices.map(async (idx) => {
        if (!idx.symbol) return;

        // ---- 1. 加密貨幣 (使用 Binance 官方 API 作為備用快速連線) ----
        // 判斷名稱包含 BTC 或比特幣，或代號是 BTC-USD
        if (idx.symbol === 'BTC-USD' || (idx.name && idx.name.toUpperCase().includes('BTC')) || (idx.name && idx.name.includes('比特幣'))) {
            try {
                const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
                if (res.ok) {
                    const data = await res.json();
                    idx.price = parseFloat(data.lastPrice);
                    idx.change = parseFloat(data.priceChangePercent);
                    return; // 這裡成功就提早結束 (不用繼續 Yahoo)
                }
            } catch (e) {
                console.warn('Binance BTC Sync Failed, falling back to Yahoo:', e);
            }
        }

        // ---- 2. 台灣加權指數 (優先嘗試台灣證券交易所 OpenAPI 作為備援) ----
        if (idx.symbol === '^TWII') {
            try {
                const twseUrl = 'https://openapi.twse.com.tw/v1/exchangeReport/FMTQIK';
                const data = await fetchWithFallback(twseUrl, 5000);

                if (data && Array.isArray(data) && data.length > 0) {
                    const last = data[data.length - 1];
                    const price = parseFloat(last.TAIEX.replace(/,/g, ''));
                    const changePt = parseFloat(last.Change.replace(/,/g, ''));
                    const prevClose = price - changePt;
                    idx.price = price;
                    if (prevClose > 0) idx.change = (changePt / prevClose) * 100;
                    return; // 證交所 API 成功，直接跳出本回合
                }
            } catch (e) {
                console.warn('TWSE official API failed, falling back to Yahoo', e);
            }
        }

        // ---- 3. 通用抓取 (使用 Yahoo Finance API + 備援 Proxy) ----
        try {
            // 直接使用原始 symbol，不要先 encodeURIComponent，以免 Proxy 重複編碼
            const symbol = idx.symbol;
            const yfUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
            const data = await fetchWithFallback(yfUrl);

            if (data && data.chart && data.chart.result && data.chart.result.length > 0) {
                const meta = data.chart.result[0].meta;
                if (meta && meta.regularMarketPrice) {
                    idx.price = parseFloat(meta.regularMarketPrice);
                    // Yahoo Finance 在某些市場指數不會回傳 previousClose，須改用 chartPreviousClose 
                    const prevClose = parseFloat(meta.previousClose !== undefined ? meta.previousClose : meta.chartPreviousClose);
                    if (prevClose > 0) {
                        idx.change = ((idx.price - prevClose) / prevClose) * 100;
                    } else {
                        idx.change = 0;
                    }
                }
            }
        } catch (e) {
            console.warn(`Yahoo Finance Sync Failed for ${idx.name} (${idx.symbol}):`, e);
        }
    });

    await Promise.all([p1, Promise.all(p2)]);
    saveMarketIndices();
    renderMarketIndices();
}

// 應用程式載入時，自動進行一次背景同步，以確保看到的是最新資訊
setTimeout(() => {
    syncLiveMarketData();
}, 1000);

// ==========================================
// 資料匯出與匯入功能 (跨裝置同步)
// ==========================================
window.exportData = function () {
    const dataToExport = {
        portfolio: portfolio,
        marketIndices: marketIndices,
        dividendInputs: dividendInputs,
        customStrategies: customStrategies,
        customTags: customTags
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport));
    const downloadAnchorNode = document.createElement('main');
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "my_stock_backup.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
};

window.importData = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.portfolio && importedData.marketIndices) {
                portfolio = importedData.portfolio;
                marketIndices = importedData.marketIndices;
                if (importedData.dividendInputs) dividendInputs = importedData.dividendInputs;
                if (importedData.customStrategies) customStrategies = importedData.customStrategies;
                if (importedData.customTags) customTags = importedData.customTags;

                // 強制覆寫目前的本機儲存
                savePortfolio();
                saveMarketIndices();
                saveDividendInputs();
                localStorage.setItem('myCustomStrategies', JSON.stringify(customStrategies));
                localStorage.setItem('myCustomTags', JSON.stringify(customTags));

                alert('資料已經成功匯入並覆寫！我們將為您重新整理以便套用設定。');
                window.location.reload();
            } else {
                alert('格式不符，請上傳正確的備份檔！');
            }
        } catch (error) {
            alert('無法解析檔案，請確認是否為本系統匯出的 JSON 檔案！');
        }
    };
    reader.readAsText(file);
    // 重設 input value 使其能連續選取相同檔案
    event.target.value = '';
};



// 支援 Enter 鍵
setTimeout(() => {
    const tagInput = document.getElementById('newTagName');
    if (tagInput) {
        tagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.addCustomTag();
            }
        });
    }
}, 500);

function updateTagSuggestions() {
    // 舊版 datalist 更新邏輯已由自定義下拉選單取代
}

// ==========================================
// 標籤智慧下拉選單邏輯 (Tag Autocomplete)
// ==========================================
function renderTagDropdown(filter = "") {
    const dropdown = document.getElementById('assetTagAutocomplete');
    const input = document.getElementById('assetTag');
    if (!dropdown || !input) return;

    // 取得所有可用標籤 (預設 + 已使用)
    const allTags = new Set([...customTags]);
    portfolio.forEach(asset => {
        if (asset && asset.tag) allTags.add(asset.tag);
    });

    const tagList = Array.from(allTags);
    const filtered = filter 
        ? tagList.filter(t => t.toLowerCase().includes(filter.toLowerCase()))
        : tagList;

    if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    dropdown.innerHTML = filtered.map(tag => `
        <div class="autocomplete-item" style="padding: 10px; cursor: pointer; transition: background 0.2s;" 
             onclick="selectTag('${tag}')">
            ${tag}
        </div>
    `).join('');
    dropdown.style.display = 'block';
}

window.selectTag = function(tag) {
    const input = document.getElementById('assetTag');
    const dropdown = document.getElementById('assetTagAutocomplete');
    if (input) input.value = tag;
    if (dropdown) dropdown.style.display = 'none';
};

// 綁定標籤輸入框事件
setTimeout(() => {
    const tagInput = document.getElementById('assetTag');
    const tagArrow = document.getElementById('tagDropdownArrow');
    const tagDropdown = document.getElementById('assetTagAutocomplete');

    if (tagInput) {
        // 任何狀態下點選都跳出全清單 (不論是否有舊文字)
        tagInput.addEventListener('click', (e) => {
            renderTagDropdown(""); 
            e.stopPropagation();
        });
        
        tagInput.addEventListener('focus', () => {
            renderTagDropdown("");
        });

        tagInput.addEventListener('input', () => {
            renderTagDropdown(tagInput.value);
        });
    }

    if (tagArrow) {
        tagArrow.addEventListener('click', (e) => {
            renderTagDropdown(""); // 點箭頭強迫顯示全清單
            e.stopPropagation();
        });
    }

    // 點擊外面自動關閉
    document.addEventListener('click', () => {
        if (tagDropdown) tagDropdown.style.display = 'none';
    });
}, 500);

// ==========================================
// 初始化執行 (確保順序正確)
// ==========================================
populateStrategySelects();
renderStrategySettings();
renderTagSettings();
updateTagSuggestions();

// 立即渲染主儀表板，讓使用者看到資料
updateDashboard();

// 延遲背景同步即時價格
setTimeout(() => {
    syncLiveMarketData();
}, 1000);




