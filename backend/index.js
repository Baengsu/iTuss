// index.js
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// 🔥 LiveKit 서버 SDK
const { AccessToken } = require("livekit-server-sdk");

const app = express();
const PORT = 4000;
const JWT_SECRET = "change-this-secret-later"; // 나중에 .env로 이동

// 🔥 LiveKit Cloud 설정 (네 콘솔 값으로 교체한 상태)
const LIVEKIT_API_KEY = "APIvPFRc9Q3bCg4";
const LIVEKIT_API_SECRET = "42JpW6b9e2R14kzrZKxck8hXLFF7KMP6xb0GHg3GYNO";
const LIVEKIT_WS_URL = "wss://ituss-auzb5tx4.livekit.cloud";

// 미들웨어
app.use(cors());
app.use(express.json());

// 🔥 인메모리 DB (실제 서비스에서는 DB 사용해야 함!)
const users = []; // { id, email, passwordHash, deviceId }

// ===========================================================
// JWT 인증 미들웨어
// ===========================================================
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "No token" });
  }

  const token = auth.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === payload.userId);

    if (!user) {
      return res.status(401).json({ ok: false, error: "User not found" });
    }

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

// ===========================================================
// 1. 회원가입
// ===========================================================
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ ok: false, error: "email, password 필요" });

  const exists = users.find((u) => u.email === email);
  if (exists)
    return res.status(400).json({ ok: false, error: "이미 존재하는 이메일" });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: String(users.length + 1),
    email,
    passwordHash,
    deviceId: null,
  };

  users.push(user);

  return res.json({ ok: true });
});

// ===========================================================
// 2. 로그인
// ===========================================================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  if (!user)
    return res.status(400).json({ ok: false, error: "이메일 또는 비밀번호 오류" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid)
    return res.status(400).json({ ok: false, error: "이메일 또는 비밀번호 오류" });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

  return res.json({ ok: true, token });
});

// ===========================================================
// 3. 디바이스 등록 (1계정 1디바이스 정책)
// ===========================================================
app.post("/device/register", authMiddleware, (req, res) => {
  const { deviceId } = req.body;

  if (!deviceId)
    return res.status(400).json({ ok: false, error: "deviceId 필요" });

  req.user.deviceId = deviceId;

  return res.json({ ok: true, deviceId });
});

// ===========================================================
// 4. LiveKit 토큰 발급 API (핵심)
// ===========================================================
//
// 프론트는 이 API에서
// - roomName
// - wsUrl
// - token
// 을 받아 WebRTC 연결에 사용함.
//
app.post("/livekit/token", authMiddleware, (req, res) => {
  try {
    if (!req.user.deviceId) {
      return res.status(400).json({ ok: false, error: "등록된 디바이스가 없습니다." });
    }

    // 1 계정 = 1 디바이스 = 1 방
    const roomName = `room-${req.user.deviceId}`;

    // LiveKit Access Token 생성
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: `viewer-${req.user.id}`,
      ttl: 60 * 60, // 1시간 동안 유효
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: false, // 시청자 = Publish 불가
      canSubscribe: true,
    });

    const token = at.toJwt();

    return res.json({
      ok: true,
      roomName,
      wsUrl: LIVEKIT_WS_URL,
      token,
    });
  } catch (err) {
    console.error("LiveKit token error:", err);
    return res.status(500).json({ ok: false, error: "LiveKit 토큰 생성 실패" });
  }
});

// ===========================================================
// 테스트용
// ===========================================================
app.get("/", (req, res) => {
  res.send("Backend is running (with LiveKit)");
});

// ===========================================================
// 서버 시작
// ===========================================================
app.listen(PORT, () => {
  console.log(`✅ Backend server listening on http://localhost:${PORT}`);
});
