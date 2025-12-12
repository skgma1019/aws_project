import pandas as pd
import os
import json

# ----------------- 🛠️ 설정 변수 🛠️ -----------------
# 1. 입력 CSV 파일 경로 (업로드하신 파일 이름)
CSV_FILE_PATH = 'dataset.csv'

# 2. 출력할 JSON 파일 이름
JSON_FILE_PATH = 'dataset_converted.json'

# 3. 인코딩 설정 (CSV 파일을 성공적으로 읽은 'cp949' 사용)
ENCODING_TYPE = 'cp949' 

# 4. JSON 출력 인코딩 (한글이 깨지지 않도록 'utf-8' 사용)
OUTPUT_ENCODING = 'utf-8' 
# ----------------------------------------------------


def convert_csv_to_json(csv_path, json_path, input_encoding, output_encoding):
    """
    CSV 파일을 읽어 JSON 파일로 저장하는 함수 (Pandas 버전 호환성 개선)
    """
    if not os.path.exists(csv_path):
        print(f"❌ 오류: 입력 파일을 찾을 수 없습니다: {csv_path}")
        return

    print(f"작업 시작: '{csv_path}' 파일을 읽어 JSON으로 변환합니다.")

    # 1. CSV 파일 불러오기
    try:
        df = pd.read_csv(csv_path, encoding=input_encoding)
        print(f"✅ CSV 파일 불러오기 성공. 총 {len(df)}개 행.")

    except Exception as e:
        print(f"❌ CSV 파일 읽기 오류 발생: {e}")
        return

    # 2. DataFrame을 JSON 파일로 저장
    try:
        # DataFrame을 Python 리스트 오브 딕셔너리(JSON 구조)로 변환
        json_data = df.to_dict(orient='records')
        
        # 파일 인코딩을 직접 지정하여 쓰기
        with open(json_path, 'w', encoding=output_encoding) as f:
            # ensure_ascii=False: 한글이 깨지지 않도록 함
            # indent=4: 가독성을 위해 들여쓰기 적용
            json.dump(json_data, f, ensure_ascii=False, indent=4)
        
        print(f"\n🎉 성공! 데이터가 '{json_path}' 파일에 JSON 형태로 저장되었습니다.")

    except Exception as e:
        print(f"❌ JSON 파일 저장 중 오류 발생: {e}")

# --- 함수 실행 ---
if __name__ == "__main__":
    convert_csv_to_json(CSV_FILE_PATH, JSON_FILE_PATH, ENCODING_TYPE, OUTPUT_ENCODING)