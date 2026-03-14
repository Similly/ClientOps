import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  gray: "bg-slate-100 text-slate-700 border-slate-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
};

export function Badge({
  tone = "gray",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: keyof typeof variants }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", variants[tone], className)}
      {...props}
    />
  );
}
