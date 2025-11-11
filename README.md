# 청AI - Simple Project Hub

Supabase를 활용한 심플한 데이터 관리 웹 애플리케이션

## 🚀 로컬 실행

### 방법 1: 브라우저에서 직접 열기
`index.html` 파일을 브라우저로 드래그 앤 드롭

### 방법 2: 로컬 서버 실행
```bash
# Python 3 사용
python -m http.server 8080

# Node.js 사용
npx serve
```

브라우저에서 `http://localhost:8080` 접속

## 🌐 Render에 배포하기

1. **Render 대시보드**에서 **New** → **Static Site** 선택
2. **GitHub 저장소** 연결
3. 설정:
   - **Build Command**: 비워두기
   - **Publish Directory**: `.` (또는 비워두기)
4. **Create Static Site** 클릭
5. 완료! 🎉

## 📂 프로젝트 구조

```
home/
├── css/
│   └── style.css           # 스타일시트
├── js/
│   └── script.js           # 메인 JavaScript
├── index.html              # 메인 HTML
└── README.md               # 이 파일
```

## 🛠 기능

- ✅ Supabase 데이터 조회
- ✅ 페이지네이션 (10개씩 블록 방식)
- ✅ 다중 필드 검색 (no, name, role, department, e_mail, phone, exhibitor)
- ✅ 반응형 UI

## 📝 데이터베이스 테이블 구조

```sql
-- MEDICA_2025 테이블
CREATE TABLE MEDICA_2025 (
  no INT,
  name TEXT,
  role TEXT,
  department TEXT,
  e_mail TEXT,
  phone TEXT,
  exhibitor TEXT
);
```

## 🔒 보안

- Supabase Anon Key는 프론트엔드용으로 공개되어도 안전합니다
- Row Level Security(RLS)로 데이터 접근 제어
- 읽기 전용 정책 권장

## 🐛 문제 해결

### Supabase 연결 오류
1. Supabase URL과 Anon Key가 올바른지 확인 (`js/script.js` 상단)
2. Supabase 프로젝트가 Paused 상태가 아닌지 확인
3. 테이블 이름이 `MEDICA_2025`와 일치하는지 확인
4. Row Level Security 정책 확인

### CORS 에러
Supabase 대시보드 → Settings → API → CORS에서 배포 도메인 추가

## 📞 문의

문제가 있거나 개선 사항이 있으면 이슈를 등록해주세요!
