// App.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
} from "react-native";

// 🔗 백엔드 서버 주소 (지금은 로컬 PC에서 실행 중)
const API_BASE = "http://localhost:4000";

export default function App() {
  // ✅ 계정 관련 상태
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("1234");
  const [token, setToken] = useState(null); // 로그인 성공 시 저장되는 JWT 토큰

  // ✅ 디바이스 / 스트림 관련 상태
  const [deviceId, setDeviceId] = useState("my-iphone-01");
  const [streamUrl, setStreamUrl] = useState("");

  // ✅ 공통 로딩 상태
  const [loading, setLoading] = useState(false);

  // ✅ 화면에 표시할 메시지 (성공/실패)
  const [message, setMessage] = useState("");        // 메시지 내용
  const [messageType, setMessageType] = useState(""); // 'success' | 'error'

  // ✅ 메시지 표시 유틸 함수
  function showMessage(type, text) {
    setMessageType(type);  // 'success' 또는 'error'
    setMessage(text);

    // 3초 후 메시지 자동으로 사라지게
    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  // =========================
  // 1) 회원가입
  // =========================
  async function signup() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.ok) {
        // 실패 시: 빨간 메시지
        showMessage("error", data.error || "회원가입 실패");
      } else {
        // 성공 시: 초록 메시지
        showMessage("success", "회원가입 성공!");
      }
    } catch (e) {
      console.error(e);
      showMessage("error", "서버 연결 실패 (회원가입)");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // 2) 로그인
  // =========================
  async function login() {
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
      } else {
        setToken(data.token);
        showMessage("success", "로그인 성공! 토큰 저장 완료");
      }
    } catch (e) {
      console.error(e);
      showMessage("error", "서버 연결 실패 (로그인)");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // 3) 디바이스 등록 (1계정 1디바이스)
  // =========================
  async function registerDevice() {
    if (!token) {
      showMessage("error", "먼저 로그인부터 해줘!");
      return;
    }

    try {
      setLoading(true);
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
      } else {
        showMessage("success", `디바이스 등록 완료! (deviceId: ${data.deviceId})`);
      }
    } catch (e) {
      console.error(e);
      showMessage("error", "서버 연결 실패 (디바이스 등록)");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // 4) 내 스트림 URL 조회
  // =========================
  async function fetchStreamUrl() {
    if (!token) {
      showMessage("error", "먼저 로그인부터 해줘!");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/stream-url`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!data.ok) {
        showMessage("error", data.error || "스트림 URL 조회 실패");
      } else {
        setStreamUrl(data.streamUrl || "");
        showMessage("success", "스트림 URL 가져오기 성공!");
      }
    } catch (e) {
      console.error(e);
      showMessage("error", "서버 연결 실패 (스트림 조회)");
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // 화면 렌더링
  // =========================
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        backgroundColor: "#f4f4f4",
      }}
    >
      {/* 상단 설명 영역 */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
          📌 계정 / 디바이스 / 스트림 테스트
        </Text>
        <Text style={{ color: "#555" }}>
          1) 회원가입 → 2) 로그인 → 3) 디바이스 등록 → 4) 스트림 URL 조회
        </Text>
      </View>

      {/* 1. 계정 정보 입력 박스 */}
      <View
        style={{
          marginBottom: 24,
          padding: 16,
          backgroundColor: "white",
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
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
            marginBottom: 12,
            backgroundColor: "white",
          }}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Button title="회원가입" onPress={signup} disabled={loading} />
          <Button title="로그인" onPress={login} disabled={loading} />
        </View>
      </View>

      {/* 2. 디바이스 등록 박스 */}
      <View
        style={{
          marginBottom: 24,
          padding: 16,
          backgroundColor: "white",
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          2. 디바이스 등록
        </Text>

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

        <Button
          title="디바이스 등록"
          onPress={registerDevice}
          disabled={loading}
        />
      </View>

      {/* 3. 스트림 URL 조회 박스 */}
      <View
        style={{
          marginBottom: 24,
          padding: 16,
          backgroundColor: "white",
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          3. 스트림 URL 확인
        </Text>

        <Button
          title="내 스트림 URL 가져오기"
          onPress={fetchStreamUrl}
          disabled={loading}
        />

        <Text style={{ marginTop: 12, color: "#333" }}>
          현재 토큰: {token ? "✅ 있음" : "❌ 없음"}
        </Text>
        <Text style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
          (실서비스에서는 토큰은 화면에 안 보여주고, 안전한 저장소에 넣습니다)
        </Text>

        <Text style={{ marginTop: 16, fontWeight: "bold" }}>streamUrl:</Text>
        <Text selectable style={{ marginTop: 4, color: "#0066cc" }}>
          {streamUrl || "(아직 없음)"}
        </Text>
      </View>

      {/* 로딩 중 표시 */}
      {loading && (
        <Text style={{ textAlign: "center", marginTop: 8 }}>로딩 중...</Text>
      )}

      {/* ✅ 하단 메시지 박스 (성공/실패) */}
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
