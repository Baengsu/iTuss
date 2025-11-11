# iTuss — iPhone → Web 브라우저 미러링

> **iTuss**는 iOS(iPhone) 화면을 웹브라우저로 미러링하고, 오디오 출력 및 기본적인 양방향 입력(예: 클릭/탭 전달)을 지향하는 오픈 프로젝트입니다.

<p align="left">
  <img alt="status" src="https://img.shields.io/badge/status-alpha-blue">
  <img alt="platform" src="https://img.shields.io/badge/platform-iOS%20%7C%20Web-000000">
  <img alt="license" src="https://img.shields.io/badge/license-TBD-lightgrey">
</p>

---

## ✨ 핵심 특징

- **저지연 미러링**: iPhone 화면을 실시간에 가깝게 브라우저로 전송
- **오디오 전송**: 시스템/앱 오디오(가능 시) 또는 마이크 입력 전달
- **양방향 동작**: 브라우저 → iPhone 기본 입력 신호(탭/키보드 등) 전달 설계
- **‘동영상 스트리밍’ 오인 방지 연구**: 단순 미러링처럼 보이도록 렌더링/전송 전략 실험 중 *(연구 단계)*

> **유의**: 스트리밍 서비스 약관, DRM, 각 앱/웹사이트의 이용정책을 준수해야 합니다. iTuss는 합법적이고 개인적인 개발·테스트 목적을 지향합니다.

---

## 🧭 프로젝트 개요

아키텍처 개요는 아래 Mermaid 다이어그램을 참고하세요. (GitHub에서 기본 렌더링 지원)

```mermaid
flowchart TB
  subgraph I[iPhone App]
    A[화면 캡처<br/>(ReplayKit/ScreenCaptureKit)]
    B[오디오 캡처<br/>(가능 시)]
    C[인코딩 & 송출<br/>(WebRTC)]
  end

  subgraph S[신호 서버]
    S1[피어 연결 중개<br/>세션 관리]
  end

  subgraph W[웹 브라우저 클라이언트]
    W1[영상/오디오 재생<br/>(HTML5/Media/WebRTC)]
    W2[입력 이벤트 수집 → iPhone 전달<br/>(양방향)]
  end

  A --> C
  B --> C
  C -- "Signaling<br/>(WebSocket 등)" --- S1
  C -- "SRTP/DTLS<br/>(미디어 채널)" --- W1
  W2 -- "입력 이벤트" --- C
  S1 --- W1
  S1 --- W2
```

---

## 📦 요구 사항

- **iOS**: iOS 15+ 권장 *(하위 버전 호환은 미확인)*  
- **브라우저**: 최신 Chrome/Edge/Safari 등 WebRTC 지원 브라우저  
- **개발 환경**: iOS 빌드에는 **macOS + Xcode**가 필요함 *(확실)*

---

## 🚀 빠른 시작 (예시)

> 아래는 예시 흐름입니다. 실제 저장소 구조/스크립트와 다를 수 있습니다.

### 1) iPhone 앱 빌드
```bash
# macOS에서
git clone https://github.com/your-org/ituss.git
cd ituss/ios

# (필요 시) CocoaPods 등 의존성 설치
pod install

# Xcode로 열어 빌드/실행
open iTuss.xcworkspace
```

### 2) 신호 서버 실행 (예: Node.js 기반)
```bash
cd server
cp .env.example .env   # 환경변수 설정
npm install
npm run start
```

### 3) 웹 클라이언트 실행
```bash
cd web
npm install
npm run dev   # 예: http://localhost:5173
```

### 4) 연결
1. 브라우저에서 웹 클라이언트 접속 → “Connect”  
2. iPhone 앱에서 서버 주소를 입력하고 “Start Mirroring”  
3. 영상/오디오 및 입력 이벤트 왕복 동작 확인

---

## ⚙️ 설정 (예시)

| 키 | 설명 |
|---|---|
| `SIGNALING_URL` | 신호 서버 WebSocket 주소 |
| `BITRATE_TARGET` | 비디오 비트레이트 목표값 |
| `AUDIO_ENABLED` | 오디오 전송 사용 여부 |
| `INPUT_BRIDGE` | 브라우저 입력 전달 기능 on/off |

> 키 이름/위치/형식은 실제 구현에 따라 달라질 수 있습니다.

---

## 🔐 보안 & 프라이버시

- 전송 채널은 **WebRTC(SRTP/DTLS)** 등 **암호화**된 경로 사용 권장  
- 외부 노출 시 **인증/권한** 적용 (토큰/세션)  
- 녹화/로그 사용 시 **개인(민감)정보** 취급에 주의

---

## 🧪 한계 및 알려진 이슈

- 일부 앱/콘텐츠는 **DRM/보안 정책**으로 화면/오디오 캡처가 제한될 수 있음  
- 네트워크 품질에 따라 **지연/프레임 드랍** 가능  
- 브라우저/플랫폼별 **WebRTC 편차**로 호환성 이슈 발생 가능  
- iOS 정책/OS 업데이트에 따라 캡처 API 동작 변화 가능

---

## 🛣️ 로드맵 (예시)

- [ ] 저지연 모드 튜닝(네트워크 적응형 비트레이트)  
- [ ] 오디오/영상 동기 개선  
- [ ] 입력 브리지 확장(가상 키보드, 제스처 매핑)  
- [ ] 미러링 ‘영상 판별’ 오인 방지 전략 고도화 *(연구 중)*  
- [ ] 간편 설치 스크립트/도커 환경 제공

---

## 🤝 기여하기

1. 이슈 등록 시 재현 단계와 기대/실제 동작 요약  
2. PR은 작은 단위로, 스크린샷/GIF/로그 첨부 환영  
3. 코드 스타일/커밋 컨벤션은 저장소 가이드에 맞춰 주세요 *(가이드 미정 시 일반 컨벤션 권장)*

---

## ❓ FAQ

- **Q. Xcode 없이 Windows에서 iOS 앱을 바로 빌드할 수 있나요?**  
  **A. 불가합니다.** iOS 앱 빌드는 **macOS + Xcode**가 필요합니다. *(확실)*

- **Q. 브라우저에서 ‘동영상’으로 인식되는 걸 완전히 막을 수 있나요?**  
  **A. 보장 불가.** 사이트/플레이어별 정책과 감지 로직이 달라 완전한 회피는 **확실하지 않음**입니다. *(연구/개선 중)*

- **Q. 상용 서비스에 바로 써도 되나요?**  
  **A. 권장하지 않습니다.** 보안/안정성/정책 검토가 선행되어야 하며, 해당 서비스 약관과 법규를 준수해야 합니다.

---

## 📄 라이선스

TBD *(미정)*

---

## 📬 연락

도움/제안/문의: **w1thy0uplz@gmail.com**

---

### 🔎 확인 상태 메모

- iOS 빌드에 macOS+Xcode 필요 — **확실**  
- 신호 서버/웹 클라이언트 구성 및 명령어 — **예시 수준(확실하지 않음)**  
- ‘동영상 판별’ 오인 방지 완전 보장 — **불가(연구 중, 확실하지 않음)**
