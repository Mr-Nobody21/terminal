import type { ReactNode } from 'react';

export function CollapsiblePanel({ className, step, title, collapsed, onToggle, children }: {
  className: string;
  step: string;
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const contentId = `${className}-content`;
  const headingId = `${className}-heading`;
  return <aside className={`${className} collapsible-panel`} data-collapsed={collapsed} aria-labelledby={headingId}>
    <div className="panel-title">
      <span className="step">{step}</span>
      <h2 id={headingId}>{title}</h2>
      <button className="panel-toggle" type="button" onClick={onToggle}
        aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}
        aria-expanded={!collapsed} aria-controls={contentId}
        title={`${collapsed ? 'Expand' : 'Collapse'} ${title}`}>
        <span aria-hidden="true">{collapsed ? '+' : '−'}</span>
      </button>
    </div>
    <div id={contentId} hidden={collapsed}>{children}</div>
  </aside>;
}
