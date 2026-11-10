import type { ReactNode } from 'react'

export type IconName =
  | 'search'
  | 'refresh'
  | 'print'
  | 'download'
  | 'expand'
  | 'sun'
  | 'bell'
  | 'user'
  | 'chevron'
  | 'info'
  | 'calendar'
  | 'document'
  | 'coins'
  | 'building'
  | 'bank'
  | 'books'
  | 'check'
  | 'filter'
  | 'series'
  | 'lock'
  | 'arrow'
  | 'tag'

type IconProps = {
  name: IconName
}

const paths: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4 4" />
    </>
  ),
  refresh: (
    <>
      <path d="M19 12a7 7 0 1 1-2-5" />
      <path d="M19 4v5h-5" />
    </>
  ),
  print: (
    <>
      <path d="M7 8V4h10v4" />
      <path d="M7 16H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 19h14" />
    </>
  ),
  expand: (
    <>
      <path d="M9 4H4v5" />
      <path d="M15 4h5v5" />
      <path d="M9 20H4v-5" />
      <path d="M15 20h5v-5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5 17 7M7 17l-1.5 1.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2H4.5L6 16z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="7" rx="6" ry="2.5" />
      <path d="M6 7v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V7" />
      <path d="M6 11v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4" />
    </>
  ),
  building: (
    <>
      <path d="M4 20h16" />
      <path d="M6 20V6h8v14" />
      <path d="M14 20v-8h4v8" />
      <path d="M8 9h2M8 12h2M8 15h2" />
    </>
  ),
  bank: (
    <>
      <path d="M4 9l8-5 8 5" />
      <path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7" />
      <path d="M3 20h18M4 17h16" />
    </>
  ),
  books: (
    <>
      <path d="M5 5h6v14H5zM13 5h6v14h-6z" />
      <path d="M8 5v14M16 5v14" />
    </>
  ),
  check: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M8.5 12l2 2 4-4" />
    </>
  ),
  filter: (
    <>
      <path d="M4 6h16l-6 7v5l-4 2v-7z" />
    </>
  ),
  series: (
    <>
      <path d="M8 7h11M8 12h11M8 17h11" />
      <path d="M4 7h.01M4 12h.01M4 17h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="11" width="12" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  tag: (
    <>
      <path d="M4 12V5h7l9 9-7 7z" />
      <path d="M8 8h.01" />
    </>
  ),
}

export function Icon({ name }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      {paths[name]}
    </svg>
  )
}
