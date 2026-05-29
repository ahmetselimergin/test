export interface PatternDef {
  id: string
  label: string
  backgroundImage: string
  backgroundSize: string
  backgroundPosition?: string
  opacity: number
}

export const PATTERNS: PatternDef[] = [
  {
    id: 'none',
    label: 'Düz',
    backgroundImage: 'none',
    backgroundSize: '1px 1px',
    opacity: 0,
  },
  {
    id: 'dots',
    label: 'Nokta',
    backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
    backgroundSize: '16px 16px',
    opacity: 0.18,
  },
  {
    id: 'grid',
    label: 'Grid',
    backgroundImage:
      'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    opacity: 0.12,
  },
  {
    id: 'diagonal',
    label: 'Çizgi',
    backgroundImage:
      'repeating-linear-gradient(45deg, transparent, transparent 9px, white 9px, white 10px)',
    backgroundSize: '14px 14px',
    opacity: 0.14,
  },
  {
    id: 'crosshatch',
    label: 'Çapraz',
    backgroundImage:
      'repeating-linear-gradient(45deg, transparent, transparent 8px, white 8px, white 9px), repeating-linear-gradient(-45deg, transparent, transparent 8px, white 8px, white 9px)',
    backgroundSize: '18px 18px',
    opacity: 0.12,
  },
  {
    id: 'rings',
    label: 'Halka',
    backgroundImage:
      'radial-gradient(circle at 50% 50%, transparent 8px, white 9px, transparent 10px, transparent 18px, white 19px, transparent 20px)',
    backgroundSize: '40px 40px',
    opacity: 0.14,
  },
  {
    id: 'topographic',
    label: 'Topo',
    backgroundImage:
      'radial-gradient(ellipse at 20% 30%, transparent 0, transparent 12px, white 13px, transparent 14px), radial-gradient(ellipse at 70% 70%, transparent 0, transparent 8px, white 9px, transparent 10px)',
    backgroundSize: '50px 50px',
    opacity: 0.16,
  },
  {
    id: 'plus',
    label: 'Artı',
    backgroundImage:
      'linear-gradient(white 2px, transparent 2px), linear-gradient(90deg, white 2px, transparent 2px)',
    backgroundSize: '20px 20px',
    backgroundPosition: '9px 0, 0 9px',
    opacity: 0.13,
  },
]

export function getPattern(id: string | null | undefined): PatternDef {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[1] // default: dots
}
