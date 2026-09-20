export const QUOTE_CATEGORY_LABELS = {
  uniforms: 'Uniforms',
  'branding-embroidery': 'Branding & Embroidery',
  'kitchen-equipment': 'Kitchen Equipment',
  'kitchen-setup': 'Kitchen Setup',
  disposables: 'Disposables',
  robotics: 'Robotics',
  other: 'Other',
}

export function formatQuoteCategory(slug) {
  return QUOTE_CATEGORY_LABELS[slug] || (slug ? slug.replace(/-/g, ' ') : '')
}