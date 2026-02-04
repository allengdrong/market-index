export default function Footer() {
  return (
    <footer
      style={{
        background: "#1a1a2e",
        color: "#888",
        padding: "20px 0",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <p style={{ margin: 0, fontSize: 14 }}>
          데이터 출처: 공공데이터포털(KOSPI), 한국수출입은행(환율)
        </p>
        <p style={{ margin: 0, fontSize: 14 }}>
          © 2026 News Service. All rights reserved.
        </p>
        <p style={{ margin: 0, fontSize: 14 }}>
          GitHub:{" "}
          <a
            href="https://github.com/allengdrong/market-index"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#e94560", textDecoration: "none" }}
          >
            🔗 GitHub Repository
          </a>
        </p>
      </div>
    </footer>
  );
}
