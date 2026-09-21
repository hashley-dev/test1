$have = Get-ChildItem "D:\duan 2\duan 2\test2\images" | Select-Object -ExpandProperty Name
$need = @(
  "ly-thuong-kiet.jpg","hai-ba-trung.jpg","ba-trieu.jpg","ngo-quyen.jpg",
  "dinh-bo-linh.jpg","tran-hung-dao.jpg","le-loi.jpg","quang-trung.jpg",
  "ho-chi-minh.jpg","vo-nguyen-giap.jpg","nhu-nguyet-song-cau.jpg",
  "bach-dang-coc.jpg","thang-long.jpg","van-mieu.jpg","dien-bien-phu.jpg",
  "dong-da.jpg","chi-lang.jpg","hoa-lu.jpg","chua-mot-cot.jpg"
)
foreach ($n in $need) {
  if ($have -contains $n) { Write-Output ("HAVE   " + $n) }
  else { Write-Output ("NEED   " + $n) }
}
