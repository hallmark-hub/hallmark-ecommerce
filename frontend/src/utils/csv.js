// Builds a CSV file from rows and starts a download; used by the admin exports.
function cell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function downloadCsv(filename, columns, rows) {
  const lines = [columns.map(c => cell(c.label)).join(','), ...rows.map(row => columns.map(c => cell(c.value(row))).join(','))]
  // BOM so Excel opens GH₵ and other non-ASCII text correctly
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
