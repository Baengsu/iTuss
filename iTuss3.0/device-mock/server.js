// C:\iTuss\ituss-3.0\device-mock\server.js

const express = require("express");
const path = require("path");

const app = express();

// 🔥 여기서 viewer 폴더 위치를 가리킴
const VIEWER_DIR = path.join(__dirname, "..", "viewer");

// 1) 루트(/) → index.html 반환 (브라우저가 처음 들어오는 곳)
app.get("/", (req, res) => {
  res.sendFile(path.join(VIEWER_DIR, "index.html"));
});

// 2) 정적 파일 서빙 (sample.mp4 등)
app.use(express.static(VIEWER_DIR));

// 3) /stream → 실제 스트림 엔드포인트 대신 지금은 sample.mp4로 대체
//    나중에 iOS 앱은 이 URL에서 진짜 실시간 스트림을 쏴주면 됨.
app.get("/stream", (req, res) => {
  // 그냥 sample.mp4를 video처럼 보내줌
  const filePath = path.join(VIEWER_DIR, "sample.mp4");
  res.sendFile(filePath);
});

// 서버 시작
const PORT = 8080; // 나중에 iPhone 앱도 이 포트로 띄우면 똑같이 동작
app.listen(PORT, () => {
  console.log(`✅ iTuss Device Mock server running at http://localhost:${PORT}`);
});
