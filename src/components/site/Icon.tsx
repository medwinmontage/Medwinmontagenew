// One icon set for the whole app: 24px grid, 1.6 stroke, round caps and joins.
// The first eight names are stored against services in the database
// (see src/lib/collections.ts), so they must keep working.
const PATHS: Record<string, string> = {
  film: '<rect x="2" y="6" width="20" height="12" rx="1"/><path d="M7 6v12M17 6v12M2 10h5M2 14h5M17 10h5M17 14h5"/>',
  camera: '<path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
  ai: '<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"/>',
  pen: '<path d="M4 20l4-1 11-11a2 2 0 0 0-3-3L5 16l-1 4Z"/><path d="M14 6l3 3"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6"/>',
  chart: '<path d="M4 20V10M11 20V4M18 20v-7"/><path d="M2 20h20"/>',
  code: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M8 10l-2.5 2.5L8 15M16 10l2.5 2.5L16 15"/>',
  badge: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5 7 21l5-2.5L17 21l-1.5-7.5"/>',

  // Interface icons
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 3.5 2.5 20h19L12 3.5Z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>',
  'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
  'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.4-3.6 4.6-5.5 7.5-5.5s6.1 1.9 7.5 5.5"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M2.5 19.5c1.1-3.2 3.8-4.8 6.5-4.8s5.4 1.6 6.5 4.8"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M18 14.9c1.7.7 3 2.2 3.6 4.6"/>',
  gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5M12 8.5V20"/><path d="M12 8.5c-1.2-3.4-5.5-4-5.5-1.6 0 1.6 2.6 1.6 5.5 1.6Zm0 0c1.2-3.4 5.5-4 5.5-1.6 0 1.6-2.6 1.6-5.5 1.6Z"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone: '<path d="M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a1.5 1.5 0 0 1-1.6 1.5C10.4 20 4 13.6 3.5 5.6A1.5 1.5 0 0 1 5 4Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  chat: '<path d="M4 5.5h16v11H10l-4.5 3.5v-3.5H4v-11Z"/>',
  play: '<path d="M8 5.5v13l10.5-6.5L8 5.5Z"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.8L12 3.5Z"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M4.5 20h15"/>',
  external: '<path d="M14 4.5h5.5V10M19.5 4.5 11 13M17.5 13.5V19a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h5.5"/>',
  logout: '<path d="M14 4.5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12.5h9.4L17.5 7M10 10.5v5.5M14 10.5v5.5"/>',
  edit: '<path d="M4 20l4-1 11-11a2 2 0 0 0-3-3L5 16l-1 4Z"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  receipt: '<path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2v-17Z"/><path d="M9 8.5h6M9 12.5h6"/>',
  home: '<path d="M4 11l8-7 8 7v8.5a.5.5 0 0 1-.5.5H4.5a.5.5 0 0 1-.5-.5V11Z"/><path d="M10 20v-5.5h4V20"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4.5 4"/>',
  layers: '<path d="M12 3.5 3 8.5l9 5 9-5-9-5Z"/><path d="M3 12.5l9 5 9-5M3 16.5l9 5 9-5"/>',
  package: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.3c-.7.4-1.1.9-1.1 1.7M12 16.7v.3"/>',
  ticket: '<path d="M3.5 8a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v2a2 2 0 0 0 0 4v2a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-2a2 2 0 0 0 0-4V8Z"/><path d="M14 7.5v9"/>',
  quote: '<path d="M5 17c2.5-1 4-3 4-6V7H4v5h3M15 17c2.5-1 4-3 4-6V7h-5v5h3"/>',
};

export default function Icon({ name, className, title }: { name: string; className?: string; title?: string }) {
  const d = PATHS[name] || PATHS.film;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
}
