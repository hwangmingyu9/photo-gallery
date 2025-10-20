// 🔹 앨범 목록 수정 (공용/홈 삭제)
const ALBUMS = {
  home:   { title: "홈", canUpload: false, showDelete: false, needsUploader: false, collection: null, folder: null },
  all:    { title: "모든 사진", canUpload: false, showDelete: true, needsUploader: false, collection: "ALL", folder: null },
  date:   { title: "데이트", canUpload: true, showDelete: true, needsUploader: true, collection: "date_photos", folder: "date" },
  mingyu: { title: "민규",   canUpload: true, showDelete: true, needsUploader: true, collection: "mingyu_photos", folder: "mingyu" },
  yoonjung:{title: "윤정",   canUpload: true, showDelete: true, needsUploader: true, collection: "yoonjung_photos", folder: "yoonjung" },
  memo:   { title: "메모",   canUpload: false, showDelete: false, needsUploader: false, collection: "memo_notes", folder: null },
};

// ✅ 상단 "사진 보관함 📸" 클릭 시 홈으로 이동
document.getElementById("go-home").addEventListener("click", () => {
  currentAlbum = "home";
  localStorage.setItem("currentAlbum", "home");
  albumTitle.textContent = "홈";
  gallery.innerHTML = "";
  uploadSection.classList.add("hidden");
  memoSection.style.display = "none";
});

// ✅ 메뉴 클릭 안 되던 문제 해결
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const next = btn.dataset.album;
    switchAlbum(next);
  });
});
