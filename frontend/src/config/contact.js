const DEFAULT_MESSAGE =
  "Hello ChefWare! I'd like to enquire about your hospitality supplies."

/** Build a wa.me link from the current admin-managed contact number. */
export function whatsappLink(number, message = DEFAULT_MESSAGE) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

/** Build the search query Google should resolve (address may map to GPS). */
function mapsQuery(name, address) {
  return [name, address].filter(Boolean).join(', ').trim()
}

/** Link that opens Google Maps turn-by-turn directions to the address. */
export function mapsDirectionsUrl(name, address) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery(name, address))}`
}

/** Keyless Google Maps embed that geocodes the address automatically. */
export function mapsEmbedUrl(name, address) {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapsQuery(name, address))}&output=embed&z=15`
}
