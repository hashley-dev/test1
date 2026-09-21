/* =====================================================================
   HÀO KHÍ VIỆT NAM — SCRIPT.JS
   Mục lục:
   1. DỮ LIỆU (nhân vật, timeline, sự kiện, thư viện, trích dẫn)
   2. LOADING SCREEN
   3. HEADER SCROLL + MOBILE MENU + ACTIVE NAV LINK
   4. SMOOTH SCROLL CHO CÁC LIÊN KẾT NEO (#...)
   5. HIỆU ỨNG PARTICLES TRONG HERO (canvas)
   6. RENDER CÁC ANH HÙNG + MODAL TIỂU SỬ
   7. RENDER TIMELINE + TƯƠNG TÁC CLICK
   8. RENDER SỰ KIỆN LỊCH SỬ
   9. RENDER THƯ VIỆN ẢNH + LIGHTBOX
   10. TRÍCH DẪN LỊCH SỬ (luân phiên + hiệu ứng chữ + parallax)
   11. SCROLL REVEAL DÙNG CHUNG (IntersectionObserver)
   12. COUNTER ANIMATION (số liệu trong phần giới thiệu)
   13. NÚT BACK TO TOP
===================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================================
     1. DỮ LIỆU
     Toàn bộ nội dung nhân vật / sự kiện / ảnh / trích dẫn được khai báo
     tại đây. Muốn sửa nội dung hoặc thêm nhân vật mới, chỉ cần chỉnh
     trong các mảng dữ liệu bên dưới — không cần đụng tới phần code render.
  ===================================================================== */

  /* ---------------------------------------------------------------------
     Hàm tạo ảnh SVG "tự chứa" (không phụ thuộc mạng).
     Trả về data-URI nên ảnh luôn hiển thị ngay cả khi không có Internet.
     Muốn dùng ảnh thật: thay giá trị src/image bằng đường dẫn file của bạn.
  --------------------------------------------------------------------- */
  function makeArt(title, subtitle, w, h, hue) {
    const palette = {
      gold: ["#2a1a12", "#c9a227", "#f2ead9"],
      red: ["#2a1214", "#a53344", "#f2ead9"],
      jade: ["#0f1c18", "#4c6b5b", "#e7d9bc"],
    };
    const [bg, accent, text] = palette[hue] || palette.gold;
    const esc = (s) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    const lines = String(title).split("|");
    // Bộ chữ hỗ trợ đầy đủ dấu tiếng Việt (Unicode): ưu tiên các font hệ thống
    // có bảng mã Latin Extended, bỏ Georgia vì dấu dễ lệch trên một số máy.
    const fontSerif =
      "'Times New Roman','Palatino Linotype','Segoe UI','Noto Serif',Tahoma,Arial,sans-serif";
    const fontSans = "'Segoe UI','Noto Sans',Tahoma,Arial,Helvetica,sans-serif";
    // Giãn dòng rộng rãi để các dòng không chồng lên nhau
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
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  /* ---------------------------------------------------------------------
     Ảnh thật (tải sẵn vào test2/images/) + ảnh SVG dự phòng.
     Dùng photo("ten-file.jpg", "Tham số|SVG", "Phụ đề", w, h, hue):
     - Nếu file ảnh có trong test2/images/ → dùng ảnh thật.
     - Nếu thiếu file → tự động thay bằng ảnh SVG tự tạo (không vỡ giao diện).
     Để thay ảnh: chỉ cần copy file mới vào test2/images/ đúng tên bên dưới.
  --------------------------------------------------------------------- */
  function photo(file, artTitle, artSub, w, h, hue) {
    const real = "images/" + file;
    return {
      src: real,
      fallback: makeArt(artTitle, artSub, w, h, hue),
    };
  }

  /* ---------------------------------------------------------------------
     Gắn ảnh thật vào mọi <img>. Nếu ảnh lỗi (thiếu file / sai đường dẫn),
     thay bằng ảnh SVG dự phòng để khung ảnh không bao giờ bị trống.
     Gọi sau khi các card đã được render ra DOM.
  --------------------------------------------------------------------- */
  function applyImageFallbacks(scope) {
    (scope || document)
      .querySelectorAll("img[data-fallback]")
      .forEach((img) => {
        const swap = () => {
          if (img.dataset.swapped === "1") return;
          img.dataset.swapped = "1";
          img.src = img.dataset.fallback;
        };
        if (img.complete && img.naturalWidth === 0) swap();
        img.addEventListener("error", swap);
      });
  }

  // Danh sách anh hùng dân tộc hiển thị ở section "Những anh hùng qua các thời đại"
  const heroesData = [
    {
      isMain: true,
      name: "Lý Thường Kiệt",
      era: "1019 – 1105",
      short:
        "Danh tướng thời Lý, tác giả bài thơ thần Nam Quốc Sơn Hà, người chỉ huy kháng chiến chống Tống thắng lợi trên phòng tuyến Như Nguyệt.",
      // THAY ẢNH TẠI ĐÂY: ảnh tượng đài Lý Thường Kiệt (Wikimedia Commons)
      image: "images/ly-thuong-kiet.jpg",
      imageFallback: makeArt("Lý Thường|Kiệt", "1019 – 1105", 600, 750, "gold"),
      bio: "Lý Thường Kiệt (1019 – 1105) tên thật là Ngô Tuấn, tự Thường Kiệt, quê ở phường Thái Hòa, thành Thăng Long (nay thuộc Hà Nội). Ông xuất thân trong một gia đình có truyền thống võ nghiệp, được vua Lý Thái Tông cho theo hầu từ khi còn trẻ. Nhờ sự thông minh, gan dạ và tài năng quân sự, ông lần lượt được giao nhiều trọng trách lớn dưới ba đời vua Lý Thái Tông, Lý Thánh Tông và Lý Nhân Tông.",
      context:
        'Cuối thế kỷ XI, nhà Tống đứng trước khó khăn trong nước nên âm mưu nam tiến để giải quyết mâu thuẫn. Nắm bắt được ý đồ đó, năm 1075 Lý Thường Kiệt chủ trương "tiên phát chế nhân" — chủ động đưa quân Đại Việt tiến đánh các châu Ung, Khâm, Liêm trên đất Tống để phá thế chuẩn bị của địch, rồi nhanh chóng rút về nước.',
      achievements:
        'Năm 1077, khi đại quân Tống do Quách Quỳ chỉ huy tiến sang, Lý Thường Kiệt tổ chức phòng tuyến kiên cố trên sông Như Nguyệt (sông Cầu), chặn đứng và đánh bại đại quân Tống. Cũng tại đây, bài thơ thần "Nam quốc sơn hà" được cho là đã vang lên để khích lệ tinh thần binh sĩ. Quân Tống cuối cùng phải chấp nhận giảng hòa và rút quân.',
      meaning:
        '"Nam quốc sơn hà" được xem là bản tuyên ngôn chủ quyền đầu tiên bằng văn tự còn lưu truyền của dân tộc Việt Nam, khẳng định nước Nam có vua riêng và ranh giới đã được "sách trời" định sẵn. Chiến thắng Như Nguyệt cũng để lại một bài học chiến lược về chủ động phòng thủ và kết thúc chiến tranh bằng giảng hòa.',
    },
    {
      name: "Hai Bà Trưng",
      era: "Năm 40 – 43 sau Công nguyên",
      short:
        "Hai chị em Trưng Trắc, Trưng Nhị dấy binh khởi nghĩa, đánh đuổi quan quân nhà Đông Hán, giành lại độc lập cho đất nước trong ba năm.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh Hai Bà Trưng, ví dụ "images/hai-ba-trung.jpg"
      image: "",
      imageFallback: makeArt("Hai Bà|Trưng", "Năm 40 – 43", 600, 750, "red"),
      bio: "Trưng Trắc và Trưng Nhị là hai chị em người huyện Mê Linh (nay thuộc Hà Nội). Năm 40 sau Công nguyên, trước chính sách cai trị hà khắc của Thái thú Tô Định nhà Đông Hán, Trưng Trắc cùng em gái phất cờ khởi nghĩa.",
      context:
        "Cuộc khởi nghĩa nhanh chóng nhận được sự hưởng ứng của hào kiệt và nhân dân nhiều quận, huyện. Quân khởi nghĩa đánh chiếm được 65 thành trì, buộc Tô Định phải bỏ chạy về nước.",
      achievements:
        "Sau khi giành thắng lợi, Trưng Trắc lên ngôi vua, đóng đô ở Mê Linh, xưng là Trưng Nữ Vương. Đây là lần đầu tiên trong lịch sử, một cuộc khởi nghĩa do phụ nữ lãnh đạo giành được độc lập cho dân tộc, dù chỉ tồn tại trong ba năm trước khi nhà Hán cử Mã Viện sang đàn áp.",
      meaning:
        "Cuộc khởi nghĩa Hai Bà Trưng là bản anh hùng ca mở đầu cho truyền thống đấu tranh chống ngoại xâm của dân tộc Việt Nam, đồng thời khẳng định vai trò và bản lĩnh của người phụ nữ Việt trong lịch sử.",
    },
    {
      name: "Bà Triệu",
      era: "Khoảng năm 248 sau Công nguyên",
      short:
        "Triệu Thị Trinh dấy binh chống lại quân Đông Ngô, được sử sách ca ngợi với khí phách quật cường hiếm có.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh Bà Triệu, ví dụ "images/ba-trieu.jpg"
      image: "",
      imageFallback: makeArt("Bà Triệu", "Khoảng năm 248", 600, 750, "red"),
      bio: "Triệu Thị Trinh (còn gọi là Bà Triệu) quê ở vùng Cửu Chân (Thanh Hóa ngày nay). Khi quân Đông Ngô đô hộ nước ta với chính sách bóc lột nặng nề, bà cùng anh trai Triệu Quốc Đạt dấy binh khởi nghĩa vào khoảng năm 248.",
      context:
        'Nghĩa quân của Bà Triệu hoạt động mạnh ở vùng núi Nưa (Thanh Hóa), khiến chính quyền đô hộ nhiều phen khốn đốn. Sử sách còn lưu truyền câu nói thể hiện khí phách của bà: "Tôi muốn cưỡi cơn gió mạnh, đạp luồng sóng dữ, chém cá kình ở biển khơi... chứ không chịu khom lưng làm tì thiếp cho người."',
      achievements:
        "Dù cuộc khởi nghĩa cuối cùng bị đàn áp, tinh thần chiến đấu ngoan cường của Bà Triệu đã trở thành biểu tượng cho ý chí bất khuất của người phụ nữ Việt Nam trước ách đô hộ ngoại bang.",
      meaning:
        "Hình ảnh Bà Triệu tiếp nối tinh thần của Hai Bà Trưng, khẳng định rằng khát vọng độc lập của dân tộc không bao giờ bị dập tắt, dù phải trải qua nhiều thế hệ đấu tranh.",
    },
    {
      name: "Ngô Quyền",
      era: "897 – 944",
      short:
        "Người làm nên chiến thắng Bạch Đằng năm 938, chấm dứt hơn một nghìn năm Bắc thuộc.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh Ngô Quyền, ví dụ "images/ngo-quyen.jpg"
      image: "",
      imageFallback: makeArt("Ngô Quyền", "897 – 944", 600, 750, "jade"),
      bio: "Ngô Quyền là một tướng lĩnh, sau này trở thành vị vua đầu tiên của nhà Ngô. Ông sinh ra tại Đường Lâm (Sơn Tây, Hà Nội ngày nay), nổi tiếng với tài năng quân sự từ sớm.",
      context:
        "Năm 938, quân Nam Hán do Lưu Hoằng Tháo chỉ huy tiến sang xâm lược theo đường thủy trên sông Bạch Đằng. Ngô Quyền đã cho quân sĩ đóng cọc nhọn bịt sắt xuống lòng sông, lợi dụng thủy triều để phá tan hạm thuyền quân Nam Hán.",
      achievements:
        "Chiến thắng Bạch Đằng năm 938 đã chấm dứt hơn 1000 năm Bắc thuộc, mở ra một kỷ nguyên độc lập tự chủ lâu dài cho dân tộc. Sau chiến thắng, Ngô Quyền xưng vương, đóng đô ở Cổ Loa.",
      meaning:
        "Trận Bạch Đằng năm 938 được xem là một trong những trận thủy chiến kinh điển nhất lịch sử quân sự Việt Nam, đặt nền móng chiến thuật cho hai chiến thắng Bạch Đằng sau này vào các năm 981 và 1288.",
    },
    {
      name: "Đinh Bộ Lĩnh",
      era: "924 – 979",
      short:
        "Người dẹp loạn 12 sứ quân, thống nhất đất nước, lập ra nhà nước Đại Cồ Việt.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh Đinh Bộ Lĩnh, ví dụ "images/dinh-bo-linh.jpg"
      image: "",
      imageFallback: makeArt("Đinh Bộ|Lĩnh", "924 – 979", 600, 750, "jade"),
      bio: "Đinh Bộ Lĩnh sinh ra tại Hoa Lư (Ninh Bình). Sau khi Ngô Quyền mất, đất nước rơi vào tình trạng cát cứ, chia rẽ bởi 12 sứ quân tranh giành quyền lực.",
      context:
        "Với tài thao lược, Đinh Bộ Lĩnh lần lượt thu phục hoặc đánh dẹp các sứ quân, thống nhất đất nước vào năm 967 sau nhiều năm chinh chiến.",
      achievements:
        "Năm 968, ông lên ngôi Hoàng đế, lấy hiệu là Đinh Tiên Hoàng, đặt quốc hiệu là Đại Cồ Việt, đóng đô ở Hoa Lư — đánh dấu sự ra đời của nhà nước phong kiến trung ương tập quyền đầu tiên của Việt Nam.",
      meaning:
        "Việc chấm dứt loạn 12 sứ quân có ý nghĩa quan trọng trong việc củng cố nền độc lập vừa giành lại, tạo tiền đề cho các triều đại phong kiến sau này xây dựng và bảo vệ đất nước.",
    },
    {
      name: "Trần Hưng Đạo",
      era: "Khoảng 1228 – 1300",
      short:
        "Ba lần lãnh đạo quân dân Đại Việt đánh bại quân xâm lược Nguyên Mông hùng mạnh nhất thời bấy giờ.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh Trần Hưng Đạo, ví dụ "images/tran-hung-dao.jpg"
      image: "",
      imageFallback: makeArt("Trần Hưng|Đạo", "1228 – 1300", 600, 750, "red"),
      bio: 'Trần Hưng Đạo, tên thật là Trần Quốc Tuấn, là tôn thất và thống lĩnh quân đội nhà Trần. Ông là tác giả của "Hịch tướng sĩ" — áng văn khích lệ tinh thần chiến đấu nổi tiếng trong lịch sử.',
      context:
        'Trong vòng ba mươi năm (1258, 1285, 1288), quân Nguyên Mông ba lần đưa đại quân xâm lược Đại Việt. Dưới sự chỉ huy của Trần Hưng Đạo, quân dân nhà Trần đã vận dụng chiến thuật "vườn không nhà trống", rút lui chiến lược rồi phản công đúng thời điểm.',
      achievements:
        "Đỉnh cao là trận Bạch Đằng năm 1288, tái hiện chiến thuật đóng cọc của Ngô Quyền, tiêu diệt và bắt sống phần lớn đạo quân của Ô Mã Nhi, đánh bại hoàn toàn cuộc xâm lược lần thứ ba của quân Nguyên Mông.",
      meaning:
        "Chiến thắng trước đế quốc Nguyên Mông — thế lực từng chinh phục gần như toàn bộ lục địa Á-Âu — cho thấy bản lĩnh và trí tuệ quân sự kiệt xuất của dân tộc Việt Nam trong việc lấy nhỏ thắng lớn, lấy ít địch nhiều.",
    },
    {
      name: "Lê Lợi",
      era: "1385 – 1433",
      short:
        "Người lãnh đạo khởi nghĩa Lam Sơn mười năm, đánh đuổi quân Minh, lập ra nhà Hậu Lê.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh vua Lê Lợi, ví dụ "images/le-loi.jpg"
      image: "",
      imageFallback: makeArt("Lê Lợi", "1385 – 1433", 600, 750, "jade"),
      bio: "Lê Lợi là một hào trưởng ở vùng Lam Sơn (Thanh Hóa). Năm 1418, trước ách đô hộ tàn bạo của nhà Minh, ông dựng cờ khởi nghĩa, xưng là Bình Định Vương.",
      context:
        "Cuộc khởi nghĩa Lam Sơn trải qua nhiều giai đoạn gian khổ, có lúc nghĩa quân phải rút lên núi Chí Linh cố thủ trước sự truy quét của quân Minh. Với sự trợ giúp của các mưu sĩ như Nguyễn Trãi, nghĩa quân dần chuyển từ phòng ngự sang phản công.",
      achievements:
        'Sau các chiến thắng quyết định như Chi Lăng – Xương Giang (1427), quân Minh buộc phải chấp nhận rút quân về nước. Năm 1428, Lê Lợi lên ngôi hoàng đế, lập ra nhà Hậu Lê, và giao cho Nguyễn Trãi soạn "Bình Ngô đại cáo" tuyên bố nền độc lập.',
      meaning:
        "Khởi nghĩa Lam Sơn là minh chứng cho việc một cuộc khởi nghĩa xuất phát từ lực lượng nhỏ bé vẫn có thể đánh bại một đế chế lớn mạnh nếu biết dựa vào sức dân và kiên trì chiến lược lâu dài.",
    },
    {
      name: "Quang Trung – Nguyễn Huệ",
      era: "1753 – 1792",
      short:
        "Vị hoàng đế áo vải, người chỉ huy trận đại phá 29 vạn quân Thanh chỉ trong vài ngày Tết Kỷ Dậu.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh Quang Trung, ví dụ "images/quang-trung.jpg"
      image: "",
      imageFallback: makeArt("Quang Trung", "1753 – 1792", 600, 750, "red"),
      bio: "Nguyễn Huệ là một trong ba anh em lãnh đạo phong trào Tây Sơn. Ông nổi tiếng với tài dụng binh thần tốc và những chiến công lẫy lừng trước khi lên ngôi hoàng đế, lấy niên hiệu Quang Trung.",
      context:
        "Cuối năm 1788, nhà Thanh đưa 29 vạn quân sang xâm lược, mượn cớ giúp nhà Lê. Nguyễn Huệ lên ngôi hoàng đế tại Phú Xuân rồi lập tức thần tốc hành quân ra Bắc.",
      achievements:
        "Chỉ trong vòng 5 ngày Tết Kỷ Dậu (1789), quân Tây Sơn liên tiếp đánh tan các đồn lũy của quân Thanh, đỉnh điểm là chiến thắng Ngọc Hồi – Đống Đa, buộc quân Thanh phải tháo chạy trong hỗn loạn.",
      meaning:
        'Chiến thắng Ngọc Hồi – Đống Đa là một trong những chiến công quân sự thần tốc và vang dội bậc nhất lịch sử Việt Nam, thể hiện tài năng quân sự kiệt xuất và tinh thần "đánh cho sử tri Nam quốc anh hùng chi hữu chủ".',
    },
    {
      name: "Hồ Chí Minh",
      era: "1890 – 1969",
      short:
        "Lãnh tụ cách mạng, người đọc bản Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hòa.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh Hồ Chí Minh, ví dụ "images/ho-chi-minh.jpg"
      image: "",
      imageFallback: makeArt("Hồ Chí|Minh", "1890 – 1969", 600, 750, "red"),
      bio: "Hồ Chí Minh (tên khai sinh Nguyễn Sinh Cung) là lãnh tụ của cách mạng Việt Nam, người sáng lập Đảng Cộng sản Việt Nam và là Chủ tịch đầu tiên của nước Việt Nam Dân chủ Cộng hòa.",
      context:
        "Sau nhiều năm bôn ba tìm đường cứu nước và lãnh đạo phong trào cách mạng, ngày 2 tháng 9 năm 1945, tại Quảng trường Ba Đình, ông đọc bản Tuyên ngôn Độc lập, tuyên bố chấm dứt chế độ thực dân phong kiến, khai sinh nước Việt Nam Dân chủ Cộng hòa.",
      achievements:
        "Ông tiếp tục lãnh đạo nhân dân trong cuộc kháng chiến chống thực dân Pháp cho đến chiến thắng Điện Biên Phủ năm 1954, và đặt nền móng tư tưởng cho cuộc kháng chiến chống Mỹ sau này.",
      meaning:
        'Tư tưởng "Không có gì quý hơn độc lập, tự do" của Hồ Chí Minh đã trở thành kim chỉ nam cho ý chí đấu tranh giành và giữ nền độc lập dân tộc trong suốt thế kỷ 20.',
    },
    {
      name: "Võ Nguyên Giáp",
      era: "1911 – 2013",
      short:
        "Đại tướng đầu tiên của Quân đội Nhân dân Việt Nam, Tổng tư lệnh chiến dịch Điện Biên Phủ.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh Võ Nguyên Giáp, ví dụ "images/vo-nguyen-giap.jpg"
      image: "",
      imageFallback: makeArt("Võ Nguyên|Giáp", "1911 – 2013", 600, 750, "jade"),
      bio: "Võ Nguyên Giáp là một trong những học trò xuất sắc của Chủ tịch Hồ Chí Minh, được phong hàm Đại tướng đầu tiên của Quân đội Nhân dân Việt Nam vào năm 1948.",
      context:
        'Ông trực tiếp chỉ huy chiến dịch Điện Biên Phủ năm 1954 — trận quyết chiến chiến lược quyết định vận mệnh cuộc kháng chiến chống thực dân Pháp, với quyết định thay đổi phương châm tác chiến từ "đánh nhanh, thắng nhanh" sang "đánh chắc, tiến chắc" mang tính bước ngoặt.',
      achievements:
        "Sau 56 ngày đêm chiến đấu, quân đội Việt Nam giành thắng lợi hoàn toàn vào ngày 7 tháng 5 năm 1954, buộc thực dân Pháp phải ký Hiệp định Genève, chấm dứt chiến tranh và công nhận độc lập cho các nước Đông Dương.",
      meaning:
        "Chiến thắng Điện Biên Phủ được ví như một tiếng vang lớn cổ vũ phong trào giải phóng dân tộc trên toàn thế giới, và tên tuổi Võ Nguyên Giáp gắn liền với một trong những chiến thắng quân sự có ảnh hưởng lớn nhất thế kỷ 20.",
    },
  ];

  // Dữ liệu cho Timeline (section 6) — dùng chung nhân vật ở trên để đảm bảo tính nhất quán
  const timelineData = [
    {
      year: "1019",
      name: "Sinh tại Thăng Long",
      detail:
        "Lý Thường Kiệt tên thật là Ngô Tuấn, sinh năm 1019 tại phường Thái Hòa, thành Thăng Long (nay thuộc Hà Nội), trong một gia đình có truyền thống võ nghiệp.",
    },
    {
      year: "Thiếu thời",
      name: "Được vua tin dùng",
      detail:
        "Nhờ thông minh và gan dạ, Ngô Tuấn được vua Lý Thái Tông cho theo hầu từ khi còn trẻ, rồi dần được giao các chức vụ trong quân đội.",
    },
    {
      year: "1069",
      name: "Nam chinh Chiêm Thành",
      detail:
        "Ông tham gia chiến dịch đánh Chiêm Thành, lập nhiều công lao và được phong tước, trở thành một trong những tướng lĩnh chủ chốt của triều Lý.",
    },
    {
      year: "1075",
      name: "Tiên phát chế nhân",
      detail:
        "Trước nguy cơ nhà Tống xâm lược, ông chủ động chỉ huy quân Đại Việt tiến đánh các châu Ung, Khâm, Liêm trên đất Tống để phá thế chuẩn bị của địch, rồi rút về nước.",
    },
    {
      year: "1077",
      name: "Phòng tuyến Như Nguyệt",
      detail:
        "Đại quân Tống tiến sang, Lý Thường Kiệt tổ chức phòng tuyến trên sông Như Nguyệt (sông Cầu), chặn đứng và đánh bại quân Tống. Bài thơ thần Nam Quốc Sơn Hà được cho là vang lên tại đây.",
    },
    {
      year: "1077",
      name: "Giảng hòa với nhà Tống",
      detail:
        "Khi quân Tống suy yếu và có ý rút, ông chủ động đề nghị giảng hòa để giữ hòa hiếu giữa hai nước và tránh một cuộc chiến kéo dài.",
    },
    {
      year: "1105",
      name: "Qua đời",
      detail:
        "Sau khi tiếp tục được tin dùng trong các trọng trách quân sự và trấn giữ vùng biên ải phía Bắc, Lý Thường Kiệt qua đời năm 1105.",
    },
  ];

  // Dữ liệu sự kiện / chiến công (section 7)
  const eventsData = [
    {
      title: "Chiến dịch phá thế chuẩn bị của nhà Tống",
      year: "1075",
      figures: "Lý Thường Kiệt",
      desc: 'Nắm được ý đồ nam tiến của nhà Tống, Lý Thường Kiệt chủ trương "tiên phát chế nhân": chủ động đưa quân Đại Việt tiến đánh các châu Ung, Khâm, Liêm trên đất Tống để phá hủy kho tàng, doanh trại và các tuyến tập kết quân, rồi nhanh chóng rút về nước.',
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh cho sự kiện này, ví dụ "images/thang-long.jpg"
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_BHRGO9WQ5DUhct2tPb4GKgTQ8TN2c2SNBNHiCJEPJlsGzi846aXOro8&s=10",
      imageFallback: makeArt("Ung – Khâm|– Liêm", "1075", 800, 600, "red"),
    },
    {
      title: "Phòng tuyến sông Như Nguyệt",
      year: "1077",
      figures: "Lý Thường Kiệt",
      desc: "Ông tổ chức phòng tuyến kiên cố trên sông Như Nguyệt (sông Cầu), kết hợp chướng ngại vật với lực lượng thủy bộ. Quân Tống nhiều lần tìm cách vượt sông đều bị đẩy lui, cuối cùng buộc phải chấp nhận giảng hòa và rút quân.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh cho sự kiện này, ví dụ "images/nhu-nguyet-song-cau.jpg"
      image: "",
      imageFallback: makeArt(
        "Phòng tuyến|Như Nguyệt",
        "1077",
        800,
        600,
        "gold",
      ),
    },
    {
      title: "Bài thơ thần Nam Quốc Sơn Hà",
      year: "1077",
      figures: "Lý Thường Kiệt (tương truyền)",
      desc: 'Giữa đêm tại phòng tuyến Như Nguyệt, bài thơ "Nam quốc sơn hà Nam đế cư, tiệt nhiên định phận tại thiên thư" được cho là đã vang lên để khích lệ tinh thần binh sĩ và khẳng định chủ quyền lãnh thổ của nước Nam.',
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh cho sự kiện này, ví dụ "images/van-mieu.jpg"
      image: "",
      imageFallback: makeArt(
        "Nam Quốc Sơn Hà",
        "Bài thơ thần, 1077",
        800,
        600,
        "gold",
      ),
    },
    {
      title: "Trấn giữ vùng biên ải phía Bắc",
      year: "Sau 1077",
      figures: "Lý Thường Kiệt",
      desc: "Sau chiến thắng chống Tống, Lý Thường Kiệt tiếp tục được triều đình tin dùng, đảm nhiệm các trọng trách quân sự và trấn giữ vùng biên giới phía Bắc, góp phần giữ ổn định cho thời kỳ thịnh trị của nhà Lý.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh cho sự kiện này, ví dụ "images/chua-mot-cot.jpg"
      image: "",
      imageFallback: makeArt("Biên ải|phía Bắc", "Sau 1077", 800, 600, "jade"),
    },
    {
      title: "Chiến thắng Bạch Đằng lần thứ ba",
      year: "1288",
      figures: "Trần Hưng Đạo",
      desc: "Vận dụng lại chiến thuật đóng cọc từng dùng bởi Ngô Quyền, Trần Hưng Đạo chỉ huy quân dân nhà Trần tiêu diệt và bắt sống phần lớn đạo quân Ô Mã Nhi, đánh bại hoàn toàn cuộc xâm lược lần thứ ba của đế quốc Nguyên Mông.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh cho sự kiện này, ví dụ "images/bach-dang-coc.jpg"
      image: "",
      imageFallback: makeArt(
        "Bạch Đằng 1288",
        "Trần Hưng Đạo",
        800,
        600,
        "red",
      ),
    },
    {
      title: "Khởi nghĩa Lam Sơn toàn thắng",
      year: "1418 – 1427",
      figures: "Lê Lợi, Nguyễn Trãi",
      desc: "Sau mười năm kháng chiến gian khổ, các chiến thắng quyết định tại Chi Lăng – Xương Giang đã buộc quân Minh phải rút quân về nước, mở ra triều đại Hậu Lê với bản Bình Ngô đại cáo tuyên bố nền độc lập.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh cho sự kiện này, ví dụ "images/chi-lang.jpg"
      image: "",
      imageFallback: makeArt(
        "Lam Sơn toàn thắng",
        "1418 – 1427",
        800,
        600,
        "jade",
      ),
    },
    {
      title: "Đại phá quân Thanh — Ngọc Hồi Đống Đa",
      year: "1789",
      figures: "Quang Trung – Nguyễn Huệ",
      desc: "Chỉ trong 5 ngày Tết Kỷ Dậu, quân Tây Sơn dưới sự chỉ huy thần tốc của vua Quang Trung đã đánh tan 29 vạn quân Thanh xâm lược, giải phóng kinh thành Thăng Long.",
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh cho sự kiện này, ví dụ "images/dong-da.jpg"
      image: "",
      imageFallback: makeArt("Ngọc Hồi|Đống Đa", "1789", 800, 600, "red"),
    },
    {
      title: "Chiến dịch Điện Biên Phủ",
      year: "1954",
      figures: "Chủ tịch Hồ Chí Minh, Đại tướng Võ Nguyên Giáp",
      desc: 'Sau 56 ngày đêm "khoét núi, ngủ hầm", quân đội Việt Nam giành thắng lợi hoàn toàn trước quân đội viễn chinh Pháp, buộc Pháp ký Hiệp định Genève, chấm dứt chiến tranh Đông Dương lần thứ nhất.',
      // THÊM ẢNH TẠI ĐÂY: dán đường dẫn ảnh cho sự kiện này, ví dụ "images/dien-bien-phu.jpg"
      image: "",
      imageFallback: makeArt("Điện Biên Phủ", "1954", 800, 600, "jade"),
    },
  ];

  // Dữ liệu thư viện ảnh (section 8) — thêm/bớt phần tử để thay đổi số lượng ảnh hiển thị
  const galleryData = [
    {
      src: "images/ly-thuong-kiet.jpg",
      fallback: makeArt("Lý Thường|Kiệt", "1019 – 1105", 500, 650, "gold"),
      caption: "Chân dung minh họa danh tướng Lý Thường Kiệt (1019 – 1105)",
    },
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0I7PHOE_P_zBP7BHHqtKQtPnKo1BcZrZLYFFxWTmhBA&s=10",
      fallback: makeArt(
        "Đền thờ|Lý Thường Kiệt",
        "Tưởng niệm",
        500,
        550,
        "jade",
      ),
      caption: "Đền thờ và tượng đài tưởng niệm Lý Thường Kiệt",
    },
    {
      src: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_BHRGO9WQ5DUhct2tPb4GKgTQ8TN2c2SNBNHiCJEPJlsGzi846aXOro8&s=10",
      fallback: makeArt("Ung – Khâm|– Liêm", "1075", 800, 600, "red"),
      caption: "Chiến dịch đánh các châu Ung – Khâm – Liêm (1075)",
    },
    // THÊM ẢNH TẠI ĐÂY: sao chép khối dưới rồi sửa src + caption để thêm ảnh mới
    // {
    //   src: "images/ten-file-anh-cua-ban.jpg",
    //   fallback: makeArt("Tiêu đề|ảnh", "Phụ đề", 500, 500, "gold"),
    //   caption: "Chú thích cho ảnh mới",
    // },
  ];

  // Trích dẫn lịch sử — CHỈ dùng câu nói có nguồn xác thực, không tự bịa
  const quotesData = [
    {
      text: "Nam quốc sơn hà Nam đế cư, tiệt nhiên định phận tại thiên thư.",
      author: "Lý Thường Kiệt (tương truyền)",
      source: 'Bài thơ thần "Nam quốc sơn hà", thế kỷ XI',
    },
    {
      text: "Như hà nghịch lỗ lai xâm phạm, Nhữ đẳng hành khan thủ bại hư.",
      author: "Lý Thường Kiệt (tương truyền)",
      source: 'Bài thơ thần "Nam quốc sơn hà", thế kỷ XI',
    },
    {
      text: "Ta thà làm quỷ nước Nam, chứ không thèm làm vương đất Bắc.",
      author: "Trần Bình Trọng",
      source: "Đại Việt Sử ký Toàn thư",
    },
    {
      text: "Đánh cho để dài tóc, đánh cho để đen răng, đánh cho nó chích luân bất phản.",
      author: "Vua Quang Trung",
      source: "Chiếu xuất quân, năm 1788",
    },
    {
      text: "Không có gì quý hơn độc lập, tự do.",
      author: "Chủ tịch Hồ Chí Minh",
      source: "Lời kêu gọi toàn quốc, ngày 17/7/1966",
    },
  ];

  /* =====================================================================
     2. LOADING SCREEN
     Ẩn màn hình loading sau khi trang đã tải xong, tạo cảm giác
     "mở cửa" bước vào bảo tàng số.
  ===================================================================== */
  const loadingScreen = document.getElementById("loading-screen");
  function hideLoadingScreen() {
    loadingScreen.classList.add("hidden");
  }
  window.addEventListener("load", () => {
    setTimeout(hideLoadingScreen, 900); // giữ đủ lâu để thấy hiệu ứng thanh chạy
  });
  // Lưới an toàn: nếu sự kiện load không bao giờ bắn (ảnh lỗi, tài nguyên treo),
  // vẫn ẩn màn hình loading để người xem không bị chặn.
  setTimeout(hideLoadingScreen, 4000);

  /* ---------------------------------------------------------------------
     Ảnh nền & chân dung dùng SVG tự tạo (không phụ thuộc mạng).
     Muốn dùng ảnh thật: thay style.backgroundImage / src bằng URL ảnh của bạn.
  --------------------------------------------------------------------- */
  const heroBg = document.querySelector(".hero-bg");
  if (heroBg) {
    heroBg.style.backgroundImage = `url(${makeArt(
      "Phòng tuyến|Như Nguyệt",
      "Sông Cầu · 1077",
      1600,
      900,
      "gold",
    )})`;
  }

  // Ảnh chân dung phần giới thiệu: dùng ảnh thật đặt trong test2/images/.
  // Nếu file ảnh không tải được (thiếu file, sai đường dẫn), tự động thay
  // bằng ảnh SVG tự tạo để khung giới thiệu không bị trống.
  const introPortrait = document.getElementById("intro-portrait");
  if (introPortrait) {
    introPortrait.addEventListener("error", () => {
      introPortrait.src = makeArt(
        "Lý Thường|Kiệt",
        "1019 – 1105",
        700,
        900,
        "gold",
      );
    });
  }

  // Ảnh bìa cho các thẻ video (dạng liên kết) — cũng dùng SVG tự chứa
  document.querySelectorAll(".video-link").forEach((el) => {
    el.style.backgroundImage = `url(${makeArt(
      el.dataset.artTitle || "Lý Thường Kiệt",
      el.dataset.artSub || "",
      800,
      450,
      el.dataset.artHue || "gold",
    )})`;
  });

  const quoteBgEl = document.querySelector(".quote-bg");
  if (quoteBgEl) {
    quoteBgEl.style.backgroundImage = `url(${makeArt(
      "Nam Quốc Sơn Hà",
      "Bài thơ thần, 1077",
      1600,
      900,
      "red",
    )})`;
  }

  /* =====================================================================
     3. HEADER SCROLL + MOBILE MENU + ACTIVE NAV LINK
  ===================================================================== */
  const header = document.getElementById("header");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("nav-links");
  const navLinkItems = document.querySelectorAll(".nav-link");
  const backToTopBtn = document.getElementById("back-to-top");

  window.addEventListener("scroll", () => {
    // Đổi nền header khi cuộn xuống
    header.classList.toggle("scrolled", window.scrollY > 60);
    // Hiện/ẩn nút back-to-top
    backToTopBtn.classList.toggle("show", window.scrollY > 600);
  });

  // Mở / đóng menu mobile khi bấm hamburger
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("open");
  });

  // Đóng menu mobile khi chọn một mục
  navLinkItems.forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      navLinks.classList.remove("open");
    });
  });

  // Highlight mục menu tương ứng với section đang hiển thị trên màn hình
  const sectionsForNav = document.querySelectorAll(
    "main section[id], .quote-section[id]",
  );
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
     (html { scroll-behavior: smooth } trong CSS đã lo phần lớn việc này;
     đoạn dưới đây bổ sung việc bù trừ chiều cao header cố định)
  ===================================================================== */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const headerHeight = header.offsetHeight;
      const top =
        target.getBoundingClientRect().top +
        window.pageYOffset -
        headerHeight +
        1;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  /* =====================================================================
     5. HIỆU ỨNG PARTICLES TRONG HERO (canvas)
     Vẽ các hạt sáng nhỏ (tượng trưng cho tàn lửa/ánh sáng) bay lên nhẹ
     nhàng trong khu vực hero, tạo chiều sâu và không khí "sử thi".
  ===================================================================== */
  const canvas = document.getElementById("particles-canvas");
  const ctx = canvas.getContext("2d");
  let particles = [];

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
    }));
  }

  function animateParticles() {
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
      ctx.fillStyle = `rgba(201, 162, 39, ${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(animateParticles);
  }

  if (canvas) {
    resizeCanvas();
    createParticles();
    animateParticles();
    window.addEventListener("resize", () => {
      resizeCanvas();
      createParticles();
    });
  }

  /* =====================================================================
     6. RENDER CÁC ANH HÙNG + MODAL TIỂU SỬ
  ===================================================================== */
  const heroesGrid = document.getElementById("heroes-grid");
  const heroModal = document.getElementById("hero-modal");
  const modalContent = document.getElementById("modal-content");
  const modalClose = document.getElementById("modal-close");

  // Tạo thẻ (card) cho từng nhân vật dựa trên heroesData
  heroesData.forEach((hero, index) => {
    const card = document.createElement("article");
    card.className = `hero-card reveal-on-scroll${hero.isMain ? " hero-card-main" : ""}`;
    card.style.transitionDelay = `${(index % 3) * 0.12}s`;

    // Nếu chưa có ảnh (image rỗng), dùng luôn ảnh SVG dự phòng làm nguồn,
    // để thẻ vẫn hiển thị khung có tiêu đề thay vì ô ảnh trống.
    const heroImgSrc = hero.image || hero.imageFallback || "";

    card.innerHTML = `
      <div class="hero-card-img">
        <img src="${heroImgSrc}" data-fallback="${hero.imageFallback || ""}" alt="${hero.name}">
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

  // Mở modal khi bấm "Xem tiểu sử"
  heroesGrid.addEventListener("click", (e) => {
    const btn = e.target.closest(".hero-card-btn");
    if (!btn) return;
    const hero = heroesData[btn.dataset.index];

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
    heroModal.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  function closeHeroModal() {
    heroModal.classList.remove("active");
    document.body.style.overflow = "";
  }
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
      <h3 class="timeline-name">${item.name}</h3>
      <p class="timeline-detail">${item.detail}</p>
    `;
    timelineWrap.appendChild(el);
  });

  // Nhấn vào tên hoặc chấm tròn để mở/đóng phần chi tiết của mốc đó
  timelineWrap.addEventListener("click", (e) => {
    const item = e.target.closest(".timeline-item");
    if (!item) return;
    const detail = item.querySelector(".timeline-detail");
    const dot = item.querySelector(".timeline-dot");
    detail.classList.toggle("open");
    dot.classList.toggle("active");
  });

  /* =====================================================================
     8. RENDER SỰ KIỆN LỊCH SỬ
  ===================================================================== */
  const eventsList = document.getElementById("events-list");

  eventsData.forEach((ev, index) => {
    const el = document.createElement("article");
    el.className = `event-item reveal-on-scroll ${index % 2 === 1 ? "reverse" : ""}`;
    // Nếu chưa có ảnh (image rỗng), dùng luôn ảnh SVG dự phòng làm nguồn.
    const evImgSrc = ev.image || ev.imageFallback || "";

    el.innerHTML = `
      <div class="event-image">
        <img src="${evImgSrc}" data-fallback="${ev.imageFallback || ""}" alt="${ev.title}">
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
     9. RENDER THƯ VIỆN ẢNH + LIGHTBOX
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
    el.innerHTML = `
      <img src="${item.src}" data-fallback="${item.fallback || item.src}" alt="${item.caption}" loading="lazy">
      <div class="gallery-overlay"><p>${item.caption}</p></div>
    `;
    galleryGrid.appendChild(el);
  });

  // Sau khi cả 3 khối (anh hùng, sự kiện, thư viện) đã render xong, gắn ảnh
  // thật nếu có file trong images/, nếu thiếu thì tự thay bằng ảnh SVG dự phòng.
  applyImageFallbacks();

  function openLightbox(index) {
    currentImageIndex = index;
    const item = galleryData[index];
    lightboxImg.dataset.swapped = "0";
    lightboxImg.addEventListener("error", () => {
      if (lightboxImg.dataset.swapped === "1") return;
      lightboxImg.dataset.swapped = "1";
      lightboxImg.src = item.fallback || item.src;
    });
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
     10. TRÍCH DẪN LỊCH SỬ (luân phiên + hiệu ứng chữ + parallax)
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
          `<span class="word" style="animation-delay:${i * 0.05}s">${word}</span>`,
      )
      .join(" ");

    quoteContent.innerHTML = `
      <p class="quote-text">${wordsHTML}</p>
      <p class="quote-author">— ${q.author}</p>
      <p class="quote-source">${q.source}</p>
      <div class="quote-dots">
        ${quotesData.map((_, i) => `<span class="quote-dot ${i === index ? "active" : ""}" data-index="${i}"></span>`).join("")}
      </div>
    `;
  }

  function nextQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotesData.length;
    renderQuote(currentQuoteIndex);
  }

  function startQuoteRotation() {
    clearInterval(quoteTimer);
    quoteTimer = setInterval(nextQuote, 6000); // đổi trích dẫn mỗi 6 giây
  }

  renderQuote(currentQuoteIndex);
  startQuoteRotation();

  // Cho phép bấm vào chấm tròn để chọn trích dẫn thủ công
  quoteContent.addEventListener("click", (e) => {
    const dot = e.target.closest(".quote-dot");
    if (!dot) return;
    currentQuoteIndex = Number(dot.dataset.index);
    renderQuote(currentQuoteIndex);
    startQuoteRotation(); // reset lại đồng hồ đếm sau khi người dùng tự chọn
  });

  // Hiệu ứng parallax nhẹ cho ảnh nền phần trích dẫn khi cuộn qua
  window.addEventListener("scroll", () => {
    if (!quoteSection) return;
    const rect = quoteSection.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const offset = rect.top * 0.15;
      quoteBg.style.transform = `translateY(${offset}px)`;
    }
  });

  /* =====================================================================
     11. SCROLL REVEAL DÙNG CHUNG (IntersectionObserver)
     Áp dụng cho mọi phần tử có class .reveal-on-scroll và .timeline-item,
     kể cả những phần tử vừa được tạo động ở các bước trên.
  ===================================================================== */
  const revealTargets = document.querySelectorAll(
    ".reveal-on-scroll, .timeline-item",
  );

  function revealAll() {
    revealTargets.forEach((el) => el.classList.add("in-view"));
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

    // Lưới an toàn: nếu vì lý do nào đó observer không chạy (trang in,
    // mở trong khung ẩn, trình duyệt cũ), vẫn hiện toàn bộ nội dung.
    window.setTimeout(() => {
      revealTargets.forEach((el) => {
        const style = getComputedStyle(el);
        if (style.opacity === "0" && !el.classList.contains("in-view")) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add("in-view");
          }
        }
      });
    }, 1200);
  } else {
    // Trình duyệt không hỗ trợ IntersectionObserver: hiện tất cả ngay.
    revealAll();
  }

  /* =====================================================================
     12. COUNTER ANIMATION (số liệu trong phần giới thiệu)
  ===================================================================== */
  const statNumbers = document.querySelectorAll(".stat-number");

  function animateCounter(el) {
    const target = Number(el.dataset.target);
    const duration = 1600;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutQuad để số chạy chậm dần về cuối, mượt hơn tuyến tính
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
     13. NÚT BACK TO TOP
  ===================================================================== */
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Cập nhật năm hiện tại ở footer
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
