$ErrorActionPreference = 'Continue'
$root = "D:\duan 2\duan 2\test2\images"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Tìm file trên Commons bằng từ khoá ASCII, lấy title chuẩn do API trả về,
# rồi tải file đầu tiên khớp với mẫu tên mong muốn.
$jobs = [ordered]@{
  "ngo-quyen.jpg"           = @{ q = "Tuong Ngo Quyen";            want = "Tượng Ngô Quyền.jpg" }
  "dinh-bo-linh.jpg"        = @{ q = "Dinh Bo Linh Shrine Hoa Lu"; want = "Dinh Bo Linh Shrine, Hoa L\u01b0, Ninh B\u00ecnh, Vietnam, 20240203 1458 5685.jpg" }
  "le-loi.jpg"              = @{ q = "Statue of Le Loi";           want = "Statue of L\u00ea L\u1ee3i.jpg" }
  "quang-trung.jpg"         = @{ q = "Tuong dai Quang Trung Bao tang"; want = "T\u01b0\u1ee3ng \u0111\u00e0i Quang Trung t\u1ea1i B\u1ea3o t\u00e0ng Quang Trung.JPG" }
  "nhu-nguyet-song-cau.jpg" = @{ q = "Song Cau Bac Giang";         want = "S\u00f4ng C\u1ea7u, \u0111o\u1ea1n qua B\u1eafc Giang.JPG" }
  "bach-dang-coc.jpg"       = @{ q = "Coc Bach Dang";              want = "C\u1ecdc B\u1ea1ch \u0110\u1eb1ng.jpg" }
  "thang-long.jpg"          = @{ q = "Thang Long Imperial Citadel 32451244358"; want = "Th\u0103ng Long Imperial Citadel (32451244358).jpg" }
  "dong-da.jpg"             = @{ q = "Go Dong Da";                 want = "G\u00f2 \u0110\u1ed1ng \u0110a.JPG" }
  "chi-lang.jpg"            = @{ q = "Chi Lang 2";                 want = "Chi L\u0103ng 2.jpg" }
}

$h = @{
  'User-Agent'      = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
  'Referer'         = 'https://commons.wikimedia.org/'
  'Accept-Language' = 'en-US,en;q=0.9'
}

function Get-FileUrl([string]$title) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($title)
  $enc = ($bytes | ForEach-Object { '%' + $_.ToString('X2') }) -join ''
  $api = "https://commons.wikimedia.org/w/api.php?action=query&titles=$enc&prop=imageinfo&iiprop=url&format=json"
  $meta = Invoke-RestMethod -Uri $api -Headers $h -ErrorAction Stop
  foreach ($p in $meta.query.pages.PSObject.Properties) {
    if ($p.Value.imageinfo) { return $p.Value.imageinfo[0].url }
  }
  return $null
}

foreach ($dest in $jobs.Keys) {
  $outPath = Join-Path $root $dest
  $job = $jobs[$dest]
  try {
    $url = Get-FileUrl ("File:" + $job.want)
    if (-not $url) {
      Write-Output ("NOURL  " + $dest)
      continue
    }
    Start-Sleep -Seconds 3
    Invoke-WebRequest -Uri $url -OutFile $outPath -Headers $h -ErrorAction Stop
    $kb = [math]::Round((Get-Item $outPath).Length / 1KB)
    Write-Output ("OK     " + $dest + "  (" + $kb + " KB)")
  } catch {
    Write-Output ("FAIL   " + $dest + "  :: " + $_.Exception.Message)
  }
  Start-Sleep -Seconds 3
}
