import pandas as pd
import os
import json

# ----------------- 🛠️ 설정 변수 🛠️ -----------------
CSV_FILE_PATH = 'dataset.csv'
JSON_FILE_PATH = 'dataset_converted.json'
ENCODING_TYPE = 'cp949'  # CSV 읽기 인코딩
OUTPUT_ENCODING = 'utf-8' # JSON 쓰기 인코딩

# 💡 MySQL 및 Node.js에서 사용할 영문 컬럼명 맵핑
COLUMN_MAP = {
    '사고다발지fid': 'fid',
    '사고다발지id': 'id',
    '법정동코드': 'legal_dong_code',
    '지점코드': 'spot_code',
    '시도시군구명': 'city_district_name',
    '지점명': 'spot_name',
    '사고건수': 'accident_count',
    '사상자수': 'casualty_count',
    '사망자수': 'death_count',
    '중상자수': 'severe_injury_count',
    '경상자수': 'minor_injury_count',
    '부상신고자수': 'reported_injury_count',
    '경도': 'longitude',
    '위도': 'latitude',
    '다발지역폴리곤': 'polygon_geom'
}
# ----------------------------------------------------


def convert_csv_to_json(csv_path, json_path, input_encoding, output_encoding):
    
    if not os.path.exists(csv_path):
        print(f"❌ 오류: 입력 파일을 찾을 수 없습니다: {csv_path}")
        return

    print(f"작업 시작: '{csv_path}' 파일을 읽어 JSON으로 변환합니다.")

    # 1. CSV 파일 불러오기 및 컬럼명 변경
    try:
        df = pd.read_csv(csv_path, encoding=input_encoding)
        
        # 💡 컬럼 이름 영문으로 변경 (핵심 수정)
        df = df.rename(columns=COLUMN_MAP)
        
        print(f"✅ CSV 파일 불러오기 및 컬럼 영문 변경 성공. 총 {len(df)}개 행.")

    except Exception as e:
        print(f"❌ CSV 파일 읽기 오류 발생: {e}")
        return

    # 2. DataFrame을 JSON 파일로 저장
    try:
        # DataFrame을 Python 리스트 오브 딕셔너리(JSON 구조)로 변환
        json_data = df.to_dict(orient='records')
        
        # 파일 인코딩을 직접 지정하여 쓰기
        with open(json_path, 'w', encoding=output_encoding) as f:
            json.dump(json_data, f, ensure_ascii=False, indent=4)
        
        print(f"\n🎉 성공! 데이터가 '{json_path}' 파일에 JSON 형태로 저장되었습니다.")

    except Exception as e:
        print(f"❌ JSON 파일 저장 중 오류 발생: {e}")

# --- 함수 실행 ---
if __name__ == "__main__":
    convert_csv_to_json(CSV_FILE_PATH, JSON_FILE_PATH, ENCODING_TYPE, OUTPUT_ENCODING)