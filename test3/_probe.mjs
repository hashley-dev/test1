const name =
  "T%C6%B0%E1%BB%A3ng_%C4%91%C3%A0i_Quang_Trung_t%E1%BA%A1i_B%E1%BA%A3o_t%C3%A0ng_Quang_Trung.JPG";

const candidates = {
  "hash-b7 (ban gui)": `https://upload.wikimedia.org/wikipedia/commons/b7/${name}`,
  "hash-b7 (Wikimedia API tra ve)": `https://upload.wikimedia.org/wikipedia/commons/b7/${name}`,
};

const out = [];
for (const [label, url] of Object.entries(candidates)) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const buf = new Uint8Array(await res.arrayBuffer());
    let w = null,
      h = null;
    for (let p = 2; p < buf.length - 9; ) {
      if (buf[p] !== 0xff) {
        p++;
        continue;
      }
      const len = (buf[p + 2] << 8) | buf[p + 3];
      const m = buf[p + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8) {
        h = (buf[p + 5] << 8) | buf[p + 6];
        w = (buf[p + 7] << 8) | buf[p + 8];
        break;
      }
      p += 2 + len;
    }
    out.push({
      label,
      status: res.status,
      ctype: res.headers.get("content-type"),
      kb: Math.round(buf.length / 1024),
      size: w && h ? `${w}x${h}` : "?",
      ratio: w && h ? +(w / h).toFixed(3) : null,
    });
  } catch (e) {
    out.push({ label, error: String(e) });
  }
}
console.log(JSON.stringify(out, null, 2));
