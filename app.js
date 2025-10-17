const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public')); // CSS, JS
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));

// multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = path.join(__dirname, 'uploads');
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// 루트 페이지
app.get('/', (req, res) => {
  const images = fs.readdirSync(path.join(__dirname, 'uploads'));
  res.render('index', { images });
});

// 업로드 처리 (Ajax)
app.post('/upload', upload.single('photo'), (req, res) => {
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ success: true, filePath });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
