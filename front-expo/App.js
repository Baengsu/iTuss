// App.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Platform,
} from "react-native";

// 🔗 백엔드 서버 주소
const API_BASE = "https://ituss.onrender.com";

// LiveKit Web SDK (웹에서만 사용)
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
} from "livekit-client";

export default function App() {
  // ========================================================
  // 상태 정의
  // ========================================================
  const [page, setPage] = useState("auth");

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("1234");

  const [token, setToken] = useState(null);
  const [deviceId, setDeviceId] = useState("my-iphone-01");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // LiveKit room + video ref
  const roomRef = useRef(null);
  const videoRef = useRef(null);

  // ========================================================
  // 메시지 출력 유틸
  // ========================================================
  function showMessage(type, text) {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  }

  // ========================================================
  // 1) 로그인 → Stream 페이지로 이동
  // ========================================================
  async function loginAndGoStream() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.ok || !data.token) {
        showMessage("error", data.error || "로그인 실패");
        return;
      }

      setToken(data.token);
      showMessage("success", "로그인 성공!");
      setPage("stream");
    } catch (e) {
      showMessage("error", "서버 연결 실패");
    } finally {
      setLoading(false);
    }
  }

  // ========================================================
  // 2) 회원가입
  // ========================================================
  async function signupOnly() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!data.ok) {
        showMessage("error", data.error || "회원가입 실패");
        return;
      }

      showMessage("success", "회원가입 성공! 디바이스 등록 진행하세요.");
    } catch (e) {
      showMessage("error", "서버 연결 실패 (회원가입)");
    } finally {
      setLoading(false);
    }
  }

  // ========================================================
  // 3) 디바이스 등록 (자동 로그인 포함)
  // ========================================================
  async function registerDeviceWithAutoLogin() {
    try {
      setLoading(true);

      // 토큰 없다 → 로그인 먼저
      if (!token) {
        const loginRes = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginRes.json();
        if (!loginData.ok || !loginData.token) {
          showMessage("error", "로그인 실패 (자동 로그인)");
          return;
        }

        setToken(loginData.token);
      }

      // 디바이스 등록
      const res = await fetch(`${API_BASE}/device/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId }),
      });

      const data = await res.json();
      if (!data.ok) {
        showMessage("error", data.error || "디바이스 등록 실패");
        return;
      }

      showMessage("success", "디바이스 등록 완료!");
    } catch (e) {
      showMessage("error", "서버 연결 실패 (디바이스 등록)");
    } finally {
      setLoading(false);
    }
  }

  // ========================================================
  // 4) LiveKit WebRTC 스트림 시청
  // ========================================================
  async function connectLiveKit() {
    if (Platform.OS !== "web") {
      showMessage("error", "웹 환경에서만 시청 가능합니다.");
      return;
    }
    if (!token) {
      showMessage("error", "먼저 로그인하세요.");
      return;
    }

    try {
      setLoading(true);

      // 🔥 백엔드에서 LiveKit 토큰 요청
      const res = await fetch(`${API_BASE}/livekit/token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.ok) {
        showMessage("error", data.error || "LiveKit 토큰 조회 실패");
        return;
      }

      const { wsUrl, roomName } = data;

      // 🔥 LiveKit Room 생성
      const room = new Room();
      roomRef.current = room;

      // 🔥 이벤트: remote participant 생기면 → 비디오 track 자동 표시
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Video) {
          const mediaStream = new MediaStream();
          mediaStream.addTrack(track.mediaStreamTrack);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.play().catch(() => {});
          }
        }
      });

      // 🔥 LiveKit 서버에 연결
      await room.connect(wsUrl, data.token);

      showMessage("success", "LiveKit 연결 성공!");
    } catch (e) {
      console.error(e);
      showMessage("error", "LiveKit 연결 실패");
    } finally {
      setLoading(false);
    }
  }

  // ========================================================
  // 페이지 UI: Stream 페이지
  // ========================================================
  function renderStreamPage() {
    return (
      <View
        style={{
          padding: 16,
          backgroundColor: "white",
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
          3. 실시간 스트림 시청
        </Text>

        {Platform.OS === "web" ? (
          <Button title="LiveKit 스트림 접속" onPress={connectLiveKit} />
        ) : (
          <Text>⚠️ 실시간 스트림은 웹에서만 동작합니다.</Text>
        )}

        {/* WebRTC video */}
        <View style={{ marginTop: 16 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls
            style={{ width: "100%", maxWidth: 480, borderRadius: 8 }}
          />
        </View>
      </View>
    );
  }

  // ========================================================
  //  UI 렌더링
  // ========================================================
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        backgroundColor: "#f4f4f4",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 12 }}>
        📌 iTuss 화면 공유 / LiveKit 시청
      </Text>

      {page === "auth" && (
        <View>
          <Text>이메일</Text>
          <TextInput value={email} onChangeText={setEmail} />

          <Text>비밀번호</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry />

          <Button title="회원가입 페이지 →" onPress={() => setPage("signup")} />
          <Button title="로그인 후 스트림 시청 →" onPress={loginAndGoStream} />
        </View>
      )}

      {page === "signup" && (
        <View>
          <Button title="회원가입" onPress={signupOnly} />
          <Button title="디바이스 등록" onPress={() => setPage("device")} />
        </View>
      )}

      {page === "device" && (
        <View>
          <Text>deviceId</Text>
          <TextInput value={deviceId} onChangeText={setDeviceId} />
          <Button
            title="디바이스 등록"
            onPress={registerDeviceWithAutoLogin}
          />
        </View>
      )}

      {page === "stream" && renderStreamPage()}

      {message !== "" && (
        <Text
          style={{
            marginTop: 20,
            padding: 10,
            backgroundColor:
              messageType === "success" ? "#d8ffd8" : "#ffd8d8",
            color: "#333",
          }}
        >
          {message}
        </Text>
      )}
    </ScrollView>
  );
}
