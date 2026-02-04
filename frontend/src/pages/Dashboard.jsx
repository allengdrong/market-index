import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSeries } from "../api/client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HeroBox from "../components/HeroBox";
import PeriodSelector from "../components/PeriodSelector";
import CurrentPrice from "../components/CurrentPrice";
import DualChart from "../components/DualChart";
import CompareStats from "../components/CompareStats";

const getDefaultDates = () => {
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  return {
    start: oneMonthAgo.toISOString().split("T")[0],
    end: today.toISOString().split("T")[0],
  };
};

export default function Dashboard() {
  const [period, setPeriod] = useState("1m");
  const defaultDates = useMemo(() => getDefaultDates(), []);
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  const handleDateChange = (type, value) => {
    if (type === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  const isCustom = period === "custom";
  const queryStartDate = isCustom ? startDate : null;
  const queryEndDate = isCustom ? endDate : null;

  const isValidCustomRange =
    !isCustom || (startDate && endDate && startDate <= endDate);

  const kospiQuery = useQuery({
    queryKey: ["series", "kospi", period, queryStartDate, queryEndDate],
    queryFn: () => fetchSeries("kospi", period, queryStartDate, queryEndDate),
    staleTime: 1000 * 60 * 5,
    enabled: isValidCustomRange,
  });

  const usdkrwQuery = useQuery({
    queryKey: ["series", "usdkrw", period, queryStartDate, queryEndDate],
    queryFn: () => fetchSeries("usdkrw", period, queryStartDate, queryEndDate),
    staleTime: 1000 * 60 * 5,
    enabled: isValidCustomRange,
  });

  const isLoading = kospiQuery.isLoading || usdkrwQuery.isLoading;
  const isFetching = kospiQuery.isFetching || usdkrwQuery.isFetching;
  const error = kospiQuery.error || usdkrwQuery.error;
  const hasData = kospiQuery.data && usdkrwQuery.data;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      <Header />

      <main style={{ flex: 1, padding: "32px 24px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <HeroBox />

        <PeriodSelector
          selected={period}
          onSelect={setPeriod}
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />

        {(isLoading || isFetching) && (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "#6b7280",
              background: "#fff",
              borderRadius: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid #e5e7eb",
                borderTop: "3px solid #6b7280",
                borderRadius: "50%",
                margin: "0 auto 16px",
                animation: "spin 1s linear infinite",
              }}
            />
            데이터를 불러오는 중...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 24,
              color: "#dc2626",
              background: "#fef2f2",
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            Error: {error.message}
          </div>
        )}

        {!isLoading && !isFetching && !error && hasData && (
          <>
            <CurrentPrice
              kospiData={kospiQuery.data}
              usdkrwData={usdkrwQuery.data}
            />

            <DualChart
              kospiData={kospiQuery.data}
              usdkrwData={usdkrwQuery.data}
            />

            <CompareStats
              kospiData={kospiQuery.data}
              usdkrwData={usdkrwQuery.data}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
