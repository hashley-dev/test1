/* =====================================================================
   MÁC & ĂNGGHEN — MACANGGHEN.JS
   Mục lục:
   1. DỮ LIỆU (nhân vật, timeline, sơ đồ học thuyết, tác phẩm, thư viện, trích dẫn)
   2. LOADING SCREEN + ẢNH NỀN
   3. HEADER SCROLL + MOBILE MENU + ACTIVE NAV LINK
   4. SMOOTH SCROLL CHO CÁC LIÊN KẾT NEO (#...)
   5. HIỆU ỨNG PARTICLES TRONG HERO (canvas)
   6. RENDER NHÂN VẬT + MODAL TIỂU SỬ
   7. RENDER TIMELINE + TƯƠNG TÁC CLICK
   8. RENDER SƠ ĐỒ BA NGUỒN GỐC – BA BỘ PHẬN
   9. RENDER TÁC PHẨM / SỰ KIỆN
   10. RENDER THƯ VIỆN ẢNH + LIGHTBOX
   11. TRÍCH DẪN LỊCH SỬ (luân phiên + hiệu ứng chữ + parallax)
   12. SCROLL REVEAL DÙNG CHUNG (IntersectionObserver)
   13. COUNTER ANIMATION (số liệu trong phần giới thiệu)
   14. NÚT BACK TO TOP + NĂM Ở FOOTER
===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* =====================================================================
     1. DỮ LIỆU
     Toàn bộ nội dung nhân vật / sự kiện / ảnh / trích dẫn được khai báo
     tại đây. Muốn sửa nội dung hoặc thêm mục mới, chỉ cần chỉnh trong các
     mảng dữ liệu bên dưới — không cần đụng tới phần code render.
     (Trong chuỗi dùng dấu “ ” để trích dẫn, tránh phải escape dấu " .)
  ===================================================================== */

  /* ---------------------------------------------------------------------
     Hàm tạo ảnh SVG "tự chứa" (không phụ thuộc mạng).
     Trả về data-URI nên ảnh luôn hiển thị ngay cả khi không có Internet.
     Muốn dùng ảnh thật: điền đường dẫn file vào trường image / src.
     Tham số title dùng "|" để xuống dòng, ví dụ "Tuyên ngôn|Đảng Cộng sản".
  --------------------------------------------------------------------- */
  function makeArt(title, subtitle, w, h, hue) {
    const palette = {
      gold: ["#2a1a12", "#c9a227", "#f2ead9"],
      red: ["#2a1012", "#c24a4a", "#f2ead9"],
      jade: ["#0f1c18", "#5f8a76", "#e7d9bc"],
    };
    const [bg, accent, text] = palette[hue] || palette.red;
    const esc = (s) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const lines = String(title).split("|");
    // Bộ chữ hỗ trợ đầy đủ dấu tiếng Việt: ưu tiên font hệ thống có Latin Extended
    const fontSerif =
      "'Times New Roman','Palatino Linotype','Segoe UI','Noto Serif',Tahoma,Arial,sans-serif";
    const fontSans = "'Segoe UI','Noto Sans',Tahoma,Arial,Helvetica,sans-serif";
    const lineGap = 62;
    const titleSvg = lines
      .map(
        (line, i) =>
          `<text x="${w / 2}" y="${h / 2 - ((lines.length - 1) * lineGap) / 2 + i * lineGap + 14}" text-anchor="middle" font-family="${fontSerif}" font-size="${Math.round(w / 13)}" font-weight="700" fill="${accent}">${esc(line)}</text>`,
      )
      .join("");
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
      `<rect width="${w}" height="${h}" fill="${bg}"/>` +
      `<rect x="12" y="12" width="${w - 24}" height="${h - 24}" fill="none" stroke="${accent}" stroke-width="2" opacity="0.5"/>` +
      `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.3}" fill="${accent}" opacity="0.08"/>` +
      titleSvg +
      `<text x="${w / 2}" y="${h / 2 + ((lines.length - 1) * lineGap) / 2 + 78}" text-anchor="middle" font-family="${fontSans}" font-size="${Math.round(w / 30)}" fill="${text}" opacity="0.75">${esc(subtitle || "")}</text>` +
      `</svg>`;
    // encodeURIComponent để nguyên dấu ' và ( ) — mã hóa thêm để an toàn khi
    // dùng trong CSS url(...) và trong thuộc tính HTML.
    const encoded = encodeURIComponent(svg)
      .replace(/'/g, "%27")
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29");
    return "data:image/svg+xml;charset=UTF-8," + encoded;
  }

  /* ---------------------------------------------------------------------
     Gắn ảnh dự phòng cho mọi <img data-fallback>. Nếu ảnh lỗi (thiếu file /
     sai đường dẫn), thay bằng ảnh SVG dự phòng để khung ảnh không bao giờ trống.
     Gọi sau khi các card đã được render ra DOM.
  --------------------------------------------------------------------- */
  function applyImageFallbacks(scope) {
    (scope || document)
      .querySelectorAll("img[data-fallback]")
      .forEach((img) => {
        const swap = () => {
          if (img.dataset.swapped === "1" || !img.dataset.fallback) return;
          img.dataset.swapped = "1";
          img.src = img.dataset.fallback;
        };
        if (img.complete && img.naturalWidth === 0) swap();
        img.addEventListener("error", swap);
      });
  }

  // Danh sách nhân vật hiển thị ở section "Mác, Ăngghen và những người đồng hành"
  const heroesData = [
    {
      isMain: true,
      name: "C. Mác (Karl Marx)",
      era: "5/5/1818 – 14/3/1883",
      short:
        "Nhà triết học, nhà kinh tế học và nhà cách mạng người Đức, tác giả bộ Tư bản và người cùng Ăngghen soạn thảo Tuyên ngôn của Đảng Cộng sản.",
      // THAY ẢNH TẠI ĐÂY: chép ảnh vào images/mac.jpg
      image: "images/mac.jpg",
      imageFallback: makeArt("C. Mác", "1818 – 1883", 600, 750, "red"),
      bio: "Karl Marx sinh ngày 5/5/1818 ở thành phố Trier, vùng Sông Ranh của Vương quốc Phổ, trong một gia đình luật sư. Ông học luật ở Bonn rồi Berlin nhưng ngày càng say mê triết học, gia nhập nhóm Hêghen trẻ và nhận bằng tiến sĩ triết học năm 1841. Sau khi báo Sông Ranh do ông làm chủ bút bị đóng cửa, ông rời nước Đức, sống lưu vong ở Paris, Brussels rồi định cư ở Luân Đôn từ năm 1849.",
      context:
        "Nửa đầu thế kỷ XIX, cách mạng công nghiệp làm nảy sinh giai cấp công nhân hiện đại cùng những mâu thuẫn xã hội gay gắt. Khởi nghĩa thợ dệt ở Lyon (Pháp, 1831 và 1834), phong trào Hiến chương ở Anh (từ cuối thập niên 1830) và khởi nghĩa thợ dệt ở Silesia (Đức, 1844) cho thấy giai cấp công nhân đã bước lên vũ đài chính trị, nhưng chưa có một học thuyết soi đường.",
      achievements:
        "Cùng Ăngghen, Mác xây dựng quan niệm duy vật về lịch sử, soạn Tuyên ngôn của Đảng Cộng sản (1848), đóng vai trò hàng đầu trong Quốc tế thứ nhất (1864) và hoàn thành tập I bộ Tư bản (1867) với học thuyết giá trị thặng dư. Ông mất ngày 14/3/1883 ở Luân Đôn và được an táng ở nghĩa trang Highgate.",
      meaning:
        "Học thuyết của Mác ảnh hưởng sâu rộng tới triết học, kinh tế học, khoa học xã hội và các phong trào chính trị thế kỷ XX. Ông coi sản xuất vật chất và các quan hệ giai cấp là chìa khóa để hiểu sự vận động của xã hội, và nhấn mạnh rằng lý luận phải gắn với thực tiễn cải tạo thế giới.",
    },
    {
      isMain: true,
      name: "Ph. Ăngghen (Friedrich Engels)",
      era: "28/11/1820 – 5/8/1895",
      short:
        "Nhà tư tưởng và nhà cách mạng người Đức, người bạn, người cộng sự trọn đời của Mác và người hoàn thiện Tư bản tập II, III.",
      // THAY ẢNH TẠI ĐÂY: chép ảnh vào images/angghen.jpg
      image: "images/angghen.jpg",
      imageFallback: makeArt("Ph. Ăngghen", "1820 – 1895", 600, 750, "jade"),
      bio: "Friedrich Engels sinh ngày 28/11/1820 ở Barmen (nay thuộc Wuppertal), trong một gia đình chủ xưởng dệt theo đạo Tin Lành. Ông không theo học đại học chính quy mà sớm được đưa vào làm việc trong công việc kinh doanh của gia đình, đồng thời tự học và viết báo. Năm 1842, ông sang Manchester (Anh) làm việc tại một xưởng sợi của công ty gia đình.",
      context:
        "Sống ở Manchester — một trung tâm công nghiệp bậc nhất thế giới — Ăngghen trực tiếp chứng kiến đời sống cực khổ của công nhân. Từ những quan sát đó, ông viết “Tình cảnh của giai cấp lao động ở Anh” (1845) và bài “Phác thảo phê phán khoa kinh tế chính trị” (1844), tác phẩm đã gây ấn tượng mạnh với Mác.",
      achievements:
        "Ăngghen cùng Mác viết “Hệ tư tưởng Đức” và Tuyên ngôn của Đảng Cộng sản; từ năm 1850, ông làm việc ở Manchester để giúp Mác về vật chất, tạo điều kiện cho Mác viết Tư bản. Sau khi Mác mất, ông biên tập và xuất bản tập II (1885) và tập III (1894); ông cũng là tác giả của “Chống Đuyrinh” (1878) và “Nguồn gốc của gia đình, của chế độ tư hữu và của nhà nước” (1884).",
      meaning:
        "Ăngghen thường được coi là người đồng sáng lập chủ nghĩa Mác, không chỉ là người giúp đỡ Mác: ông có đóng góp vào phép biện chứng duy vật, phổ biến học thuyết và giữ vững sự liên kết của phong trào công nhân quốc tế sau năm 1883. Ông mất ngày 5/8/1895 ở Luân Đôn.",
    },
    {
      name: "Jenny von Westphalen",
      era: "1814 – 1881",
      short:
        "Người bạn đời và người cộng tác thầm lặng của Mác, đồng hành cùng ông qua những năm lưu vong và túng thiếu.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/jenny.jpg"
      image: "",
      imageFallback: makeArt(
        "Jenny von|Westphalen",
        "1814 – 1881",
        600,
        750,
        "gold",
      ),
      bio: "Jenny von Westphalen sinh năm 1814, con gái một quan chức thuộc giới quý tộc ở Trier. Bà và Mác là bạn từ thuở nhỏ, đính hôn bí mật năm 1836 và kết hôn năm 1843.",
      context:
        "Sau khi kết hôn, bà cùng Mác sống lưu vong ở Paris, Brussels rồi Luân Đôn. Gia đình nhiều năm sống trong cảnh túng thiếu và phải chuyển chỗ ở nhiều lần.",
      achievements:
        "Bà giúp chép lại bản thảo của Mác, chăm lo gia đình và giữ liên lạc thư từ. Hai ông bà có bảy người con, nhưng chỉ ba người con gái (Jenny, Laura và Eleanor) sống đến tuổi trưởng thành.",
      meaning:
        "Cuộc đời bà cho thấy phía sau một công trình lý luận đồ sộ là những hy sinh bền bỉ. Bà mất ngày 2/12/1881 ở Luân Đôn, chưa đầy hai năm trước khi Mác qua đời.",
    },
    {
      name: "G.W.F. Hêghen (Hegel)",
      era: "1770 – 1831",
      short:
        "Nhà triết học cổ điển Đức, người xây dựng phép biện chứng — một nguồn gốc lý luận quan trọng của triết học Mác.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/heghen.jpg"
      image: "",
      imageFallback: makeArt("Hêghen", "1770 – 1831", 600, 750, "jade"),
      bio: "Georg Wilhelm Friedrich Hegel sinh năm 1770 ở Stuttgart, làm giáo sư triết học ở Heidelberg rồi Berlin, là đại biểu lớn nhất của triết học cổ điển Đức.",
      context:
        "Phép biện chứng của Hêghen coi thế giới là một quá trình vận động, phát triển thông qua mâu thuẫn. Tuy nhiên, ông là nhà duy tâm, cho rằng “ý niệm tuyệt đối” quyết định hiện thực.",
      achievements:
        "Mác và Ăngghen tiếp thu “hạt nhân hợp lý” là phép biện chứng, đồng thời loại bỏ vỏ duy tâm để xây dựng phép biện chứng duy vật. Trong lời bạt cho lần xuất bản thứ hai tập I bộ Tư bản (1873), Mác nhận xét rằng phép biện chứng của Hêghen bị đặt ngược và cần được lật lại cho đúng.",
      meaning:
        "Nếu không có Hêghen thì không có phép biện chứng duy vật; ông vì thế được xem là một trong những nguồn gốc lý luận trực tiếp của chủ nghĩa Mác. Hêghen mất năm 1831 ở Berlin.",
    },
    {
      name: "L. Phoiơbắc (Feuerbach)",
      era: "1804 – 1872",
      short:
        "Nhà triết học duy vật Đức, có ảnh hưởng mạnh tới Mác và Ăngghen thuở đầu nhưng bị hai ông phê phán vì cách nhìn trực quan.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/phoiobac.jpg"
      image: "",
      imageFallback: makeArt("Phoiơbắc", "1804 – 1872", 600, 750, "gold"),
      bio: "Ludwig Feuerbach sinh năm 1804 ở Landshut (Bavaria). Ông từng là học trò của Hêghen rồi đoạn tuyệt với chủ nghĩa duy tâm để chuyển sang chủ nghĩa duy vật.",
      context:
        "Tác phẩm “Bản chất của đạo Cơ Đốc” (1841) gây ấn tượng lớn với thế hệ trẻ đương thời. Ăngghen về sau kể lại rằng khi ấy giới trẻ, trong đó có cả ông và Mác, đều trở thành những người theo Phoiơbắc.",
      achievements:
        "Năm 1845, Mác viết “Luận cương về Phoiơbắc”, chỉ ra hạn chế của chủ nghĩa duy vật cũ: nhìn con người một cách trực quan, tách rời thực tiễn xã hội. Năm 1886, Ăngghen viết “Lútvích Phoiơbắc và sự cáo chung của triết học cổ điển Đức” để tổng kết mối quan hệ này.",
      meaning:
        "Nhờ tiếp thu và vượt qua Phoiơbắc, Mác và Ăngghen xây dựng một chủ nghĩa duy vật mới, gắn với thực tiễn và lịch sử xã hội. Phoiơbắc mất năm 1872.",
    },
    {
      name: "V.I. Lênin (Lenin)",
      era: "1870 – 1924",
      short:
        "Nhà cách mạng Nga, người kế thừa và phát triển chủ nghĩa Mác trong điều kiện mới, lãnh đạo Cách mạng Tháng Mười Nga năm 1917.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/lenin.jpg"
      image: "",
      imageFallback: makeArt("V.I. Lênin", "1870 – 1924", 600, 750, "red"),
      bio: "Vladimir Ilyich Ulyanov, tức V.I. Lênin, sinh năm 1870 ở Simbirsk (Nga), học luật và sớm tham gia hoạt động cách mạng, nghiên cứu sâu các tác phẩm của Mác và Ăngghen.",
      context:
        "Đầu thế kỷ XX, chủ nghĩa tư bản chuyển sang giai đoạn độc quyền — chủ nghĩa đế quốc, còn phong trào giải phóng dân tộc ở các nước thuộc địa dâng cao. Lênin vận dụng và phát triển học thuyết của Mác vào điều kiện lịch sử mới.",
      achievements:
        "Năm 1913, ông viết bài “Ba nguồn gốc và ba bộ phận cấu thành của chủ nghĩa Mác”, một cách khái quát vẫn được dùng phổ biến trong giảng dạy. Năm 1917, ông lãnh đạo Cách mạng Tháng Mười Nga, lập ra nhà nước xô viết đầu tiên.",
      meaning:
        "Từ đó, chủ nghĩa Mác – Lênin trở thành nền tảng tư tưởng của nhiều đảng và phong trào cách mạng trên thế giới, trong đó có Đảng Cộng sản Việt Nam. Lênin mất năm 1924.",
    },
  ];

  // Dữ liệu cho Timeline (section "Cuộc đời")
  const timelineData = [
    {
      year: "1818 – 1820",
      name: "Hai con người ra đời",
      detail:
        "C. Mác sinh ngày 5/5/1818 ở Trier; Ph. Ăngghen sinh ngày 28/11/1820 ở Barmen. Cả hai đều lớn lên ở vùng Sông Ranh của Vương quốc Phổ.",
    },
    {
      year: "1841",
      name: "Mác nhận bằng tiến sĩ",
      detail:
        "Mác bảo vệ luận án tiến sĩ triết học về sự khác nhau giữa triết học tự nhiên của Đêmôcrít và của Êpiquya, và nhận bằng ở Đại học Jena.",
    },
    {
      year: "1842 – 1843",
      name: "Báo Sông Ranh và Manchester",
      detail:
        "Mác viết báo rồi làm chủ bút báo Sông Ranh ở Cologne cho đến khi báo bị chính quyền Phổ đóng cửa. Cuối năm 1842, Ăngghen sang Manchester làm việc và bắt đầu nghiên cứu đời sống công nhân Anh. Tháng 6/1843, Mác kết hôn với Jenny.",
    },
    {
      year: "1844",
      name: "Gặp gỡ ở Paris",
      detail:
        "Cuối tháng 8/1844, Ăngghen ghé Paris và gặp Mác. Hai người trò chuyện suốt mười ngày, nhận thấy quan điểm của mình rất gần nhau; từ đó bắt đầu tình bạn và sự cộng tác kéo dài đến hết đời.",
    },
    {
      year: "1845 – 1847",
      name: "Brussels và Đồng minh những người cộng sản",
      detail:
        "Sống ở Brussels, hai ông soạn “Hệ tư tưởng Đức” (bản thảo không được xuất bản khi còn sống) và năm 1847 gia nhập Đồng minh những người cộng sản, tổ chức đã giao cho hai ông soạn cương lĩnh.",
    },
    {
      year: "1848",
      name: "Tuyên ngôn và cách mạng châu Âu",
      detail:
        "Tháng 2/1848, Tuyên ngôn của Đảng Cộng sản được xuất bản ở London. Cùng năm, cách mạng bùng nổ ở nhiều nước châu Âu; Mác và Ăngghen trở về Đức, làm báo Sông Ranh mới ở Cologne.",
    },
    {
      year: "1849 – 1850",
      name: "Luân Đôn và Manchester",
      detail:
        "Sau khi cách mạng thất bại, Mác bị trục xuất và định cư ở Luân Đôn năm 1849. Từ 1850, Ăngghen quay lại làm việc ở Manchester trong công ty gia đình, dành phần lớn thu nhập để giúp Mác và gia đình ông.",
    },
    {
      year: "1864",
      name: "Quốc tế thứ nhất",
      detail:
        "Ngày 28/9/1864, Hội liên hiệp công nhân quốc tế được thành lập ở London. Mác giữ vai trò hàng đầu trong Hội đồng Trung ương và soạn Lời kêu gọi cùng Điều lệ của tổ chức.",
    },
    {
      year: "1867",
      name: "Tư bản, tập I",
      detail:
        "Tập I bộ Tư bản xuất bản ở Hamburg vào tháng 9/1867, trình bày học thuyết giá trị thặng dư — điểm then chốt trong cách Mác giải thích sự vận hành của chủ nghĩa tư bản.",
    },
    {
      year: "1883",
      name: "Mác qua đời",
      detail:
        "Ngày 14/3/1883, Mác qua đời ở Luân Đôn và được an táng ở nghĩa trang Highgate. Ăngghen đọc điếu văn bên mộ, đánh giá Mác là một trong những nhà tư tưởng vĩ đại nhất của thời đại.",
    },
    {
      year: "1885 – 1895",
      name: "Ăngghen tiếp nối sự nghiệp",
      detail:
        "Ăngghen biên tập và xuất bản Tư bản tập II (1885), tập III (1894) từ bản thảo của Mác. Ông mất ngày 5/8/1895 ở Luân Đôn; theo nguyện vọng của ông, tro được rải xuống biển.",
    },
  ];

  // Sơ đồ "Ba nguồn gốc – ba bộ phận cấu thành" (section "Học thuyết")
  const convData = {
    sourcesTitle: "Ba nguồn gốc lý luận",
    partsTitle: "Ba bộ phận cấu thành",
    sources: [
      {
        title: "Triết học cổ điển Đức",
        who: "Hêghen · Phoiơbắc",
        note: "Mác và Ăngghen tiếp thu phép biện chứng của Hêghen và chủ nghĩa duy vật của Phoiơbắc, loại bỏ mặt duy tâm và siêu hình để xây dựng chủ nghĩa duy vật biện chứng.",
      },
      {
        title: "Kinh tế chính trị học cổ điển Anh",
        who: "Adam Smith · David Ricardo",
        note: "Kế thừa lý thuyết giá trị lao động, Mác đi tới chỗ tìm nguồn gốc của giá trị thặng dư trong nền sản xuất tư bản chủ nghĩa.",
      },
      {
        title: "Chủ nghĩa xã hội không tưởng",
        who: "Xanh Ximông · Phuriê (Pháp) · Ôoen (Anh)",
        note: "Hai ông tiếp thu những phê phán xã hội tư bản và ý tưởng về một xã hội tốt đẹp hơn, đồng thời chỉ ra vì sao các học thuyết ấy còn thiếu cơ sở khoa học.",
      },
    ],
    core: {
      title: "Chủ nghĩa Mác",
      sub: "Học thuyết của C. Mác và Ph. Ăngghen, được V.I. Lênin khái quát năm 1913",
    },
    parts: [
      {
        title: "Triết học Mác",
        who: "Duy vật biện chứng · duy vật lịch sử",
        note: "Giải thích thế giới và xã hội trên cơ sở vật chất, vận động và phát triển qua mâu thuẫn; coi sản xuất vật chất là nền tảng của đời sống xã hội.",
      },
      {
        title: "Kinh tế chính trị Mác",
        who: "Học thuyết giá trị thặng dư",
        note: "Phân tích phương thức sản xuất tư bản chủ nghĩa trong bộ Tư bản, làm rõ mối quan hệ giữa lao động, giá trị và lợi nhuận.",
      },
      {
        title: "Chủ nghĩa xã hội khoa học",
        who: "Sứ mệnh lịch sử của giai cấp công nhân",
        note: "Nêu lên quan điểm về xu hướng vận động của xã hội tư bản, vai trò của giai cấp công nhân và con đường tiến tới xã hội cộng sản.",
      },
    ],
  };

  // Dữ liệu tác phẩm / sự kiện (section "Tác phẩm")
  const eventsData = [
    {
      title: "Cuộc gặp ở Paris",
      year: "Tháng 8/1844",
      figures: "C. Mác, Ph. Ăngghen",
      desc: "Ăngghen từ Manchester trở về Đức, ghé Paris gặp Mác. Hai người trò chuyện suốt mười ngày và thấy quan điểm của mình về triết học, kinh tế và cách mạng rất gần nhau. Trước đó, bài “Phác thảo phê phán khoa kinh tế chính trị” của Ăngghen đã gây ấn tượng mạnh với Mác.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/paris-1844.jpg"
      image: "",
      imageFallback: makeArt(
        "Gặp gỡ|ở Paris",
        "Tháng 8/1844",
        800,
        600,
        "gold",
      ),
    },
    {
      title: "Hệ tư tưởng Đức",
      year: "1845 – 1846",
      figures: "C. Mác, Ph. Ăngghen",
      desc: "Trong những năm ở Brussels, Mác và Ăngghen cùng soạn bản thảo này để “thanh toán” với quan điểm triết học trước đây của mình, trình bày lần đầu quan niệm duy vật về lịch sử. Bản thảo không tìm được nhà xuất bản khi hai ông còn sống và mãi đến thế kỷ XX mới được in đầy đủ.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/he-tu-tuong-duc.jpg"
      image: "",
      imageFallback: makeArt(
        "Hệ tư tưởng|Đức",
        "1845 – 1846",
        800,
        600,
        "jade",
      ),
    },
    {
      title: "Tuyên ngôn của Đảng Cộng sản",
      year: "Tháng 2/1848",
      figures: "C. Mác, Ph. Ăngghen",
      desc: "Theo đặt hàng của Đồng minh những người cộng sản, Tuyên ngôn được Mác chấp bút chính, trên cơ sở bản dự thảo “Những nguyên lý của chủ nghĩa cộng sản” của Ăngghen, và xuất bản ở London. Tác phẩm trình bày quan niệm duy vật về lịch sử, phân tích đấu tranh giai cấp và kết thúc bằng lời kêu gọi giai cấp công nhân các nước đoàn kết lại.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/tuyen-ngon-1848.jpg"
      image: "",
      imageFallback: makeArt(
        "Tuyên ngôn|Đảng Cộng sản",
        "London, 1848",
        800,
        600,
        "red",
      ),
    },
    {
      title: "Quốc tế thứ nhất",
      year: "28/9/1864",
      figures: "C. Mác",
      desc: "Hội liên hiệp công nhân quốc tế thành lập tại London. Mác giữ vai trò hàng đầu trong Hội đồng Trung ương, soạn Lời kêu gọi thành lập và Điều lệ. Tổ chức tập hợp nhiều khuynh hướng của phong trào công nhân châu Âu và hoạt động đến giữa thập niên 1870 thì giải thể.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/quoc-te-thu-nhat.jpg"
      image: "",
      imageFallback: makeArt(
        "Quốc tế|thứ nhất",
        "London, 1864",
        800,
        600,
        "gold",
      ),
    },
    {
      title: "Tư bản, tập I",
      year: "Tháng 9/1867",
      figures: "C. Mác; Ph. Ăngghen (biên tập tập II, III)",
      desc: "Sau nhiều năm nghiên cứu ở Bảo tàng Anh (London), Mác hoàn thành tập I bộ Tư bản, xuất bản ở Hamburg. Tập sách phân tích hàng hóa, giá trị, tiền tệ và giá trị thặng dư; các tập II và III do Ăngghen biên tập từ bản thảo của Mác và xuất bản năm 1885, 1894.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/tu-ban.jpg"
      image: "",
      imageFallback: makeArt("Tư bản", "Tập I, 1867", 800, 600, "red"),
    },
    {
      title: "Công xã Paris",
      year: "18/3 – 28/5/1871",
      figures: "C. Mác, Ph. Ăngghen",
      desc: "Công xã Paris tồn tại khoảng 72 ngày và được Mác, Ăngghen đánh giá là hình thức chính quyền công nhân đầu tiên. Trong “Nội chiến ở Pháp”, Mác tổng kết kinh nghiệm này và rút ra rằng giai cấp công nhân không thể đơn giản nắm lấy bộ máy nhà nước cũ để dùng cho mục đích của mình.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/cong-xa-paris.jpg"
      image: "",
      imageFallback: makeArt("Công xã|Paris", "1871", 800, 600, "jade"),
    },
    {
      title: "Chống Đuyrinh",
      year: "1878",
      figures: "Ph. Ăngghen",
      desc: "Trong khi phê phán quan điểm của E. Đuyrinh, Ăngghen trình bày một cách hệ thống quan điểm của chủ nghĩa Mác về triết học, kinh tế chính trị và chủ nghĩa xã hội. Một phần tác phẩm về sau được in riêng thành “Từ chủ nghĩa xã hội không tưởng đến chủ nghĩa xã hội khoa học”.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/chong-duy-rinh.jpg"
      image: "",
      imageFallback: makeArt("Chống|Đuyrinh", "1878", 800, 600, "gold"),
    },
  ];

  // Dữ liệu thư viện ảnh — thêm/bớt phần tử để thay đổi số lượng ảnh hiển thị.
  // Chép ảnh thật vào thư mục images/ đúng tên bên dưới; thiếu file thì hiện ảnh SVG dự phòng.
  const galleryData = [
    {
      src: "images/mac-angghen.jpg",
      fallback: makeArt("Mác &|Ăngghen", "Tượng đài", 500, 650, "red"),
      caption: "Tượng đài C. Mác và Ph. Ăngghen (Marx-Engels-Forum, Berlin)",
    },
    {
      src: "images/nha-mac-trier.jpg",
      fallback: makeArt("Nhà của Mác", "Trier", 500, 550, "gold"),
      caption:
        "Ngôi nhà ở Trier nơi Mác chào đời, nay là bảo tàng Karl-Marx-Haus",
    },
    {
      src: "images/mo-mac-highgate.jpg",
      fallback: makeArt("Mộ Mác", "Highgate, London", 500, 620, "jade"),
      caption: "Mộ Mác ở nghĩa trang Highgate, London",
    },
    {
      src: "images/thu-vien-chetham.jpg",
      fallback: makeArt("Thư viện|Chetham", "Manchester", 500, 500, "jade"),
      caption:
        "Thư viện Chetham (Manchester) — nơi hai ông từng đọc sách năm 1845",
    },
    {
      src: "images/tuyen-ngon-1848.jpg",
      fallback: makeArt("Tuyên ngôn|1848", "Bản in đầu tiên", 500, 600, "red"),
      caption: "Bìa bản in đầu tiên của Tuyên ngôn của Đảng Cộng sản (1848)",
    },
    {
      src: "images/phong-doc-bao-tang-anh.jpg",
      fallback: makeArt("Phòng đọc|Bảo tàng Anh", "London", 500, 560, "gold"),
      caption: "Phòng đọc của Bảo tàng Anh — nơi Mác nghiên cứu và viết Tư bản",
    },
    // THÊM ẢNH TẠI ĐÂY: sao chép khối dưới rồi sửa src + caption để thêm ảnh mới
    // {
    //   src: "images/ten-file-anh-cua-ban.jpg",
    //   fallback: makeArt("Tiêu đề|ảnh", "Phụ đề", 500, 500, "gold"),
    //   caption: "Chú thích cho ảnh mới",
    // },
  ];

  // Trích dẫn — dựa theo các bản dịch tiếng Việt phổ biến; câu chữ có thể khác đôi chút
  // giữa các bản dịch, hãy đối chiếu với sách giáo trình của bạn khi trích dẫn chính thức.
  const quotesData = [
    {
      text: "Các nhà triết học đã chỉ giải thích thế giới bằng nhiều cách khác nhau; vấn đề là cải tạo thế giới.",
      author: "C. Mác",
      source: "Luận cương về Phoiơbắc, 1845 (luận cương thứ 11)",
    },
    {
      text: "Vô sản tất cả các nước, đoàn kết lại!",
      author: "C. Mác và Ph. Ăngghen",
      source: "Tuyên ngôn của Đảng Cộng sản, 1848",
    },
    {
      text: "Không phải ý thức của con người quyết định tồn tại của họ; trái lại, tồn tại xã hội của họ quyết định ý thức của họ.",
      author: "C. Mác",
      source: "Lời tựa “Góp phần phê phán khoa kinh tế chính trị”, 1859",
    },
    {
      text: "Tự do là sự nhận thức được tất yếu.",
      author: "Ph. Ăngghen (dẫn ý của Hêghen)",
      source: "Chống Đuyrinh, 1878",
    },
  ];

  /* =====================================================================
     2. LOADING SCREEN + ẢNH NỀN
  ===================================================================== */
  const loadingScreen = document.getElementById("loading-screen");
  function hideLoadingScreen() {
    loadingScreen.classList.add("hidden");
  }
  window.addEventListener("load", () => {
    setTimeout(hideLoadingScreen, 900); // giữ đủ lâu để thấy thanh chạy
  });
  // Lưới an toàn: nếu sự kiện load không bao giờ bắn (ảnh lỗi, tài nguyên treo)
  setTimeout(hideLoadingScreen, 4000);

  // Ảnh nền hero, video, trích dẫn: SVG tự tạo (dùng url("...") có nháy kép để an toàn).
  // Muốn dùng ảnh thật: thay bằng style.backgroundImage = 'url("images/ten-anh.jpg")'.
  const heroBg = document.querySelector(".hero-bg");
  if (heroBg) {
    heroBg.style.backgroundImage = `url("${makeArt(
      "Tuyên ngôn|1848",
      "Đảng Cộng sản · London",
      1600,
      900,
      "red",
    )}")`;
  }

  // Ảnh chân dung phần giới thiệu: dùng ảnh thật nếu có, thiếu file thì thay bằng SVG
  const introPortrait = document.getElementById("intro-portrait");
  if (introPortrait) {
    const swapIntro = () => {
      if (introPortrait.dataset.swapped === "1") return;
      introPortrait.dataset.swapped = "1";
      introPortrait.src = makeArt(
        "Mác &|Ăngghen",
        "1818 – 1895",
        700,
        900,
        "red",
      );
    };
    if (introPortrait.complete && introPortrait.naturalWidth === 0) swapIntro();
    introPortrait.addEventListener("error", swapIntro);
  }

  // Ảnh bìa cho các thẻ video (dạng liên kết)
  document.querySelectorAll(".video-link").forEach((el) => {
    el.style.backgroundImage = `url("${makeArt(
      el.dataset.artTitle || "Mác & Ăngghen",
      el.dataset.artSub || "",
      800,
      450,
      el.dataset.artHue || "red",
    )}")`;
  });

  const quoteBgEl = document.querySelector(".quote-bg");
  if (quoteBgEl) {
    quoteBgEl.style.backgroundImage = `url("${makeArt(
      "Vô sản|đoàn kết lại",
      "Tuyên ngôn, 1848",
      1600,
      900,
      "red",
    )}")`;
  }

  /* =====================================================================
     3. HEADER SCROLL + MOBILE MENU + ACTIVE NAV LINK
  ===================================================================== */
  const header = document.getElementById("header");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  const navLinkItems = document.querySelectorAll(".nav-link");
  const backToTopBtn = document.getElementById("back-to-top");

  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("scrolled", window.scrollY > 60);
      backToTopBtn.classList.toggle("show", window.scrollY > 600);
    },
    { passive: true },
  );

  function setMenu(open) {
    hamburger.classList.toggle("active", open);
    navLinks.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
  }
  hamburger.addEventListener("click", () =>
    setMenu(!navLinks.classList.contains("open")),
  );
  navLinkItems.forEach((link) =>
    link.addEventListener("click", () => setMenu(false)),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  // Highlight mục menu tương ứng với section đang hiển thị trên màn hình
  const sectionsForNav = document.querySelectorAll("main section[id]");
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinkItems.forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${id}`,
            );
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  sectionsForNav.forEach((sec) => navObserver.observe(sec));

  /* =====================================================================
     4. SMOOTH SCROLL CHO CÁC LIÊN KẾT NEO
     (bù trừ chiều cao header cố định)
  ===================================================================== */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId.length < 2) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const top =
        target.getBoundingClientRect().top +
        window.pageYOffset -
        header.offsetHeight +
        1;
      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  });

  /* =====================================================================
     5. HIỆU ỨNG PARTICLES TRONG HERO (canvas)
     Tàn lửa / khói súng: các hạt sáng vàng và đỏ bay lên chậm.
     Tạm dừng khi hero ra khỏi màn hình và tắt hẳn nếu người dùng bật
     "giảm chuyển động".
  ===================================================================== */
  const canvas = document.getElementById("particles-canvas");
  const ctx = canvas ? canvas.getContext("2d") : null;
  let particles = [];
  let heroVisible = true;

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    const count = window.innerWidth < 768 ? 35 : 70;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.8 + 0.4,
      speedY: Math.random() * 0.4 + 0.15,
      drift: Math.random() * 0.3 - 0.15,
      alpha: Math.random() * 0.5 + 0.2,
      ember: Math.random() < 0.35, // một phần hạt màu đỏ cam như tàn lửa
    }));
  }

  function animateParticles() {
    if (heroVisible) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.drift;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.ember
          ? `rgba(224, 96, 64, ${p.alpha})`
          : `rgba(231, 199, 102, ${p.alpha})`;
        ctx.fill();
      });
    }
    requestAnimationFrame(animateParticles);
  }

  if (canvas && ctx && !prefersReducedMotion) {
    resizeCanvas();
    createParticles();
    animateParticles();
    window.addEventListener("resize", () => {
      resizeCanvas();
      createParticles();
    });
    new IntersectionObserver((entries) => {
      heroVisible = entries[0].isIntersecting;
    }).observe(document.getElementById("hero"));
  }

  /* =====================================================================
     6. RENDER NHÂN VẬT + MODAL TIỂU SỬ
  ===================================================================== */
  const heroesGrid = document.getElementById("heroes-grid");
  const heroModal = document.getElementById("hero-modal");
  const modalContent = document.getElementById("modal-content");
  const modalClose = document.getElementById("modal-close");
  let lastFocusedBeforeModal = null;

  heroesData.forEach((hero, index) => {
    const card = document.createElement("article");
    card.className = `hero-card reveal-on-scroll${hero.isMain ? " hero-card-main" : ""}`;
    card.style.transitionDelay = `${(index % 3) * 0.12}s`;

    // Nếu chưa có ảnh (image rỗng), dùng luôn ảnh SVG dự phòng làm nguồn
    const heroImgSrc = hero.image || hero.imageFallback || "";

    card.innerHTML = `
      <div class="hero-card-img">
        <img src="${heroImgSrc}" data-fallback="${hero.imageFallback || ""}" alt="${hero.name}" loading="lazy">
        ${hero.isMain ? '<span class="hero-card-badge">Nhân vật chính</span>' : ""}
      </div>
      <div class="hero-card-body">
        <p class="hero-card-era">${hero.era}</p>
        <h3 class="hero-card-name">${hero.name}</h3>
        <p class="hero-card-desc">${hero.short}</p>
        <button class="hero-card-btn" data-index="${index}">Xem tiểu sử &rarr;</button>
      </div>
    `;
    heroesGrid.appendChild(card);
  });

  function openHeroModal(index) {
    const hero = heroesData[index];
    modalContent.innerHTML = `
      <h3 class="modal-hero-name">${hero.name}</h3>
      <p class="modal-hero-era">${hero.era}</p>
      <h4>Tiểu sử</h4>
      <p>${hero.bio}</p>
      <h4>Bối cảnh lịch sử</h4>
      <p>${hero.context}</p>
      <h4>Chiến công / Sự kiện quan trọng</h4>
      <p>${hero.achievements}</p>
      <h4>Ý nghĩa lịch sử</h4>
      <p>${hero.meaning}</p>
    `;
    lastFocusedBeforeModal = document.activeElement;
    heroModal.classList.add("active");
    document.body.style.overflow = "hidden";
    modalClose.focus();
  }

  function closeHeroModal() {
    if (!heroModal.classList.contains("active")) return;
    heroModal.classList.remove("active");
    document.body.style.overflow = "";
    if (lastFocusedBeforeModal) lastFocusedBeforeModal.focus();
  }

  heroesGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".hero-card-btn");
    if (!btn) return;
    openHeroModal(Number(btn.dataset.index));
  });
  modalClose.addEventListener("click", closeHeroModal);
  heroModal.addEventListener("click", (e) => {
    if (e.target === heroModal) closeHeroModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeHeroModal();
  });

  /* =====================================================================
     7. RENDER TIMELINE + TƯƠNG TÁC CLICK
  ===================================================================== */
  const timelineWrap = document.getElementById("timeline-wrap");

  timelineData.forEach((item) => {
    const el = document.createElement("div");
    el.className = "timeline-item";
    el.innerHTML = `
      <span class="timeline-dot"></span>
      <p class="timeline-year">${item.year}</p>
      <h3 class="timeline-name">
        <button type="button" class="timeline-toggle" aria-expanded="false">${item.name}</button>
      </h3>
      <p class="timeline-detail">${item.detail}</p>
    `;
    timelineWrap.appendChild(el);
  });

  // Nhấn vào mốc (tên, chấm tròn hoặc vùng chữ) để mở/đóng phần chi tiết
  timelineWrap.addEventListener("click", (e) => {
    const item = e.target.closest(".timeline-item");
    if (!item) return;
    const detail = item.querySelector(".timeline-detail");
    const dot = item.querySelector(".timeline-dot");
    const toggle = item.querySelector(".timeline-toggle");
    const isOpen = detail.classList.toggle("open");
    dot.classList.toggle("active", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  /* =====================================================================
     8. RENDER SƠ ĐỒ BA NGUỒN GỐC – BA BỘ PHẬN
     Các đường nối chạy từ ba nguồn gốc vào "lõi" rồi ra ba bộ phận khi
     người xem cuộn tới (CSS lo chuyển động, JS chỉ dựng HTML, đặt độ trễ
     cho từng đường và thêm class .in-view).
  ===================================================================== */
  const convGrid = document.getElementById("conv-grid");

  function convCards(list, baseDelay) {
    return list
      .map(
        (c, i) => `
        <div class="conv-card" style="--line-delay:${(baseDelay + i * 0.25).toFixed(2)}s">
          <h3>${c.title}</h3>
          <p class="conv-who">${c.who}</p>
          <p>${c.note}</p>
        </div>`,
      )
      .join("");
  }

  convGrid.innerHTML = `
    <div class="conv-col conv-sources">
      <p class="conv-col-title">${convData.sourcesTitle}</p>
      ${convCards(convData.sources, 0)}
    </div>
    <div class="conv-core">
      <h3 class="conv-core-title">${convData.core.title}</h3>
      <p class="conv-core-sub">${convData.core.sub}</p>
    </div>
    <div class="conv-col conv-parts">
      <p class="conv-col-title">${convData.partsTitle}</p>
      ${convCards(convData.parts, 1.5)}
    </div>
  `;

  /* =====================================================================
     9. RENDER TÁC PHẨM / SỰ KIỆN
  ===================================================================== */
  const eventsList = document.getElementById("events-list");

  eventsData.forEach((ev, index) => {
    const el = document.createElement("article");
    el.className = `event-item reveal-on-scroll ${index % 2 === 1 ? "reverse" : ""}`;
    const evImgSrc = ev.image || ev.imageFallback || "";

    el.innerHTML = `
      <div class="event-image">
        <img src="${evImgSrc}" data-fallback="${ev.imageFallback || ""}" alt="${ev.title}" loading="lazy">
      </div>
      <div class="event-text">
        <span class="event-year">${ev.year}</span>
        <h3 class="event-title">${ev.title}</h3>
        <p class="event-figures">Nhân vật liên quan: ${ev.figures}</p>
        <p class="event-desc">${ev.desc}</p>
      </div>
    `;
    eventsList.appendChild(el);
  });

  /* =====================================================================
     10. RENDER THƯ VIỆN ẢNH + LIGHTBOX
  ===================================================================== */
  const galleryGrid = document.getElementById("gallery-grid");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxPrev = document.getElementById("lightbox-prev");
  const lightboxNext = document.getElementById("lightbox-next");
  let currentImageIndex = 0;

  galleryData.forEach((item, index) => {
    const el = document.createElement("div");
    el.className = "gallery-item";
    el.dataset.index = index;
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `Xem ảnh: ${item.caption}`);
    el.innerHTML = `
      <img src="${item.src}" data-fallback="${item.fallback || ""}" alt="${item.caption}" loading="lazy">
      <div class="gallery-overlay"><p>${item.caption}</p></div>
    `;
    galleryGrid.appendChild(el);
  });

  // Sau khi các khối (nhân vật, sự kiện, thư viện) đã render xong, gắn ảnh dự
  // phòng: nếu file trong images/ bị thiếu thì tự thay bằng ảnh SVG.
  applyImageFallbacks();

  // Chỉ gắn một lần: nếu ảnh trong lightbox lỗi, đổi sang ảnh dự phòng của mục hiện tại
  lightboxImg.addEventListener("error", () => {
    const item = galleryData[currentImageIndex];
    if (lightboxImg.dataset.swapped === "1" || !item || !item.fallback) return;
    lightboxImg.dataset.swapped = "1";
    lightboxImg.src = item.fallback;
  });

  function openLightbox(index) {
    currentImageIndex = index;
    const item = galleryData[index];
    lightboxImg.dataset.swapped = "0";
    lightboxImg.src = item.src;
    lightboxImg.alt = item.caption;
    lightboxCaption.textContent = item.caption;
    lightbox.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
  }

  function showNextImage(step) {
    currentImageIndex =
      (currentImageIndex + step + galleryData.length) % galleryData.length;
    openLightbox(currentImageIndex);
  }

  galleryGrid.addEventListener("click", (e) => {
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    openLightbox(Number(item.dataset.index));
  });
  galleryGrid.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    e.preventDefault();
    openLightbox(Number(item.dataset.index));
  });

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => showNextImage(-1));
  lightboxNext.addEventListener("click", () => showNextImage(1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showNextImage(-1);
    if (e.key === "ArrowRight") showNextImage(1);
  });

  /* =====================================================================
     11. TRÍCH DẪN LỊCH SỬ (luân phiên + hiệu ứng chữ + parallax)
  ===================================================================== */
  const quoteContent = document.getElementById("quote-content");
  const quoteSection = document.getElementById("quote-section");
  const quoteBg = document.querySelector(".quote-bg");
  let currentQuoteIndex = 0;
  let quoteTimer = null;

  function renderQuote(index) {
    const q = quotesData[index];
    const wordsHTML = q.text
      .split(" ")
      .map(
        (word, i) =>
          `<span class="word" style="animation-delay:${Math.min(i * 0.05, 1.2)}s">${word}</span>`,
      )
      .join(" ");

    quoteContent.innerHTML = `
      <p class="quote-text">${wordsHTML}</p>
      <p class="quote-author">— ${q.author}</p>
      <p class="quote-source">${q.source}</p>
      <div class="quote-dots">
        ${quotesData
          .map(
            (_, i) =>
              `<button type="button" class="quote-dot ${i === index ? "active" : ""}" data-index="${i}" aria-label="Trích dẫn ${i + 1}"></button>`,
          )
          .join("")}
      </div>
    `;
  }

  function nextQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotesData.length;
    renderQuote(currentQuoteIndex);
  }

  function startQuoteRotation() {
    clearInterval(quoteTimer);
    quoteTimer = setInterval(nextQuote, 9000); // trích dẫn dài nên để 9 giây
  }

  renderQuote(currentQuoteIndex);
  startQuoteRotation();

  // Bấm vào chấm tròn để chọn trích dẫn thủ công
  quoteContent.addEventListener("click", (e) => {
    const dot = e.target.closest(".quote-dot");
    if (!dot) return;
    currentQuoteIndex = Number(dot.dataset.index);
    renderQuote(currentQuoteIndex);
    startQuoteRotation(); // reset đồng hồ đếm sau khi người dùng tự chọn
  });

  // Parallax nhẹ cho ảnh nền phần trích dẫn khi cuộn qua
  if (!prefersReducedMotion) {
    window.addEventListener(
      "scroll",
      () => {
        const rect = quoteSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          quoteBg.style.transform = `translateY(${rect.top * 0.15}px)`;
        }
      },
      { passive: true },
    );
  }

  /* =====================================================================
     12. SCROLL REVEAL DÙNG CHUNG (IntersectionObserver)
     Áp dụng cho .reveal-on-scroll, .timeline-item và sơ đồ học thuyết,
     kể cả những phần tử vừa được tạo động ở các bước trên.
  ===================================================================== */
  const revealTargets = document.querySelectorAll(
    ".reveal-on-scroll, .timeline-item",
  );

  function revealAll() {
    revealTargets.forEach((el) => el.classList.add("in-view"));
    convGrid.classList.add("in-view");
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      // threshold thấp để phần tử cao (vượt màn hình) vẫn được hiện đúng lúc
      { threshold: 0.05, rootMargin: "0px 0px -5% 0px" },
    );
    revealTargets.forEach((el) => revealObserver.observe(el));

    // Các đường nối chỉ bắt đầu chạy khi sơ đồ đã vào tầm nhìn
    const convObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            convObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 },
    );
    convObserver.observe(convGrid);

    // Lưới an toàn: nếu observer không chạy (trang in, khung ẩn, trình duyệt cũ),
    // vẫn hiện nội dung đang nằm trong màn hình.
    window.setTimeout(() => {
      revealTargets.forEach((el) => {
        if (
          getComputedStyle(el).opacity === "0" &&
          !el.classList.contains("in-view")
        ) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add("in-view");
          }
        }
      });
    }, 1200);
  } else {
    revealAll();
  }

  /* =====================================================================
     13. COUNTER ANIMATION (số liệu trong phần giới thiệu)
  ===================================================================== */
  const statNumbers = document.querySelectorAll(".stat-number");

  function animateCounter(el) {
    const target = Number(el.dataset.target);
    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }
    const duration = 1600;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutQuad để số chạy chậm dần về cuối
      const eased = 1 - (1 - progress) * (1 - progress);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );
  statNumbers.forEach((el) => counterObserver.observe(el));

  /* =====================================================================
     14. NÚT BACK TO TOP + NĂM Ở FOOTER
  ===================================================================== */
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });

  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
