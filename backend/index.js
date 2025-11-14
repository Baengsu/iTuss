// index.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
// Render 같은 PaaS에서는 PORT를 환경변수로 내려줌
const PORT = process.env.PORT || 4000;
const JWT_SECRET = "change-this-secret-later";

app.use(cors());
app.use(express.json());

// ===== 1) 파일 DB 설정 =====
const DB_PATH = path.join(__dirname, "db.json");

function loadDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed.users) parsed.users = [];
    return parsed;
  } catch (e) {
    return { users: [] };
  }
}

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

let db = loadDb();

// ===== 2) 인증 미들웨어 =====
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

// ===== 3) 회원가입 (/api/signup) =====
app.post("/api/signup", async (req, res) => {
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
    deviceId: null,
  };
  db.users.push(user);
  saveDb();

  return res.json({ ok: true });
});

// ===== 4) 로그인 (/api/login) =====
app.post("/api/login", async (req, res) => {
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

// ===== 5) 디바이스 등록 (/api/device/register) =====
app.post("/api/device/register", authMiddleware, (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) {
    return res
      .status(400)
      .json({ ok: false, error: "deviceId 필요" });
  }

  req.user.deviceId = deviceId;
  saveDb();

  return res.json({
    ok: true,
    deviceId: req.user.deviceId,
  });
});

// ===== 6) 스트림 URL 조회 (/api/stream-url) =====
app.get("/api/stream-url", authMiddleware, (req, res) => {
  if (!req.user.deviceId) {
    return res.status(400).json({
      ok: false,
      error: "등록된 디바이스가 없습니다.",
    });
  }

  const dummyStreamUrl =
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

  return res.json({
    ok: true,
    deviceId: req.user.deviceId,
    streamUrl: dummyStreamUrl,
  });
});

// ===== 7) 루트(테스트용) =====
app.get("/", (req, res) => {
  res.send("Backend is running (with file DB, /api prefix)");
});

// ===== 8) 서버 시작 =====
app.listen(PORT, () => {
  console.log(`✅ Backend server listening on port ${PORT}`);
  console.log(`📁 DB file: ${DB_PATH}`);
});
