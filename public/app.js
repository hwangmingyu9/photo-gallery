// 🔥 Firebase SDK 로드
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔧 Firebase 설정 (민규 프로젝트용)
const firebaseConfig = {
  apiKey: "AIzaSyDycTuXpS0bbAmcKi8UWIeGVwCltd6K6Tk",
  authDomain: "photo-gallery-676d1.firebaseapp.com",
  projectId: "photo-gallery-676d1",
  storageBucket: "photo-gallery-676d1.firebasestorage.app",
  messagingSenderId: "379643266189",
  appId: "1:379643266189:web:63c6e7feacc69e24d54ec4"
};

// ✅ Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// 📸 HTML 요소
const fileInput = document.getElementById("file-input");
const uploadBtn = document.getElementById("upload-btn");
const gallery = document.getElementById("gallery");

// 📦 Firestore 컬렉션 참조
const photosRef = collection(db, "photos");

// 🧩 업로드 버튼 클릭 이벤트
uploadBtn.addEventListener("click", async () => {
  const files = fileInput.files;
  if (!files.length) {
    alert("📁 업로드할 파일을 선택하세요.");
    return;
  }

  for (const file of files) {
    const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    console.log("✅ 업로드 완료:", url);

    // Firestore에 이미지 정보 저장
    await addDoc(photosRef, {
      url: url,
      name: file.name,
      ts: Date.now()
    });
  }

  alert("✅ 업로드 완료!");
  fileInput.value = "";
});

// 🧭 실시간으로 Firestore 데이터 가져오기
const q = query(photosRef, orderBy("ts", "desc"));
onSnapshot(q, (snapshot) => {
  console.log("📡 Firestore 문서 수:", snapshot.size);
  gallery.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const img = document.createElement("img");
    img.src = data.url;
    img.alt = data.name;
    img.style.width = "160px";
    img.style.height = "160px";
    img.style.objectFit = "cover";
    img.style.margin = "5px";
    img.style.borderRadius = "10px";
    img.style.boxShadow = "0 0 5px rgba(0,0,0,0.2)";
    gallery.appendChild(img);
  });
});
