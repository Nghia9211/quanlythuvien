export function LoadingState({ children }: { children: string }) {
  return <p className="state-panel" role="status">{children}</p>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="state-panel state-panel--error" role="alert"><p>{message}</p>{onRetry && <button onClick={onRetry}>Thử lại</button>}</div>;
}
