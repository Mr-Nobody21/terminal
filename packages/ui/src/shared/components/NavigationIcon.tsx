type IconName = 'shapes' | 'requirements' | 'cost' | 'projects' | 'workspace' | 'settings' | 'menu';
const paths: Record<IconName, string[]> = {
    shapes: ['M12 3 21 12 12 21 3 12Z'],
    requirements: ['M6 3h9l3 3v15H6Z', 'M9 10h6M9 14h6M9 18h4'],
    cost: ['M12 3a9 9 0 1 0 9 9h-9Z', 'M15 3.5V9h5.5'],
    projects: ['M3 6h7l2 2h9v12H3Z', 'M3 6V4h7l2 2'],
    workspace: ['M4 4h16v16H4Z', 'M4 9h16M9 9v11'],
    settings: ['M9 3h6l1 4 4 1v8l-4 1-1 4H9l-1-4-4-1V8l4-1Z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6'],
    menu: ['M4 6h16M4 12h16M4 18h16'],
};
export function NavigationIcon({ name }: { name: IconName }) {
    return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name].map(path => <path key={path} d={path}/>)}</svg>;
}
