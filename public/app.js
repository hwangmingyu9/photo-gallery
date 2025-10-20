// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import {
  getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDycTuXpS0bbAmcKi8UWIeGVwCltd6K6Tk",
  authDomain: "photo-gallery-676d1.firebaseapp.com",
  projectId: "photo-gallery-676d1",
  storageBucket: "photo-gallery-676d1.firebasestorage.app",
  messagingSenderId: "379643266189",
  appId: "1:379643266189:web:63c6e7feacc69e24d54ec4"
};

// 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// 요소
const fileInput   = document.getElementById("file-input");
const dateInput   = document.getElementById("date-input");
const uploadBtn   = document.getElementById("upload-btn");
const deleteBtn   = document.getElementById("delete-btn");
const gallery     = document.getElementById("gallery");
const albumTitle  = document.getElementById("album-title");
const navBtns     = document.querySelectorAll(".nav-btn");
const memoSection = document.getElementById("memo-section");
const uploadSection = document.getElementById("upload-section");
const memoText    = document.getElementById("memo-text");
const memoSaveBtn = document.getElementById("memo-save-btn");
const memoList    = document.getElementById("memo-list");
const uploaderRow = document.getElementById("uploader-row");

// 업로더 라디오
let uploader = null;
const setUploaderHandlers = () => {
  document.querySelectorAll('input[name="uploader"]').forEach(r => {
    r.addEventListener('change', e => {
      uploader = e.target.value;
    });
  });
};
setUploaderHandlers();

// 앨범/컬렉션 맵
const ALBUMS = {
  home:   { title: "홈",            canUpload: false, showDelete: false, needsUploader: false, collection: null, folder: null },
  all:    { title: "모든 사진",     canUpload: false, showDelete: true,  needsUploader: false, collection: "ALL", folder: null },
  date:   { title: "데이트",        canUpload: true,  showDelete: true,  needsUploader: true,  collection: "date_photos",   folder: "date" },
  mingyu: { title: "민규",          canUpload: true,  showDelete: true,  needsUploader: true,  collection: "mingyu_photos", folder: "mingyu" },
  yoonjung:{title: "윤정",          canUpload: true,  showDelete: true,  needsUploader: true,  collection: "yoonjung_photos",folder: "yoonjung" },
  shared: { title: "공용",          canUpload: true,  showDelete: true,  needsUploader: false, collection: "shared_photos", folder: "shared" },
  memo:   { title: "메모",          canUpload: false, showDelete: false, needsUploader: false, collection: "memo_notes",    folder: null },
};

const PHOTO_COLLECTIONS = ["date_photos","mingyu_photos","yoonjung_photos","shared_photos"];

// 마지막 앨범 복원
let currentAlbum = localStorage.getItem("currentAlbum") || "home";
applyAlbumUI(currentAlbum);
bindAlbumListeners(currentAlbum);

// 앨범 버튼 클릭
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.album;
    switchAlbum(next);
  });
});

function switchAlbum(albumKey) {
  currentAlbum = albumKey;
  localStorage.setItem("currentAlbum", currentAlbum);
  applyAlbumUI(albumKey);
  bindAlbumListeners(albumKey);
}

// UI 적용
function applyAlbumUI(albumKey) {
  const meta = ALBUMS[albumKey];
  albumTitle.textContent = meta.title;

  // 홈/메모/모든사진에서 업로드 영역 숨김 제어
  uploadSection.classList.toggle("hidden", !meta.canUpload);
  // 홈에서는 삭제 버튼도 숨김, '모든 사진'은 삭제만 가능
  deleteBtn.classList.toggle("hidden", !meta.showDelete);

  // 업로더(민규/윤정) 선택 표시 (데이트/민규/윤정에만)
  uploaderRow.style.display = meta.needsUploader ? "flex" : "none";
  if (!meta.needsUploader) {
    // 선택값 초기화
    document.querySelectorAll('input[name="uploader"]').forEach(r => r.checked = false);
    uploader = null;
  }

  // 메모 영역
  memoSection.style.display = (albumKey === "memo") ? "block" : "none";

  // 홈은 갤러리도 비움
  gallery.innerHTML = "";
}

// ===== 업로드 =====
uploadBtn.addEventListener("click", async () => {
  const { canUpload, folder, collection, needsUploader } = ALBUMS[currentAlbum];
  if (!canUpload) return alert("이 메뉴에서는 업로드할 수 없습니다.");

  const files = fileInput.files;
  const dateVal = dateInput.value;
  if (!files.length) return alert("📁 업로드할 파일을 선택하세요!");
  if (!dateVal)      return alert("📅 날짜를 선택하세요!");

  if (needsUploader && !uploader) {
    return alert("올린 사람(민규/윤정)을 선택하세요!");
  }

  for (const file of files) {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collectionRef(collection), {
      url,
      name: file.name,
      path: storageRef.fullPath,
      date: dateVal,            // 사용자가 고른 날짜
      uploader: uploader || "", // 민규/윤정 (해당되는 앨범만)
      album: currentAlbum,      // 삭제/모아보기용
      ts: Date.now()            // 업로드 시각 (정렬용)
    });
  }

  alert("✅ 업로드 완료!");
  // 입력값 초기화는 유지하되, 현재 앨범은 그대로 (새로고침해도 복원됨)
  fileInput.value = "";
  dateInput.value = "";
  if (uploaderRow.style.display !== "none") {
    document.querySelectorAll('input[name="uploader"]').forEach(r => r.checked = false);
    uploader = null;
  }
});

// Firestore 컬렉션 객체 얻기
function collectionRef(name) {
  return collection(db, name);
}

// ===== 갤러리 실시간 렌더 =====
let unsubs = [];
function clearUnsubs() {
  unsubs.forEach(fn => { try { fn(); } catch {} });
  unsubs = [];
}

function bindAlbumListeners(albumKey) {
  clearUnsubs();
  gallery.innerHTML = "";

  // 홈은 아무것도 표시 X
  if (albumKey === "home") return;

  // 메모는 별도 처리
  if (albumKey === "memo") {
    loadMemos();
    return;
  }

  // 모든 사진: 4개 컬렉션을 합쳐서 표시
  if (albumKey === "all") {
    const buffer = []; // {id, url, date, uploader, album, path, _col, ts}
    let readyCount = 0;

    PHOTO_COLLECTIONS.forEach(col => {
      const q = query(collectionRef(col), orderBy("ts", "desc"));
      const unsub = onSnapshot(q, snap => {
        // 해당 컬렉션 최신 스냅샷 반영
        // 먼저 기존 buffer에서 이 컬렉션 레코드 제거
        for (let i = buffer.length - 1; i >= 0; i--) {
          if (buffer[i]._col === col) buffer.splice(i, 1);
        }
        snap.forEach(d => {
          const v = d.data();
          buffer.push({
            id: d.id, url: v.url, date: v.date || "", uploader: v.uploader || "",
            album: v.album || inferAlbumFromCollection(col),
            path: v.path, _col: col, ts: v.ts || 0
          });
        });
        readyCount++;
        // 모든 변경마다 그리되, 정렬해서 그림
        renderAll(buffer);
      });
      unsubs.push(unsub);
    });

    return;
  }

  // 특정 앨범
  const colName = ALBUMS[albumKey].collection;
  const qy = query(collectionRef(colName), orderBy("ts", "desc"));
  const unsub = onSnapshot(qy, snapshot => {
    gallery.innerHTML = "";
    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      gallery.appendChild(buildCard({
        id: docSnap.id,
        url: d.url,
        date: d.date || "",
        uploader: d.uploader || "",
        album: albumKey,
        path: d.path,
        collection: colName
      }));
    });
  });
  unsubs.push(unsub);
}

function inferAlbumFromCollection(col) {
  if (col === "date_photos") return "date";
  if (col === "mingyu_photos") return "mingyu";
  if (col === "yoonjung_photos") return "yoonjung";
  if (col === "shared_photos") return "shared";
  return "home";
}

function renderAll(items) {
  // 최신순 정렬
  const sorted = items.slice().sort((a,b) => (b.ts || 0) - (a.ts || 0));
  gallery.innerHTML = "";
  sorted.forEach(item => {
    gallery.appendChild(buildCard({
      id: item.id,
      url: item.url,
      date: item.date,
      uploader: item.uploader,
      album: item.album,
      path: item.path,
      collection: item._col
    }));
  });
}

// 카드 DOM
function buildCard({id, url, date, uploader, album, path, collection}) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = id;
  card.dataset.path = path;
  card.dataset.collection = collection || ALBUMS[album].collection;

  const img = document.createElement("img");
  img.src = url;

  const chkWrap = document.createElement("div");
  chkWrap.className = "check-wrap";
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.className = "select-chk";
  chkWrap.appendChild(chk);

  const meta = document.createElement("div");
  meta.className = "meta";
  const left = document.createElement("span");
  left.textContent = date || "";
  const right = document.createElement("span");
  right.textContent = uploader || "";
  meta.appendChild(left);
  meta.appendChild(right);

  card.appendChild(img);
  card.appendChild(chkWrap);
  card.appendChild(meta);
  return card;
}

// ===== 선택 삭제 =====
deleteBtn.addEventListener("click", async () => {
  const { showDelete } = ALBUMS[currentAlbum];
  if (!showDelete) return;

  const checks = Array.from(document.querySelectorAll(".select-chk:checked"));
  if (!checks.length) return alert("삭제할 사진을 선택하세요!");

  if (!confirm("선택한 사진을 삭제하시겠습니까?")) return;

  for (const chk of checks) {
    const card = chk.closest(".card");
    const id = card.dataset.id;
    const path = card.dataset.path;
    const col = card.dataset.collection;

    try {
      await deleteDoc(doc(db, col, id));
    } catch (e) {
      console.warn("deleteDoc 실패:", e);
    }
    try {
      await deleteObject(ref(storage, path));
    } catch (e) {
      console.warn("deleteObject 실패:", e);
    }
  }

  alert("🗑️ 삭제 완료!");
});

// ===== 메모 (자동 날짜 기록) =====
function loadMemos() {
  gallery.innerHTML = ""; // 메모 탭에선 갤러리 사용 안 함
  memoList.innerHTML = "";

  const qy = query(collectionRef(ALBUMS.memo.collection), orderBy("ts","desc"));
  const unsub = onSnapshot(qy, snap => {
    memoList.innerHTML = "";
    snap.forEach(d => {
      const v = d.data();
      const item = document.createElement("div");
      item.className = "memo-item";
      const text = document.createElement("div");
      text.textContent = v.text || "";

      const meta = document.createElement("div");
      meta.className = "memo-meta";
      meta.textContent = formatDateTime(v.ts);

      const del = document.createElement("button");
      del.className = "memo-del";
      del.textContent = "삭제";
      del.addEventListener("click", async () => {
        await deleteDoc(doc(db, ALBUMS.memo.collection, d.id));
      });

      item.appendChild(text);
      item.appendChild(meta);
      item.appendChild(del);
      memoList.appendChild(item);
    });
  });
  unsubs.push(unsub);
}

// 메모 저장: ts(업로드 시각)를 자동 저장하여 날짜 자동 기록
memoSaveBtn.addEventListener("click", async () => {
  const t = (memoText.value || "").trim();
  if (!t) return alert("메모 내용을 입력하세요!");
  await addDoc(collectionRef(ALBUMS.memo.collection), {
    text: t,
    ts: Date.now()
  });
  memoText.value = "";
});

// 날짜 포맷
function formatDateTime(ts) {
  try {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    const hh = String(d.getHours()).padStart(2,"0");
    const mi = String(d.getMinutes()).padStart(2,"0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return "";
  }
}
