// index.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 4000; // http://localhost:4000
const JWT_SECRET = "change-this-secret-later"; // 나중에 env로 빼기

app.use(cors());
app.use(express.json());

// ====== 아주 간단한 인메모리 “DB” (서버 재시작 시 초기화됨) ======
const users = []; // { id, email, passwordHash, deviceId }

// 유틸: 토큰에서 유저 찾기
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "No token" });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === payload.userId);
    if (!user) return res.status(401).json({ ok: false, error: "User not found" });
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

// ====== 1) 회원가입 ======
app.post("/signup", async (req, res) => {
  console.log("REQ BODY:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "email, password 필요" });
  }

  const existed = users.find((u) => u.email === email);
  if (existed) {
    return res.status(400).json({ ok: false, error: "이미 존재하는 이메일" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: String(users.length + 1),
    email,
    passwordHash,
    deviceId: null, // 아직 디바이스 없음
  };
  users.push(user);

  return res.json({ ok: true });
});

// ====== 2) 로그인 ======
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(400).json({ ok: false, error: "이메일 또는 비밀번호 오류" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(400).json({ ok: false, error: "이메일 또는 비밀번호 오류" });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  return res.json({ ok: true, token });
});

// ====== 3) 디바이스 등록 (1계정 1디바이스) ======
app.post("/device/register", authMiddleware, (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) {
    return res.status(400).json({ ok: false, error: "deviceId 필요" });
  }

  // 1계정 1디바이스 정책: 그냥 내 계정에 덮어쓰기
  req.user.deviceId = deviceId;

  return res.json({
    ok: true,
    deviceId: req.user.deviceId,
  });
});

// ====== 4) 내 스트림 URL 조회 (나중에 진짜 스트림으로 교체) ======
app.get("/stream-url", authMiddleware, (req, res) => {
  if (!req.user.deviceId) {
    return res.status(400).json({ ok: false, error: "등록된 디바이스가 없습니다." });
  }

  // 지금은 연습이라 "샘플 영상" 리턴 (mp4 파일)
  const dummyStreamUrl =
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

  return res.json({
    ok: true,
    deviceId: req.user.deviceId,
    streamUrl: dummyStreamUrl,
  });
});

// 테스트용
app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.listen(PORT, () => {
  console.log(`✅ Backend server listening on http://localhost:${PORT}`);
});
