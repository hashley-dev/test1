$ErrorActionPreference = 'Continue'
$root = "D:\duan 2\duan 2\test2\images"
Start-Sleep -Seconds 120

$jobs = [ordered]@{
  "quang-trung.jpg"         = "Tượng đài Quang Trung tại Bảo tàng Quang Trung.JPG"
  "dong-da.jpg"             = "Gò Đống Đa.JPG"
  "chi-lang.jpg"            = "Chi Lăng 2.jpg"
  "nhu-nguyet-song-cau.jpg" = "Sông Cầu, đoạn qua Bắc Giang.JPG"
  "bach-dang-coc.jpg"       = "Cọc Bạch Đằng.jpg"
  "thang-long.jpg"          = "Thăng Long Imperial Citadel (32451244358).jpg"
}

$h = @{
  'User-Agent'      = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
  'Referer'         = 'https://commons.wikimedia.org/'
}

$searchMap = @{
  "quang-trung.jpg"         = "Tuong dai Quang Trung Bao tang Quang Trung"
  "dong-da.jpg"             = "Go Dong Da"
  "chi-lang.jpg"            = "Chi Lang 2 Lang Son"
  "nhu-nguyet-song-cau.jpg" = "Song Cau Bac Giang"
  "bach-dang-coc.jpg"       = "Coc Bach Dang"
  "thang-long.jpg"          = "Thang Long Imperial Citadel Hanoi"
}

function Retry([scriptblock]$a, [int]$max = 4) {
  for ($i = 1; $i -le $max; $i++) {
    try { return & $a } catch { if ($i -eq $max) { throw }; Start-Sleep -Seconds (20 * $i) }
  }
}

foreach ($dest in $jobs.Keys) {
  $outPath = Join-Path $root $dest
  if ((Test-Path $outPath) -and ((Get-Item $outPath).Length -gt 2048)) { Write-Output ("SKIP " + $dest); continue }
  $want = $jobs[$dest]
  try {
    $r = Retry { Invoke-RestMethod -Uri ("https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=" + [uri]::EscapeDataString($searchMap[$dest]) + "&srnamespace=6&srlimit=10&format=json") -Headers $h -ErrorAction Stop }
    $titles = @($r.query.search | ForEach-Object { $_.title })
    $title = $titles | Where-Object { $_ -eq ("File:" + $want) } | Select-Object -First 1
    if (-not $title) { Write-Output ("NOTFOUND " + $dest); continue }
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($title)
    $encT = ($bytes | ForEach-Object { '%' + $_.ToString('X2') }) -join ''
    $meta = Retry { Invoke-RestMethod -Uri "https://commons.wikimedia.org/w/api.php?action=query&titles=$encT&prop=imageinfo&iiprop=url&format=json" -Headers $h -ErrorAction Stop }
    $url = $null
    foreach ($p in $meta.query.pages.PSObject.Properties) { if ($p.Value.imageinfo) { $url = $p.Value.imageinfo[0].url } }
    if (-not $url) { Write-Output ("NOURL " + $dest); continue }
    Start-Sleep -Seconds 8
    Retry { Invoke-WebRequest -Uri $url -OutFile $outPath -Headers $h -ErrorAction Stop }
    Write-Output ("OK " + $dest + " (" + [math]::Round((Get-Item $outPath).Length/1KB) + " KB)")
  } catch {
    Write-Output ("FAIL " + $dest + " :: " + $_.Exception.Message)
  }
  Start-Sleep -Seconds 8
}
Write-Output "ALLDONE"
