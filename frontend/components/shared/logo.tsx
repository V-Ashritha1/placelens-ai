import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="22" height="22" rx="6" fill="hsl(var(--primary))" />
        <path
          d="M6 15.5V6.5H11.2C13.2 6.5 14.5 7.7 14.5 9.5C14.5 11.3 13.2 12.5 11.2 12.5H8.3V15.5H6Z"
          fill="hsl(var(--primary-foreground))"
        />
        <path d="M8.3 8.3H11C11.9 8.3 12.4 8.8 12.4 9.5C12.4 10.2 11.9 10.7 11 10.7H8.3V8.3Z" fill="hsl(var(--primary))" />
      </svg>
      <span className="font-display text-[15px] font-semibold tracking-tight">
        PlaceLens  <span className="text-primary">AI</span>
      </span>
    </div>
  );
}
