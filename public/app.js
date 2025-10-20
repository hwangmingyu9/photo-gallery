import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// 🔥 Firebase 연결
const firebaseConfig = {
  apiKey: "AIzaSyDycTuXpS0bbAmcKi8UWIeGVwCltd6K6Tk",
  authDomain: "photo-gallery-676d1.firebaseapp.com",
  projectId: "photo-gallery-676d1",
  storageBucket: "photo-gallery-676d1.firebasestorage.app",
  messagingSenderId: "379643266189",
  appId: "1:379643266189:web:63c6e7feacc69e24d54ec4"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// ✅ 앨범 정의
const ALBUMS = {
  date: { title: "데이트", emoji: "💖", collection: "date" },
  mingyu: { title: "민규", emoji: "💚", collection: "mingyu" },
  yoonjung: { title: "윤정", emoji: "💜", collection: "yoonjung" },
  memo: { title: "메모", emoji: "📝", collection: "memo" },
  all: { title: "모든 사진", emoji: "🌍", collection: "all" }
};

let currentAlbum = "date";
let selectedIds = new Set();

// ✅ 요소 선택
const el = {
  title: document.getElementById("album-title"),
  navBtns: document.querySelectorAll(".nav-btn"),
  gallery: document.getElementById("gallery"),
  uploadArea: document.querySelector(".upload-area"),
  fileInput: document.getElementById("file-input"),
  uploadBtn: document.getElementById("upload-btn"),
  dateInput: document.getElementById("date-input"),
  userSelect: document.getElementById("user-select"),
  deleteBtn: document.getElementById("delete-btn"),
  memoArea: document.querySelector(".memo-area"),
  memoInput: document.getElementById("memo-input"),
  memoAdd: document.getElementById("memo-add"),
  memoList: document.getElementById("memo-list"),
};

// ✅ 현재 위치 기억
window.addEventListener("beforeunload", () => {
  localStorage.setItem("lastAlbum", currentAlbum);
});
window.addEventListener("DOMContentLoaded", () => {
  const last = localStorage.getItem("lastAlbum");
  if (last && ALBUMS[last]) setAlbum(last);
  else setAlbum("date");
});

// ✅ 앨범 변경
function setAlbum(name) {
  currentAlbum = name;
  const meta = ALBUMS[name];
  el.title.textContent = `${meta.emoji} ${meta.title}`;
  el.uploadArea.classList.toggle("hidden", name === "all");
  el.memoArea.classList.toggle("hidden", name !== "memo");
  el.gallery.innerHTML = "";
  selectedIds.clear();

  if (name === "memo") {
    loadMemos();
  } else if (name === "all") {
    loadAllPhotos();
  } else {
    loadAlbumPhotos(name);
  }
}

// ✅ 사진 업로드
el.uploadBtn.addEventListener("click", async () => {
  const files = el.fileInput.files;
  const date = el.dateInput.value;
  const uploader = el.userSelect.value;
  if (!files.length || !date || !uploader) return alert("📅 날짜와 업로더, 파일을 선택하세요.");

  for (const file of files) {
    const path = `${currentAlbum}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, currentAlbum), {
      url,
      date,
      uploader,
      ts: Date.now(),
      path
    });
  }

  el.fileInput.value = "";
  el.dateInput.value = "";
  alert("✅ 업로드 완료!");
});

// ✅ 삭제 버튼
el.deleteBtn.addEventListener("click", async () => {
  const checks = Array.from(document.querySelectorAll(".select-chk:checked"));
  if (!checks.length) return alert("삭제할 사진을 선택하세요.");

  for (const chk of checks) {
    const card = chk.closest(".card");
    const path = card.dataset.path;
    const id = card.dataset.id;
    const collectionName = card.dataset.collection;
    await deleteDoc(doc(db, collectionName, id));
    await deleteObject(ref(storage, path));
  }
  alert("🗑️ 선택된 사진 삭제 완료");
});

// ✅ 사진 실시간 불러오기
function loadAlbumPhotos(name) {
  const q = query(collection(db, name), orderBy("ts", "desc"));
  onSnapshot(q, (snap) => {
    el.gallery.innerHTML = "";
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const card = buildCard({ id: docSnap.id, ...data, album: name });
      el.gallery.appendChild(card);
    });
  });
}

// ✅ 모든 사진 보기
function loadAllPhotos() {
  el.gallery.innerHTML = "";
  Object.keys(ALBUMS).forEach(name => {
    if (["memo", "all"].includes(name)) return;
    const q = query(collection(db, name), orderBy("ts", "desc"));
    onSnapshot(q, (snap) => {
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const card = buildCard({ id: docSnap.id, ...data, album: name });
        el.gallery.appendChild(card);
      });
    });
  });
}

// ✅ 카드 생성
function buildCard({ id, url, date, uploader, album, path, collection }) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = id;
  card.dataset.path = path;
  card.dataset.collection = collection || ALBUMS[album].collection;

  const img = document.createElement("img");
  img.src = url;

  // ✅ 모달로 확대 보기
  img.addEventListener("click", (e) => {
    e.stopPropagation();
    showImageModal(url);
  });

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

// ✅ 모달 보기
function showImageModal(url) {
  let modal = document.getElementById("image-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "image-modal";
    modal.className = "modal";
    modal.innerHTML = `<div class="modal-content"><img id="modal-img" src="" alt="preview" /></div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("show"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.classList.remove("show"); });
  }
  modal.querySelector("#modal-img").src = url;
  modal.classList.add("show");
}

// ✅ 메모 기능
el.memoAdd?.addEventListener("click", async () => {
  const text = el.memoInput.value.trim();
  if (!text) return alert("메모를 입력하세요.");
  await addDoc(collection(db, "memo"), { text, ts: Date.now(), date: new Date().toLocaleString() });
  el.memoInput.value = "";
});

function loadMemos() {
  const q = query(collection(db, "memo"), orderBy("ts", "desc"));
  onSnapshot(q, (snap) => {
    el.memoList.innerHTML = "";
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const item = document.createElement("div");
      item.className = "memo-item";
      item.innerHTML = `
        <div>${data.text}</div>
        <div class="memo-meta">${data.date}</div>
        <button class="memo-del">🗑️</button>
      `;
      item.querySelector(".memo-del").addEventListener("click", async () => {
        await deleteDoc(doc(db, "memo", docSnap.id));
      });
      el.memoList.appendChild(item);
    });
  });
}

// ✅ 메뉴 버튼
el.navBtns.forEach(b => b.addEventListener("click", () => setAlbum(b.dataset.album)));
document.querySelector(".nav-title").addEventListener("click", () => location.reload());
