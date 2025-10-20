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

const photosRef = collection(db, "photos");
let currentAlbum = "home";

// ✅ 업로드
uploadBtn.addEventListener("click", async () => {
  const files = fileInput.files;
  const selectedDate = dateInput.value;

  if (!files.length) return alert("📁 업로드할 파일을 선택하세요!");
  if (!selectedDate) return alert("📅 날짜를 선택하세요!");
  if (currentAlbum === "home") return alert("홈에서는 업로드할 수 없습니다!");

  for (const file of files) {
    const storageRef = ref(storage, `${currentAlbum}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(photosRef, {
      url,
      name: file.name,
      path: storageRef.fullPath,
      date: selectedDate,
      album: currentAlbum,
      ts: Date.now()
    });
  }

  alert("✅ 업로드 완료!");
  fileInput.value = "";
  dateInput.value = "";
});

// ✅ 실시간 갤러리 표시
const q = query(photosRef, orderBy("ts", "desc"));
onSnapshot(q, (snapshot) => {
  gallery.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // 홈에서는 아무 사진도 표시하지 않음
    if (currentAlbum === "home" || data.album !== currentAlbum) return;

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

    // 선택 토글
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
    });

    gallery.appendChild(card);
  });
});

// ✅ 앨범 전환
navBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentAlbum = btn.dataset.album;
    const emojiMap = {
      home: "🏠 홈",
      date: "💖 데이트 앨범",
      mingyu: "💚 민규 앨범",
      yoonjung: "💜 윤정 앨범",
      memo: "📝 메모 앨범"
    };
    albumTitle.textContent = emojiMap[currentAlbum];
    renderGallery();
  });
});

// ✅ 선택 삭제
deleteBtn.addEventListener("click", async () => {
  const selected = document.querySelectorAll(".card.selected");
  if (!selected.length) return alert("삭제할 사진을 선택하세요!");
  if (!confirm("선택한 사진을 삭제하시겠습니까?")) return;

  for (const card of selected) {
    await deleteDoc(doc(db, "photos", card.dataset.id));
    await deleteObject(ref(storage, card.dataset.path));
  }
  alert("🗑️ 삭제 완료!");
});

// ✅ 렌더링 함수
function renderGallery() {
  const event = new Event("updateGallery");
  document.dispatchEvent(event);
}
