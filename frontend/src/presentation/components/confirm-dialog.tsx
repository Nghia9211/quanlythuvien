import type { FormEvent, ReactNode } from "react";

export function ConfirmDialog({
  title, confirmLabel, pending, onCancel, onConfirm, children,
}: {
  title: string;
  confirmLabel: string;
  pending?: boolean;
  onCancel(): void;
  onConfirm(): void | Promise<void>;
  children: ReactNode;
}) {
  const submit = (event: FormEvent) => { event.preventDefault(); void onConfirm(); };
  return (
    <div className="dialog-backdrop">
      <form className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onSubmit={submit}>
        <h2 id="dialog-title">{title}</h2>
        {children}
        <div className="button-row"><button type="button" className="button-secondary" onClick={onCancel}>Đóng</button><button disabled={pending}>{confirmLabel}</button></div>
      </form>
    </div>
  );
}
