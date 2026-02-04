import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function DualChart({ kospiData, usdkrwData }) {
  if (!kospiData?.series?.length || !usdkrwData?.series?.length) {
    return <div style={{ padding: 24 }}>데이터를 불러오는 중...</div>;
  }

  // 두 데이터를 인덱스 기준으로 매칭 (날짜가 달라도 같은 위치에 표시)
  const kospiSeries = kospiData.series;
  const usdkrwSeries = usdkrwData.series;
  const maxLen = Math.max(kospiSeries.length, usdkrwSeries.length);

  const mergedData = [];
  for (let i = 0; i < maxLen; i++) {
    const kospiItem = kospiSeries[i];
    const usdkrwItem = usdkrwSeries[i];

    // X축 라벨은 KOSPI 날짜 우선, 없으면 USD/KRW 날짜
    const date = kospiItem?.date || usdkrwItem?.date;

    mergedData.push({
      date,
      kospi: kospiItem?.value ?? null,
      usdkrw: usdkrwItem?.value ?? null,
      // 툴팁용 실제 날짜 저장
      kospiDate: kospiItem?.date,
      usdkrwDate: usdkrwItem?.date,
    });
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {data?.kospi !== null && (
            <p
              style={{
                margin: "6px 0",
                color: "#dc2626",
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <span>KOSPI ({data.kospiDate})</span>
              <span style={{ fontWeight: "600" }}>
                {data.kospi?.toLocaleString()}
              </span>
            </p>
          )}
          {data?.usdkrw !== null && (
            <p
              style={{
                margin: "6px 0",
                color: "#2563eb",
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <span>USD/KRW ({data.usdkrwDate})</span>
              <span style={{ fontWeight: "600" }}>
                {data.usdkrw?.toLocaleString()}
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        background: "#fff",
      }}
    >
      {/* 범례 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 3,
              borderRadius: 2,
              background: "#dc2626",
            }}
          />
          <span style={{ fontSize: 14, color: "#dc2626", fontWeight: "500" }}>
            KOSPI (좌측)
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 3,
              borderRadius: 2,
              background: "#2563eb",
            }}
          />
          <span style={{ fontSize: 14, color: "#2563eb", fontWeight: "500" }}>
            USD/KRW (우측)
          </span>
        </div>
      </div>

      <div style={{ width: "100%", height: 380 }}>
        <ResponsiveContainer>
          <LineChart data={mergedData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              tickFormatter={(date) => date?.slice(5) || ""}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 11, fill: "#dc2626" }}
              tickFormatter={(v) => v?.toLocaleString() ?? ""}
              domain={["auto", "auto"]}
              axisLine={{ stroke: "#fecaca" }}
              tickLine={{ stroke: "#fecaca" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#2563eb" }}
              tickFormatter={(v) => v?.toLocaleString() ?? ""}
              domain={["auto", "auto"]}
              axisLine={{ stroke: "#bfdbfe" }}
              tickLine={{ stroke: "#bfdbfe" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="kospi"
              stroke="#dc2626"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#dc2626" }}
              activeDot={{ r: 6, fill: "#dc2626" }}
              name="kospi"
              connectNulls={true}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="usdkrw"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#2563eb" }}
              activeDot={{ r: 6, fill: "#2563eb" }}
              name="usdkrw"
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
