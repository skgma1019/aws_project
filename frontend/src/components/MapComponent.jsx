// frontend/src/components/MapComponent.jsx

import React, { useState, useEffect, useCallback } from "react";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import UserMarkerImage from "../assets/ping.jpg"; // 🚨 로컬 이미지 임포트 변수 (경로 확인 필수)

const defaultCenter = { lat: 37.566826, lng: 126.978656 }; // 서울 시청

const MapComponent = () => {
  // 1. 상태 정의
  const [userLocation, setUserLocation] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [status, setStatus] = useState("위치 추적을 시작합니다...");

  // 🚨 지도 중심 좌표 상태 (사용자 수동 조작 시 고정됨)
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // 지도를 수동 조작했는지 판단하는 플래그 (현재 로직에서는 onDragEnd에서만 사용)
  const [isMapMoved, setIsMapMoved] = useState(false);

  // 🚨 "내 위치로" 버튼 클릭 시 지도 중심 이동 함수
  const moveToUserLocation = () => {
    if (userLocation) {
      // userLocation이 있다면, mapCenter를 userLocation으로 설정하여 지도 중심을 이동시킵니다.
      setMapCenter(userLocation);
      setIsMapMoved(false); // 수동 조작 플래그 해제 (자동 이동 허용)
    } else {
      alert("아직 사용자 위치를 찾지 못했습니다. 위치 권한을 확인해주세요.");
    }
  };

  // 2. 백엔드 API 호출 함수
  const fetchNearbyHotspots = useCallback(async (lat, lng) => {
    try {
      const url = `/api/analysis/nearby_hotspots?lat=${lat}&lon=${lng}&radius=0.01`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "success") {
        setHotspots(data.nearby_hotspots);
      } else {
        console.error("API 응답 실패:", data);
        setStatus(`❌ API 응답 실패: ${data.message || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      setStatus(
        "❌ 서버 연결 오류가 발생했습니다. 백엔드(Node.js) 서버가 실행 중인지 확인하세요."
      );
    }
  }, []);

  // 3. Geolocation API 실행 (useEffect)
  useEffect(() => {
    // 1. 지도 로드 즉시 기본 위치 데이터부터 미리 불러와 화면을 채웁니다. (지연 방지)
    fetchNearbyHotspots(defaultCenter.lat, defaultCenter.lng);
    setStatus("GPS 위치 권한을 요청 중입니다...");

    if (!navigator.geolocation) {
      setStatus("❌ 이 브라우저는 Geolocation API를 지원하지 않습니다.");
      return;
    }

    // 위치 추적 성공 콜백
    const handleLocationSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      const newLocation = { lat: latitude, lng: longitude };

      // userLocation만 업데이트합니다. mapCenter는 버튼 클릭 시에만 변경됩니다.
      setUserLocation(newLocation);
      setStatus(
        `✅ 현재 위치 추적 성공: 위도 ${latitude}, 경도 ${longitude}. 주변 위험 지역 마커를 업데이트합니다.`
      );

      // 새로운 사용자 위치로 API 호출을 다시 수행
      fetchNearbyHotspots(latitude, longitude);
    };

    // 위치 추적 실패 콜백
    const handleLocationError = (error) => {
      let message = "";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "위치 정보 사용이 거부되었습니다.";
          break;
        case error.POSITION_UNAVAILABLE:
          message = "사용자의 위치 정보를 얻을 수 없습니다.";
          break;
        case error.TIMEOUT:
          message =
            "위치 정보를 가져오는 데 시간이 초과되었습니다. (계속 시도 중)";
          break;
        default:
          message = "위치 추적 중 알 수 없는 오류가 발생했습니다.";
      }

      setStatus(
        `❌ 오류: ${message}. 계속해서 위치를 찾고 있습니다. 기본 위치(서울)를 사용합니다.`
      );
      console.error(message, error);
    };

    // 🚨 watchPosition으로 지속적인 위치 추적 시작
    const watchID = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true, // 높은 정확도 (느려도 확실히 찾음)
        maximumAge: 50000, // 50초 이내의 이전 위치는 재검색하지 않음 (빈도 조절)
        timeout: 20000, // 20초마다 응답을 기다림
      }
    );

    // 컴포넌트 언마운트 시 추적 중지
    return () => navigator.geolocation.clearWatch(watchID);
  }, [fetchNearbyHotspots]);

  // 4. 컴포넌트 렌더링
  return (
    <div className="map-container">
      <div id="status">{status}</div>

      {/* 🚨 지도 내부의 "내 위치로" 버튼 (헤더 버튼이 아니라 지도 위에 떠있는 버튼) */}
      <button
        onClick={moveToUserLocation}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "10px",
          zIndex: 10,
          padding: "8px",
          background: "white",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      >
        내 위치로 이동
      </button>

      <Map
        // 🚨 지도 중심을 mapCenter 상태로 사용합니다. (watchPosition의 영향을 받지 않습니다)
        center={mapCenter}
        // 🚨 onDragEnd: 지도를 수동으로 옮기면 mapCenter를 업데이트하여 지도 중심을 고정합니다.
        onDragEnd={(map) => {
          setMapCenter({
            lat: map.getCenter().getLat(),
            lng: map.getCenter().getLng(),
          });
          setIsMapMoved(true); // 수동 조작 플래그 설정
        }}
        style={{ width: "100%", height: "600px" }}
        level={4}
      >
        {/* 사용자 현재 위치 마커 */}
        {userLocation && (
          <MapMarker
            position={userLocation}
            image={{
              src: UserMarkerImage,
              size: { width: 31, height: 35 },
              options: { offset: { x: 16, y: 35 } },
            }}
          />
        )}

        {/* 위험 지역 마커 목록 */}
        {hotspots.map((spot) => (
          <React.Fragment key={spot.fid}>
            <MapMarker
              position={{ lat: spot.LATITUDE, lng: spot.LONGITUDE }}
              title={spot.spot_name}
            />
            {/* 마커 위에 커스텀 오버레이로 정보창 표시 */}
            <CustomOverlayMap
              position={{ lat: spot.LATITUDE, lng: spot.LONGITUDE }}
              yAnchor={2.0}
            >
              <div
                style={{
                  padding: "5px 10px",
                  fontSize: "12px",
                  backgroundColor: "white",
                  border: "1px solid red",
                  borderRadius: "5px",
                  boxShadow: "2px 2px 2px rgba(0,0,0,0.3)",
                  whiteSpace: "nowrap",
                }}
              >
                🚨 {spot.spot_name} ({spot.accident_count}건)
              </div>
            </CustomOverlayMap>
          </React.Fragment>
        ))}
      </Map>
    </div>
  );
};

export default MapComponent;
