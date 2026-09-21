/* =====================================================================
   QUANG TRUNG — QUANGTRUNG.JS
   Mục lục:
   1. DỮ LIỆU (nhân vật, timeline, hành quân, sự kiện, thư viện, trích dẫn)
   2. LOADING SCREEN + ẢNH NỀN
   3. HEADER SCROLL + MOBILE MENU + ACTIVE NAV LINK
   4. SMOOTH SCROLL CHO CÁC LIÊN KẾT NEO (#...)
   5. HIỆU ỨNG PARTICLES TRONG HERO (canvas)
   6. RENDER NHÂN VẬT + MODAL TIỂU SỬ
   7. RENDER TIMELINE + TƯƠNG TÁC CLICK
   8. RENDER CUỘC HÀNH QUÂN THẦN TỐC
   9. RENDER SỰ KIỆN LỊCH SỬ
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
     Tham số title dùng "|" để xuống dòng, ví dụ "Ngọc Hồi|Đống Đa".
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

  // Danh sách nhân vật hiển thị ở section "Quang Trung và những người đồng hành"
  const heroesData = [
    {
      isMain: true,
      name: "Quang Trung – Nguyễn Huệ",
      era: "1753 – 1792",
      short:
        "Hoàng đế Tây Sơn, người chỉ huy cuộc hành quân thần tốc và chiến thắng Ngọc Hồi – Đống Đa năm 1789.",
      // THAY ẢNH TẠI ĐÂY: chép ảnh vào images/quang-trung.jpg
      image: "images/quang-trung.jpg",
      imageFallback: makeArt(
        "Quang Trung|Nguyễn Huệ",
        "1753 – 1792",
        600,
        750,
        "red",
      ),
      bio: "Nguyễn Huệ (1753 – 1792), sau này lên ngôi hoàng đế với niên hiệu Quang Trung, là người em thứ hai trong ba anh em lãnh đạo phong trào Tây Sơn. Ông sinh ra ở vùng Tây Sơn, thuộc đất Bình Định xưa (nay thuộc tỉnh Gia Lai), nổi tiếng với tài cầm quân quyết đoán, linh hoạt và những cuộc hành quân thần tốc.",
      context:
        "Cuối thế kỷ XVIII, đất nước bị chia cắt: chúa Trịnh nắm quyền ở Đàng Ngoài, chúa Nguyễn ở Đàng Trong, đời sống nhân dân khốn khó. Năm 1771, ba anh em Nguyễn Nhạc, Nguyễn Huệ, Nguyễn Lữ dựng cờ khởi nghĩa ở Tây Sơn. Năm 1785, Nguyễn Huệ đánh tan quân Xiêm ở Rạch Gầm – Xoài Mút; năm 1786 ông tiến ra Bắc, chấm dứt thế lực chúa Trịnh. Cuối năm 1788, khi vua Lê Chiêu Thống cầu viện nhà Thanh, quân Thanh do Tôn Sĩ Nghị chỉ huy kéo vào Thăng Long.",
      achievements:
        "Ngày 25 tháng 11 âm lịch năm Mậu Thân (22/12/1788), ông lên ngôi hoàng đế ở núi Bân (Phú Xuân), lấy niên hiệu Quang Trung rồi lập tức xuất quân ra Bắc. Trong những ngày Tết Kỷ Dậu 1789, quân Tây Sơn lần lượt hạ đồn Hà Hồi, Ngọc Hồi, đánh tan quân Thanh ở Đống Đa và giải phóng Thăng Long. Sau chiến thắng, ông ban Chiếu khuyến nông, Chiếu lập học và đề cao chữ Nôm.",
      meaning:
        "Chiến thắng Ngọc Hồi – Đống Đa được xem là một trong những chiến công quân sự vang dội nhất lịch sử dân tộc, thể hiện nghệ thuật thần tốc, bất ngờ và tài dùng người. Hình ảnh vị hoàng đế áo vải cũng gắn với khát vọng canh tân đất nước, còn dang dở khi ông mất sớm năm 1792.",
    },
    {
      name: "Nguyễn Nhạc",
      era: "1743 – 1793",
      short:
        "Người anh cả của ba anh em Tây Sơn, dựng cờ khởi nghĩa năm 1771 và xưng hoàng đế Thái Đức năm 1778.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/nguyen-nhac.jpg"
      image: "",
      imageFallback: makeArt("Nguyễn Nhạc", "1743 – 1793", 600, 750, "gold"),
      bio: "Nguyễn Nhạc là anh cả trong ba anh em Tây Sơn, người có công dựng cờ khởi nghĩa và tập hợp lực lượng nông dân ở vùng Tây Sơn.",
      context:
        "Năm 1771, anh em Tây Sơn dựng cờ khởi nghĩa giữa lúc chính quyền chúa Nguyễn suy yếu, nhân dân điêu đứng vì thuế khóa và nạn cường hào. Nghĩa quân nhanh chóng lớn mạnh và chiếm được thành Quy Nhơn.",
      achievements:
        "Năm 1778, Nguyễn Nhạc xưng hoàng đế, niên hiệu Thái Đức, đóng đô ở Quy Nhơn (thành Đồ Bàn). Dưới sự chỉ huy chung của ba anh em, Tây Sơn lần lượt đánh bại chúa Nguyễn ở phương Nam và chúa Trịnh ở phương Bắc.",
      meaning:
        "Nguyễn Nhạc là người mở đầu và giữ vững nền móng ban đầu của phong trào Tây Sơn, tạo điều kiện để Nguyễn Huệ phát huy tài năng quân sự trên khắp chiến trường.",
    },
    {
      name: "Trần Quang Diệu",
      era: "Chưa rõ năm sinh – 1802",
      short:
        "Danh tướng của Tây Sơn, gắn bó với triều đại đến những ngày cuối cùng.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/tran-quang-dieu.jpg"
      image: "",
      imageFallback: makeArt(
        "Trần Quang|Diệu",
        "Đại tướng Tây Sơn",
        600,
        750,
        "jade",
      ),
      bio: "Trần Quang Diệu là một trong những đại tướng lớn của triều Tây Sơn, quê ở Bình Định, là chồng của nữ tướng Bùi Thị Xuân.",
      context:
        "Sau khi Quang Trung mất năm 1792, triều Tây Sơn đứng trước sức ép ngày càng lớn từ lực lượng của Nguyễn Ánh ở phương Nam. Trần Quang Diệu là một trong những tướng được giao trọng trách cầm quân trong giai đoạn khó khăn này.",
      achievements:
        "Năm 1793, ông chỉ huy quân Tây Sơn vây thành Diên Khánh (Khánh Hòa) chống lại Nguyễn Ánh. Khi triều Tây Sơn sụp đổ năm 1802, ông bị bắt và bị xử tử.",
      meaning:
        "Cuộc đời ông cho thấy sự gắn bó của lớp tướng lĩnh Tây Sơn với sự nghiệp mà Nguyễn Huệ đã khởi dựng, ngay cả khi thế cuộc đã đổi thay.",
    },
    {
      name: "Bùi Thị Xuân",
      era: "Chưa rõ năm sinh – 1802",
      short:
        "Nữ tướng nổi tiếng của Tây Sơn, được nhớ đến với tài võ nghệ và khí phách.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/bui-thi-xuan.jpg"
      image: "",
      imageFallback: makeArt(
        "Bùi Thị|Xuân",
        "Nữ tướng Tây Sơn",
        600,
        750,
        "red",
      ),
      bio: "Bùi Thị Xuân là nữ tướng của triều Tây Sơn, quê ở vùng đất Bình Định, vợ của đại tướng Trần Quang Diệu. Sử sách và truyền thuyết đều ca ngợi bà là người giỏi võ nghệ, có tài cầm quân.",
      context:
        "Bà tham gia sự nghiệp Tây Sơn từ thời Nguyễn Huệ và tiếp tục cùng chồng chiến đấu bảo vệ triều đại khi cục diện dần đổi khác sau năm 1792.",
      achievements:
        "Bà được nhắc đến như một trong những gương mặt nữ tướng tiêu biểu nhất của Tây Sơn. Khi triều đại sụp đổ năm 1802, bà cùng chồng bị bắt và bị xử tử.",
      meaning:
        "Hình ảnh Bùi Thị Xuân được nhiều thế hệ Việt Nam nhớ đến như biểu tượng của khí phách phụ nữ; tên bà ngày nay được đặt cho nhiều con đường trên cả nước.",
    },
    {
      name: "Ngô Thì Nhậm",
      era: "1746 – 1803",
      short:
        "Nhà văn, nhà ngoại giao và mưu sĩ, người góp phần lớn trong việc bang giao với nhà Thanh.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/ngo-thi-nham.jpg"
      image: "",
      imageFallback: makeArt("Ngô Thì|Nhậm", "1746 – 1803", 600, 750, "jade"),
      bio: "Ngô Thì Nhậm là danh sĩ người làng Tả Thanh Oai (nay thuộc Hà Nội), đỗ tiến sĩ năm 1775. Ông về với Tây Sơn khi Nguyễn Huệ ra Bắc và trở thành một trong những mưu sĩ, nhà ngoại giao quan trọng nhất của triều đại.",
      context:
        "Cuối năm 1788, khi quân Thanh kéo vào Thăng Long, Ngô Thì Nhậm cùng tướng Ngô Văn Sở bàn kế lui quân về Tam Điệp để bảo toàn lực lượng, chờ Quang Trung đưa quân ra Bắc.",
      achievements:
        "Sau chiến thắng năm 1789, ông giữ vai trò then chốt trong việc giao thiệp với nhà Thanh, giúp chấm dứt chiến tranh bằng ngoại giao. Ông cũng được cho là người soạn thảo Chiếu lập học năm 1791 theo ý vua Quang Trung.",
      meaning:
        "Ngô Thì Nhậm là ví dụ tiêu biểu cho việc Quang Trung biết trọng dụng người tài: có tướng giỏi cầm quân và có người giỏi văn chương, ngoại giao để giữ hòa hiếu sau chiến thắng. Sau khi Tây Sơn sụp đổ, ông bị xử đánh đòn ở Văn Miếu và qua đời năm 1803.",
    },
    {
      name: "Nguyễn Thiếp (La Sơn phu tử)",
      era: "1723 – 1804",
      short:
        "Học giả được Quang Trung kính trọng, người đứng đầu Sùng chính viện ở Nghệ An.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/nguyen-thiep.jpg"
      image: "",
      imageFallback: makeArt(
        "Nguyễn Thiếp|La Sơn phu tử",
        "1723 – 1804",
        600,
        750,
        "gold",
      ),
      bio: "Nguyễn Thiếp, còn gọi là La Sơn phu tử, là nhà nho nổi tiếng thời Lê – Tây Sơn, sống ẩn dật, dạy học và được người đương thời rất kính trọng.",
      context:
        "Cuối năm 1788, trên đường ra Bắc, Quang Trung dừng chân ở Nghệ An và hỏi ý kiến Nguyễn Thiếp về tình hình. Theo sử sách, ông nhận định quân Thanh kiêu ngạo, chưa hiểu tình hình đất Việt và khuyên nên tiến đánh nhanh.",
      achievements:
        "Năm 1791, Quang Trung lập Sùng chính viện ở Nghệ An và giao ông đứng đầu, phụ trách dịch sách chữ Hán sang chữ Nôm, đồng thời làm cố vấn giáo dục cho triều Tây Sơn.",
      meaning:
        "Mối quan hệ giữa Quang Trung và Nguyễn Thiếp phản ánh tinh thần trọng người hiền tài, trọng việc học của vị hoàng đế áo vải.",
    },
  ];

  // Dữ liệu cho Timeline (section "Cuộc đời")
  const timelineData = [
    {
      year: "1753",
      name: "Sinh ở vùng Tây Sơn",
      detail:
        "Nguyễn Huệ sinh khoảng năm 1753 ở vùng Tây Sơn (Bình Định xưa, nay thuộc tỉnh Gia Lai). Ông là người em thứ hai trong ba anh em: Nguyễn Nhạc, Nguyễn Huệ và Nguyễn Lữ.",
    },
    {
      year: "1771",
      name: "Anh em Tây Sơn khởi nghĩa",
      detail:
        "Ba anh em dựng cờ khởi nghĩa ở Tây Sơn, được đông đảo nông dân hưởng ứng. Nguyễn Huệ sớm trở thành vị tướng chỉ huy quân sự xuất sắc của nghĩa quân.",
    },
    {
      year: "1777",
      name: "Đánh tan lực lượng chúa Nguyễn",
      detail:
        "Nguyễn Huệ cùng Nguyễn Lữ tiến vào Gia Định, tiêu diệt lực lượng chúa Nguyễn ở Đàng Trong. Nguyễn Ánh chạy thoát và về sau nhiều lần tìm cách cầu viện bên ngoài.",
    },
    {
      year: "1785",
      name: "Rạch Gầm – Xoài Mút",
      detail:
        "Ông chỉ huy trận thủy chiến trên sông Tiền, đánh tan đạo quân Xiêm do Nguyễn Ánh mời sang. Đây là chiến thắng khẳng định tài mai phục và điều khiển thủy binh của ông.",
    },
    {
      year: "1786",
      name: "Tiến quân ra Bắc",
      detail:
        "Lấy danh nghĩa “phù Lê diệt Trịnh”, Nguyễn Huệ đánh chiếm Phú Xuân rồi tiến ra Thăng Long, chấm dứt thế lực chúa Trịnh ở Đàng Ngoài, sau đó rút quân về Nam.",
    },
    {
      year: "1788",
      name: "Lên ngôi hoàng đế",
      detail:
        "Ngày 25 tháng 11 âm lịch (22/12/1788), Nguyễn Huệ lên ngôi ở núi Bân (Phú Xuân), lấy niên hiệu Quang Trung, rồi xuất quân ra Bắc ngay trong ngày để đánh quân Thanh.",
    },
    {
      year: "1789",
      name: "Đại phá quân Thanh",
      detail:
        "Trong những ngày Tết Kỷ Dậu, quân Tây Sơn hạ đồn Hà Hồi, phá đồn Ngọc Hồi, đánh tan quân Thanh ở Đống Đa và giải phóng Thăng Long vào ngày mồng 5 Tết.",
    },
    {
      year: "1789 – 1792",
      name: "Xây dựng đất nước",
      detail:
        "Ông ban Chiếu khuyến nông, Chiếu lập học (1791), lập Sùng chính viện dịch sách sang chữ Nôm, và chủ trương xây kinh đô mới ở Nghệ An (Phượng Hoàng Trung Đô).",
    },
    {
      year: "1792",
      name: "Qua đời",
      detail:
        "Quang Trung mất ngày 29 tháng 7 năm Nhâm Tý (16/9/1792), ở tuổi khoảng 39, khi nhiều kế hoạch canh tân vẫn còn dang dở.",
    },
  ];

  // Các chặng của cuộc hành quân thần tốc (section "Hành quân")
  const marchData = [
    {
      when: "25 tháng 11 âm lịch",
      place: "Phú Xuân",
      note: "Nguyễn Huệ lên ngôi hoàng đế ở núi Bân, lấy niên hiệu Quang Trung và xuất quân ra Bắc ngay trong ngày.",
    },
    {
      when: "Cuối tháng 11",
      place: "Nghệ An",
      note: "Dừng chân tuyển thêm quân, gặp La Sơn phu tử Nguyễn Thiếp để hỏi ý kiến về thế trận.",
    },
    {
      when: "Giữa tháng Chạp",
      place: "Tam Điệp",
      note: "Hội quân với Ngô Văn Sở, Ngô Thì Nhậm, chỉnh đốn hàng ngũ và chuẩn bị kế hoạch đánh vào dịp Tết.",
    },
    {
      when: "Mồng 3 Tết",
      place: "Hà Hồi",
      note: "Quân Tây Sơn bao vây đồn Hà Hồi, buộc quân Thanh ra hàng mà hầu như không tốn sức.",
    },
    {
      when: "Mồng 5 Tết",
      place: "Ngọc Hồi – Đống Đa",
      note: "Hạ đồn Ngọc Hồi, đánh tan quân Thanh ở Đống Đa rồi tiến vào Thăng Long.",
    },
  ];

  // Dữ liệu sự kiện / trận đánh (section "Trận chiến")
  const eventsData = [
    {
      title: "Trận Rạch Gầm – Xoài Mút",
      year: "1785",
      figures: "Nguyễn Huệ",
      desc: "Quân Xiêm được Nguyễn Ánh mời sang, theo sử sách gồm khoảng 5 vạn quân cùng hàng trăm chiến thuyền, tiến vào vùng sông Tiền. Nguyễn Huệ bố trí quân mai phục ở khúc sông Rạch Gầm – Xoài Mút, nhử địch vào trận địa rồi đánh chặn hai đầu; phần lớn đạo quân Xiêm bị tiêu diệt.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/rach-gam.jpg"
      image: "",
      imageFallback: makeArt(
        "Rạch Gầm|Xoài Mút",
        "Sông Tiền, 1785",
        800,
        600,
        "jade",
      ),
    },
    {
      title: "Tiến quân ra Bắc “phù Lê diệt Trịnh”",
      year: "1786",
      figures: "Nguyễn Huệ, Nguyễn Hữu Chỉnh",
      desc: "Lấy danh nghĩa phù Lê diệt Trịnh, Nguyễn Huệ đánh chiếm Phú Xuân rồi tiến ra Thăng Long, chấm dứt thế lực họ Trịnh ở Đàng Ngoài. Sau đó ông rút quân về Nam, để lại một Bắc Hà còn nhiều biến động.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/thang-long-1786.jpg"
      image: "",
      imageFallback: makeArt("Tiến ra Bắc", "Năm 1786", 800, 600, "gold"),
    },
    {
      title: "Lên ngôi hoàng đế và xuất quân",
      year: "1788",
      figures: "Quang Trung – Nguyễn Huệ",
      desc: "Trước tin quân Thanh vào Thăng Long, Nguyễn Huệ lên ngôi hoàng đế ở núi Bân vào ngày 25 tháng 11 âm lịch, lấy niên hiệu Quang Trung, rồi xuất quân ngay trong ngày. Lễ lên ngôi giúp khẳng định tính chính danh của cuộc kháng chiến chống ngoại xâm.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/nui-ban.jpg"
      image: "",
      imageFallback: makeArt(
        "Núi Bân|Phú Xuân",
        "Tháng 12 năm 1788",
        800,
        600,
        "red",
      ),
    },
    {
      title: "Hạ đồn Hà Hồi và Ngọc Hồi",
      year: "Mồng 3 – mồng 5 Tết 1789",
      figures: "Quang Trung và các tướng Tây Sơn",
      desc: "Đồn Hà Hồi bị bao vây và phải đầu hàng, quân Tây Sơn thu được lương thực. Sáng mồng 5 Tết ở Ngọc Hồi, quân Tây Sơn dùng ván ghép rơm ướt che tên đạn, tiến sát đồn địch rồi đánh giáp lá cà, phối hợp voi trận; đồn Ngọc Hồi bị phá.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/ngoc-hoi.jpg"
      image: "",
      imageFallback: makeArt(
        "Hà Hồi|Ngọc Hồi",
        "Tết Kỷ Dậu 1789",
        800,
        600,
        "red",
      ),
    },
    {
      title: "Đại phá quân Thanh ở Đống Đa",
      year: "Mồng 5 Tết 1789",
      figures: "Quang Trung, Đô đốc Đặng Tiến Đông",
      desc: "Cùng lúc, cánh quân của Đô đốc Đặng Tiến Đông đánh vào Đống Đa; Sầm Nghi Đống không giữ nổi đồn và tự vẫn. Trưa mồng 5, Quang Trung tiến vào Thăng Long, tà áo bào đỏ nhuốm khói súng sạm đen theo lời kể trong sử sách. Tôn Sĩ Nghị bỏ chạy, quân Thanh tranh nhau qua cầu phao sông Nhị khiến nhiều người chết đuối.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/dong-da.jpg"
      image: "",
      imageFallback: makeArt(
        "Gò Đống Đa",
        "Thăng Long, 1789",
        800,
        600,
        "gold",
      ),
    },
    {
      title: "Ngoại giao sau chiến thắng",
      year: "1789 – 1790",
      figures: "Quang Trung, Ngô Thì Nhậm",
      desc: "Sau chiến thắng, Quang Trung dùng ngoại giao để chấm dứt xung đột: cử sứ giả giao thiệp với nhà Thanh, giữ hòa hiếu để có thời gian xây dựng đất nước. Vua Càn Long phong ông làm An Nam quốc vương, và năm 1790 Tây Sơn cử người sang Yên Kinh dự lễ mừng thọ vua Càn Long.",
      // THÊM ẢNH TẠI ĐÂY: ví dụ "images/ngoai-giao.jpg"
      image: "",
      imageFallback: makeArt(
        "Bang giao|với nhà Thanh",
        "1789 – 1790",
        800,
        600,
        "jade",
      ),
    },
  ];

  // Dữ liệu thư viện ảnh — thêm/bớt phần tử để thay đổi số lượng ảnh hiển thị.
  // Chép ảnh thật vào thư mục images/ đúng tên bên dưới; thiếu file thì hiện ảnh SVG dự phòng.
  const galleryData = [
    {
      src: "images/quang-trung.jpg",
      fallback: makeArt("Quang Trung|Nguyễn Huệ", "Tượng đài", 500, 650, "red"),
      caption: "Tượng đài vua Quang Trung – Nguyễn Huệ",
    },
    {
      src: "images/go-dong-da.jpg",
      fallback: makeArt("Gò Đống Đa", "Hà Nội", 500, 550, "gold"),
      caption: "Gò Đống Đa (Hà Nội) — nơi diễn ra trận Đống Đa năm 1789",
    },
    {
      src: "images/bao-tang-quang-trung.jpg",
      fallback: makeArt(
        "Bảo tàng|Quang Trung",
        "Vùng đất Tây Sơn",
        500,
        620,
        "jade",
      ),
      caption: "Bảo tàng Quang Trung trên vùng đất Tây Sơn (Gia Lai)",
    },
    {
      src: "images/rach-gam.jpg",
      fallback: makeArt("Rạch Gầm|Xoài Mút", "Sông Tiền", 500, 500, "jade"),
      caption: "Vùng sông Tiền — chiến trường Rạch Gầm – Xoài Mút (1785)",
    },
    {
      src: "images/phuong-hoang-trung-do.jpg",
      fallback: makeArt(
        "Phượng Hoàng|Trung Đô",
        "Núi Dũng Quyết",
        500,
        600,
        "gold",
      ),
      caption:
        "Núi Dũng Quyết (Vinh, Nghệ An) — nơi Quang Trung định xây Phượng Hoàng Trung Đô",
    },
    {
      src: "images/le-hoi-dong-da.jpg",
      fallback: makeArt("Lễ hội|Đống Đa", "Mồng 5 Tết", 500, 560, "red"),
      caption: "Lễ hội gò Đống Đa vào mồng 5 Tết hằng năm",
    },
    // THÊM ẢNH TẠI ĐÂY: sao chép khối dưới rồi sửa src + caption để thêm ảnh mới
    // {
    //   src: "images/ten-file-anh-cua-ban.jpg",
    //   fallback: makeArt("Tiêu đề|ảnh", "Phụ đề", 500, 500, "gold"),
    //   caption: "Chú thích cho ảnh mới",
    // },
  ];

  // Trích dẫn lịch sử — chỉ dùng câu có nguồn ghi nhận, không tự bịa
  const quotesData = [
    {
      text: "Đánh cho để dài tóc, đánh cho để đen răng, đánh cho nó chích luân bất phản, đánh cho nó phiến giáp bất hoàn, đánh cho sử tri Nam quốc anh hùng chi hữu chủ.",
      author: "Vua Quang Trung (tương truyền)",
      source: "Lời dụ tướng sĩ trước trận đại phá quân Thanh, năm 1789",
    },
    {
      text: "Ngọc không mài, không thành đồ vật; người không học, không biết rõ đạo.",
      author: "Chiếu lập học của vua Quang Trung",
      source: "Do Ngô Thì Nhậm soạn theo ý vua, năm 1791",
    },
    {
      text: "Không có gì quý hơn độc lập, tự do.",
      author: "Chủ tịch Hồ Chí Minh",
      source: "Lời kêu gọi toàn quốc, ngày 17/7/1966",
    },
  ];

  /* =====================================================================
     2. LOADING SCREEN + ẢNH NỀN
  ===================================================================== */
  const loadingScreen = document.getElementById("loading-screen");
  let loadingDismissed = false;
  function hideLoadingScreen() {
    if (loadingDismissed) return;
    loadingDismissed = true;
    loadingScreen.classList.add("hidden");
    // Sau khi mờ hẳn thì gỡ khỏi luồng render để không còn chặn click/scroll
    loadingScreen.addEventListener(
      "transitionend",
      () => {
        loadingScreen.style.display = "none";
      },
      { once: true },
    );
  }
  // Không chờ window.load (sự kiện này còn phụ thuộc Google Fonts và ảnh lazy,
  // có thể mất vài giây hoặc không bao giờ bắn) — hẹn giờ ngay từ lúc script chạy.
  setTimeout(hideLoadingScreen, 900); // giữ đủ lâu để thấy thanh chạy
  // Lưới an toàn thứ hai
  setTimeout(hideLoadingScreen, 4000);

  // Ảnh nền hero, video, trích dẫn: SVG tự tạo (dùng url("...") có nháy kép để an toàn).
  // Muốn dùng ảnh thật: thay bằng style.backgroundImage = 'url("images/ten-anh.jpg")'.
  const heroBg = document.querySelector(".hero-bg");
  if (heroBg) {
    heroBg.style.backgroundImage = `url("${makeArt(
      "Ngọc Hồi|Đống Đa",
      "Thăng Long · Tết Kỷ Dậu 1789",
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
        "Quang Trung|Nguyễn Huệ",
        "1753 – 1792",
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
      el.dataset.artTitle || "Quang Trung",
      el.dataset.artSub || "",
      800,
      450,
      el.dataset.artHue || "red",
    )}")`;
  });

  const quoteBgEl = document.querySelector(".quote-bg");
  if (quoteBgEl) {
    quoteBgEl.style.backgroundImage = `url("${makeArt(
      "Đống Đa 1789",
      "Đại phá quân Thanh",
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

  // Gom mọi tác vụ theo dõi cuộn vào MỘT listener dùng requestAnimationFrame:
  // giới hạn ở 1 lần đọc/ghi DOM mỗi frame thay vì nhiều listener chạy mỗi sự kiện
  // scroll (trước đây có 2 listener, mỗi lần cuộn đều đọc layout gây jank).
  let scrollRaf = 0;
  function onScroll() {
    scrollRaf = 0;
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 60);
    backToTopBtn.classList.toggle("show", y > 600);

    // Parallax nhẹ cho ảnh nền phần trích dẫn
    if (!prefersReducedMotion) {
      const rect = quoteSection.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        quoteBg.style.transform = `translateY(${rect.top * 0.15}px)`;
      }
    }
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll);
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
  const particlesEnabled = Boolean(canvas && ctx && !prefersReducedMotion);
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
    // Dừng vòng lặp hẳn khi hero ra khỏi màn hình (trước đây vẫn chạy rAF liên tục
    // dù không vẽ gì, gây tốn CPU/GPU ở mọi vị trí cuộn của trang).
    if (!heroVisible) return;
    {
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

  if (particlesEnabled) {
    resizeCanvas();
    createParticles();
    requestAnimationFrame(animateParticles);

    // Gom sự kiện resize vào 1 frame: tránh chạy lại vòng tạo hạt nhiều lần
    // liên tiếp khi người dùng kéo giãn cửa sổ.
    let resizeRaf = 0;
    window.addEventListener("resize", () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resizeCanvas();
        createParticles();
      });
    });

    new IntersectionObserver((entries) => {
      const wasVisible = heroVisible;
      heroVisible = entries[0].isIntersecting;
      // Khởi động lại vòng lặp khi hero quay lại trong tầm nhìn
      if (heroVisible && !wasVisible) requestAnimationFrame(animateParticles);
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
     8. RENDER CUỘC HÀNH QUÂN THẦN TỐC
     Đường đỏ chạy qua các chặng khi người xem cuộn tới (CSS lo phần
     chuyển động, JS chỉ thêm class .in-view và đặt độ trễ cho từng chấm).
  ===================================================================== */
  const marchTrack = document.getElementById("march-track");

  marchData.forEach((stop, i) => {
    const el = document.createElement("div");
    el.className = "march-stop";
    // Chấm sáng lên đúng lúc đường đỏ chạy tới (đường chạy 3.2s)
    const delay = (i / (marchData.length - 1)) * 2.6;
    el.style.setProperty("--lit-delay", `${delay.toFixed(2)}s`);
    el.innerHTML = `
      <span class="march-marker"></span>
      <p class="march-when">${stop.when}</p>
      <h3 class="march-place">${stop.place}</h3>
      <p class="march-note">${stop.note}</p>
    `;
    marchTrack.appendChild(el);
  });

  /* =====================================================================
     9. RENDER SỰ KIỆN LỊCH SỬ
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

  /* =====================================================================
     12. SCROLL REVEAL DÙNG CHUNG (IntersectionObserver)
     Áp dụng cho .reveal-on-scroll, .timeline-item và đường hành quân,
     kể cả những phần tử vừa được tạo động ở các bước trên.
  ===================================================================== */
  const revealTargets = document.querySelectorAll(
    ".reveal-on-scroll, .timeline-item",
  );

  function revealAll() {
    revealTargets.forEach((el) => el.classList.add("in-view"));
    marchTrack.classList.add("in-view");
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

    // Đường hành quân chỉ bắt đầu chạy khi cả đường đã vào tầm nhìn
    const marchObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            marchObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    marchObserver.observe(marchTrack);

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
