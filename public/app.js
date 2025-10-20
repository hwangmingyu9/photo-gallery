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
const fileInput = document.getElementById("file-input");
const dateInput = document.getElementById("date-input");
const uploadBtn = document.getElementById("upload-btn");
const deleteBtn = document.getElementById("delete-btn");
const gallery = document.getElementById("gallery");
const albumTitle = document.getElementById("album-title");
const navBtns = document.querySelectorAll(".nav-btn");
const memoSection = document.getElementById("memo-section");
const uploadSection = document.getElementById("upload-section");
const memoText = document.getElementById("memo-text");
const memoSaveBtn = document.getElementById("memo-save-btn");
const memoList = document.getElementById("memo-list");

let currentAlbum = "home";

// ✅ 앨범 컬렉션 매핑
const albumMap = {
  date: { name: "💖 데이트 앨범", collection: "date_photos" },
  mingyu: { name: "💚 민규 앨범", collection: "mingyu_photos" },
  yoonjung: { name: "💜 윤정 앨범", collection: "yoonjung_photos" },
  memo: { name: "📝 메모", collection: "memo_notes" },
};

// ✅ 업로드
uploadBtn.addEventListener("click", async () => {
  if (currentAlbum === "home" || currentAlbum === "memo")
    return alert("홈 또는 메모에서는 업로드할 수 없습니다!");

  const files = fileInput.files;
  const selectedDate = dateInput.value;

  if (!files.length) return alert("📁 업로드할 파일을 선택하세요!");
  if (!selectedDate) return alert("📅 날짜를 선택하세요!");

  for (const file of files) {
    const storageRef = ref(storage, `${currentAlbum}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, albumMap[currentAlbum].collection), {
      url,
      name: file.name,
      path: storageRef.fullPath,
      date: selectedDate,
      ts: Date.now()
    });
  }

  alert("✅ 업로드 완료!");
  fileInput.value = "";
  dateInput.value = "";
});

// ✅ 실시간 표시
function loadGallery(albumKey) {
  gallery.innerHTML = "";

  if (albumKey === "home") return;
  if (albumKey === "memo") return loadMemos();

  const q = query(collection(db, albumMap[albumKey].collection), orderBy("ts", "desc"));
  onSnapshot(q, (snapshot) => {
    gallery.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.id = docSnap.id;
      card.dataset.path = data.path;

      const img = document.createElement("img");
      img.src = data.url;

      const dateLabel = document.createElement("div");
      dateLabel.className = "card-date";
      dateLabel.textContent = data.date;

      card.appendChild(img);
      card.appendChild(dateLabel);
      card.addEventListener("click", () => card.classList.toggle("selected"));
      gallery.appendChild(card);
    });
  });
}

// ✅ 삭제
deleteBtn.addEventListener("click", async () => {
  const selected = document.querySelectorAll(".card.selected");
  if (!selected.length) return alert("삭제할 사진을 선택하세요!");
  if (!confirm("선택한 사진을 삭제하시겠습니까?")) return;

  for (const card of selected) {
    await deleteDoc(doc(db, albumMap[currentAlbum].collection, card.dataset.id));
    await deleteObject(ref(storage, card.dataset.path));
  }

  alert("🗑️ 삭제 완료!");
});

// ✅ 앨범 전환
navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentAlbum = btn.dataset.album;
    albumTitle.textContent =
      currentAlbum === "home" ? "🏠 홈" : albumMap[currentAlbum].name;
    gallery.innerHTML = "";

    // 업로드 / 메모 섹션 전환
    uploadSection.style.display = currentAlbum === "memo" ? "none" : "block";
    memoSection.style.display = currentAlbum === "memo" ? "block" : "none";

    if (currentAlbum !== "home") loadGallery(currentAlbum);
  });
});

// ✅ 메모 저장
memoSaveBtn.addEventListener("click", async () => {
  const text = memoText.value.trim();
  if (!text) return alert("메모 내용을 입력하세요!");
  await addDoc(collection(db, albumMap.memo.collection), {
    text,
    ts: Date.now()
  });
  memoText.value = "";
  loadMemos();
});

// ✅ 메모 로드
function loadMemos() {
  memoList.innerHTML = "";
  const q = query(collection(db, albumMap.memo.collection), orderBy("ts", "desc"));
  onSnapshot(q, (snapshot) => {
    memoList.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const item = document.createElement("div");
      item.className = "memo-item";
      item.textContent = data.text;

      const delBtn = document.createElement("button");
      delBtn.className = "memo-delete";
      delBtn.textContent = "❌";
      delBtn.addEventListener("click", async () => {
        await deleteDoc(doc(db, albumMap.memo.collection, docSnap.id));
      });

      item.appendChild(delBtn);
      memoList.appendChild(item);
    });
  });
}
