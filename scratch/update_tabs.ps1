$path = 'styles.css'
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

$content = $content -replace 'box-shadow:\s*inset\s+2px\s+0\s+0\s+var\(--accent-color\);', 'box-shadow: 0 2px 0 var(--accent-color);'
$content = $content -replace '\.nav-item\.active::after\s*\{[^}]*\}', '.nav-item.active::after { display: none; }'
$content = $content -replace 'background:\s*linear-gradient\(90deg,\s*rgba\(59,\s*130,\s*246,\s*0\.15\)\s*0%,\s*transparent\s*100%\);', 'background: linear-gradient(180deg, transparent 0%, rgba(59, 130, 246, 0.15) 100%);'

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Output "Successfully updated nav-item styles"
