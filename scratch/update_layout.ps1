$path = 'f:\理財小幫手_M版\styles.css'
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Change .app-container to flex-direction: column
$target = '(?s)\.app-container\s*\{\s*display:\s*flex;\s*width:\s*100%;\s*max-width:\s*100vw;\s*height:\s*100vh;\s*overflow-x:\s*hidden;\s*\}'
$replacement = @'
.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  height: 100vh;
  overflow-x: hidden;
}

/* 頂部導覽列樣式 (取代原本的 Sidebar) */
.topbar {
  background: rgba(15, 17, 23, 0.9);
  backdrop-filter: blur(20px);
  position: sticky;
  top: 0;
  border-bottom: 1px solid var(--panel-border);
}
'@

$newContent = $content -replace $target, $replacement

[System.IO.File]::WriteAllText($path, $newContent, [System.Text.Encoding]::UTF8)
Write-Output "Successfully updated styles.css"
