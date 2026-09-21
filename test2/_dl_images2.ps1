$ErrorActionPreference = 'Continue'
$root = "D:\duan 2\duan 2\test2\images"

$files = [ordered]@{
  "ngo-quyen.jpg"           = "Tượng Ngô Quyền.jpg"
  "dinh-bo-linh.jpg"        = "Dinh Bo Linh Shrine, Hoa Lư, Ninh Bình, Vietnam, 20240203 1458 5685.jpg"
  "le-loi.jpg"              = "Statue of Lê Lợi.jpg"
  "quang-trung.jpg"         = "Tượng đài Quang Trung tại Bảo tàng Quang Trung.JPG"
  "nhu-nguyet-song-cau.jpg" = "Sông Cầu, đoạn qua Bắc Giang.JPG"
  "bach-dang-coc.jpg"       = "Cọc Bạch Đằng.jpg"
  "thang-long.jpg"          = "Thăng Long Imperial Citadel (32451244358).jpg"
  "dong-da.jpg"             = "Gò Đống Đa.JPG"
  "chi-lang.jpg"            = "Chi Lăng 2.jpg"
}

$h = @{
  'User-Agent'            = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
  'Referer'               = 'https://commons.wikimedia.org/'
  'Accept'                = 'application/json'
  'Accept-Language'       = 'en-US,en;q=0.9'
}

foreach ($dest in $files.Keys) {
  $wiki = $files[$dest]
  $outPath = Join-Path $root $dest
  # Mã hoá từng ký tự UTF-8 thủ công, tránh lỗi encode của PowerShell
  $bytes = [System.Text.Encoding]::UTF8.GetBytes("File:" + $wiki)
  $enc = ($bytes | ForEach-Object { '%' + $_.ToString('X2') }) -join ''
  $api = "https://commons.wikimedia.org/w/api.php?action=query&titles=$enc&prop=imageinfo&iiprop=url&format=json"
  try {
    $meta = Invoke-RestMethod -Uri $api -Headers $h -ErrorAction Stop
    $url = $null
    foreach ($p in $meta.query.pages.PSObject.Properties) {
      if ($p.Value.imageinfo) { $url = $p.Value.imageinfo[0].url }
    }
    if (-not $url) { Write-Output ("NOURL  " + $dest + "  [" + $wiki + "]"); continue }
    Start-Sleep -Seconds 3
    Invoke-WebRequest -Uri $url -OutFile $outPath -Headers $h -ErrorAction Stop
    $kb = [math]::Round((Get-Item $outPath).Length / 1KB)
    Write-Output ("OK     " + $dest + "  (" + $kb + " KB)")
  } catch {
    Write-Output ("FAIL   " + $dest + "  :: " + $_.Exception.Message)
  }
  Start-Sleep -Seconds 3
}
