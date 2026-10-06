import type { ExportFormat } from '@planner/adapters/exports/artifacts';

export function ExportButtons({ exporting, onExport }: {
    exporting: string;
    onExport: (format: ExportFormat) => Promise<void>;
}) {
    return <div className="export-grid">
        {(['drawio', 'json', 'svg', 'png', 'pdf', 'md', 'docx', 'zip'] as const).map(format =>
            <button disabled={!!exporting} key={format} onClick={() => void onExport(format)}>
                {exporting === format ? 'Preparing…' : `Export ${format.toUpperCase()}`}
            </button>
        )}
    </div>;
}
