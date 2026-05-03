$path = 'styles.css'
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Remove max-width and excessive padding from main-content
$content = $content -replace '(?s)\.main-content\s*\{[^}]*\}', '.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  scroll-behavior: smooth;
  max-width: 100%;
  margin: 0;
  width: 100%;
}'

# Ensure body and html explicitly hide scrollbars for ALL browsers (Chrome/Edge/Firefox)
$appendCss = @"

/* 強制隱藏全站所有滾動條 */
html, body {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
}
html::-webkit-scrollbar, body::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    background: transparent !important;
}
"@

$content += $appendCss

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Output "Successfully updated layout spacing and scrollbars."
