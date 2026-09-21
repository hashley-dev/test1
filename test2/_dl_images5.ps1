$ErrorActionPreference = 'Continue'
$root = "D:\duan 2\duan 2\test2\images"

# Chỉ tải những file còn thiếu. idx = vị trí trong kết quả tìm kiếm.
$jobs = [ordered]@{
  "quang-trung.jpg"         = @{ q = "Tuong dai Quang Trung Bao tang Quang Trung"; idx = 1 }
  "nhu-nguyet-song-cau.jpg" = @{ q = "Song Cau Bac Giang";         idx = 0 }
  "bach-dang-coc.jpg"       = @{ q = "Coc Bach Dang";              idx = 0 }
  "thang-long.jpg"          = @{ q = "Thang Long Imperial Citadel 32451244358"; idx = 0 }
  "dong-da.jpg"             = @{ q = "Go Dong Da";                 idx = 0 }
  "chi-lang.jpg"            = @{ q = "Chi Lang 2 Lang Son";        idx = 0 }
}

$h = @{
  'User-Agent'      = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
  'Referer'         = 'https://commons.wikimedia.org/'
  'Accept-Language' = 'en-US,en;q=0.9'
}

function Invoke-WithRetry([scriptblock]$action, [int]$max = 5) {
  for ($i = 1; $i -le $max; $i++) {
    try { return & $action }
    catch {
      if ($i -eq $max) { throw }
      Start-Sleep -Seconds (8 * $i)
    }
  }
}

foreach ($dest in $jobs.Keys) {
  $outPath = Join-Path $root $dest
  if ((Test-Path $outPath) -and ((Get-Item $outPath).Length -gt 2048)) {
    Write-Output ("SKIP   " + $dest)
    continue
  }
  $job = $jobs[$dest]
  try {
    $encQ = [uri]::EscapeDataString($job.q)
    $searchApi = "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=$encQ&srnamespace=6&srlimit=8&format=json"
    $res = Invoke-WithRetry { Invoke-RestMethod -Uri $searchApi -Headers $h -ErrorAction Stop }
    $titles = @($res.query.search | ForEach-Object { $_.title })
    if ($titles.Count -le $job.idx) { Write-Output ("NOSEARCH " + $dest); continue }
    $title = $titles[$job.idx]

    $bytes = [System.Text.Encoding]::UTF8.GetBytes($title)
    $encT = ($bytes | ForEach-Object { '%' + $_.ToString('X2') }) -join ''
    $api = "https://commons.wikimedia.org/w/api.php?action=query&titles=$encT&prop=imageinfo&iiprop=url&format=json"
    $meta = Invoke-WithRetry { Invoke-RestMethod -Uri $api -Headers $h -ErrorAction Stop }
    $url = $null
    foreach ($p in $meta.query.pages.PSObject.Properties) {
      if ($p.Value.imageinfo) { $url = $p.Value.imageinfo[0].url }
    }
    if (-not $url) { Write-Output ("NOURL " + $dest); continue }

    Start-Sleep -Seconds 5
    Invoke-WithRetry { Invoke-WebRequest -Uri $url -OutFile $outPath -Headers $h -ErrorAction Stop }
    $kb = [math]::Round((Get-Item $outPath).Length / 1KB)
    Write-Output ("OK     " + $dest + "  (" + $kb + " KB)  <- " + $title)
  } catch {
    Write-Output ("FAIL   " + $dest + "  :: " + $_.Exception.Message)
  }
  Start-Sleep -Seconds 5
}
Write-Output "DONE"
