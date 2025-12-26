import React, { useState, useEffect, useCallback } from "react";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import UserMarkerImage from "../assets/ping.jpg";
import "./MapComponent.css"; // ✅ CSS 분리 import

const defaultCenter = { lat: 37.566826, lng: 126.978656 };

// ✅ Vite 환경변수
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const MapComponent = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [status, setStatus] = useState("위치 추적을 시작합니다...");
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isMapMoved, setIsMapMoved] = useState(false);

  const moveToUserLocation = () => {
    if (userLocation) {
      setMapCenter(userLocation);
      setIsMapMoved(false);
    } else {
      alert("아직 사용자 위치를 찾지 못했습니다.");
    }
  };

  const fetchNearbyHotspots = useCallback(
    async (lat, lng) => {
      try {
        if (!API_BASE) {
          setStatus("❌ VITE_API_BASE_URL이 설정되지 않았습니다.");
          return;
        }

        const url = `${API_BASE}/api/analysis/nearby_hotspots?lat=${lat}&lon=${lng}&radius=0.01`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.status === "success") {
          setHotspots(data.nearby_hotspots);
        } else {
          setStatus(`❌ API 응답 실패`);
        }
      } catch (error) {
        console.error(error);
        setStatus("❌ 서버 연결 오류가 발생했습니다.");
      }
    },
    [API_BASE]
  );

  useEffect(() => {
    fetchNearbyHotspots(defaultCenter.lat, defaultCenter.lng);
    setStatus("GPS 위치 권한을 요청 중입니다...");

    if (!navigator.geolocation) {
      setStatus("❌ Geolocation을 지원하지 않습니다.");
      return;
    }

    const watchID = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const loc = { lat: latitude, lng: longitude };
        setUserLocation(loc);
        setStatus("✅ 현재 위치 추적 성공");
        fetchNearbyHotspots(latitude, longitude);
      },
      (error) => {
        setStatus("❌ 위치 추적 실패, 기본 위치 사용");
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 50000,
        timeout: 20000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchID);
  }, [fetchNearbyHotspots]);

  return (
    <div className="map-container">
      <div className="status-text">{status}</div>

      <button className="move-btn" onClick={moveToUserLocation}>
        내 위치로 이동
      </button>

      <Map
        center={mapCenter}
        onDragEnd={(map) => {
          setMapCenter({
            lat: map.getCenter().getLat(),
            lng: map.getCenter().getLng(),
          });
          setIsMapMoved(true);
        }}
        className="map-view"
        level={4}
      >
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

        {hotspots.map((spot) => (
          <React.Fragment key={spot.fid}>
            <MapMarker
              position={{ lat: spot.LATITUDE, lng: spot.LONGITUDE }}
              title={spot.spot_name}
            />
            <CustomOverlayMap
              position={{ lat: spot.LATITUDE, lng: spot.LONGITUDE }}
              yAnchor={2.0}
            >
              <div className="hotspot-overlay">
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

