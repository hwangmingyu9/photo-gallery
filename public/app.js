// 🔥 Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔧 Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDycTuXpS0bbAmcKi8UWIeGVwCltd6K6Tk",
  authDomain: "photo-gallery-676d1.firebaseapp.com",
  projectId: "photo-gallery-676d1",
  storageBucket: "photo-gallery-676d1.firebasestorage.app",
  messagingSenderId: "379643266189",
  appId: "1:379643266189:web:63c6e7feacc69e24d54ec4"
};

// ✅ 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// 📸 요소
const fileInput = document.getElementById("file-input");
const dateInput = document.getElementById("date-input");
const uploadBtn = document.getElementById("upload-btn");
const deleteBtn = document.getElementById("delete-btn");
const gallery = document.getElementById("gallery");
const photosRef = collection(db, "photos");

// ✅ 업로드
uploadBtn.addEventListener("click", async () => {
  const files = fileInput.files;
  const selectedDate = dateInput.value;

  if (!files.length) {
    alert("📁 업로드할 파일을 선택하세요!");
    return;
  }

  if (!selectedDate) {
    alert("📅 업로드 날짜를 선택하세요!");
    return;
  }

  for (const file of files) {
    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    await addDoc(photosRef, {
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

// ✅ 실시간 갤러리 렌더링
const q = query(photosRef, orderBy("ts", "desc"));
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

    const label = document.createElement("div");
    label.textContent = data.date || "날짜 없음";
    label.style.position = "absolute";
    label.style.bottom = "0";
    label.style.width = "100%";
    label.style.background = "rgba(0,0,0,0.5)";
    label.style.color = "#fff";
    label.style.fontSize = "12px";
    label.style.padding = "2px 0";

    card.appendChild(img);
    card.appendChild(label);

    // 선택 토글
    card.addEventListener("click", () => {
      card.classList.toggle("selected");
    });

    gallery.appendChild(card);
  });
});

// ✅ 선택 삭제
deleteBtn.addEventListener("click", async () => {
  const selectedCards = document.querySelectorAll(".card.selected");
  if (selectedCards.length === 0) {
    alert("삭제할 사진을 선택하세요!");
    return;
  }

  if (!confirm("선택한 사진을 정말 삭제할까요?")) return;

  for (const card of selectedCards) {
    const id = card.dataset.id;
    const path = card.dataset.path;

    await deleteDoc(doc(db, "photos", id));
    await deleteObject(ref(storage, path));
  }

  alert("🗑️ 선택한 사진이 삭제되었습니다!");
});
