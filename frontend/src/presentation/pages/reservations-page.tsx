import { type FormEvent, useState } from "react";
import type { Reservation } from "../../domain/reservation";
import { useServices } from "../app/services-context";
import { ConfirmDialog } from "../components/confirm-dialog";
import { DataTable } from "../components/data-table";
import { FormField } from "../components/form-field";
import { StatusBadge } from "../components/status-badge";
import { Toast } from "../components/toast";

export function ReservationsPage() {
  const services = useServices();
  const [readerId, setReaderId] = useState("");
  const [rows, setRows] = useState<Reservation[]>([]);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [reason, setReason] = useState("");
  const [bookTitleId, setBookTitleId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const execute = async <T,>(work: () => Promise<T>): Promise<T | null> => {
    setPending(true); setError(""); setMessage("");
    try { return await work(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Thao tác thất bại"); return null; }
    finally { setPending(false); }
  };
  async function lookup(event: FormEvent) { event.preventDefault(); const result = await execute(() => services.listReservations.execute(readerId)); if (result) setRows(result); }
  async function cancel() {
    if (!selected) return;
    const result = await execute(() => services.cancelReservation.execute(selected.id, reason));
    if (result) { setRows((current) => current.map((row) => row.id === result.id ? result : row)); setSelected(null); setReason(""); }
  }
  async function allocate(event: FormEvent) {
    event.preventDefault(); const result = await execute(() => services.allocateReservation.execute({ bookTitleId, branchId }));
    setMessage(result ? `Đã phân bổ đặt chỗ ${result.id}` : "Không có yêu cầu hoặc bản sao phù hợp");
  }
  return (
    <section><div className="page-heading"><div><p className="eyebrow">Reservations</p><h1>Quản lý đặt chỗ</h1></div></div>
      {error && <Toast message={error} tone="error" />}{message && <Toast message={message} />}
      <div className="two-column"><form className="panel" onSubmit={lookup}><h2>Tra cứu theo độc giả</h2><FormField label="ID độc giả"><input value={readerId} onChange={(e) => setReaderId(e.target.value)} /></FormField><button disabled={pending}>Tra cứu đặt chỗ</button></form>
        <form className="panel" onSubmit={allocate}><h2>Phân bổ bản sao</h2><FormField label="ID đầu sách"><input value={bookTitleId} onChange={(e) => setBookTitleId(e.target.value)} /></FormField><FormField label="ID chi nhánh"><input value={branchId} onChange={(e) => setBranchId(e.target.value)} /></FormField><button disabled={pending}>Phân bổ bản sao</button></form></div>
      {rows.length === 0 ? <p className="state-panel">Chưa có dữ liệu đặt chỗ.</p> : <DataTable rows={rows} rowKey={(row) => row.id} columns={[{ key: "id", header: "Mã đặt chỗ", render: (row) => row.id }, { key: "title", header: "Đầu sách / chi nhánh", render: (row) => <>{row.bookTitleId}<br />{row.branchId}</> }, { key: "status", header: "Trạng thái", render: (row) => <StatusBadge value={row.status} /> }, { key: "reason", header: "Ghi chú", render: (row) => row.cancelReason || (row.holdExpiresAt ? `Giữ đến ${new Intl.DateTimeFormat("vi-VN").format(new Date(row.holdExpiresAt))}` : "—") }, { key: "action", header: "Thao tác", render: (row) => ["WAITING", "ON_HOLD"].includes(row.status) ? <button className="button-link" aria-label={`Hủy ${row.id}`} onClick={() => setSelected(row)}>Hủy</button> : null }]} />}
      {selected && <ConfirmDialog title="Hủy đặt chỗ" confirmLabel="Xác nhận hủy" pending={pending} onCancel={() => setSelected(null)} onConfirm={cancel}><FormField label="Lý do hủy"><textarea value={reason} onChange={(e) => setReason(e.target.value)} /></FormField>{error && <p className="form-error" role="alert">{error}</p>}</ConfirmDialog>}
    </section>
  );
}
