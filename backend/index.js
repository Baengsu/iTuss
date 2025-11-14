// index.js
// ===============================
// 1) 라이브러리 로드
// ===============================
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000; // http://localhost:4000
const JWT_SECRET = "change-this-secret-later"; // 나중에 환경변수로 빼기

app.use(cors());
app.use(express.json());

// ===============================
// 2) "파일 DB" 설정 (db.json)
// ===============================
const DB_PATH = path.join(__dirname, "db.json");

// DB 읽기 함수
function loadDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    // users 배열이 없으면 기본값
    if (!parsed.users) {
      parsed.users = [];
    }
    return parsed;
  } catch (e) {
    // 파일이 없거나 파싱 에러 → 기본값
    return { users: [] };
  }
}

// DB 쓰기 함수
function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

// 실제로 사용하는 DB 객체 (서버 시작 시 1번 로드)
let db = loadDb();

// ===============================
// 3) 유틸: 토큰에서 유저 찾기
// ===============================
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "No token" });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.users.find((u) => u.id === payload.userId);
    if (!user) {
      return res.status(401).json({ ok: false, error: "User not found" });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

// ===============================
// 4) 회원가입
// ===============================
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ ok: false, error: "email, password 필요" });
  }

  const existed = db.users.find((u) => u.email === email);
  if (existed) {
    return res
      .status(400)
      .json({ ok: false, error: "이미 존재하는 이메일" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: String(db.users.length + 1),
    email,
    passwordHash,
    deviceId: null, // 아직 디바이스 없음
  };
  db.users.push(user);

  // ✅ 변경된 DB를 파일에 저장
  saveDb();

  return res.json({ ok: true });
});

// ===============================
// 5) 로그인
// ===============================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = db.users.find((u) => u.email === email);
  if (!user) {
    return res
      .status(400)
      .json({ ok: false, error: "이메일 또는 비밀번호 오류" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res
      .status(400)
      .json({ ok: false, error: "이메일 또는 비밀번호 오류" });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return res.json({ ok: true, token });
});

// ===============================
// 6) 디바이스 등록 (1계정 1디바이스)
// ===============================
app.post("/device/register", authMiddleware, (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) {
    return res
      .status(400)
      .json({ ok: false, error: "deviceId 필요" });
  }

  // 1계정 1디바이스 정책: 그냥 내 계정에 덮어쓰기
  req.user.deviceId = deviceId;

  // ✅ DB 저장
  saveDb();

  return res.json({
    ok: true,
    deviceId: req.user.deviceId,
  });
});

// ===============================
// 7) 내 스트림 URL 조회
// ===============================
app.get("/stream-url", authMiddleware, (req, res) => {
  if (!req.user.deviceId) {
    return res.status(400).json({
      ok: false,
      error: "등록된 디바이스가 없습니다.",
    });
  }

  // 지금은 샘플 영상 URL (MP4)
  const dummyStreamUrl =
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

  return res.json({
    ok: true,
    deviceId: req.user.deviceId,
    streamUrl: dummyStreamUrl,
  });
});

// ===============================
// 8) 테스트용 루트 엔드포인트
// ===============================
app.get("/", (req, res) => {
  res.send("Backend is running (with file DB)");
});

// ===============================
// 9) 서버 시작
// ===============================
app.listen(PORT, () => {
  console.log(`✅ Backend server listening on http://localhost:${PORT}`);
  console.log(`📁 DB file: ${DB_PATH}`);
});
