export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-ink-soft">
      {message}
    </p>
  );
}
