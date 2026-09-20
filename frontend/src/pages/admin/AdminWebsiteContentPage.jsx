import { useEffect, useState } from 'react'
import { AlertTriangle, Bot, Building2, Home, Info, MessageSquare, Save, Wrench } from 'lucide-react'
import { uploadAdminProductImage } from '../../api/admin'
import { getAdminSiteContent, updateAdminSiteContent } from '../../api/siteContent'
import AdminContentField from '../../components/admin/AdminContentField'
import { SITE_CONTENT_SECTIONS } from '../../config/siteContentFields'
import useSiteContentStore from '../../store/siteContentStore'

const SECTION_ICONS = { company: Building2, home: Home, about: Info, services: Wrench, robotics: Bot, quote: MessageSquare }

export default function AdminWebsiteContentPage() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingKey, setUploadingKey] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const replacePublicContent = useSiteContentStore(state => state.replace)

  useEffect(() => {
    let active = true
    getAdminSiteContent()
      .then(response => {
        if (!response.success) throw new Error(response.message)
        if (active) setContent(response.data)
      })
      .catch(err => { if (active) setError(err.message || 'Unable to load website content.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function updateField(key, value) {
    setContent(current => ({ ...current, [key]: value }))
    setSaved(false)
  }

  function updateCard(collection, index, key, value) {
    setContent(current => ({
      ...current,
      [collection]: current[collection].map((card, cardIndex) => (
        cardIndex === index ? { ...card, [key]: value } : card
      )),
    }))
    setSaved(false)
  }

  async function uploadImage(file, fieldKey, onComplete) {
    setError('')
    setUploadingKey(fieldKey)
    try {
      const response = await uploadAdminProductImage(file)
      if (!response.success) throw new Error(response.message)
      onComplete(response.data.secure_url)
    } catch (err) {
      setError(err.message || 'Unable to upload image.')
    } finally {
      setUploadingKey('')
    }
  }

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const response = await updateAdminSiteContent(content)
      if (!response.success) throw new Error(response.message)
      setContent(response.data)
      replacePublicContent(response.data)
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Unable to save website content.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-secondary">Loading website content...</p>
  if (!content) return <ErrorMessage message={error || 'Website content is unavailable.'} />

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-on-surface">Website Content</h1>
        <p className="text-secondary text-sm mt-1">Edit public company pages, contact details, visibility, and images.</p>
      </div>
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSave} className="space-y-6">
        {SITE_CONTENT_SECTIONS.map(section => {
          const Icon = SECTION_ICONS[section.id]
          return (
            <section key={section.id} className="bg-white rounded-2xl border border-outline-variant overflow-hidden">
              <header className="px-6 py-4 border-b border-outline-variant flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon size={16} className="text-primary" /></span>
                <h2 className="font-bold text-on-surface">{section.label}</h2>
              </header>
              <div className="px-6 py-5 grid md:grid-cols-2 gap-5">
                {section.fields.map(field => (
                  <AdminContentField
                    key={field.key}
                    field={field}
                    value={content[field.key]}
                    onChange={value => updateField(field.key, value)}
                    uploading={uploadingKey === field.key}
                    onUpload={file => uploadImage(file, field.key, value => updateField(field.key, value))}
                  />
                ))}
                {section.id === 'about' && <CardEditors title="Capability Cards" collection="about_capabilities" cards={content.about_capabilities} onChange={updateCard} onUpload={uploadImage} uploadingKey={uploadingKey} />}
                {section.id === 'services' && <CardEditors title="Service Pages" collection="services" cards={content.services} images onChange={updateCard} onUpload={uploadImage} uploadingKey={uploadingKey} />}
                {section.id === 'robotics' && <CardEditors title="Robotics Use Cases" collection="robotics_cards" cards={content.robotics_cards} images onChange={updateCard} onUpload={uploadImage} uploadingKey={uploadingKey} />}
                {section.id === 'quote' && <QuoteOptionsEditor options={content.quote_options} onChange={updateCard} />}
              </div>
            </section>
          )
        })}

        <div className="sticky bottom-4 flex items-center gap-4 bg-white border border-outline-variant rounded-xl p-4 shadow-lg">
          <button disabled={saving || Boolean(uploadingKey)} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl cursor-pointer disabled:opacity-60">
            <Save size={16} /> {saving ? 'Saving...' : 'Save Website Content'}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Public website updated.</span>}
        </div>
      </form>
    </div>
  )
}

function CardEditors({ title, collection, cards, images = false, onChange, onUpload, uploadingKey }) {
  return (
    <div className="md:col-span-2 border-t border-outline-variant pt-5">
      <h3 className="font-bold text-on-surface mb-4">{title}</h3>
      <div className="space-y-5">
        {cards.map((card, index) => {
          const imageKey = `${collection}.${index}.image_url`
          return (
            <div key={`${collection}-${index}`} className="grid md:grid-cols-2 gap-4 rounded-xl bg-surface-container-low p-4">
              <AdminContentField field={{ label: `Card ${index + 1} Title` }} value={card.title} onChange={value => onChange(collection, index, 'title', value)} />
              <AdminContentField field={{ label: 'Description', type: 'textarea' }} value={card.body} onChange={value => onChange(collection, index, 'body', value)} />
              {images && <AdminContentField field={{ label: 'Image', type: 'image', wide: true }} value={card.image_url} onChange={value => onChange(collection, index, 'image_url', value)} uploading={uploadingKey === imageKey} onUpload={file => onUpload(file, imageKey, value => onChange(collection, index, 'image_url', value))} />}
              {images && <AdminContentField field={{ label: 'Image Description', wide: true }} value={card.image_alt} onChange={value => onChange(collection, index, 'image_alt', value)} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function QuoteOptionsEditor({ options, onChange }) {
  return (
    <div className="md:col-span-2 border-t border-outline-variant pt-5">
      <h3 className="font-bold text-on-surface mb-1">Quote Form Options</h3>
      <p className="text-secondary text-sm mb-4">Labels shown in the quote/contact form. Slugs are fixed by the service contract.</p>
      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={option.slug} className="grid md:grid-cols-2 gap-4 rounded-xl bg-surface-container-low p-4">
            <AdminContentField field={{ label: `${option.slug} — label` }} value={option.title} onChange={value => onChange('quote_options', index, 'title', value)} />
            <AdminContentField field={{ label: 'Slug (fixed)', wide: true }} value={option.slug} disabled />
          </div>
        ))}
      </div>
    </div>
  )
}

function ErrorMessage({ message }) {
  return <div className="mb-5 flex items-center gap-2 rounded-xl bg-error-container p-4 text-on-error-container"><AlertTriangle size={18} /><p className="text-sm">{message}</p></div>
}
