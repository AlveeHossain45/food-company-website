import { useState } from 'react'
import { Mail, Phone, Building2, Pencil, Save, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { storage, STORAGE_KEYS } from '../utils/storage.js'
import { getInitials } from '../utils/format.js'
import Button from '../components/Button.jsx'

const DEFAULT_PROFILE = {
  name: 'Alvee Hossain',
  position: 'Software Developer / Administrator',
  email: 'admin@yusufflowermills.com',
  phone: '+880 1700-000000',
  company: 'Yusuf Flower Mills LTD',
}

export default function Profile() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [profile, setProfile] = useState(
    () => storage.get(STORAGE_KEYS.PROFILE, null) || { ...DEFAULT_PROFILE, name: user?.name || DEFAULT_PROFILE.name }
  )
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)

  const startEdit = () => { setDraft(profile); setEditing(true) }

  const save = () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      showToast('Name and Email are required', 'error')
      return
    }
    setProfile(draft)
    storage.set(STORAGE_KEYS.PROFILE, draft)
    setEditing(false)
    showToast('Profile updated successfully', 'success')
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p>Your account information</p>
        </div>
        {!editing ? (
          <Button onClick={startEdit}><Pencil size={15} /> Edit Profile</Button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setEditing(false)}><X size={15} /> Cancel</Button>
            <Button onClick={save}><Save size={15} /> Save</Button>
          </div>
        )}
      </div>

      <div className="profile-hero">
        <div className="profile-avatar-lg">{getInitials(profile.name)}</div>
        <div className="profile-info">
          <h2>{profile.name}</h2>
          <div className="role">{profile.position}</div>
          <div className="meta">
            <span><Mail size={14} /> {profile.email}</span>
            <span><Phone size={14} /> {profile.phone}</span>
            <span><Building2 size={14} /> {profile.company}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Account Information</h3>
            <p>Personal and company details</p>
          </div>
        </div>

        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            <InfoField label="Full Name" value={profile.name} />
            <InfoField label="Position" value={profile.position} />
            <InfoField label="Email" value={profile.email} />
            <InfoField label="Phone" value={profile.phone} />
            <InfoField label="Company" value={profile.company} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Position</label>
              <input className="form-input" value={draft.position} onChange={e => setDraft({ ...draft, position: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={draft.phone} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input className="form-input" value={draft.company} onChange={e => setDraft({ ...draft, company: e.target.value })} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function InfoField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
    </div>
  )
}