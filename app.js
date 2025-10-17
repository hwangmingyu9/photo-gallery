const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 업로드 폴더 생성 (없을 때 자동 생성)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const date = req.body.date || new Date().toISOString().split('T')[0];
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${date}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// EJS 설정
app.set('view engine', 'ejs');
app.use(express.static('uploads'));
app.use(express.urlencoded({ extended: true }));

// 메인 페이지
app.get('/', (req, res) => {
  const files = fs.readdirSync(uploadDir);
  res.render('index', { files });
});

// 업로드 처리
app.post('/upload', upload.single('photo'), (req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => console.log(`✅ 서버 실행 중: http://localhost:${PORT}`));
