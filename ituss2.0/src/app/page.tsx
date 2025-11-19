"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Player from "@/components/Player";

/** 동의 화면 컴포넌트 */
function ConsentScreen({ onAgree }: { onAgree: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="w-full max-w-md bg-gray-900/90 rounded-2xl p-6 shadow-xl space-y-4">
        <h1 className="text-2xl font-semibold">화면 미러링 사용 안내</h1>

        <ul className="text-sm text-gray-200 list-disc pl-4 space-y-1">
          <li>이 브라우저에 현재 iPhone 화면이 그대로 표시됩니다.</li>
          <li>알림, 메신저 내용 등 민감한 정보도 함께 노출될 수 있습니다.</li>
          <li>공용 PC / 화면 공유 중인 상태에서는 사용에 주의해 주세요.</li>
          <li>스트리밍 중에는 네트워크 데이터가 소모됩니다.</li>
        </ul>

        <p className="text-xs text-gray-400">
          위 내용을 모두 이해하고 동의하는 경우에만 시청을 진행해 주세요.
        </p>

        <button
          onClick={onAgree}
          className="w-full mt-2 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 font-semibold"
        >
          동의 후 시청 진행
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const searchParams = useSearchParams();

  // 주소창에서 ?url=... 로 넘어온 스트림 주소
  const streamUrl = useMemo(
    () => (searchParams.get("url") || "").trim(),
    [searchParams]
  );

  const [agreed, setAgreed] = useState(false);

  // 1) url 자체가 안 들어온 경우
  if (!streamUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">유효한 스트림이 없습니다</h1>
          <p className="text-sm text-gray-300">
            브라우저 주소창에{" "}
            <code className="bg-gray-800 px-1 rounded">?url=스트림주소</code> 를
            붙여서 접속해야 합니다.
          </p>
          <p className="text-xs text-gray-500 break-all">
            예시: http://localhost:3000?url=http://192.168.0.5:8080/stream.m3u8
          </p>
        </div>
      </div>
    );
  }

  // 2) 주의사항 동의 전: 동의 화면만 보여주기
  if (!agreed) {
    return <ConsentScreen onAgree={() => setAgreed(true)} />;
  }

  // 3) 동의 후: 전체 화면 스트리밍
  return (
    <div className="w-screen h-screen bg-black">
      <Player url={streamUrl} />
    </div>
  );
}
