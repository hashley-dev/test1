$ErrorActionPreference = 'Continue'
$root = "D:\duan 2\duan 2\test2\images"
if (-not (Test-Path $root)) { New-Item -ItemType Directory -Force -Path $root | Out-Null }

# tên file đích  ->  tên file trên Wikimedia Commons
$files = [ordered]@{
  "ly-thuong-kiet.jpg"      = "Tuong Ly Thuong Kiet, DNQT.jpg"
  "hai-ba-trung.jpg"        = "Hai Ba Trung statue in HCMC.JPG"
  "ba-trieu.jpg"            = "TuongBaTrieu.jpg"
  "ngo-quyen.jpg"           = "Tượng Ngô Quyền.jpg"
  "dinh-bo-linh.jpg"        = "Dinh Bo Linh Shrine, Hoa Lư, Ninh Bình, Vietnam, 20240203 1458 5685.jpg"
  "tran-hung-dao.jpg"       = "Statue of Tran Hung Dao at Me Linh Square.jpg"
  "le-loi.jpg"              = "Statue of Lê Lợi.jpg"
  "quang-trung.jpg"         = "Tượng đài Quang Trung tại Bảo tàng Quang Trung.JPG"
  "ho-chi-minh.jpg"         = "Ho Chi Minh 1946.jpg"
  "vo-nguyen-giap.jpg"      = "Vo Nguyen Giap 1951.jpg"
  "nhu-nguyet-song-cau.jpg" = "Sông Cầu, đoạn qua Bắc Giang.JPG"
  "bach-dang-coc.jpg"       = "Cọc Bạch Đằng.jpg"
  "thang-long.jpg"          = "Thăng Long Imperial Citadel (32451244358).jpg"
  "van-mieu.jpg"            = "Van Mieu Hanoi 23.jpg"
  "dien-bien-phu.jpg"       = "The Victory Monument of Dien Bien Phu (front).jpg"
  "dong-da.jpg"             = "Gò Đống Đa.JPG"
  "chi-lang.jpg"            = "Chi Lăng 2.jpg"
  "hoa-lu.jpg"              = "Gate at Hoa Lu - Vietnam - August 2023.jpg"
  "chua-mot-cot.jpg"        = "One Pillar Pagoda, Hanoi, Vietnam, 20240123 1122 3222.jpg"
}

$h = @{
  'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
  'Referer'    = 'https://commons.wikimedia.org/'
}

foreach ($dest in $files.Keys) {
  $wiki = $files[$dest]
  $outPath = Join-Path $root $dest
  # hỏi API để lấy URL gốc của file
  $title = [uri]::EscapeDataString("File:" + $wiki)
  $api = "https://commons.wikimedia.org/w/api.php?action=query&titles=$title&prop=imageinfo&iiprop=url&format=json"
  try {
    $meta = Invoke-RestMethod -Uri $api -Headers $h -ErrorAction Stop
    $pages = $meta.query.pages
    $url = $null
    foreach ($p in $pages.PSObject.Properties) {
      if ($p.Value.imageinfo) { $url = $p.Value.imageinfo[0].url }
    }
    if (-not $url) { Write-Output ("NOURL  " + $dest); continue }
    Start-Sleep -Seconds 3
    Invoke-WebRequest -Uri $url -OutFile $outPath -Headers $h -ErrorAction Stop
    $kb = [math]::Round((Get-Item $outPath).Length / 1KB)
    Write-Output ("OK     " + $dest + "  (" + $kb + " KB)")
  } catch {
    Write-Output ("FAIL   " + $dest + "  :: " + $_.Exception.Message)
  }
  Start-Sleep -Seconds 3
}
