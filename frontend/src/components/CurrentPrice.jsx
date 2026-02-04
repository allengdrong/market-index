export default function CurrentPrice({ kospiData, usdkrwData }) {
  if (!kospiData?.series?.length || !usdkrwData?.series?.length) return null;

  const kospiLatest = kospiData.series[kospiData.series.length - 1];
  const kospiPrev = kospiData.series[kospiData.series.length - 2];
  const usdkrwLatest = usdkrwData.series[usdkrwData.series.length - 1];
  const usdkrwPrev = usdkrwData.series[usdkrwData.series.length - 2];

  const kospiChange = kospiPrev ? kospiLatest.value - kospiPrev.value : 0;
  const kospiChangePct = kospiPrev ? (kospiChange / kospiPrev.value) * 100 : 0;
  const usdkrwChange = usdkrwPrev ? usdkrwLatest.value - usdkrwPrev.value : 0;
  const usdkrwChangePct = usdkrwPrev ? (usdkrwChange / usdkrwPrev.value) * 100 : 0;

  const PriceCard = ({ label, value, change, changePct, color, date }) => {
    const isUp = change >= 0;
    return (
      <div
        style={{
          flex: 1,
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          border: `1px solid ${color}30`,
          borderRadius: 16,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: "bold",
            color: color,
            marginBottom: 8,
          }}
        >
          {value?.toLocaleString()}
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 12px",
            borderRadius: 20,
            background: isUp ? "#fef2f2" : "#eff6ff",
            color: isUp ? "#dc2626" : "#2563eb",
            fontSize: 14,
            fontWeight: "bold",
          }}
        >
          {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)} ({isUp ? "+" : ""}
          {changePct.toFixed(2)}%)
        </div>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
          {date} 기준
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
      <PriceCard
        label="KOSPI"
        value={kospiLatest.value}
        change={kospiChange}
        changePct={kospiChangePct}
        color="#dc2626"
        date={kospiLatest.date}
      />
      <PriceCard
        label="USD/KRW"
        value={usdkrwLatest.value}
        change={usdkrwChange}
        changePct={usdkrwChangePct}
        color="#2563eb"
        date={usdkrwLatest.date}
      />
    </div>
  );
}
