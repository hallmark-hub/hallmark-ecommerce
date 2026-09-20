const DEFAULT_MESSAGE =
  "Hello ChefWare! I'd like to enquire about your hospitality supplies."

/** Build a wa.me link from the current admin-managed contact number. */
export function whatsappLink(number, message = DEFAULT_MESSAGE) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
