// App.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Platform,
} from "react-native";

// 🔗 백엔드 주소 (Render 기준)
// 로컬에서만 테스트할 땐 "http://localhost:4000" 으로 바꿔도 됨
const API_BASE = "https://ituss.onrender.com";

// 🔥 LiveKit Web SDK (웹에서만 실제로 동작)
import { Room, RoomEvent, Track } from "livekit-client";

export default function App() {
  // ==========================================
  // 상태 관리
  // ==========================================
  const [page, setPage] = useState("auth"); // 'auth' | 'signupDevice' | 'stream'

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("1234");
  const [token, setToken] = useState(null); // 백엔드 JWT

  const [deviceId, setDeviceId] = useState("my-iphone-01");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' | 'error'

  // LiveKit 관련
  const [lkRoomName, setLkRoomName] = useState("");
  const [lkConnected, setLkConnected] = useState(false);

  const roomRef = useRef(null);
  const videoRef = useRef(null);

  // ==========================================
  // 메시지 유틸
  // ==========================================
  function show(type, text) {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  }

  // ==========================================
  // 로그인 → 스트림 페이지로 이동
  // ==========================================
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
        return show("error", data.error || "로그인 실패");
      }

      setToken(data.token);
      setPage("stream");
      show("success", "로그인 성공! 스트림 화면으로 이동합니다.");
    } catch (e) {
      console.error(e);
      show("error", "서버 연결 실패 (로그인)");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // 회원가입
  // ==========================================
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
        return show("error", data.error || "회원가입 실패");
      }

      show("success", "회원가입 성공! 이제 디바이스를 등록하세요.");
    } catch (e) {
      console.error(e);
      show("error", "서버 연결 실패 (회원가입)");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // 디바이스 등록 (로그인 필요)
  // ==========================================
  async function registerDeviceWithAutoLogin() {
    try {
      setLoading(true);

      let currentToken = token;

      // 토큰 없으면 로그인 먼저
      if (!currentToken) {
        const loginRes = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const loginData = await loginRes.json();

        if (!loginData.ok || !loginData.token) {
          return show(
            "error",
            loginData.error || "로그인 실패 (디바이스 등록 전 단계)"
          );
        }

        currentToken = loginData.token;
        setToken(loginData.token);
        show("success", "로그인 성공! 디바이스 등록을 진행합니다.");
      }

      const res = await fetch(`${API_BASE}/device/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ deviceId }),
      });

      const data = await res.json();
      if (!data.ok) {
        return show("error", data.error || "디바이스 등록 실패");
      }

      show("success", `디바이스 등록 완료! (deviceId: ${data.deviceId})`);
    } catch (e) {
      console.error(e);
      show("error", "서버 연결 실패 (디바이스 등록)");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // LiveKit 연결
  // ==========================================
  async function connectLiveKit() {
    if (Platform.OS !== "web") {
      show("error", "실시간 시청은 웹 브라우저에서만 지원됩니다.");
      return;
    }
    if (!token) {
      show("error", "먼저 로그인부터 해주세요.");
      return;
    }

    try {
      setLoading(true);

      // 1) 백엔드에서 LiveKit 정보 받아오기
      const res = await fetch(`${API_BASE}/livekit-info`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!data.ok) {
        return show("error", data.error || "LiveKit 토큰 조회 실패");
      }

      const { wsUrl, roomName, token: lkToken } = data;
      setLkRoomName(roomName);

      // 2) 기존 연결 정리
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // 3) LiveKit Room 생성
      const room = new Room();
      roomRef.current = room;

      // 리모트 비디오 트랙 구독
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.attach(videoRef.current);
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Video && videoRef.current) {
          track.detach(videoRef.current);
        }
      });

      // 4) LiveKit 방 연결
      await room.connect(wsUrl, lkToken);

      setLkConnected(true);
      show("success", `LiveKit 방 연결 성공! (room: ${roomName})`);
    } catch (e) {
      console.error(e);
      show("error", "LiveKit 연결 실패 (토큰/권한 문제일 수 있음)");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // LiveKit 연결 해제
  // ==========================================
  function disconnectLiveKit() {
    try {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setLkConnected(false);
      show("success", "LiveKit 연결 해제 완료");
    } catch (e) {
      console.error(e);
    }
  }

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  // ==========================================
  // 화면 1) 계정 정보
  // ==========================================
  function renderAuthPage() {
    return (
      <View
        style={{
          marginBottom: 24,
          padding: 16,
          backgroundColor: "white",
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
          1. 계정 정보
        </Text>

        <Text>이메일</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginBottom: 12,
            backgroundColor: "white",
          }}
        />

        <Text>비밀번호</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginBottom: 16,
            backgroundColor: "white",
          }}
        />

        <View style={{ flexDirection: "column", gap: 8 }}>
          <View style={{ marginBottom: 8 }}>
            <Button
              title="회원가입/디바이스 등록 화면으로 이동"
              onPress={() => setPage("signupDevice")}
              disabled={loading}
            />
          </View>
          <Button
            title="로그인 후 스트림 화면으로 이동"
            onPress={loginAndGoStream}
            disabled={loading}
          />
        </View>
      </View>
    );
  }

  // ==========================================
  // 화면 2) 회원가입 + 디바이스 등록
  // ==========================================
  function renderSignupDevicePage() {
    return (
      <View
        style={{
          marginBottom: 24,
          padding: 16,
          backgroundColor: "white",
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
          2. 회원가입 + 디바이스 등록
        </Text>

        <Text style={{ marginBottom: 8, color: "#666" }}>
          첫 화면에서 입력한 이메일/비밀번호를 그대로 사용해도 되고,
          여기서 수정해도 됩니다.
        </Text>

        <Text>이메일</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginBottom: 12,
            backgroundColor: "white",
          }}
        />

        <Text>비밀번호</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginBottom: 16,
            backgroundColor: "white",
          }}
        />

        <View style={{ marginBottom: 16 }}>
          <Button title="회원가입" onPress={signupOnly} disabled={loading} />
        </View>

        <Text>deviceId</Text>
        <TextInput
          value={deviceId}
          onChangeText={setDeviceId}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
            marginBottom: 12,
            backgroundColor: "white",
          }}
        />

        <View style={{ marginBottom: 16 }}>
          <Button
            title="디바이스 등록 (필요 시 자동 로그인)"
            onPress={registerDeviceWithAutoLogin}
            disabled={loading}
          />
        </View>

        <Button
          title="← 계정 정보 화면으로 돌아가기"
          onPress={() => setPage("auth")}
          disabled={loading}
        />
      </View>
    );
  }

  // ==========================================
  // 화면 3) LiveKit 시청
  // ==========================================
  function renderStreamPage() {
    return (
      <View
        style={{
          marginBottom: 24,
          padding: 16,
          backgroundColor: "white",
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>
          3. LiveKit 실시간 스트림 시청
        </Text>

        <Text style={{ marginBottom: 4, color: "#666" }}>
          현재 이메일: {email}
        </Text>
        <Text style={{ marginBottom: 12, color: "#666" }}>
          디바이스 ID: {deviceId}
        </Text>

        {Platform.OS === "web" ? (
          <>
            <View style={{ marginBottom: 8 }}>
              <Button
                title={lkConnected ? "LiveKit 다시 연결" : "LiveKit 방 접속"}
                onPress={connectLiveKit}
                disabled={loading}
              />
            </View>

            {lkConnected && (
              <View style={{ marginBottom: 8 }}>
                <Button
                  title="LiveKit 연결 해제"
                  onPress={disconnectLiveKit}
                  disabled={loading}
                />
              </View>
            )}

            <Text style={{ marginTop: 12, marginBottom: 4 }}>
              현재 방: {lkRoomName || "(없음)"}
            </Text>

            <View style={{ marginTop: 12 }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                controls
                style={{
                  width: "100%",
                  maxWidth: 480,
                  borderRadius: 8,
                  backgroundColor: "#000",
                }}
              />
            </View>
          </>
        ) : (
          <Text style={{ color: "#c00", marginTop: 8 }}>
            ⚠️ 실시간 시청은 현재 웹 브라우저에서만 지원됩니다.
          </Text>
        )}

        <View style={{ marginTop: 24 }}>
          <View style={{ marginBottom: 8 }}>
            <Button
              title="← 계정 정보 화면으로 돌아가기"
              onPress={() => setPage("auth")}
              disabled={loading}
            />
          </View>
          <Button
            title="회원가입/디바이스 등록 화면으로 이동"
            onPress={() => setPage("signupDevice")}
            disabled={loading}
          />
        </View>
      </View>
    );
  }

  // ==========================================
  // 메인 렌더링
  // ==========================================
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        backgroundColor: "#f4f4f4",
      }}
    >
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
          📌 iOS 화면 공유 서비스 - 시청 웹앱 (LiveKit Viewer)
        </Text>
        <Text style={{ color: "#555" }}>
          1) 계정 정보 → 2) 회원가입/디바이스 등록 → 3) 실시간 시청
        </Text>
      </View>

      {page === "auth" && renderAuthPage()}
      {page === "signupDevice" && renderSignupDevicePage()}
      {page === "stream" && renderStreamPage()}

      {loading && (
        <Text style={{ textAlign: "center", marginTop: 8 }}>로딩 중...</Text>
      )}

      {message !== "" && (
        <View
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            backgroundColor:
              messageType === "success" ? "#DFFFD8" : "#FFD8D8",
            borderLeftWidth: 6,
            borderLeftColor:
              messageType === "success" ? "#4CAF50" : "#F44336",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: messageType === "success" ? "#2E7D32" : "#C62828",
            }}
          >
            {message}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
