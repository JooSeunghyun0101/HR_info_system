# QnA Platform 배포 가이드

## 📋 사전 준비사항

- GitHub 계정
- Render 계정 (https://render.com)
- Vercel 계정 (https://vercel.com)
- Supabase 프로젝트 (이미 완료)

---

## 🔧 1단계: 코드 저장소 준비

### GitHub에 코드 푸시

```bash
# Git 초기화 (아직 안했다면)
git init
git add .
git commit -m "Initial commit for deployment"

# GitHub 저장소 생성 후
git remote add origin https://github.com/your-username/qna-platform.git
git branch -M main
git push -u origin main
```

---

## 🚀 2단계: 백엔드 배포 (Render)

### 2.1 Render 대시보드 접속
1. https://render.com 로그인
2. 우측 상단 **"New +"** 클릭
3. **"Web Service"** 선택

### 2.2 저장소 연결
1. GitHub 연결 (처음이면 권한 승인)
2. `qna-platform` 저장소 선택
3. **"Connect"** 클릭

### 2.3 서비스 설정

#### 기본 정보
- **Name**: `qna-platform-backend`
- **Region**: Singapore (한국과 가장 가까움)
- **Branch**: `main`
- **Root Directory**: `backend`

#### 빌드 & 실행 설정
- **Runtime**: Node
- **Build Command**:
  ```bash
  npm install && npm run build && npx prisma generate
  ```
- **Start Command**:
  ```bash
  npm start
  ```

#### 플랜 선택
- **Instance Type**: Free (무료)

### 2.4 환경변수 설정

**"Environment"** 탭에서 다음 변수들을 추가:

```bash
# 데이터베이스
DATABASE_URL=postgresql://postgres.wineokguvgpcffcrjqkj:dkvmfh#019@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres

# JWT
JWT_SECRET=your-super-secure-jwt-secret-change-this
JWT_ACCESS_TOKEN_EXPIRY=1h
JWT_REFRESH_TOKEN_EXPIRY=7d

# Supabase
SUPABASE_URL=https://wineokguvgpcffcrjqkj.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 환경
NODE_ENV=production
PORT=10000

# CORS (나중에 Vercel URL로 업데이트)
CORS_ORIGINS=https://your-frontend-url.vercel.app
```

**⚠️ 중요**:
- `JWT_SECRET`은 강력한 랜덤 문자열로 변경
- Supabase 키는 Supabase 대시보드 → Settings → API에서 복사

### 2.5 배포 시작
- **"Create Web Service"** 클릭
- 배포 로그를 확인하며 대기 (5-10분 소요)
- 배포 완료 후 URL 복사 (예: `https://qna-platform-backend.onrender.com`)

### 2.6 Health Check 확인
브라우저에서 접속:
```
https://qna-platform-backend.onrender.com/api/health
```

응답 확인:
```json
{
  "status": "ok",
  "timestamp": "2024-01-07T..."
}
```

---

## 🎨 3단계: 프론트엔드 배포 (Vercel)

### 3.1 Vercel 대시보드 접속
1. https://vercel.com 로그인
2. **"Add New..."** → **"Project"** 클릭

### 3.2 저장소 연결
1. GitHub에서 `qna-platform` 저장소 선택
2. **"Import"** 클릭

### 3.3 프로젝트 설정

#### 기본 정보
- **Project Name**: `qna-platform`
- **Framework Preset**: Vite
- **Root Directory**: `frontend`

#### 빌드 설정
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.4 환경변수 설정

**"Environment Variables"** 섹션에서 추가:

```bash
VITE_API_URL=https://qna-platform-backend.onrender.com/api
```

**⚠️ 주의**: Render 백엔드 URL로 정확히 입력 (끝에 `/api` 포함)

### 3.5 배포 시작
- **"Deploy"** 클릭
- 배포 로그를 확인하며 대기 (3-5분 소요)
- 배포 완료 후 URL 확인 (예: `https://qna-platform.vercel.app`)

---

## 🔄 4단계: CORS 설정 업데이트

### 4.1 Render 환경변수 수정
1. Render 대시보드 → 백엔드 서비스 선택
2. **"Environment"** 탭 클릭
3. `CORS_ORIGINS` 변수를 Vercel URL로 업데이트:
   ```
   https://qna-platform.vercel.app
   ```
4. **"Save Changes"** 클릭
5. 서비스가 자동으로 재배포됨

---

## ✅ 5단계: 배포 확인 및 테스트

### 5.1 프론트엔드 접속
- Vercel URL로 접속: `https://qna-platform.vercel.app`

### 5.2 기능 테스트
1. **로그인 테스트**
   - 관리자 계정으로 로그인
   - 토큰이 정상적으로 발급되는지 확인

2. **API 연결 테스트**
   - 브라우저 개발자 도구 (F12) → Network 탭
   - API 요청이 정상적으로 전송되는지 확인
   - 응답 코드가 200이나 정상 범위인지 확인

3. **데이터베이스 연결 테스트**
   - QnA 목록 조회
   - 매뉴얼 목록 조회
   - 데이터가 정상적으로 표시되는지 확인

### 5.3 에러 발생시 디버깅

#### 백엔드 로그 확인
- Render 대시보드 → 백엔드 서비스 → **"Logs"** 탭

#### 프론트엔드 로그 확인
- Vercel 대시보드 → 프로젝트 → **"Deployments"** → 배포 선택 → **"Logs"**

#### 일반적인 문제

**CORS 에러**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```
→ Render의 `CORS_ORIGINS` 환경변수가 정확한지 확인

**API 연결 실패**
```
Network Error / Failed to fetch
```
→ Vercel의 `VITE_API_URL` 환경변수가 정확한지 확인

**데이터베이스 연결 실패**
```
Error connecting to database
```
→ Render의 `DATABASE_URL`이 정확한지 확인

---

## 🔧 추가 설정 (선택사항)

### Custom Domain 연결 (Vercel)
1. Vercel 프로젝트 → **"Settings"** → **"Domains"**
2. 도메인 입력 후 DNS 설정 안내에 따라 진행

### Render Free Tier Sleep 방지
- 무료 플랜은 15분 비활성시 sleep 모드
- 해결책:
  - UptimeRobot (https://uptimerobot.com) 같은 서비스로 5분마다 health check 호출
  - 또는 유료 플랜으로 업그레이드 ($7/월)

### 파일 업로드 Supabase Storage로 마이그레이션
현재 로컬 파일 시스템 사용 중 → Render는 임시 파일 시스템이므로 재배포시 파일 삭제됨

**권장**: Supabase Storage로 변경
- 영구 저장
- CDN 지원
- 무료 1GB

---

## 📊 모니터링

### Render
- **Metrics** 탭: CPU, Memory, Request 모니터링
- **Logs** 탭: 실시간 로그 확인

### Vercel
- **Analytics** 탭: 방문자 통계, 성능 지표
- **Deployments**: 배포 히스토리 및 로그

---

## 🔄 업데이트 배포

코드 변경 후 배포는 **자동**:

```bash
# 코드 수정 후
git add .
git commit -m "Fix: 버그 수정"
git push origin main
```

→ Render와 Vercel이 자동으로 재배포

---

## 💰 비용 정리

### 무료 플랜 사용시
- **Supabase**: 무료 (500MB DB, 1GB Storage)
- **Render**: 무료 (750시간/월, sleep 있음)
- **Vercel**: 무료 (100GB 대역폭)

**총 비용**: $0/월

### 프로덕션 권장 플랜
- **Supabase**: Pro $25/월 (8GB DB, 100GB Storage)
- **Render**: Starter $7/월 (no sleep)
- **Vercel**: 무료로 충분

**총 비용**: $32/월

---

## 📞 문제 해결

배포 중 문제가 발생하면:

1. **로그 확인**: Render/Vercel 로그 탭
2. **환경변수 재확인**: 오타, 누락 체크
3. **GitHub 코드 확인**: 최신 코드가 push 되었는지 확인
4. **Health Check**: 백엔드 `/api/health` 엔드포인트 테스트

---

## ✅ 체크리스트

### 배포 전
- [ ] GitHub에 코드 푸시 완료
- [ ] Supabase 데이터베이스 준비 완료
- [ ] Supabase API 키 확인

### 백엔드 배포
- [ ] Render 계정 생성
- [ ] 저장소 연결
- [ ] 환경변수 설정
- [ ] 배포 성공
- [ ] Health check 확인

### 프론트엔드 배포
- [ ] Vercel 계정 생성
- [ ] 저장소 연결
- [ ] 환경변수 설정 (VITE_API_URL)
- [ ] 배포 성공

### 최종 확인
- [ ] CORS 설정 업데이트
- [ ] 로그인 테스트
- [ ] API 연결 테스트
- [ ] 데이터베이스 연결 테스트

---

## 🎉 완료!

배포가 성공적으로 완료되었습니다!

**프론트엔드 URL**: https://qna-platform.vercel.app
**백엔드 URL**: https://qna-platform-backend.onrender.com
