# 📊 Market Index Dashboard

> Public 금융 API 데이터를 기반으로
> **데이터 수집 → 시계열 저장 → 통계 가공 → 시각화 → 장애 대응**까지
> 전체 데이터 파이프라인을 설계·구현한 시장 지표 분석 대시보드

🔗 **서비스 바로가기**
[https://market-index-frontend.onrender.com/](https://market-index-frontend.onrender.com/)

---

# 1. 프로젝트 개요

Market Index Dashboard는
**KOSPI 종합주가지수와 USD/KRW 환율 데이터를 자동으로 수집하고
기간별 흐름과 통계를 하나의 화면에서 비교 분석할 수 있도록 제공하는 서비스**입니다.

공공 금융 데이터를 기반으로 데이터 파이프라인을 구성하고,
무료 인프라 환경에서도 안정적인 사용자 경험을 유지하기 위해
Fallback 데이터 전략을 포함한 서비스 구조를 설계했습니다.

---

# 2. 주요 기능

## 2.1 시장 데이터 자동 수집

* 공공데이터포털 API를 통한 KOSPI 종가 수집
* 한국수출입은행 API를 통한 USD/KRW 환율 수집
* GitHub Actions Cron 기반 자동 데이터 갱신
* Backfill + Upsert 전략으로 데이터 정합성 보장

## 2.2 듀얼 축 차트 시각화

* KOSPI(좌축) / 환율(우축) Dual-axis 차트 제공
* 기간 선택(1d / 1w / 1m / 3m / 1y / custom)
* 두 지표의 동행 / 역행 흐름 직관적 확인

## 2.3 기간별 통계 분석

* 최소 / 최대 / 평균 / 변화량 / 변화율 자동 계산
* 공통 거래일 기준 데이터 정렬
* 기간별 비교 테이블 제공

## 2.4 백엔드 장애 대응 (Fallback)

* 서버 연결 실패 시 캐시된 JSON 데이터 자동 사용
* GitHub Actions가 fallback 데이터를 자동 갱신
* Backend 장애 상황에서도 서비스 정상 동작 유지

---

# 3. 시스템 아키텍처

```
External Public APIs
        ↓
GitHub Actions (Cron Data Sync)
        ↓
FastAPI Backend
        ↓
PostgreSQL (Time-series Data)
        ↓
React Frontend (React Query Cache)

Fallback JSON (GitHub raw)
        ↓
Frontend fallback data source
```

---

# 4. 기술 스택

## 프론트엔드

* React 19
* TanStack Query v5
* Recharts
* Vite

## 백엔드

* Python 3.11
* FastAPI
* SQLAlchemy 2.0
* Alembic

## 데이터베이스

* PostgreSQL (Render)

## 인프라

* Render (Static Site + Web Service)
* GitHub Actions (Daily Cron)
* GitHub Raw Data (Fallback Storage)

---

# 5. 데이터 파이프라인

본 프로젝트는 외부 금융 데이터를 자동으로 수집하고 저장하는 데이터 파이프라인을 포함합니다.

* 외부 공공 API 기반 시장 데이터 수집
* 최근 거래일 기준 Backfill 처리
* `(metric, date)` Unique Constraint 기반 Upsert 저장
* GitHub Actions Cron 기반 자동 데이터 갱신
* PostgreSQL 시계열 구조 저장
* Fallback JSON 자동 생성 및 배포

---

# 6. API

```http
GET /api/series?metric=kospi&period=1m
GET /api/series?metric=usdkrw&period=1y&startDate=2025-01-01&endDate=2026-02-08
GET /health
```

* 시계열 데이터 조회 API
* 기간별 통계 데이터 조회 API
* Health Check endpoint

---

# 7. 기술적 문제 해결 (Engineering Challenges)

## 무료 인프라 환경에서의 서비스 가용성 문제

* 문제:

  * Free tier 서버 환경에서 비활성 시 서버가 자동 종료
* 해결:

  * Stateless 서버 구조 설계
  * Fallback JSON 기반 데이터 제공 전략 적용
  * Frontend 캐시 기반 자동 fallback 처리

## 서로 다른 거래일 데이터 정합성 문제

* 문제:

  * KOSPI와 환율 데이터의 거래일 불일치
* 해결:

  * 공통 거래일 기준 데이터 정렬 로직 구현
  * 최소 데이터 포인트 보장 로직 적용

## Cron 실행 중 중복 데이터 저장 문제

* 문제:

  * Cron 재실행 시 중복 데이터 저장 가능성
* 해결:

  * Upsert 기반 저장 구조 설계
  * PostgreSQL Advisory Lock을 통한 중복 실행 방지

---

# 8. 성능 최적화

* React Query 기반 클라이언트 캐싱 전략
* 기간별 독립 Query Key 설계
* 서버사이드 통계 계산 처리
* 불필요한 API 호출 방지 (Query enable 조건 제어)

---

# 9. 배포 환경

* Render Web Service (Backend)
* Render Static Site (Frontend)
* GitHub Actions Cron (Daily Data Sync)
* Environment Variables 기반 환경 분리

---

# 10. 향후 개선 계획

* WebSocket 기반 실시간 시장 데이터 스트리밍
* Redis 캐시 레이어 추가
* 시장 지표 간 Correlation 자동 분석 기능
* 글로벌 시장 지표 확장 (NASDAQ, 금리 등)

---

# 11. 프로젝트를 통해 배운 점

이 프로젝트를 통해 다음을 경험했습니다.

* 공공 API 기반 데이터 수집 파이프라인 설계
* 시계열 데이터 저장 및 통계 처리 구조 설계
* 무료 인프라 환경에서의 장애 대응 서비스 설계
* 데이터 수집 → 가공 → 서비스 제공까지 전체 흐름 구현

---

# 12. 스크린샷

(서비스 UI 이미지 추가)

---

## 요약

이 프로젝트는 단순한 차트 서비스가 아니라
**데이터 수집 → 저장 → 가공 → 시각화 → 장애 대응까지
실제 서비스에서 사용되는 데이터 파이프라인 구조를 설계하고 구현한 프로젝트**입니다.
