// =====================================================
// PC 유지보수 기록 - 동작(기능) 코드
// 기록은 폰 브라우저 안의 저장소(IndexedDB)에 보관됩니다.
// → 같은 휴대폰, 같은 브라우저(또는 홈 화면 앱)에서 열면 기록이 남아 있어요.
// =====================================================


// =====================================================
// ★ 선택지 목록 (여기만 고치면 드롭다운·버튼이 바뀝니다) ★
// 항목을 추가하려면 따옴표로 감싸고 쉼표(,)로 구분해서 넣으세요.
// =====================================================

// 부서 목록 (적은 순서대로 드롭다운에 나옴)
//   ["묶음 이름", [부서들]] → 드롭다운에서 묶음 제목 아래에 모여 보임
//   ["", [부서들]]          → 묶음 없이 하나씩 보임
const DEPT_GROUPS = [
  ["", ["비서실", "자치행정담당관"]],
  ["기획재정국", ["기획재정국", "기획예산과", "허가민원과", "복지정책과", "세무회계과", "스마트교통과"]],
  ["관광경제국", ["관광경제국", "관광문화과", "경제에너지과", "교육체육과", "해양수산과", "삭도추진단"]],
  ["도시안전국", ["도시안전국", "도시계획과", "건설과", "재난안전과", "산림녹지과", "환경과"]],
  ["보건소", ["보건소", "보건정책과", "건강관리과"]],
  ["농업기술센터", ["농업기술센터", "농정축산과", "농촌개발과", "기술지원과"]],
  ["", ["상하수도사업소", "육아지원센터", "양양읍", "서면", "손양면", "현북면", "현남면", "강현면", "양양군의회"]],
];

// 부서별 장소 목록 (부서를 고르면 "장소" 칸에 나옴, 안 골라도 저장됨)
// 여기에 없는 부서는 장소를 직접 입력하는 칸만 나옴
const PLACES = {
  관광문화과: ["수영장", "선사유적박물관"],
  교육체육과: ["사이클경기장", "실내체육관", "국민체육센터", "생활체육센터", "종합운동장", "볼링장"],
  건강관리과: [
    "서면보건지소", "손양면보건지소", "현북면보건지소", "현남면보건지소", "강현면보건지소",
    "서림보건진료소", "수산보건진료소", "어성전보건진료소", "입암보건진료소", "석교보건진료소",
  ],
};

// 대상별 증상·조치사항 버튼 목록
// ("기타" 대상은 여기에 없으므로 버튼 없이 직접 입력칸만 나옴)
const OPTIONS = {
  PC: {
    symptoms: [
      "부팅안됨", "전원안들어옴", "블루스크린", "무한재부팅", "PC느림",
      "문서안열림", "한글안열림", "엑셀오류", "인터넷안됨", "특정사이트접속안됨",
      "메신저안됨", "비밀번호분실", "윈도우재설치요청", "정품인증",
    ],
    actions: [
      "메모리카드 탈부착", "메인보드 초기화", "전원케이블 교체/재장착", "중고파워 교체",
      "중고PC 교체", "윈도우11 설치", "프로그램 정리", "보안프로그램 설치",
      "한글 재설치", "엑셀 재설치", "정품인증", "인터넷옵션 변경",
      "연결프로그램 변경", "내PC지킴이 실행", "IP 입력", "비밀번호 초기화",
      "메신저 삭제 후 재설치", "재부팅 후 정상",
    ],
  },
  모니터: {
    symptoms: [
      "화면안나옴", "화면떨림/깜빡임", "듀얼모니터 한쪽안나옴", "모니터안켜짐",
      "화면에 줄감", "모니터 추가/교체요청",
    ],
    actions: [
      "모니터케이블 탈부착", "모니터케이블 교체", "전원케이블 교체", "VGA카드 교체",
      "드라이버 설치", "중고모니터 교체", "중고모니터 추가설치",
    ],
  },
};

// 구분이 H/W(하드웨어)로 자동 선택되는 PC 증상 (나머지 PC 증상은 S/W, 모니터·기타는 H/W)
const HW_SYMPTOMS = ["부팅안됨", "전원안들어옴", "블루스크린", "무한재부팅"];

// 엑셀 보고서 표지의 결재란 (사람이 바뀌면 여기만 고치세요)
const APPROVERS = [
  ["점검", "완컴", "최승완"],
  ["검토", "양양군", "김효근"],
  ["검토", "양양군", "양희성"],
  ["확인", "양양군", "이기선"],
];
const REPORT_TITLE = "양양군청 행정업무용 PC 유지보수 내역";
const MIN_ROWS = 30; // 내역표 한 장의 최소 줄 수 (모자라면 빈 줄로 채움)

// "기타(직접입력)" 버튼을 뜻하는 특별한 값 (목록 맨 끝에 붙음)
const ETC = "__etc__";

// 예전 버전이 localStorage에 저장하던 이름표 (처음 한 번 IndexedDB로 옮길 때만 사용)
const STORAGE_KEY = "pcRepairRecords";

// 기록을 저장하는 폰 브라우저 안 저장소(IndexedDB) 이름
const DB_NAME = "pcRepairDB";
const STORE = "records";


// =====================================================
// 화면의 요소들을 미리 찾아서 변수에 담아둠
// =====================================================
const form = document.getElementById("recordForm");
const dateInput = document.getElementById("date");
const deptSelect = document.getElementById("dept");
const placeBox = document.getElementById("placeBox");
const placeSelect = document.getElementById("place");
const placeEtc = document.getElementById("placeEtc");
const symptomBox = document.getElementById("symptomBox");
const symptomBtns = document.getElementById("symptomBtns");
const symptomEtc = document.getElementById("symptomEtc");
const actionBox = document.getElementById("actionBox");
const actionBtns = document.getElementById("actionBtns");
const actionEtc = document.getElementById("actionEtc");

const listMonth = document.getElementById("listMonth");
const listDay = document.getElementById("listDay");
const listSummary = document.getElementById("listSummary");
const recordList = document.getElementById("recordList");

const statsYear = document.getElementById("statsYear");
const statsPeriod = document.getElementById("statsPeriod");
const statsResult = document.getElementById("statsResult");

// 목록 보기 방식: "month"(월별) 또는 "day"(일별)
let listMode = "month";


// =====================================================
// 작은 도우미 함수들
// =====================================================

// 오늘 날짜를 "2026-09-23" 형태의 글자로 만들어 주는 함수
function getToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0"); // 월은 0부터 시작해서 +1
  const d = String(now.getDate()).padStart(2, "0");      // 한 자리면 앞에 0 붙이기
  return `${y}-${m}-${d}`;
}

// ----- 기록 저장소 (IndexedDB) -----
// 기록은 IndexedDB에 저장하고, 화면에서 빨리 쓰려고 메모리(cache)에도 복사해 둠
let db;
let cache = [];

// IndexedDB 열기 (처음이면 "records" 저장소를 만듦, 기록마다 id가 열쇠)
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// 저장소 작업 하나를 실행하고 끝날 때까지 기다리는 함수
//   mode: "readonly"(읽기) 또는 "readwrite"(쓰기), fn: 저장소로 할 일
function dbRun(mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req && req.result);
    tx.onerror = () => reject(tx.error);
  });
}

// 저장된 기록 전체를 돌려주는 함수 (복사본이라 정렬해도 원본은 그대로)
function loadRecords() {
  return cache.slice();
}

// 기록 하나 추가
function addRecord(record) {
  cache.push(record);
  return dbRun("readwrite", (s) => s.put(record));
}

// 기록 하나 삭제
function deleteRecord(id) {
  cache = cache.filter((r) => r.id !== id);
  return dbRun("readwrite", (s) => s.delete(id));
}

// 사용자가 입력한 글자에 <, > 같은 특수문자가 있어도
// 화면이 깨지지 않도록 안전한 글자로 바꿔 주는 함수
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 부서 드롭다운(select)에 묶음(optgroup)별로 선택지를 채워 넣는 함수
function fillDeptSelect() {
  // 맨 위 안내 문구 (값이 비어 있어서 이걸 고른 채로는 저장 안 됨)
  deptSelect.innerHTML = '<option value="">부서를 선택하세요</option>' +
    DEPT_GROUPS.map(([group, items]) => {
      const options = items.map((item) => `<option>${item}</option>`).join("");
      return group ? `<optgroup label="${group}">${options}</optgroup>` : options;
    }).join("");
}

// 부서에 맞게 장소 칸을 새로 그리는 함수 (부서를 바꾸면 장소는 초기화)
function renderPlace() {
  const list = PLACES[deptSelect.value];
  placeSelect.innerHTML = list
    ? '<option value="">선택 안 함</option>' +
      list.map((p) => `<option>${p}</option>`).join("") +
      `<option value="${ETC}">직접 입력</option>`
    : "";
  placeEtc.value = "";
  show(placeBox, !!deptSelect.value);  // 부서를 골라야 장소 칸이 나옴
  show(placeSelect, !!list);           // 목록 없는 부서는 직접 입력칸만
  show(placeEtc, !list);
}

// 고른 장소 또는 직접 입력한 장소를 꺼내는 함수 (없으면 빈 글자)
function getPlace() {
  return placeSelect.value && placeSelect.value !== ETC ? placeSelect.value : placeEtc.value.trim();
}

// 요소를 보이거나(on=true) 숨기는 함수
function show(el, on) {
  el.classList.toggle("hidden", !on);
}

// 직접 입력칸을 켜고 끄는 함수 (켤 때만 필수 입력, 끌 때는 내용 지움)
function setEtc(input, on) {
  show(input, on);
  input.required = on;
  if (!on) input.value = "";
}

// 버튼 목록 HTML 만들기 (맨 끝에 "기타(직접입력)" 버튼 추가)
//   name: "symptom" 또는 "action"
function chipsHtml(name, items) {
  return [...items, ETC].map((v) => `
    <label class="device-option">
      <input type="radio" name="${name}" value="${v}" required>
      <span>${v === ETC ? "기타(직접입력)" : v}</span>
    </label>`).join("");
}

// 고른 버튼 값 또는 직접 입력한 글자를 꺼내는 함수
function getChoice(name, etcInput) {
  const checked = form.querySelector(`input[name="${name}"]:checked`);
  return !checked || checked.value === ETC ? etcInput.value.trim() : checked.value;
}

// 대상과 증상을 보고 구분(H/W 또는 S/W)을 추측하는 함수
function guessKind(device, symptom) {
  return device === "PC" && !HW_SYMPTOMS.includes(symptom) ? "S/W" : "H/W";
}

// 구분 버튼을 선택하는 함수 (값이 없으면 선택 해제)
function setKind(value) {
  form.querySelectorAll('input[name="kind"]').forEach((r) => (r.checked = r.value === value));
}

// 대상(PC/모니터/기타)에 맞게 증상·조치사항 영역을 새로 그리는 함수
// (대상을 바꾸면 이전에 고른 증상·조치는 모두 지워짐)
function renderFlow() {
  const device = form.querySelector('input[name="device"]:checked')?.value;
  const opt = OPTIONS[device]; // "기타"거나 아직 안 골랐으면 undefined

  symptomBtns.innerHTML = opt ? chipsHtml("symptom", opt.symptoms) : "";
  actionBtns.innerHTML = opt ? chipsHtml("action", opt.actions) : "";
  // 목록이 없는 "기타"는 처음부터 직접 입력칸 2개만 보여줌
  setEtc(symptomEtc, device === "기타");
  setEtc(actionEtc, device === "기타");
  setKind(device === "기타" ? "H/W" : null);

  show(symptomBox, !!device);             // 대상을 골라야 증상이 나옴
  show(actionBox, device === "기타");     // PC·모니터는 증상을 골라야 조치가 나옴
}

// 날짜("2026-09-23")를 보고 몇 분기인지 계산 (1~3월=1분기 ...)
function getQuarter(date) {
  const month = Number(date.slice(5, 7));
  return Math.ceil(month / 3);
}

// 날짜가 그 달의 몇 주차인지 계산 (월요일 시작, 1일이 들어 있는 주 = 1주차)
function getWeek(date) {
  const offset = (new Date(date.slice(0, 8) + "01").getUTCDay() + 6) % 7; // 1일의 요일 (월=0 … 일=6)
  return Math.floor((Number(date.slice(8)) - 1 + offset) / 7) + 1;
}

// 기록의 주차 이름표 (예: "2026-7-1" = 2026년 7월 1주차)
function weekKey(r) {
  return `${r.date.slice(0, 4)}-${Number(r.date.slice(5, 7))}-${getWeek(r.date)}`;
}

// 날짜를 "07월 01일" 형태로
function shortDate(date) {
  return `${date.slice(5, 7)}월 ${date.slice(8)}일`;
}

// "부서 (장소)/이름" 형태로 만들기 (장소·이름이 없으면 빼고)
// 예전 기록에는 place가 없어도 괜찮음
function deptName(r) {
  const dept = r.place ? `${r.dept} (${r.place})` : r.dept;
  return r.userName ? `${dept}/${r.userName}` : dept;
}


// =====================================================
// 탭 메뉴 (입력 / 목록 / 통계 화면 전환)
// =====================================================
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    // 모든 탭의 선택 표시를 끄고, 누른 탭만 켬
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // 모든 화면을 숨기고, 누른 탭에 해당하는 화면만 보이기
    document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
    document.getElementById(tab.dataset.tab).classList.remove("hidden");

    // 목록/통계 화면으로 갈 때는 최신 내용으로 다시 그림
    if (tab.dataset.tab === "listPage") {
      renderList();
      fillWeekOptions();
    }
    if (tab.dataset.tab === "statsPage") {
      fillYearOptions();
      renderStats();
    }

    window.scrollTo(0, 0); // 화면 맨 위로
  });
});


// =====================================================
// [입력 화면] 저장 버튼을 눌렀을 때 실행
// =====================================================
form.addEventListener("submit", (event) => {
  // 기본 동작(페이지 새로고침)을 막음
  event.preventDefault();

  // 입력칸의 값을 모아서 기록 하나를 만듦
  const record = {
    id: Date.now(), // 지금 시각(숫자)을 고유번호로 사용
    date: dateInput.value,
    dept: deptSelect.value,
    place: getPlace(),
    userName: document.getElementById("userName").value.trim(),
    device: form.querySelector('input[name="device"]:checked').value,
    kind: form.querySelector('input[name="kind"]:checked').value,
    symptom: getChoice("symptom", symptomEtc),
    action: getChoice("action", actionEtc),
    memo: document.getElementById("memo").value.trim(),
    parts: document.getElementById("parts").value.trim(),
  };

  // 새 기록을 저장
  addRecord(record);

  // 입력칸 비우기 (날짜와 부서는 그대로 두면 같은 곳 연속 입력이 편함)
  const lastDate = dateInput.value;
  const lastDept = deptSelect.value;
  form.reset();
  dateInput.value = lastDate;
  deptSelect.value = lastDept;
  renderPlace(); // 장소는 비움
  renderFlow(); // 대상 선택이 지워졌으므로 증상·조치 영역도 숨김

  alert("저장되었습니다!");
});

// 부서를 바꾸면 장소 칸을 새로 그림
deptSelect.addEventListener("change", renderPlace);

// 장소에서 "직접 입력"을 고르면 글자 입력칸을 보임
placeSelect.addEventListener("change", () => {
  const on = placeSelect.value === ETC;
  show(placeEtc, on);
  if (on) placeEtc.focus();
  else placeEtc.value = "";
});

// 대상 버튼을 누르면 증상·조치 영역을 새로 그림
document.getElementById("deviceGroup").addEventListener("change", renderFlow);

// 증상 버튼을 누르면: "기타(직접입력)"이면 입력칸을 보이고, 조치사항 영역을 보임
symptomBtns.addEventListener("change", (e) => {
  setEtc(symptomEtc, e.target.value === ETC);
  setKind(guessKind(form.querySelector('input[name="device"]:checked').value, e.target.value));
  show(actionBox, true);
});

// 조치사항 버튼을 누르면: "기타(직접입력)"이면 입력칸을 보임
actionBtns.addEventListener("change", (e) => setEtc(actionEtc, e.target.value === ETC));


// =====================================================
// [목록 화면] 월별 / 일별 보기
// =====================================================

// 월별·일별 전환 버튼
document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    listMode = btn.dataset.mode;

    // 모드에 맞는 선택칸만 보이기
    document.getElementById("monthPicker").classList.toggle("hidden", listMode !== "month");
    document.getElementById("dayPicker").classList.toggle("hidden", listMode !== "day");
    renderList();
  });
});

// 월이나 날짜를 바꾸면 목록 다시 그리기
listMonth.addEventListener("change", renderList);
listDay.addEventListener("change", renderList);

// 기록 한 건을 HTML 글자로 만드는 함수
function recordHtml(r) {
  return `
    <div class="record">
      <div class="record-head">
        <div>
          <span class="tag">${escapeHtml(r.device)} · ${r.kind || guessKind(r.device, r.symptom)}</span>
          <span class="who">${escapeHtml(deptName(r))}</span>
        </div>
        <button class="btn-delete" data-id="${r.id}">삭제</button>
      </div>
      <p><b>증상:</b> ${escapeHtml(r.symptom)}</p>
      <p><b>조치:</b> ${escapeHtml(r.action)}</p>
      ${r.memo ? `<p><b>메모:</b> ${escapeHtml(r.memo)}</p>` : ""}
      <p><b>부품:</b> ${r.parts ? escapeHtml(r.parts) : "없음"}</p>
    </div>
  `;
}

// 기록들을 최신 날짜가 위로 오도록 정렬 (같은 날짜면 나중에 저장한 것이 위로)
function sortNewestFirst(records) {
  return records.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.id - a.id;
  });
}

// 지금 목록 화면에서 선택한 월/날짜의 기록만 골라 주는 함수
//   월별: 날짜 앞 7글자("2026-09")가 같은 것
//   일별: 날짜 전체("2026-09-23")가 같은 것
function getListRecords() {
  const records = loadRecords();
  if (listMode === "month") {
    return sortNewestFirst(records.filter((r) => r.date.slice(0, 7) === listMonth.value));
  }
  return sortNewestFirst(records.filter((r) => r.date === listDay.value));
}

// 목록을 화면에 그리는 함수
function renderList() {
  const records = getListRecords();

  // 화면에 보여줄 기간 이름 (예: "2026년 09월" 또는 "2026-09-23")
  const label = listMode === "month"
    ? listMonth.value.replace("-", "년 ") + "월"
    : listDay.value;

  listSummary.textContent = `${label} · 총 ${records.length}건`;

  // 기록이 하나도 없으면 안내 문구만 보여주고 끝
  if (records.length === 0) {
    recordList.innerHTML = '<p class="empty">기록이 없습니다.</p>';
    return;
  }

  // 날짜별로 묶기: { "2026-09-23": [기록, 기록], "2026-09-22": [기록] } 형태
  const groups = {};
  records.forEach((r) => {
    if (!groups[r.date]) groups[r.date] = [];
    groups[r.date].push(r);
  });

  // 화면에 넣을 HTML 글자를 차곡차곡 만들기
  let html = "";
  for (const date in groups) {
    const list = groups[date];
    html += `<h3 class="date-title">📅 ${date} · ${list.length}건</h3>`;
    list.forEach((r) => {
      html += recordHtml(r);
    });
  }
  recordList.innerHTML = html;
}

// 목록 안의 [삭제] 버튼을 눌렀을 때 실행
// (버튼이 계속 새로 만들어지므로 목록 전체에 한 번만 연결)
recordList.addEventListener("click", (event) => {
  // 누른 것이 삭제 버튼이 아니면 무시
  if (!event.target.classList.contains("btn-delete")) return;

  // 실수로 지우지 않도록 한 번 더 확인
  if (!confirm("이 기록을 삭제할까요?")) return;

  deleteRecord(Number(event.target.dataset.id));
  renderList();
  fillWeekOptions();
});


// =====================================================
// 엑셀(xlsx) 내보내기 - "유지보수 내역 보고" 양식
// 달마다 [표지](결재란) 시트와 [내역] 시트를 한 쌍씩 만듭니다.
// xlsx-js-style 라이브러리(index.html에서 불러온 XLSX)를 사용합니다.
// =====================================================

// 셀 서식(글꼴·정렬·테두리·배경색)을 만드는 함수
//   opt: { sz: 글자 크기, bold: 굵게, left: 왼쪽 정렬, gray: 회색 배경, noBorder: 테두리 없음 }
const LINE = { style: "thin", color: { rgb: "000000" } };
function makeStyle(opt = {}) {
  return {
    font: { name: "맑은 고딕", sz: opt.sz || 10, bold: !!opt.bold },
    alignment: { horizontal: opt.left ? "left" : "center", vertical: "center", wrapText: true },
    border: opt.noBorder ? {} : { top: LINE, bottom: LINE, left: LINE, right: LINE },
    ...(opt.gray && { fill: { patternType: "solid", fgColor: { rgb: "D9D9D9" } } }),
  };
}

// 시트의 범위(예: "A1:E3") 안 모든 칸에 서식을 입히는 함수
function setStyle(ws, ref, style) {
  const { s, e } = XLSX.utils.decode_range(ref);
  for (let r = s.r; r <= e.r; r++) {
    for (let c = s.c; c <= e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      ws[addr] = ws[addr] || { t: "s", v: "" }; // 빈 칸도 테두리를 그리려면 칸이 있어야 함
      ws[addr].s = style;
    }
  }
}

// [표지] 시트 만들기: 제목, "2026년 7월 ( )", 결재란
function coverSheet(label) {
  const rows = Array.from({ length: 23 }, () => Array(8).fill("")); // 23줄 × 8칸 빈 표
  rows[7][0] = REPORT_TITLE + " 보고";
  rows[14][0] = label;
  rows[18].splice(2, 4, "구분", "소속", "성명", "확인");
  APPROVERS.forEach((a, i) => rows[19 + i].splice(2, 3, ...a));

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!merges"] = ["A8:H8", "A15:H15"].map(XLSX.utils.decode_range); // 제목은 가로로 합치기
  ws["!cols"] = Array(8).fill({ wch: 11 });
  ws["!rows"] = rows.map((_, i) => ({ hpt: i >= 18 ? 28 : i === 7 ? 40 : 20 }));
  setStyle(ws, "A8:H8", makeStyle({ sz: 20, bold: true, noBorder: true }));
  setStyle(ws, "A15:H15", makeStyle({ sz: 14, bold: true, noBorder: true }));
  setStyle(ws, "C19:F19", makeStyle({ sz: 11, bold: true, gray: true }));
  setStyle(ws, "C20:F23", makeStyle({ sz: 11, bold: true }));
  return ws;
}

// [내역] 시트 만들기: 일자 | 부서/이름 | 구분 | 세부내용 | 처리내용
function tableSheet(label, list) {
  const rows = [
    [label, "", "", REPORT_TITLE, ""],
    ["일자", "부서 / 이름", "오류 및 증상", "", "처리 내용"],
    ["", "", "구분", "세부내용", ""],
  ];
  let lastDate = "";
  list.forEach((r) => {
    rows.push([
      r.date === lastDate ? "" : shortDate(r.date), // 날짜는 그날 첫 줄에만
      deptName(r),
      r.kind || guessKind(r.device, r.symptom), // 예전 기록은 구분이 없어서 추측
      r.symptom,
      r.action,
    ]);
    lastDate = r.date;
  });
  while (rows.length < MIN_ROWS + 3) rows.push(["", "", "", "", ""]); // 양식처럼 빈 줄 채우기

  const n = rows.length;
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!merges"] = ["A1:C1", "D1:E1", "A2:A3", "B2:B3", "C2:D2", "E2:E3"].map(XLSX.utils.decode_range);
  ws["!cols"] = [9, 18, 8, 32, 32].map((wch) => ({ wch }));
  ws["!rows"] = rows.map((_, i) => ({ hpt: i === 0 ? 36 : 22 }));
  setStyle(ws, "A1:E1", makeStyle({ sz: 14, bold: true }));
  setStyle(ws, "A2:E3", makeStyle({ sz: 11, bold: true, gray: true }));
  setStyle(ws, `A4:C${n}`, makeStyle());
  setStyle(ws, `D4:E${n}`, makeStyle({ left: true }));
  return ws;
}

// 기록들을 보고서 양식 xlsx 파일로 만들어 내려받게 하는 함수
//   fileName: 저장될 파일 이름 (예: "PC유지보수_2026년 3분기.xlsx")
function exportToExcel(records, fileName) {
  // 라이브러리를 못 불러왔으면 (인터넷 끊김 등) 안내하고 멈춤
  if (typeof XLSX === "undefined") {
    alert("엑셀 기능을 불러오지 못했습니다.\n인터넷 연결을 확인한 뒤 새로고침 해주세요.");
    return;
  }
  if (records.length === 0) {
    alert("내보낼 기록이 없습니다.");
    return;
  }

  // 1) 오래된 순으로 정렬한 뒤 월별로 묶기: { "2026-7": [기록...], ... }
  const months = {};
  sortNewestFirst(records).reverse().forEach((r) => {
    const key = `${r.date.slice(0, 4)}-${Number(r.date.slice(5, 7))}`;
    (months[key] = months[key] || []).push(r);
  });

  // 2) 달마다 표지(결재 1회) + 내역 시트를 차례로 추가
  const book = XLSX.utils.book_new();
  for (const key in months) {
    const [y, m] = key.split("-");
    const name = `${y.slice(2)}년${m}월`; // 시트 이름 (예: 26년7월)
    XLSX.utils.book_append_sheet(book, coverSheet(`${y}년 ${m}월 ( )`), `${name} 표지`);
    XLSX.utils.book_append_sheet(book, tableSheet(`${y}-${m}월 ( )`, months[key]), `${name} 내역`);
  }
  const data = XLSX.write(book, { bookType: "xlsx", type: "array" }); // 엑셀 파일 내용
  shareOrDownload(new File([data], fileName, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }));
}

// 휴대폰(안드로이드·아이폰)이면 공유 창(메일·카카오톡 등)을 열고, PC이거나 공유가 안 되면 파일로 내려받는 함수
// ※ 공유 기능은 https:// 주소로 열었을 때만 작동합니다.
async function shareOrDownload(file) {
  if (/Android|iPhone|iPad/i.test(navigator.userAgent) && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return; // 공유 성공
    } catch (e) {
      if (e.name === "AbortError") return; // 사용자가 공유 창을 닫음 → 아무것도 안 함
      // 그 밖의 오류는 아래에서 내려받기로 대신함
    }
  }
  // 내려받기: 보이지 않는 링크를 만들어 눌러 줌
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file);
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}


// =====================================================
// [목록 화면] 주차별 CSV 내보내기 (엑셀에서 열 수 있는 글자 파일)
// 항목 순서: 일자, 부서/이름, 구분, 세부내용, 처리내용
// =====================================================
const csvWeek = document.getElementById("csvWeek");

// 주차 드롭다운 채우기 (기록이 있는 주차만, 최근 주차가 위로)
function fillWeekOptions() {
  const counts = {};
  loadRecords().forEach((r) => (counts[weekKey(r)] = (counts[weekKey(r)] || 0) + 1));

  // "2026-7-1" 같은 이름표를 날짜 순서로 정렬하기 위해 숫자로 비교
  const keys = Object.keys(counts).sort((a, b) => {
    const [ay, am, aw] = a.split("-").map(Number);
    const [by, bm, bw] = b.split("-").map(Number);
    return by - ay || bm - am || bw - aw;
  });
  csvWeek.innerHTML = keys.length
    ? keys.map((k) => {
        const [y, m, w] = k.split("-");
        return `<option value="${k}">${y}년 ${m}월 ${w}주차 · ${counts[k]}건</option>`;
      }).join("")
    : '<option value="">저장된 기록 없음</option>';
}

// 쉼표·따옴표·줄바꿈이 들어 있어도 칸이 깨지지 않도록 "..."로 감싸는 함수
function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

// [CSV] 버튼: 고른 주차의 기록을 CSV 파일로 내보냄
document.getElementById("csvBtn").addEventListener("click", () => {
  const key = csvWeek.value;
  if (!key) {
    alert("내보낼 기록이 없습니다.");
    return;
  }
  const list = sortNewestFirst(loadRecords().filter((r) => weekKey(r) === key)).reverse(); // 오래된 순

  const rows = [["일자", "부서/이름", "구분", "세부내용", "처리내용"]];
  list.forEach((r) => {
    rows.push([shortDate(r.date), deptName(r), r.kind || guessKind(r.device, r.symptom), r.symptom, r.action]);
  });

  // 맨 앞 ﻿(BOM)는 엑셀이 한글을 깨뜨리지 않게 하는 표시
  const csv = "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const [y, m, w] = key.split("-");
  shareOrDownload(new File([csv], `PC유지보수_${y}년${m}월${w}주차.csv`, { type: "text/csv" }));
});

// [이 목록 엑셀로] 버튼: 지금 화면에 보이는 월/날짜의 기록만 내보냄
document.getElementById("exportBtn").addEventListener("click", () => {
  const period = listMode === "month" ? listMonth.value : listDay.value;
  exportToExcel(getListRecords(), `PC유지보수_${period}.xlsx`);
});

// [전체 기록 엑셀로] 버튼: 저장된 모든 기록을 내보냄
document.getElementById("exportAllBtn").addEventListener("click", () => {
  exportToExcel(loadRecords(), `PC유지보수_전체_${getToday()}.xlsx`);
});

// [이 기간 보고서 엑셀로] 버튼 (통계 화면): 고른 연도·분기·월의 기록을 내보냄
document.getElementById("exportStatsBtn").addEventListener("click", () => {
  const { records, label } = getStatsRecords();
  exportToExcel(records, `PC유지보수_${label}.xlsx`);
});


// =====================================================
// [통계 화면] 연도별 / 분기별 / 월별 통계
// =====================================================

// 연도 드롭다운 채우기 (올해 + 기록이 있는 연도들)
function fillYearOptions() {
  const years = new Set([Number(getToday().slice(0, 4))]);
  loadRecords().forEach((r) => years.add(Number(r.date.slice(0, 4))));

  const selected = statsYear.value; // 이미 고른 연도는 유지
  const sorted = [...years].sort((a, b) => b - a); // 최근 연도가 위로
  statsYear.innerHTML = sorted.map((y) => `<option value="${y}">${y}년</option>`).join("");
  if (selected) statsYear.value = selected;
}

// 기간 드롭다운 채우기: 연간 전체 / 1~4분기 / 1~12월
function fillPeriodOptions() {
  let html = '<option value="year">연간 전체</option>';
  for (let q = 1; q <= 4; q++) {
    html += `<option value="q${q}">${q}분기</option>`;
  }
  for (let m = 1; m <= 12; m++) {
    html += `<option value="m${m}">${m}월</option>`;
  }
  statsPeriod.innerHTML = html;
}

// 목록에서 항목별 건수를 세는 함수
//   예: countBy(기록들, "dept") → [["총무과", 5], ["세무회계과", 3], ...] (많은 순)
function countBy(records, key) {
  const counts = {};
  records.forEach((r) => {
    counts[r[key]] = (counts[r[key]] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

// 막대그래프 HTML을 만드는 함수
function barChartHtml(title, rows) {
  let html = `<h3 class="stats-title">${title}</h3>`;
  if (rows.length === 0) {
    return html + '<p class="empty">자료 없음</p>';
  }
  const max = Math.max(...rows.map((row) => row[1])); // 가장 큰 값 = 막대 100%
  rows.forEach(([name, count]) => {
    // 막대 길이(%) 계산. 0건은 막대 없음, 1건 이상은 최소 3%로 보이게
    const percent = count ? Math.max((count / max) * 100, 3) : 0;
    html += `
      <div class="bar-row">
        <span class="bar-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
        <span class="bar-count">${count}건</span>
      </div>
    `;
  });
  return html;
}

// 통계 화면에서 고른 연도·기간의 기록과 기간 이름을 돌려주는 함수
function getStatsRecords() {
  const year = statsYear.value;
  const period = statsPeriod.value;

  // 1) 선택한 연도의 기록만 남김
  let records = loadRecords().filter((r) => r.date.slice(0, 4) === year);

  // 2) 분기 또는 월을 골랐으면 한 번 더 거름
  let label = `${year}년 전체`;
  if (period.startsWith("q")) {
    const q = Number(period.slice(1));
    records = records.filter((r) => getQuarter(r.date) === q);
    label = `${year}년 ${q}분기`;
  } else if (period.startsWith("m")) {
    const m = Number(period.slice(1));
    records = records.filter((r) => Number(r.date.slice(5, 7)) === m);
    label = `${year}년 ${m}월`;
  }
  return { records, label };
}

// 통계를 화면에 그리는 함수
function renderStats() {
  const period = statsPeriod.value;
  const { records, label } = getStatsRecords();

  // 결과 HTML 만들기
  let html = `
    <div class="stats-total">
      ${label} 처리 건수
      <strong>${records.length}건</strong>
    </div>
  `;

  // 연간/분기 통계일 때는 월별 건수 추이도 보여줌
  if (!period.startsWith("m")) {
    const months = period === "year"
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      : [1, 2, 3].map((i) => (Number(period.slice(1)) - 1) * 3 + i);
    const monthRows = months.map((m) => [
      `${m}월`,
      records.filter((r) => Number(r.date.slice(5, 7)) === m).length,
    ]);
    html += barChartHtml("📅 월별 건수", records.length ? monthRows : []);
  }

  html += barChartHtml("🏢 부서별 발생 순위", countBy(records, "dept"));
  html += barChartHtml("⚠️ 증상별 발생 순위", countBy(records, "symptom"));
  html += barChartHtml("💻 대상별", countBy(records, "device"));
  html += barChartHtml("🔧 조치사항별", countBy(records, "action"));

  statsResult.innerHTML = html;
}

// 연도나 기간을 바꾸면 통계 다시 그리기
statsYear.addEventListener("change", renderStats);
statsPeriod.addEventListener("change", renderStats);


// =====================================================
// 페이지가 처음 열릴 때 실행
// =====================================================
fillDeptSelect();
renderPlace();
renderFlow();
fillPeriodOptions();

// 저장소(IndexedDB)를 열고 기록을 불러옴
async function init() {
  db = await openDB();

  // 예전 버전(localStorage)에 기록이 있으면 IndexedDB로 한 번만 옮김
  // 예전 모바일 버전은 이름을 ext, 대상을 target 으로 저장했으므로
  // 원래 항목은 그대로 두고 userName, device 를 채워 넣어 옮김
  const old = localStorage.getItem(STORAGE_KEY);
  if (old) {
    await dbRun("readwrite", (s) => JSON.parse(old).forEach((r) => {
      if (r.userName === undefined && r.ext !== undefined) r.userName = r.ext;
      if (r.device === undefined && r.target !== undefined) r.device = r.target;
      s.put(r);
    }));
    // 혹시 몰라 지우지 않고 백업 이름으로 바꿔 둠 (다시 옮겨지지는 않음)
    localStorage.setItem(STORAGE_KEY + "_backup", old);
    localStorage.removeItem(STORAGE_KEY);
  }

  cache = await dbRun("readonly", (s) => s.getAll());
  fillYearOptions();

  // 저장 공간이 부족할 때 브라우저가 기록을 지우지 않도록 요청
  navigator.storage?.persist?.();
}
init();

// 오프라인에서도 작동하도록 서비스 워커(sw.js) 등록
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

dateInput.value = getToday();            // 날짜칸에 오늘 날짜 자동 입력
listMonth.value = getToday().slice(0, 7); // 목록 월 선택칸에 이번 달
listDay.value = getToday();               // 목록 날짜 선택칸에 오늘
statsPeriod.value = "m" + Number(getToday().slice(5, 7)); // 통계는 이번 달부터
