$path = 'styles.css'
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$appendCss = @"

/* ==========================================
   全域滾動條隱藏 (隱藏但保持可滾動)
   ========================================== */
* {
    scrollbar-width: none !important; /* Firefox */
    -ms-overflow-style: none !important; /* IE and Edge */
}
*::-webkit-scrollbar {
    display: none !important; /* Chrome, Safari, Opera */
    width: 0px !important;
    height: 0px !important;
}

/* ==========================================
   消除電腦版卡片內部小滾動條 (讓卡片高度隨內容自動撐開)
   ========================================== */
@media (min-width: 1024px) {
    .glass-panel {
        max-height: none !important;
        overflow-y: visible !important;
        height: auto !important;
    }
    .assets-table, .trend-table {
        max-height: none !important;
        overflow-y: visible !important;
    }
    #dividendHistoryList, #tagSettingsList {
        max-height: none !important;
        overflow-y: visible !important;
    }
}

/* ==========================================
   手機版重構 (寬度 767px 以下)
   ========================================== */
@media (max-width: 767px) {
    /* 頂部導覽列：垂直堆疊，文字縮小置中 */
    .topbar {
        flex-direction: column !important;
        align-items: center !important;
        padding: 12px 16px !important;
        gap: 12px !important;
    }
    .topbar > div:first-child {
        flex-direction: column !important;
        gap: 8px !important;
        justify-content: center !important;
    }
    .topbar .logo {
        font-size: 1.2rem !important;
        justify-content: center !important;
    }
    .topbar .privacy-badge {
        padding: 4px 8px !important;
    }
    .topbar .privacy-badge span {
        font-size: 0.7rem !important;
    }
    
    .nav-menu {
        flex-wrap: wrap !important;
        justify-content: center !important;
        gap: 8px !important;
    }
    .nav-item {
        padding: 6px 10px !important;
        font-size: 0.8rem !important;
    }

    /* 縮小頁首空白間距 */
    .main-content {
        padding: 12px 8px !important;
    }
    header {
        margin-bottom: 16px !important;
        gap: 4px !important;
    }
    header h1 {
        font-size: 1.6rem !important;
        margin-bottom: 4px !important;
    }
    header .subtitle {
        font-size: 0.85rem !important;
    }

    /* 縮小大金額數字 */
    .kpi-value {
        font-size: 2rem !important;
    }
    #totalDividendOutput {
        font-size: 2rem !important;
    }

    /* 卡片邊距調小，讓畫面更乾淨 */
    .glass-panel {
        padding: 12px !important;
        border-radius: 16px !important;
        margin-bottom: 16px !important;
    }

    .kpi-card {
        padding: 16px !important;
        min-height: 100px !important;
    }

    /* 確保所有原本雙欄的區塊變成單欄由上到下 */
    .kpi-container {
        grid-template-columns: 1fr !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 12px !important;
        margin-bottom: 16px !important;
    }

    .glass-panel[style*="relative"] {
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
    }
    
    .section-title {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 8px !important;
    }
    
    .section-title button, .section-title select {
        width: 100% !important;
        text-align: center !important;
        margin-top: 4px !important;
    }
    
    /* 表格調整 */
    .assets-table {
        font-size: 13px !important;
    }
    .assets-table th, .assets-table td {
        padding: 6px !important;
    }
}
"@

$content += $appendCss
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Output "Styles updated for mobile, desktop, and scrollbars."
