$appendStr = [System.IO.File]::ReadAllText('f:\理財小幫手_M版\scratch\append.txt', [System.Text.Encoding]::UTF8)
[System.IO.File]::AppendAllText('f:\理財小幫手_M版\styles.css', $appendStr, [System.Text.Encoding]::UTF8)
Write-Output "Appended successfully"
