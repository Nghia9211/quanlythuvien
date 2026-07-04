import { type FormEvent, useState } from "react";
import type { Loan, ReturnCondition, ReturnLine, ReturnResult } from "../../domain/circulation";
import { useServices } from "../app/services-context";
import { DataTable } from "../components/data-table";
import { FormField } from "../components/form-field";
import { StatusBadge } from "../components/status-badge";
import { Toast } from "../components/toast";

export function CirculationPage() {
  const services = useServices();
  const [tab, setTab] = useState<"borrow" | "return" | "lookup">("borrow");
  const [cardNumber, setCardNumber] = useState("");
  const [barcodeText, setBarcodeText] = useState("");
  const [returns, setReturns] = useState<ReturnLine[]>([{ barcode: "", condition: "NORMAL" }]);
  const [readerId, setReaderId] = useState("");
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [returnResults, setReturnResults] = useState<ReturnResult[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const execute = async <T,>(work: () => Promise<T>): Promise<T | null> => {
    setPending(true); setError(""); setMessage("");
    try { return await work(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Thao tác thất bại"); return null; }
    finally { setPending(false); }
  };
  async function borrow(event: FormEvent) {
    event.preventDefault();
    const barcodes = barcodeText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const result = await execute(() => services.borrowBooks.execute({ cardNumber, barcodes }));
    if (result) { setLoan(result); setMessage("Tạo khoản mượn thành công"); }
  }
  async function returnBooks(event: FormEvent) {
    event.preventDefault(); const result = await execute(() => services.returnBooks.execute(returns));
    if (result) { setReturnResults(result); setMessage("Ghi nhận trả sách thành công"); }
  }
  async function lookup(event: FormEvent) {
    event.preventDefault(); const result = await execute(() => services.listReaderLoans.execute(readerId));
    if (result) setLoans(result);
  }
  const setReturn = (index: number, key: keyof ReturnLine, value: string) => setReturns((current) => current.map((line, position) => position === index ? { ...line, [key]: value } as ReturnLine : line));

  return (
    <section><div className="page-heading"><div><p className="eyebrow">Circulation</p><h1>Mượn và trả sách</h1></div></div>
      <div className="tabs"><button className={tab === "borrow" ? "active" : ""} onClick={() => setTab("borrow")}>Mượn sách</button><button className={tab === "return" ? "active" : ""} onClick={() => setTab("return")}>Trả sách</button><button className={tab === "lookup" ? "active" : ""} onClick={() => setTab("lookup")}>Tra cứu khoản mượn</button></div>
      {error && <Toast message={error} tone="error" />}{message && <Toast message={message} />}
      {tab === "borrow" && <form className="panel form-grid" onSubmit={borrow}><FormField label="Số thẻ"><input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} /></FormField><FormField label="Mã bản sao" hint="Mỗi dòng một mã"><textarea aria-label="Mã bản sao" value={barcodeText} onChange={(e) => setBarcodeText(e.target.value)} /></FormField><div className="form-actions"><button disabled={pending}>Xác nhận mượn</button></div></form>}
      {tab === "return" && <form className="panel" onSubmit={returnBooks}><div className="return-lines">{returns.map((line, index) => <div className="return-line" key={index}><FormField label={`Mã bản sao trả ${index + 1}`}><input value={line.barcode} onChange={(e) => setReturn(index, "barcode", e.target.value)} /></FormField><FormField label={`Tình trạng trả ${index + 1}`}><select value={line.condition} onChange={(e) => setReturn(index, "condition", e.target.value as ReturnCondition)}><option value="NORMAL">Bình thường</option><option value="DAMAGED">Hư hỏng</option><option value="LOST">Thất lạc</option></select></FormField>{returns.length > 1 && <button type="button" className="button-link" onClick={() => setReturns((current) => current.filter((_, position) => position !== index))}>Xóa dòng</button>}</div>)}</div><div className="button-row"><button type="button" className="button-secondary" onClick={() => setReturns((current) => [...current, { barcode: "", condition: "NORMAL" }])}>Thêm sách</button><button disabled={pending}>Xác nhận trả</button></div></form>}
      {tab === "lookup" && <form className="panel inline-form" onSubmit={lookup}><FormField label="ID độc giả"><input value={readerId} onChange={(e) => setReaderId(e.target.value)} /></FormField><button disabled={pending}>Tra cứu khoản mượn</button></form>}
      {loan && <article className="detail-card"><h2>Khoản mượn vừa tạo</h2><p>{loan.id}</p><StatusBadge value={loan.status} /></article>}
      {returnResults.length > 0 && <DataTable rows={returnResults} rowKey={(row) => row.barcode} columns={[{ key: "barcode", header: "Mã bản sao", render: (row) => row.barcode }, { key: "condition", header: "Tình trạng", render: (row) => <StatusBadge value={row.condition} /> }, { key: "overdue", header: "Quá hạn", render: (row) => `Quá hạn ${row.overdueDays} ngày` }]} />}
      {loans.length > 0 && <DataTable rows={loans} rowKey={(row) => row.id} columns={[{ key: "id", header: "Mã khoản mượn", render: (row) => row.id }, { key: "date", header: "Ngày mượn", render: (row) => new Intl.DateTimeFormat("vi-VN").format(new Date(row.borrowedAt)) }, { key: "items", header: "Số sách", render: (row) => row.items.length }, { key: "status", header: "Trạng thái", render: (row) => <StatusBadge value={row.status} /> }]} />}
    </section>
  );
}
