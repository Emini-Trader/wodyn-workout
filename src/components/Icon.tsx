export type IconName =
  | 'dumbbell'
  | 'list'
  | 'chart'
  | 'info'
  | 'check'
  | 'clock'
  | 'up'
  | 'history'
  | 'x'
  | 'chev-left'
  | 'chev-right'
  | 'note'
  | 'cloud'
  | 'download'
  | 'upload'

const PATHS: Record<IconName, string> = {
  dumbbell: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  chart: 'M4 19h16M7 15l4-5 3 3 5-7',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  up: 'M12 19V5M6 11l6-6 6 6',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2',
  x: 'M6 6l12 12M18 6L6 18',
  'chev-left': 'M15 5l-7 7 7 7',
  'chev-right': 'M9 5l7 7-7 7',
  note: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
  cloud: 'M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}
