const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

export async function fetchSeries(metric, period, startDate = null, endDate = null) {
  let url = `${API_BASE_URL}/api/series?metric=${metric}&period=${period}`;

  if (startDate) {
    url += `&startDate=${startDate}`;
  }
  if (endDate) {
    url += `&endDate=${endDate}`;
  }

  console.log(`[API 호출] ${url}`);
  const startTime = performance.now();

  const res = await fetch(url);

  const duration = Math.round(performance.now() - startTime);

  if (!res.ok) {
    console.error(`[API 오류] ${res.status} ${res.statusText} (${duration}ms)`);
    throw new Error("Failed to fetch series data");
  }

  const data = await res.json();
  console.log(`[API 응답] ${metric}/${period}: ${data.series?.length}개 데이터 (${duration}ms)`);

  return data;
}
