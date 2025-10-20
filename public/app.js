import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// 🔥 Firebase 설정
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
  date: { title: "데이트/추억", emoji: "💖", collection: "date" },
  mingyu: { title: "민규 🐻", emoji: "💚", collection: "mingyu" },
  yoonjung: { title: "윤정 🐰", emoji: "💜", collection: "yoonjung" },
  memo: { title: "메모", emoji: "📝", collection: "memo" },
  all: { title: "모든 사진", emoji: "🌍", collection: "all" }
};

let currentAlbum = "all";
let allPhotos = [];
let currentIndex = 0;

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
  memoUser: document.getElementById("memo-user"),
};

// ✅ 마지막 앨범 기억
window.addEventListener("DOMContentLoaded", () => {
  setAlbum("all");
});
window.addEventListener("beforeunload", () => {
  localStorage.setItem("lastAlbum", currentAlbum);
});

// ✅ 앨범 변경
function setAlbum(name) {
  currentAlbum = name;
  const meta = ALBUMS[name];
  el.title.textContent = `${meta.emoji} ${meta.title}`;

  el.uploadArea.classList.toggle("hidden", name === "all" || name === "memo");
  el.memoArea.classList.toggle("hidden", name !== "memo");
  el.gallery.innerHTML = "";
  allPhotos = [];

  if (name === "memo") loadMemos();
  else if (name === "all") loadAllPhotos();
  else loadAlbumPhotos(name);
}

// ✅ 업로드
el.uploadBtn.addEventListener("click", async () => {
  const files = el.fileInput.files;
  const date = el.dateInput.value;
  const uploader = el.userSelect.value;
  if (!files.length || !date || !uploader)
    return alert("📅 날짜, 업로더, 파일을 모두 선택하세요.");

  for (const file of files) {
    const path = `${currentAlbum}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await addDoc(collection(db, currentAlbum), {
      url, date, uploader, ts: Date.now(), path
    });
  }

  el.fileInput.value = "";
  el.dateInput.value = "";
  alert("✅ 업로드 완료!");
});

// ✅ 삭제
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

// ✅ 앨범별 사진 불러오기
function loadAlbumPhotos(name) {
  const q = query(collection(db, name), orderBy("ts", "desc"));
  onSnapshot(q, (snap) => {
    el.gallery.innerHTML = "";
    allPhotos = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      allPhotos.push({ ...data, id: docSnap.id, album: name });
      el.gallery.appendChild(buildCard({ id: docSnap.id, ...data, album: name }));
    });
  });
}

// ✅ 모든 사진 보기
function loadAllPhotos() {
  el.gallery.innerHTML = "";
  allPhotos = [];
  Object.keys(ALBUMS).forEach((name) => {
    if (["memo", "all"].includes(name)) return;
    const q = query(collection(db, name), orderBy("ts", "desc"));
    onSnapshot(q, (snap) => {
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        allPhotos.push({ ...data, id: docSnap.id, album: name });
        el.gallery.appendChild(buildCard({ id: docSnap.id, ...data, album: name, hideCheckbox: true }));
      });
    });
  });
}

// ✅ 카드 생성
function buildCard({ id, url, date, uploader, album, path, hideCheckbox }) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = id;
  card.dataset.path = path;
  card.dataset.collection = album;

  const img = document.createElement("img");
  img.src = url;
  img.addEventListener("click", (e) => {
    e.stopPropagation();
    currentIndex = allPhotos.findIndex((p) => p.url === url);
    showImageModal(url);
  });

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `<span>${date || ""}</span><span>${uploader || ""}</span>`;

  card.appendChild(img);
  if (!hideCheckbox) {
    const chkWrap = document.createElement("div");
    chkWrap.className = "check-wrap";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "select-chk";
    chkWrap.appendChild(chk);
    card.appendChild(chkWrap);
  }
  card.appendChild(meta);
  return card;
}

// ✅ 모달
function showImageModal(url) {
  let modal = document.getElementById("image-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "image-modal";
    modal.className = "modal";
    modal.innerHTML = `
      <button class="modal-nav prev">◀</button>
      <div class="modal-content">
        <img id="modal-img" src="" alt="preview" />
        <div id="img-info"></div>
        <button id="download-btn">⬇ 다운로드</button>
      </div>
      <button class="modal-nav next">▶</button>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });
    document.querySelector(".prev").addEventListener("click", showPrev);
    document.querySelector(".next").addEventListener("click", showNext);
  }

  updateModalContent(url);
  modal.classList.add("show");
}
function updateModalContent(url) {
  const modal = document.getElementById("image-modal");
  const img = modal.querySelector("#modal-img");
  const info = modal.querySelector("#img-info");
  const downloadBtn = modal.querySelector("#download-btn");

  const photo = allPhotos[currentIndex];
  img.src = url;
  info.textContent = `${photo.album || ""} | ${photo.uploader || ""} | ${photo.date || ""}`;
  downloadBtn.onclick = () => window.open(url, "_blank");
}
function showPrev() {
  currentIndex = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
  updateModalContent(allPhotos[currentIndex].url);
}
function showNext() {
  currentIndex = (currentIndex + 1) % allPhotos.length;
  updateModalContent(allPhotos[currentIndex].url);
}

// ✅ 메모
el.memoAdd?.addEventListener("click", async () => {
  const text = el.memoInput.value.trim();
  const user = el.memoUser.value;
  if (!text || !user) return alert("업로더와 메모를 입력하세요.");
  await addDoc(collection(db, "memo"), {
    text,
    user,
    ts: Date.now(),
    date: new Date().toLocaleString(),
  });
  el.memoInput.value = "";
  el.memoUser.value = "";
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
        <div class="memo-meta">${data.user} | ${data.date}</div>
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
el.navBtns.forEach((b) => b.addEventListener("click", () => setAlbum(b.dataset.album)));
document.querySelector(".nav-title").addEventListener("click", () => setAlbum("all"));
