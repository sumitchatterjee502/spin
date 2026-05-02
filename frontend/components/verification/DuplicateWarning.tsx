"use client";

type DuplicateWarningProps = {
  message: string | null;
};

export default function DuplicateWarning({ message }: DuplicateWarningProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800"
    >
      {message}
    </div>
  );
}
