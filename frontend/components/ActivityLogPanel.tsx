"use client";

import { useMemo } from "react";
import { useActivityLog } from "@/hooks/useActivityLog";

// Minimal inline Heroicons (MIT) SVGs as React components to avoid adding a dependency
function IconClipboardList(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M9 6h.01M7.5 6h9A2.5 2.5 0 0 1 19 8.5v9A2.5 2.5 0 0 1 16.5 20h-9A2.5 2.5 0 0 1 5 17.5v-9A2.5 2.5 0 0 1 7.5 6Zm3-3h3a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}

function IconKey(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a4.5 4.5 0 1 1-3.79 7l-6.46 6.46a1.5 1.5 0 0 1-2.12-2.12l6.46-6.46a4.5 4.5 0 0 1 5.91-4.88Z" />
    </svg>
  );
}

function IconInfo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M11.25 9.75h1.5m-1.5 3v4.5h1.5m-7.5-5.25a7.5 7.5 0 1 0 15 0 7.5 7.5 0 0 0-15 0Z" />
    </svg>
  );
}

function IconWarning(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.34 3.94 1.7 18.06A2 2 0 0 0 3.4 21h17.2a2 2 0 0 0 1.7-2.94L13.66 3.94a2 2 0 0 0-3.32 0Z" />
    </svg>
  );
}

export function ActivityLogPanel() {
  const { entries, clear } = useActivityLog();

  const renderIcon = (type: string) => {
    const cls = "w-4 h-4";
    if (type === "report_submit") return <IconClipboardList className={cls} />;
    if (type === "decrypt") return <IconKey className={cls} />;
    if (type === "error") return <IconWarning className={cls} />;
    return <IconInfo className={cls} />;
  };

  const items = useMemo(() => {
    if (entries.length === 0) return null;
    return entries.map((e) => (
      <div key={e.id} className="flex items-start gap-2">
        <div className="mt-0.5 text-base-content/70">{renderIcon(e.type)}</div>
        <div>
          <div className="text-sm font-medium leading-tight">{e.title}</div>
          {e.details ? (
            <div className="text-xs text-base-content/60 leading-snug whitespace-pre-wrap break-words">{e.details}</div>
          ) : null}
          <div className="text-[10px] text-base-content/50">{new Date(e.ts).toLocaleTimeString()}</div>
        </div>
      </div>
    ));
  }, [entries]);

  return (
    <div className="card bg-base-100 shadow border w-full max-w-full overflow-hidden">
      <div className="card-body p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="card-title text-base">Activity Log</h3>
          <button className="btn btn-ghost btn-xs" onClick={clear}>Clear</button>
        </div>
        <div className="text-xs text-base-content/60 mb-2">Report submission and decryption records</div>
        <div className="max-h-80 overflow-auto space-y-2 pr-1">
          {entries.length === 0 ? (
            <div className="text-sm text-base-content/60">No entries yet</div>
          ) : (
            items
          )}
        </div>
      </div>
    </div>
  );
}
