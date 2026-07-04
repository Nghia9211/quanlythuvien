import { useCallback, useEffect, useState } from "react";
import type { OperationalReport } from "../../domain/report";
import { useServices } from "../app/services-context";
import { ErrorState, LoadingState } from "../components/async-state";
import { MetricCard } from "../components/metric-card";

const datePart = (date: Date) => date.toISOString().slice(0, 10);

export function DashboardPage() {
  const { getOperationalReport } = useServices();
  const [report, setReport] = useState<OperationalReport | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const now = new Date();
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    setLoading(true);
    setError("");
    try {
      setReport(await getOperationalReport.execute({ from: datePart(from), to: datePart(to) }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không tải được báo cáo");
    } finally {
      setLoading(false);
    }
  }, [getOperationalReport]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <LoadingState>Đang tải báo cáo…</LoadingState>;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!report) return null;

  const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
  return (
    <section aria-labelledby="dashboard-title">
      <div className="page-heading"><div><p className="eyebrow">Hôm nay</p><h1 id="dashboard-title">Tổng quan vận hành</h1></div></div>
      <div className="metric-grid">
        <MetricCard label="Lượt mượn" value={report.loans} />
        <MetricCard label="Sách đang quá hạn" value={report.overdueItems} tone="warning" />
        <MetricCard label="Bản sao sẵn sàng" value={report.availableCopies} tone="success" />
        <MetricCard label="Tiền phạt chưa thu" value={money.format(report.unpaidFineAmount)} tone="danger" />
        <MetricCard label="Kiểm kê hoàn tất" value={report.completedInventories} />
      </div>
    </section>
  );
}
