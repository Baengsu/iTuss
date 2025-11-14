// App.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  Platform,
} from "react-native";

// 🔗 백엔드 서버 주소 (클라우드 주소 사용)
const API_BASE = "https://ituss.onrender.com/api";

export default function App() {
  // ✅ 전체 화면(페이지) 상태: 'auth' | 'signupDevice' | 'stream'
  const [page, setPage] = useState("auth");

  // ✅ 계정 정보 상태
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("1234");
  const [token, setToken] = useState(null); // 로그인 후 받아오는 JWT 토큰

  // ✅ 디바이스 / 스트림 상태
  const [deviceId, setDeviceId] = useState("my-iphone-01");
  const [streamUrl, setStreamUrl] = useState("");

  // ✅ 공통 로딩 / 메시지 상태
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");        // 메시지 내용
  const [messageType, setMessageType] = useState(""); // 'success' | 'error'

  // -----------------------------
  // 공통 메시지 유틸
  // -----------------------------
  function showMessage(type, text) {
    setMessageType(type); // 'success' 또는 'error'
    setMessage(text);

    // 3초 후 자동 삭제
    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  // ==========================================================
  // 1. 첫 화면: 계정정보 화면에서 사용하는 로그인 로직
  // ==========================================================
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
      showMessage("success", "로그인 성공! 스트림 화면으로 이동합니다.");
      setPage("stream"); // 👉 스트림 화면으로 이동
    } catch (e) {
      console.error(e);
      showMessage("error", "서버 연결 실패 (로그인)");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // 2. 회원가입 + 디바이스 등록 화면에서 쓰는 로직
  // ==========================================================

  // (1) 회원가입만 수행
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

      showMessage("success", "회원가입 성공! 이제 디바이스를 등록하세요.");
    } catch (e) {
      console.error(e);
      showMessage("error", "서버 연결 실패 (회원가입)");
    } finally {
      setLoading(false);
    }
  }

  // (2) 토큰이 없으면 먼저 로그인 → 그다음 디바이스 등록
  async function registerDeviceWithAutoLogin() {
    try {
      setLoading(true);

      // 1) 토큰이 없으면 자동 로그인 시도
      if (!token) {
        const loginRes = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginRes.json();

        if (!loginData.ok || !loginData.token) {
          showMessage(
            "error",
            loginData.error || "로그인 실패 (디바이스 등록 전 단계)"
          );
          return; // 로그인 실패 시 디바이스 등록 진행 안 함
        }

        setToken(loginData.token);
        showMessage("success", "로그인 성공! 디바이스 등록을 진행합니다.");
      }

      // 2) 디바이스 등록
      const res = await fetch(`${API_BASE}/device/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ deviceId }),
      });

      const data = await res.json();

      if (!data.ok) {
        showMessage("error", data.error || "디바이스 등록 실패");
        return;
      }

      showMessage("success", `디바이스 등록 완료! (deviceId: ${data.deviceId})`);
    } catch (e) {
      console.error(e);
      showMessage("error", "서버 연결 실패 (디바이스 등록)");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // 3. 스트림 URL / 영상 재생 화면에서 사용하는 로직
  // ==========================================================
  async function fetchAndShowStreamUrl() {
    if (!token) {
      showMessage("error", "먼저 로그인부터 해주세요.");
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
        return;
      }

      setStreamUrl(data.streamUrl || "");
      showMessage("success", "스트림 URL 가져오기 성공!");
    } catch (e) {
      console.error(e);
      showMessage("error", "서버 연결 실패 (스트림 조회)");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // 각 화면(페이지)별 UI 정의
  // ==========================================================

  // 1) 첫 화면: 계정 정보 (회원가입/로그인 진입)
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

        <View
          style={{
            flexDirection: "column",
            gap: 8,
          }}
        >
          {/* 회원가입 페이지로 이동 */}
          <View style={{ marginBottom: 8 }}>
            <Button
              title="회원가입 화면으로 이동 (디바이스 등록 포함)"
              onPress={() => setPage("signupDevice")}
              disabled={loading}
            />
          </View>

          {/* 로그인 후 스트림 화면으로 이동 */}
          <Button
            title="로그인 후 스트림 보기"
            onPress={loginAndGoStream}
            disabled={loading}
          />
        </View>
      </View>
    );
  }

  // 2) 회원가입 + 디바이스 등록 화면
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

        {/* 이메일 / 비밀번호 재입력 가능 */}
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

        {/* 회원가입 버튼 */}
        <View style={{ marginBottom: 16 }}>
          <Button
            title="회원가입"
            onPress={signupOnly}
            disabled={loading}
          />
        </View>

        {/* 디바이스 ID + 등록 */}
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

        {/* 계정 화면으로 돌아가기 */}
        <Button
          title="← 계정 정보 화면으로 돌아가기"
          onPress={() => setPage("auth")}
          disabled={loading}
        />
      </View>
    );
  }

  // 3) 스트림 URL / 영상 재생 화면
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
          3. 스트림 URL / 영상 재생
        </Text>

        <Text style={{ marginBottom: 8, color: "#666" }}>
          현재 이메일: {email || "(미입력)"}
        </Text>
        <Text style={{ marginBottom: 12, color: "#666" }}>
          (먼저 디바이스를 등록해두지 않으면, 스트림 URL 조회 시 에러가 날 수 있습니다.)
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Button
            title="스트림 URL 가져오기"
            onPress={fetchAndShowStreamUrl}
            disabled={loading}
          />
        </View>

        {/* 스트림 URL 텍스트 표시 */}
        <Text style={{ marginTop: 8, fontWeight: "bold" }}>streamUrl:</Text>
        <Text selectable style={{ marginTop: 4, color: "#0066cc" }}>
          {streamUrl || "(아직 없음)"}
        </Text>

        {/* 웹 전용 비디오 플레이어 */}
        {streamUrl ? (
          <View style={{ marginTop: 16 }}>
            <Text style={{ marginBottom: 4 }}>미리보기 (웹 전용):</Text>
            {Platform.OS === "web" && (
              <video
                src={streamUrl}
                controls
                autoPlay
                style={{
                  width: "100%",
                  maxWidth: 480,
                  borderRadius: 8,
                  outline: "none",
                }}
              />
            )}
          </View>
        ) : null}

        {/* 네비게이션 버튼들 */}
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

  // ==========================================================
  // 메인 렌더링
  // ==========================================================
  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 24,
        backgroundColor: "#f4f4f4",
      }}
    >
      {/* 상단 공통 타이틀 */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
          📌 iOS 화면 공유 서비스 플로우 테스트
        </Text>
        <Text style={{ color: "#555" }}>
          1) 계정 정보 → 2) 회원가입/디바이스 등록 → 3) 스트림 URL/영상 재생
        </Text>
      </View>

      {/* 현재 페이지에 따라 다른 화면 렌더링 */}
      {page === "auth" && renderAuthPage()}
      {page === "signupDevice" && renderSignupDevicePage()}
      {page === "stream" && renderStreamPage()}

      {/* 로딩 중 표시 */}
      {loading && (
        <Text style={{ textAlign: "center", marginTop: 8 }}>로딩 중...</Text>
      )}

      {/* 하단 메시지 박스 */}
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
