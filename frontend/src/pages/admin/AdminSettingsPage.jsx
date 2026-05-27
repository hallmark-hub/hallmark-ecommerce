import { useState } from 'react'
import { Save, Eye, EyeOff, Store, Bell, Shield } from 'lucide-react'

const SECTIONS = [
  {
    id: 'store',
    label: 'Store Info',
    icon: Store,
    fields: [
      { key: 'store_name', label: 'Store Name', value: 'ChefWare Enterprise', type: 'text' },
      { key: 'email', label: 'Contact Email', value: 'info@chefware.com', type: 'email' },
      { key: 'phone', label: 'Contact Phone', value: '+233302000000', type: 'tel' },
      { key: 'address', label: 'Address', value: 'Accra Central, Greater Accra Region, Ghana', type: 'text' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    fields: [
      { key: 'admin_sms', label: 'Admin SMS Number', value: '+233244000000', type: 'tel' },
      { key: 'order_sms', label: 'Order SMS Alerts', value: 'enabled', type: 'toggle' },
      { key: 'quote_sms', label: 'Quote Request Alerts', value: 'enabled', type: 'toggle' },
    ],
  },
  {
    id: 'api',
    label: 'API & Security',
    icon: Shield,
    fields: [
      { key: 'admin_key', label: 'Admin API Key', value: 'cw-admin-xxxxxxxxxxxxxxxx', type: 'secret' },
      { key: 'paystack_key', label: 'Paystack Public Key', value: 'pk_live_xxxxxxxxxxxx', type: 'secret' },
    ],
  },
]

function ToggleField({ value, onChange }) {
  const on = value === 'enabled'
  return (
    <button
      type="button"
      onClick={() => onChange(on ? 'disabled' : 'enabled')}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${on ? 'bg-primary' : 'bg-outline-variant'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function SecretField({ value }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 font-mono text-sm text-secondary bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant truncate">
        {show ? value : '•'.repeat(Math.min(value.length, 24))}
      </span>
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer text-secondary"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export default function AdminSettingsPage() {
  const [values, setValues] = useState(() =>
    Object.fromEntries(SECTIONS.flatMap(s => s.fields.map(f => [f.key, f.value])))
  )
  const [saved, setSaved] = useState(false)

  function handleSave(e) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-on-surface">Settings</h1>
        <p className="text-secondary text-sm mt-1">Store configuration — mock UI, real values pending backend auth</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {SECTIONS.map(section => {
          const Icon = section.icon
          return (
            <div key={section.id} className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon size={16} className="text-primary" />
                </div>
                <h2 className="font-bold text-on-surface">{section.label}</h2>
              </div>
              <div className="px-6 py-5 space-y-5">
                {section.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
                      {field.label}
                    </label>
                    {field.type === 'toggle' ? (
                      <div className="flex items-center gap-3">
                        <ToggleField
                          value={values[field.key]}
                          onChange={v => setValues(p => ({ ...p, [field.key]: v }))}
                        />
                        <span className="text-sm text-secondary capitalize">{values[field.key]}</span>
                      </div>
                    ) : field.type === 'secret' ? (
                      <SecretField value={values[field.key]} />
                    ) : (
                      <input
                        type={field.type}
                        value={values[field.key]}
                        onChange={e => setValues(p => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-container transition-colors cursor-pointer"
          >
            <Save size={16} /> Save Changes
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Changes saved.</span>}
        </div>
      </form>
    </div>
  )
}
