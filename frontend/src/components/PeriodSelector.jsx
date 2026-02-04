import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PERIODS = [
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주" },
  { key: "1m", label: "1달" },
  { key: "3m", label: "3달" },
  { key: "custom", label: "직접지정" },
];

export default function PeriodSelector({
  selected,
  onSelect,
  startDate,
  endDate,
  onDateChange,
}) {
  const isCustom = selected === "custom";

  const today = new Date();
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;

  const handleStartChange = (date) => {
    if (date) {
      onDateChange("start", date.toISOString().split("T")[0]);
    }
  };

  const handleEndChange = (date) => {
    if (date) {
      onDateChange("end", date.toISOString().split("T")[0]);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginBottom: isCustom ? 16 : 0,
        }}
      >
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => onSelect(p.key)}
            style={{
              padding: "8px 20px",
              border: selected === p.key ? "2px solid #374151" : "1px solid #d1d5db",
              borderRadius: 20,
              background: selected === p.key ? "#374151" : "#fff",
              color: selected === p.key ? "#fff" : "#374151",
              cursor: "pointer",
              fontWeight: selected === p.key ? "bold" : "normal",
              fontSize: 14,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isCustom && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            padding: 16,
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #e5e7eb",
          }}
        >
          <label style={{ fontSize: 14, color: "#6b7280" }}>시작일</label>
          <DatePicker
            selected={startDateObj}
            onChange={handleStartChange}
            selectsStart
            startDate={startDateObj}
            endDate={endDateObj}
            minDate={oneYearAgo}
            maxDate={endDateObj || today}
            dateFormat="yyyy-MM-dd"
          />

          <span style={{ color: "#9ca3af", fontSize: 18 }}>~</span>

          <label style={{ fontSize: 14, color: "#6b7280" }}>종료일</label>
          <DatePicker
            selected={endDateObj}
            onChange={handleEndChange}
            selectsEnd
            startDate={startDateObj}
            endDate={endDateObj}
            minDate={startDateObj || oneYearAgo}
            maxDate={today}
            dateFormat="yyyy-MM-dd"
          />
        </div>
      )}
    </div>
  );
}
