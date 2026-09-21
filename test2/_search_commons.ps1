$ErrorActionPreference = 'Continue'
$terms = @(
  "Hai Ba Trung statue",
  "Ba Trieu",
  "Ngo Quyen statue",
  "Dinh Bo Linh",
  "Tran Hung Dao statue",
  "Le Loi statue",
  "Quang Trung statue",
  "Ho Chi Minh portrait",
  "Vo Nguyen Giap",
  "Nam quoc son ha",
  "Nhu Nguyet",
  "Bach Dang battle",
  "Thang Long citadel",
  "Temple of Literature Hanoi",
  "Ly dynasty",
  "Dien Bien Phu",
  "Dong Da mound",
  "Chi Lang"
)
foreach ($t in $terms) {
  Write-Output ("=== " + $t + " ===")
  $enc = [uri]::EscapeDataString($t)
  $u = "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=$enc&srnamespace=6&srlimit=5&format=json"
  try {
    $r = Invoke-RestMethod -Uri $u -Headers @{ 'User-Agent' = 'Mozilla/5.0' } -ErrorAction Stop
    foreach ($s in $r.query.search) { Write-Output ("  " + $s.title) }
  } catch {
    Write-Output ("  ERR: " + $_.Exception.Message)
  }
}
