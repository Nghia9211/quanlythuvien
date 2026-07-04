import { type FormEvent, useState } from "react";
import type { Reader, RegisterReaderInput, UpdateReaderInput } from "../../domain/reader";
import { useServices } from "../app/services-context";
import { ConfirmDialog } from "../components/confirm-dialog";
import { FormField } from "../components/form-field";
import { ReaderDetails } from "../components/reader-details";

const emptyRegistration: RegisterReaderInput = {
  fullName: "", dateOfBirth: "", email: "", phone: "", identityNumber: "", address: "",
  username: "", initialPassword: "", cardValidityMonths: 12,
};

export function ReadersPage() {
  const services = useServices();
  const [tab, setTab] = useState<"lookup" | "register">("lookup");
  const [readerId, setReaderId] = useState("");
  const [reader, setReader] = useState<Reader | null>(null);
  const [registration, setRegistration] = useState(emptyRegistration);
  const [edit, setEdit] = useState<UpdateReaderInput | null>(null);
  const [dialog, setDialog] = useState<"renew" | "status" | null>(null);
  const [months, setMonths] = useState(12);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const run = async (work: () => Promise<Reader>) => {
    setPending(true); setError("");
    try { const result = await work(); setReader(result); return result; }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Thao tác thất bại"); return null; }
    finally { setPending(false); }
  };

  async function lookup(event: FormEvent) { event.preventDefault(); await run(() => services.getReader.execute(readerId)); }
  async function register(event: FormEvent) {
    event.preventDefault();
    const result = await run(() => services.registerReader.execute(registration));
    if (result) { setReaderId(result.id); setRegistration(emptyRegistration); }
  }
  async function saveEdit(event: FormEvent) {
    event.preventDefault(); if (!reader || !edit) return;
    const result = await run(() => services.updateReader.execute(reader.id, edit));
    if (result) setEdit(null);
  }
  async function confirmDialog() {
    if (!reader) return;
    const action = reader.card.status === "LOCKED" ? "UNLOCK" : "LOCK";
    const result = dialog === "renew"
      ? await run(() => services.renewReaderCard.execute(reader.id, months))
      : await run(() => services.changeCardStatus.execute(reader.id, action, reason));
    if (result) { setDialog(null); setReason(""); }
  }

  const field = (key: keyof RegisterReaderInput, value: string | number) => setRegistration((current) => ({ ...current, [key]: value }));
  return (
    <section>
      <div className="page-heading"><div><p className="eyebrow">Membership</p><h1>Quản lý độc giả</h1></div></div>
      <div className="tabs"><button aria-label="Mở tab tra cứu" className={tab === "lookup" ? "active" : ""} onClick={() => setTab("lookup")}>Tra cứu</button><button className={tab === "register" ? "active" : ""} onClick={() => setTab("register")}>Đăng ký mới</button></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {tab === "lookup" ? (
        <form className="panel inline-form" onSubmit={lookup}><FormField label="ID độc giả"><input value={readerId} onChange={(e) => setReaderId(e.target.value)} /></FormField><button disabled={pending}>Tra cứu</button></form>
      ) : (
        <form className="panel form-grid" onSubmit={register}>
          <FormField label="Họ và tên"><input value={registration.fullName} onChange={(e) => field("fullName", e.target.value)} /></FormField>
          <FormField label="Ngày sinh"><input type="date" value={registration.dateOfBirth} onChange={(e) => field("dateOfBirth", e.target.value)} /></FormField>
          <FormField label="Email"><input type="email" value={registration.email} onChange={(e) => field("email", e.target.value)} /></FormField>
          <FormField label="Điện thoại"><input value={registration.phone} onChange={(e) => field("phone", e.target.value)} /></FormField>
          <FormField label="Số giấy tờ"><input value={registration.identityNumber} onChange={(e) => field("identityNumber", e.target.value)} /></FormField>
          <FormField label="Địa chỉ"><input value={registration.address} onChange={(e) => field("address", e.target.value)} /></FormField>
          <FormField label="Tên đăng nhập mới"><input value={registration.username} onChange={(e) => field("username", e.target.value)} /></FormField>
          <FormField label="Mật khẩu ban đầu"><input type="password" value={registration.initialPassword} onChange={(e) => field("initialPassword", e.target.value)} /></FormField>
          <FormField label="Thời hạn thẻ (tháng)"><input type="number" min="1" max="60" value={registration.cardValidityMonths} onChange={(e) => field("cardValidityMonths", Number(e.target.value))} /></FormField>
          <div className="form-actions"><button disabled={pending}>Đăng ký độc giả</button></div>
        </form>
      )}
      {reader && <ReaderDetails reader={reader} onEdit={() => setEdit({ fullName: reader.fullName, dateOfBirth: reader.dateOfBirth, email: reader.email, phone: reader.phone, address: reader.address })} onRenew={() => setDialog("renew")} onStatus={() => setDialog("status")} />}
      {edit && reader && <form className="panel form-grid" onSubmit={saveEdit}><h2>Chỉnh sửa hồ sơ</h2>
        <FormField label="Họ và tên chỉnh sửa"><input value={edit.fullName || ""} onChange={(e) => setEdit({ ...edit, fullName: e.target.value })} /></FormField>
        <FormField label="Email chỉnh sửa"><input value={edit.email || ""} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></FormField>
        <FormField label="Điện thoại chỉnh sửa"><input value={edit.phone || ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></FormField>
        <div className="form-actions"><button className="button-secondary" type="button" onClick={() => setEdit(null)}>Hủy</button><button disabled={pending}>Lưu hồ sơ</button></div>
      </form>}
      {dialog && reader && <ConfirmDialog title={dialog === "renew" ? "Gia hạn thẻ" : (reader.card.status === "LOCKED" ? "Mở khóa thẻ" : "Khóa thẻ")} confirmLabel={dialog === "renew" ? "Xác nhận gia hạn" : (reader.card.status === "LOCKED" ? "Xác nhận mở khóa" : "Xác nhận khóa")} pending={pending} onCancel={() => setDialog(null)} onConfirm={confirmDialog}>
        {dialog === "renew" ? <FormField label="Số tháng"><input type="number" min="1" max="60" value={months} onChange={(e) => setMonths(Number(e.target.value))} /></FormField> : <FormField label="Lý do"><textarea value={reason} onChange={(e) => setReason(e.target.value)} /></FormField>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </ConfirmDialog>}
    </section>
  );
}
