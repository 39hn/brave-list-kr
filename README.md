[English README](./README.en.md)

# Brave용 List-KR

이 저장소는 [List-KR](https://github.com/List-KR/List-KR) 필터를 Brave 브라우저에서 사용할 수 있도록 변환한 필터를 제공합니다.

## 필터 소개

이 필터는 List-KR의 한국어 광고 차단 필터를 Brave 브라우저에서 바로 사용할 수 있도록 변환한 것입니다. Brave는 uBlock Origin의 일부 고급 구문을 지원하지 않기 때문에, List-KR 원본을 그대로 사용할 수 없어 변환 작업을 거쳤습니다.

## 사용법

1. Brave 브라우저에서 `brave://settings/shields/filters` 접속
2. "맞춤 필터 목록 추가" 클릭
3. 필터 목록 URL 입력란에 다음 주소 입력:
   ```
   https://raw.githubusercontent.com/39hn/brave-list-kr/filter/filter/list-kr.txt
   ```
4. "추가" 버튼 클릭

## 자동 업데이트

이 필터는 GitHub Actions를 통해 매시간 자동으로 업데이트됩니다. List-KR 원본이 업데이트되면 이 필터도 자동으로 최신 버전으로 갱신됩니다.

## 참고
- List-KR 원본: https://github.com/List-KR/List-KR
- Brave Shields: https://brave.com/support/adblock-filters/

## 라이선스
GPL-3.0-only 