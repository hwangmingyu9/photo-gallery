const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// EJS 뷰 엔진
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 업로드 폴더 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const today = new Date();
    const folder = path.join(__dirname, 'uploads', `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`);
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// 정적 파일
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

// 루트 페이지
app.get('/', (req, res) => res.render('index'));

// 업로드 처리
app.post('/upload', upload.single('photo'), (req, res) => {
  res.send('업로드 완료! <a href="/">뒤로가기</a>');
});

// 서버 시작
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
