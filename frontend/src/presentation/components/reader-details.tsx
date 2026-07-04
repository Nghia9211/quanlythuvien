import type { Reader } from "../../domain/reader";
import { StatusBadge } from "./status-badge";

const date = (value: string) => new Intl.DateTimeFormat("vi-VN").format(new Date(value));

export function ReaderDetails({ reader, onEdit, onRenew, onStatus }: {
  reader: Reader;
  onEdit(): void;
  onRenew(): void;
  onStatus(): void;
}) {
  return (
    <article className="detail-card">
      <div className="detail-card__heading"><div><p className="eyebrow">Hồ sơ độc giả</p><h2>{reader.fullName}</h2></div><StatusBadge value={reader.card.status} /></div>
      <dl className="detail-grid">
        <div><dt>ID</dt><dd>{reader.id}</dd></div><div><dt>Email</dt><dd>{reader.email}</dd></div>
        <div><dt>Điện thoại</dt><dd>{reader.phone || "—"}</dd></div><div><dt>Số giấy tờ</dt><dd>{reader.identityNumber}</dd></div>
        <div><dt>Số thẻ</dt><dd>{reader.card.cardNumber}</dd></div><div><dt>Hết hạn</dt><dd>{date(reader.card.expiresAt)}</dd></div>
        {reader.card.lockReason && <div className="detail-grid__wide"><dt>Lý do khóa</dt><dd>{reader.card.lockReason}</dd></div>}
      </dl>
      <div className="button-row"><button className="button-secondary" onClick={onEdit}>Sửa hồ sơ</button><button className="button-secondary" onClick={onRenew}>Gia hạn thẻ</button><button onClick={onStatus}>{reader.card.status === "LOCKED" ? "Mở khóa thẻ" : "Khóa thẻ"}</button></div>
    </article>
  );
}
