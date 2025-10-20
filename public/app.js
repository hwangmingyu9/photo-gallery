// Firebase SDK import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-storage.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDycTuXpS0bbAmcKi8UWIeGVwCltd6K6Tk",
  authDomain: "photo-gallery-676d1.firebaseapp.com",
  projectId: "photo-gallery-676d1",
  storageBucket: "photo-gallery-676d1.firebasestorage.app",
  messagingSenderId: "379643266189",
  appId: "1:379643266189:web:63c6e7feacc69e24d54ec4"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// 요소 불러오기
const fileInput = document.getElementById("file-input");
const uploadBtn = document.getElementById("upload-btn");
const gallery = document.getElementById("gallery");

// 업로드 버튼 클릭
uploadBtn.addEventListener("click", async () => {
  const files = fileInput.files;
  if (!files.length) {
    alert("📸 먼저 업로드할 사진을 선택하세요!");
    return;
  }

  for (const file of files) {
    const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    // 이미지 추가
    const img = document.createElement("img");
    img.src = url;
    img.alt = file.name;
    img.className = "thumb";
    gallery.appendChild(img);
  }

  alert("✅ 업로드 완료!");
  fileInput.value = "";
});
