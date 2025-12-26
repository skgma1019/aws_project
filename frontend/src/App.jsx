// frontend/src/App.jsx

import React, { useState, useEffect, useRef } from "react";
import { useKakaoLoader } from "react-kakao-maps-sdk";

import MapComponent from "./components/MapComponent";
import LoginForm from "./components/LoginForm";       // 🚨 추가됨
import RegisterForm from "./components/RegisterForm"; // 🚨 추가됨

import "./App.css";
import "./Header.css";

function App() {
  const KAKAO_KEY = import.meta.env.VITE_KAKAO_MAP_API_KEY;

  // --- 상태 관리 ---
  // viewState: 'map' (지도), 'login' (로그인), 'register' (회원가입)
  const [viewState, setViewState] = useState("map");
  const [showLoadingMessage, setShowLoadingMessage] = useState(true);
  
  // MapComponent의 함수를 호출하기 위한 Ref
  const mapRef = useRef(null);

  // --- 핸들러 함수 ---
  const handleMenuClick = () => {
    // 메뉴 버튼을 누르면 로그인 화면으로 전환 (또는 사이드바 구현 가능)
    setViewState("login");
  };

  const handleCurrentLocationClick = () => {
    if (viewState !== "map") {
      setViewState("map"); // 지도가 아니면 지도로 먼저 이동
    }
    // 약간의 시간차를 두어 지도가 로드된 후 함수 호출
    setTimeout(() => {
      if (mapRef.current) mapRef.current.moveToUserLocation();
    }, 100);
  };

  // --- 지도 로더 ---
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

  // --- 조건부 렌더링 (로딩/에러) ---
  if (!KAKAO_KEY) return <div>❌ API 키 설정 필요</div>;
  if (loading || showLoadingMessage) return <div className="loading-screen">로딩 중...</div>;
  if (error) return <div>❌ 에러 발생: {error.message}</div>;

  return (
    <div className="mobile-layout">
      {/* 1. 헤더 (고정) */}
      <header className="app-header">
        {/* 왼쪽: 지도가 아닐 때는 뒤로가기(지도보기) 버튼으로 변신 */}
        <button 
          className="icon-button left-icon" 
          onClick={() => viewState === "map" ? handleMenuClick() : setViewState("map")}
        >
          <span className="material-symbols-outlined">
            {viewState === "map" ? "menu" : "arrow_back"}
          </span>
        </button>

        {/* 가운데: 상태에 따른 제목 변경 */}
        <h1 className="header-title">
          {viewState === "map" && "위험 지역 알림"}
          {viewState === "login" && "로그인"}
          {viewState === "register" && "회원가입"}
        </h1>

        {/* 오른쪽: 현재 위치로 버튼 */}
        <button className="action-button right-action" onClick={handleCurrentLocationClick}>
          {viewState === "map" ? "내 위치" : "지도보기"}
        </button>
      </header>

      {/* 2. 본문 (상태에 따라 다른 컴포넌트 렌더링) */}
      <main className="app-main">
        {viewState === "map" && (
          <MapComponent ref={mapRef} />
        )}
        
        {viewState === "login" && (
          <LoginForm 
            onLoginSuccess={() => setViewState("map")} 
            onGoToRegister={() => setViewState("register")} 
          />
        )}
        
        {viewState === "register" && (
          <RegisterForm 
            onRegisterSuccess={() => setViewState("login")} 
            onGoToLogin={() => setViewState("login")} 
          />
        )}
      </main>
    </div>
  );
}

export default App;
