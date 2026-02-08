const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";
const FALLBACK_DATA_URL = import.meta.env.VITE_FALLBACK_DATA_URL || null;
const API_TIMEOUT = 10000; // 10초 (무료 서버 cold start 대비)

export async function fetchSeries(metric, period, startDate = null, endDate = null) {
  let url = `${API_BASE_URL}/api/series?metric=${metric}&period=${period}`;

  if (startDate) {
    url += `&startDate=${startDate}`;
  }
  if (endDate) {
    url += `&endDate=${endDate}`;
  }

  try {
    console.log(`[API 호출] ${url}`);
    const startTime = performance.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const duration = Math.round(performance.now() - startTime);

    if (!res.ok) {
      console.error(`[API 오류] ${res.status} ${res.statusText} (${duration}ms)`);
      throw new Error("Failed to fetch series data");
    }

    const data = await res.json();
    console.log(`[API 응답] ${metric}/${period}: ${data.series?.length}개 데이터 (${duration}ms)`);

    return data;
  } catch (err) {
    console.warn(`[API 실패] ${metric}/${period}: ${err.message}, fallback 데이터 시도...`);
    return loadFallbackData(metric, period);
  }
}

async function loadFallbackData(metric, period) {
  // 1순위: 외부 fallback URL (GitHub raw 등, 재배포 없이 업데이트 가능)
  // 2순위: 로컬 static fallback (빌드 시 포함된 파일)
  const sources = [
    FALLBACK_DATA_URL,
    "/fallback-data.json",
  ].filter(Boolean);

  for (const url of sources) {
    try {
      console.log(`[Fallback 시도] ${url}`);
      const res = await fetch(url);
      if (!res.ok) continue;

      const allData = await res.json();
      const key = period === "custom" ? "1m" : period;
      const data = allData?.[metric]?.[key];

      if (data && data.series && data.series.length > 0) {
        console.log(`[Fallback 성공] ${metric}/${key} from ${url}`);
        return { ...data, _fallback: true, _fallbackUpdatedAt: allData.updatedAt };
      }
    } catch (e) {
      console.warn(`[Fallback 실패] ${url}: ${e.message}`);
    }
  }

  throw new Error("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
}
