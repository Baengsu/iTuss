import { useEffect, useState } from "react";
import "./App.css";

// ============================
// 타입 & 상수
// ============================
const DEFAULT_PORT = "8080" as const;
const TOAST_DURATION = 2000; // ms

const RESOLUTIONS = ["540p", "720p", "1080p"] as const;
type Resolution = (typeof RESOLUTIONS)[number];

const FPS_OPTIONS = [30, 60] as const;
type Fps = (typeof FPS_OPTIONS)[number];

// ============================
// 유틸 함수
// ============================

/** 브라우저 기준 기본 스트림 주소 계산 (IPv4 / IPv6 대응) */
function getDefaultStreamAddress(): string {
  if (typeof window === "undefined") return "";

  try {
    const { hostname } = window.location;
    const isIPv6 = hostname.includes(":");
    const hostForDisplay = isIPv6 ? `[${hostname}]` : hostname;

    return `http://${hostForDisplay}:${DEFAULT_PORT}`;
  } catch {
    // 실패 시 샘플 IP 사용
    return "http://192.168.0.10:8080";
  }
}

// ============================
// 공통 훅: 토스트
// ============================

function useToast() {
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), TOAST_DURATION);
  };

  return { toast, showToast };
}

// ============================
// 메인 컴포넌트
// ============================

function App() {
  const [streamAddress, setStreamAddress] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const [resolution, setResolution] = useState<Resolution>("720p");
  const [fps, setFps] = useState<Fps>(30);

  const { toast, showToast } = useToast();

  // 📡 IP / 포트 자동 세팅 (웹 프리뷰용)
  useEffect(() => {
    setStreamAddress(getDefaultStreamAddress());
  }, []);

  // 주소 클릭 → 클립보드 복사
  const handleCopyAddress = async () => {
    if (!streamAddress) return;

    try {
      await navigator.clipboard.writeText(streamAddress);
      showToast("스트림 주소가 복사되었습니다.");
    } catch {
      showToast("복사에 실패했습니다. 직접 복사해주세요.");
    }
  };

  // Start / Stop 버튼 (지금은 UI 상태만, 실제 앱에선 여기서 방송 시작/종료 붙이면 됨)
  const handleToggleStreaming = () => {
    const next = !isStreaming;
    setIsStreaming(next);
    showToast(next ? "스트리밍을 시작했습니다." : "스트리밍을 중지했습니다.");
  };

  const handleResolutionChange = (value: Resolution) => {
    setResolution(value);
    showToast(`해상도: ${value}`);
  };

  const handleFpsChange = (value: Fps) => {
    setFps(value);
    showToast(`FPS: ${value}fps`);
  };

  return (
    <div className="app-root">
      {/* 상단 헤더 */}
      <header className="app-header">
        <div className="app-logo" />
        <div className="app-title">
          <h1>iTuss</h1>
          <p>Stream your iPhone screen anywhere</p>
        </div>
      </header>

      <main className="app-main">
        {/* 1) Stream Address 카드 */}
        <section className="card">
          <div className="card-header">
            <h2>Stream Address</h2>
            <span
              className={`status-chip ${
                isStreaming ? "status-on" : "status-off"
              }`}
            >
              {isStreaming ? "Streaming" : "Not Streaming"}
            </span>
          </div>

          <button
            type="button"
            className="address-pill"
            onClick={handleCopyAddress}
          >
            <span className="address-text">
              {streamAddress || "주소를 준비 중입니다..."}
            </span>
          </button>

          <p className="card-caption">
            같은 네트워크에 있는 브라우저에서 이 주소를 열면
            실시간으로 화면을 시청할 수 있습니다.
          </p>
        </section>

        {/* 2) How to use 영역 */}
        <section className="card">
          <h2 className="card-title">How to use</h2>
          <ol className="howto-list">
            <li>
              <div className="howto-badge">1</div>
              <div>
                <h3>Connect to Wi-Fi</h3>
                <p>
                  시청 디바이스에 송출 디바이스의 네트워크를 연결합니다.
                  <br />
                  ※ iPhone → 설정 → 개인용 핫스팟
                </p>
              </div>
            </li>
            <li>
              <div className="howto-badge">2</div>
              <div>
                <h3>Recording Settings</h3>
                <p>
                  하단의 Stream Quality에서 해상도와 FPS를 선택한 뒤,
                  Start Mirroring 버튼을 눌러 송출을 시작합니다.
                </p>
              </div>
            </li>
            <li>
              <div className="howto-badge">3</div>
              <div>
                <h3>Open Stream URL</h3>
                <p>시청 기기 브라우저에서 위 스트림 주소를 엽니다.</p>
              </div>
            </li>
            <li>
              <div className="howto-badge">4</div>
              <div>
                <h3>Caution!</h3>
                <p>미러링 사용에 따른 모든 법적 책임은 사용자에게 있습니다.</p>
              </div>
            </li>
          </ol>
        </section>

        {/* 3) Stream Quality 설정 */}
        <section className="card">
          <h2 className="card-title">Stream Quality</h2>

          <div className="quality-group">
            <p className="quality-label">Resolution</p>
            <div className="segmented">
              {RESOLUTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleResolutionChange(v)}
                  className={`segmented-btn ${
                    resolution === v ? "active" : ""
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="quality-group">
            <p className="quality-label">Frame rate</p>
            <div className="segmented">
              {FPS_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleFpsChange(v)}
                  className={`segmented-btn ${fps === v ? "active" : ""}`}
                >
                  {v} fps
                </button>
              ))}
            </div>
          </div>

          <p className="quality-summary">
            현재 설정: <strong>{resolution}</strong> /{" "}
            <strong>{fps}fps</strong>
          </p>
        </section>
      </main>

      {/* 하단 Start Mirroring 버튼 */}
      <footer className="app-footer">
        <button
          type="button"
          className={`primary-btn ${isStreaming ? "btn-danger" : ""}`}
          onClick={handleToggleStreaming}
        >
          {isStreaming ? "Stop Mirroring" : "Start Mirroring"}
        </button>
      </footer>

      {/* 토스트 */}
      {toast && (
        <div className="toast">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

export default App;
