export default function HeroBox() {
  return (
    <section
      style={{
        textAlign: "center",
        padding: "50px 20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        borderRadius: 8,
        marginBottom: 32,
      }}
    >
      <h2
        style={{
          fontSize: "2rem",
          marginBottom: 12,
          fontWeight: "bold",
        }}
      >
        KOSPI 지수와 원/달러 환율 비교
      </h2>
      <p
        style={{
          fontSize: "1rem",
          opacity: 0.9,
          margin: 0,
        }}
      >
        실시간 시장 데이터를 한눈에 확인하세요
      </p>
    </section>
  );
}
