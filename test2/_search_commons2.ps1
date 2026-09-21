$ErrorActionPreference = 'Continue'
$terms = @(
  "Nhu Nguyet river",
  "Bach Dang stake",
  "Thang Long",
  "Van Mieu Hanoi",
  "Dien Bien Phu victory",
  "Dong Da",
  "Chi Lang",
  "Cổ Loa",
  "Hoa Lu",
  "One Pillar Pagoda",
  "Temple Ly Thuong Kiet",
  "Vietnam National Museum History"
)
foreach ($t in $terms) {
  Start-Sleep -Seconds 4
  Write-Output ("=== " + $t + " ===")
  $enc = [uri]::EscapeDataString($t)
  $u = "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=$enc&srnamespace=6&srlimit=6&format=json"
  try {
    $r = Invoke-RestMethod -Uri $u -Headers @{ 'User-Agent' = 'Mozilla/5.0' } -ErrorAction Stop
    foreach ($s in $r.query.search) { Write-Output ("  " + $s.title) }
  } catch {
    Write-Output ("  ERR: " + $_.Exception.Message)
  }
}
