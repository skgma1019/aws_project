// frontend/src/App.jsx

import React from "react";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import { useState, useEffect } from "react";

import MapComponent from "./components/MapComponent";
import "./App.css";
import "./Header.css"; // 🚨 헤더 스타일 임포트

function App() {
  const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_API_KEY;

  // 훅 정의
  const [showLoadingMessage, setShowLoadingMessage] = useState(true);

  // 현재 MapComponent에는 '내 위치로' 버튼이 이미 구현되어 있습니다.
  // App.jsx의 헤더 버튼을 누르면 MapComponent의 기능을 호출해야 합니다.
  // 이 예시에서는 MapComponent를 Ref로 연결하지 않고 alert만 남겨두겠습니다.
  const handleMenuClick = () => {
    alert(
      "메뉴 버튼 클릭: 로그인/회원가입, 건의 사항, 마이페이지 등의 사이드바를 열어야 합니다."
    );
  };

  const handleCurrentLocationClick = () => {
    alert(
      "MapComponent 내부의 '내 위치로' 버튼 함수를 호출해야 합니다. (현재는 MapComponent의 내부 버튼을 사용하세요)"
    );
    // 실제 구현 시, MapComponent에 ref를 연결하여 moveToUserLocation 함수를 외부에서 호출해야 합니다.
  };

  const { loading, error } = useKakaoLoader({
    appkey: KAKAO_KEY || "TEMP_KEY",
    libraries: ["services"],
  });

  useEffect(() => {
    if (!KAKAO_KEY) return;
    if (!loading) {
      setShowLoadingMessage(false);
      return;
    }
    const timer = setTimeout(() => {
      setShowLoadingMessage(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [loading, KAKAO_KEY]);

  // 조건부 렌더링
  if (!KAKAO_KEY) {
    return <div>❌ 카카오 API 키(.env 파일)를 설정해 주세요.</div>;
  }

  if (loading || showLoadingMessage) {
    return (
      <div className="mobile-layout">
        <header className="app-header">
          <h1 className="header-title">지도 로딩 중...</h1>
        </header>
        <main
          className="app-main"
          style={{ textAlign: "center", marginTop: "50px" }}
        >
          지도 SDK 로딩 중... 잠시만 기다려주세요.
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-layout">
        <header className="app-header">
          <h1 className="header-title">오류 발생</h1>
        </header>
        <main
          className="app-main"
          style={{ textAlign: "center", color: "red", marginTop: "50px" }}
        >
          ❌ 지도 로딩 실패: 카카오 API 키 또는 등록 도메인을 확인하세요.
          <br /> 오류 상세: {error.message || "알 수 없는 오류"}
        </main>
      </div>
    );
  }

  // 로딩 성공 시 MapComponent 렌더링
  return (
    <div className="mobile-layout">
      {/* 1. 헤더 (고정) */}
      <header className="app-header">
        {/* 왼쪽: 메뉴 버튼 (삼선) */}
        <button className="icon-button left-icon" onClick={handleMenuClick}>
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* 가운데: 제목 */}
        <h1 className="header-title">위험 지역 알림 서비스</h1>

        {/* 오른쪽: 현재 위치로 버튼 */}
        <button
          className="action-button right-action"
          onClick={handleCurrentLocationClick}
        >
          현재 위치로
        </button>
      </header>

      {/* 2. 본문 (지도 및 상태) */}
      <main className="app-main">
        <MapComponent />
      </main>
    </div>
  );
}

export default App;
