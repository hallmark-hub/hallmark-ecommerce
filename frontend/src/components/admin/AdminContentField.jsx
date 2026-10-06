import { useId } from 'react'
import { inputClass, secondaryButtonClass } from './AdminUI'

export default function AdminContentField({ field, value, onChange, onUpload, uploading, disabled }) {
  const id = useId()

  return (
    <div className={field.wide ? 'md:col-span-2' : ''}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {field.label}
      </label>
      {field.type === 'textarea' ? (
        <textarea
          id={id}
          value={value || ''}
          onChange={event => onChange(event.target.value)}
          rows={field.rows || 3}
          className={`${inputClass} h-auto py-2 resize-y`}
        />
      ) : field.type === 'toggle' ? (
        <label className="inline-flex items-center gap-3 cursor-pointer">
          <input
            id={id}
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
            id={id}
            type={field.type === 'image' ? 'text' : (field.type || 'text')}
            value={value || ''}
            onChange={event => onChange(event.target.value)}
            disabled={disabled}
            className={inputClass}
          />
          {field.type === 'image' && (
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {value && <img src={value} alt="Current selection" className="h-16 w-20 rounded object-cover border border-gray-200" />}
              <label className={`${secondaryButtonClass} h-9 ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {uploading ? 'Uploading…' : 'Replace image'}
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
