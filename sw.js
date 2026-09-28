// =====================================================
// 서비스 워커: 앱 파일을 폰에 저장(캐시)해 두어 인터넷 없이도 열리게 함
// 동작 방식: 인터넷이 되면 항상 최신 파일을 먼저 가져오고,
//           안 되면 폰에 저장해 둔 사본으로 엶
// =====================================================

const CACHE = "pc-repair-v4"; // 코드를 고치면 숫자를 올려야 폰에 새 코드가 반영됨

// 처음 설치할 때 미리 저장해 둘 파일들 (엑셀 도구 포함)
const FILES = [
  "./",
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js",
];

// 설치: 파일들을 저장소에 넣음
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

// 활성화: 이름이 다른 옛날 저장소는 지움
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 파일 요청: 인터넷에서 새 파일을 먼저 받고(받은 건 저장), 안 되면 저장된 것 사용
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then((r) => r || caches.match("index.html")))
  );
});
