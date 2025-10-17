const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// 포트 설정 (Render 환경 변수 사용)
const PORT = process.env.PORT || 3000;

// EJS 뷰 엔진
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 업로드 폴더 경로 (날짜별 하위 폴더 생성)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const today = new Date();
    const folder = path.join(__dirname, 'uploads', `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`);
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 정적 파일 경로
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parser
app.use(express.urlencoded({ extended: true }));

// 루트 페이지
app.get('/', (req, res) => {
  res.render('index');
});

// 업로드 처리
app.post('/upload', upload.single('photo'), (req, res) => {
  res.send('업로드 완료! <a href="/">뒤로가기</a>');
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
