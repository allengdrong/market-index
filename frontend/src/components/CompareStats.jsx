export default function CompareStats({ kospiData, usdkrwData }) {
  if (!kospiData?.stats || !usdkrwData?.stats) return null;

  const kospiStats = kospiData.stats;
  const usdkrwStats = usdkrwData.stats;

  // 상관관계 분석
  const kospiUp = kospiStats.change >= 0;
  const usdkrwUp = usdkrwStats.change >= 0;
  const sameDirection = kospiUp === usdkrwUp;

  const correlation = sameDirection
    ? { text: "동행", color: "#059669", desc: "두 지표가 같은 방향으로 움직임" }
    : { text: "역행", color: "#7c3aed", desc: "두 지표가 반대 방향으로 움직임" };

  const StatRow = ({ label, kospi, usdkrw, isChange = false }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr 1fr",
        gap: 12,
        padding: "14px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div style={{ color: "#6b7280", fontSize: 14 }}>{label}</div>
      <div
        style={{
          fontWeight: "600",
          color: isChange ? (kospi >= 0 ? "#dc2626" : "#2563eb") : "#374151",
          textAlign: "right",
        }}
      >
        {isChange
          ? `${kospi >= 0 ? "+" : ""}${kospi?.toLocaleString()}`
          : kospi?.toLocaleString()}
      </div>
      <div
        style={{
          fontWeight: "600",
          color: isChange ? (usdkrw >= 0 ? "#dc2626" : "#2563eb") : "#374151",
          textAlign: "right",
        }}
      >
        {isChange
          ? `${usdkrw >= 0 ? "+" : ""}${usdkrw?.toLocaleString()}`
          : usdkrw?.toLocaleString()}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 260px",
        gap: 16,
      }}
    >
      {/* 상세 비교 테이블 */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          background: "#fff",
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: "600" }}>
          기간 내 통계 비교
        </h3>

        {/* 헤더 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr 1fr",
            gap: 12,
            padding: "10px 0",
            borderBottom: "2px solid #e5e7eb",
            fontWeight: "600",
            fontSize: 13,
          }}
        >
          <div></div>
          <div style={{ textAlign: "right", color: "#dc2626" }}>KOSPI</div>
          <div style={{ textAlign: "right", color: "#2563eb" }}>USD/KRW</div>
        </div>

        <StatRow label="최소값" kospi={kospiStats.min} usdkrw={usdkrwStats.min} />
        <StatRow label="최대값" kospi={kospiStats.max} usdkrw={usdkrwStats.max} />
        <StatRow label="평균" kospi={kospiStats.avg} usdkrw={usdkrwStats.avg} />
        <StatRow
          label="변화량"
          kospi={kospiStats.change}
          usdkrw={usdkrwStats.change}
          isChange
        />
        <StatRow
          label="변화율(%)"
          kospi={kospiStats.changePct}
          usdkrw={usdkrwStats.changePct}
          isChange
        />
      </div>

      {/* 상관관계 카드 */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
          기간 내 움직임
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: "bold",
            color: correlation.color,
            marginBottom: 8,
          }}
        >
          {correlation.text}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#9ca3af",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {correlation.desc}
        </div>

        <div
          style={{
            display: "flex",
            gap: 24,
            padding: "16px 20px",
            background: "#f9fafb",
            borderRadius: 12,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: kospiUp ? "#dc2626" : "#2563eb",
              }}
            >
              {kospiUp ? "▲" : "▼"} {Math.abs(kospiStats.changePct)}%
            </div>
            <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>
              KOSPI
            </div>
          </div>
          <div
            style={{
              width: 1,
              background: "#e5e7eb",
            }}
          />
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: usdkrwUp ? "#dc2626" : "#2563eb",
              }}
            >
              {usdkrwUp ? "▲" : "▼"} {Math.abs(usdkrwStats.changePct)}%
            </div>
            <div style={{ color: "#9ca3af", fontSize: 11, marginTop: 2 }}>
              USD/KRW
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
