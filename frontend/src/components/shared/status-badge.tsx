"use client"

const statusConfig: Record<
  string,
  { label: string; dotColor: string; bgColor: string; textColor: string }
> = {
  auto_validated: {
    label: "Validated",
    dotColor: "bg-success-500",
    bgColor: "bg-success-50",
    textColor: "text-success-700",
  },
  expert_validated: {
    label: "Validated",
    dotColor: "bg-success-500",
    bgColor: "bg-success-50",
    textColor: "text-success-700",
  },
  pending_review: {
    label: "Under Review",
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
  },
  rejected: {
    label: "Rejected",
    dotColor: "bg-danger-500",
    bgColor: "bg-danger-50",
    textColor: "text-danger-700",
  },
  processing: {
    label: "Processing",
    dotColor: "bg-stone-400",
    bgColor: "bg-stone-100",
    textColor: "text-stone-600",
  },
}

/**
 * Status badge pill — colored indicator dot + label text.
 *
 * DOC-09 Lines 299–319
 */
export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.processing

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${config.bgColor} ${config.textColor}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  )
}
