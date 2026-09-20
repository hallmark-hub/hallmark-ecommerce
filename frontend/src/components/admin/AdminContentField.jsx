export default function AdminContentField({ field, value, onChange, onUpload, uploading, disabled }) {
  const inputClass = `w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary ${disabled ? 'bg-surface-container-low text-secondary cursor-not-allowed' : ''}`

  return (
    <div className={field.wide ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
        {field.label}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={event => onChange(event.target.value)}
          rows={field.rows || 3}
          className={`${inputClass} resize-y`}
        />
      ) : field.type === 'toggle' ? (
        <label className="inline-flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={event => onChange(event.target.checked)}
            className="h-5 w-5 accent-primary"
          />
          <span className="text-sm text-on-surface">Visible on the public website</span>
        </label>
      ) : (
        <>
          <input
            type={field.type === 'image' ? 'text' : (field.type || 'text')}
            value={value || ''}
            onChange={event => onChange(event.target.value)}
            disabled={disabled}
            className={inputClass}
          />
          {field.type === 'image' && (
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {value && <img src={value} alt="Current selection" className="h-16 w-20 rounded-lg object-cover border border-outline-variant" />}
              <label className="px-3 py-2 rounded-lg border border-outline-variant text-sm font-semibold text-primary cursor-pointer hover:bg-surface-container-low">
                {uploading ? 'Uploading...' : 'Replace image'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={event => {
                    const file = event.target.files?.[0]
                    if (file) onUpload(file)
                    event.target.value = ''
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          )}
        </>
      )}
    </div>
  )
}
