import { useEffect, useState } from 'react'
import { Mail, Phone, Building2, Pencil, Save, X, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { storage, STORAGE_KEYS } from '../utils/storage.js'
import { getInitials } from '../utils/format.js'
import Button from '../components/Button.jsx'

const DEFAULT_PROFILE = {
  position: 'Software Developer / Administrator',
  phone: '',
  company: '',
  avatar: '/Alveeee.png', // ← public folder থেকে load হবে
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()

  /* Account fields come from the authenticated user (backend-backed);
   * only the avatar lives in localStorage (no upload endpoint exists). */
  const [profile, setProfile] = useState(() => {
    const saved = storage.get(STORAGE_KEYS.PROFILE, null)
    return {
      ...DEFAULT_PROFILE,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      position: user?.position || DEFAULT_PROFILE.position,
      company: user?.company || DEFAULT_PROFILE.company,
      avatar: saved?.avatar || DEFAULT_PROFILE.avatar,
    }
  })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [imgError, setImgError] = useState(false)
  const [saving, setSaving] = useState(false)

  /* Keep in sync when the auth user changes (e.g. after a save) */
  useEffect(() => {
    if (editing) return
    setProfile(prev => ({
      ...prev,
      name: user?.name || prev.name,
      email: user?.email || prev.email,
      phone: user?.phone || prev.phone,
      position: user?.position || prev.position,
      company: user?.company || prev.company,
    }))
  }, [user, editing])

  const startEdit = () => {
    setDraft(profile)
    setEditing(true)
  }

  const save = async () => {
    if (!draft.name.trim()) {
      showToast('Name is required', 'error')
      return
    }
    const patch = {
      name: draft.name.trim(),
      phone: (draft.phone || '').trim(),
      position: (draft.position || '').trim(),
      company: (draft.company || '').trim(),
    }
    setSaving(true)
    try {
      await updateProfile(patch) // → PUT /api/auth/profile (server mode)
      const next = { ...profile, ...patch }
      setProfile(next)
      // avatar has no backend column — keep it device-local
      storage.set(STORAGE_KEYS.PROFILE, { avatar: next.avatar })
      setEditing(false)
      showToast('Profile updated successfully', 'success')
    } catch (err) {
      showToast(err?.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* Handle avatar image change (file upload → base64 preview) */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be smaller than 2MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setDraft({ ...draft, avatar: ev.target.result })
    }
    reader.readAsDataURL(file)
  }

  /* The avatar source: uploaded base64 OR default public path */
  const avatarSrc = profile.avatar || '/Alveeee.png'

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Profile</h1>
          <p>Your account information</p>
        </div>
        {!editing ? (
          <Button onClick={startEdit}>
            <Pencil size={15} /> Edit Profile
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              <X size={15} /> Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : <><Save size={15} /> Save</>}
            </Button>
          </div>
        )}
      </div>

      {/* ─────── HERO CARD ─────── */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          {!imgError && avatarSrc ? (
            <img
              src={editing ? draft.avatar || '/Alveeee.png' : avatarSrc}
              alt={profile.name}
              className="profile-avatar-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="profile-avatar-lg">
              {getInitials(profile.name)}
            </div>
          )}

          {editing && (
            <label className="avatar-upload-btn" title="Change photo">
              <Camera size={14} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                hidden
              />
            </label>
          )}
        </div>

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

      {/* ─────── INFO CARD ─────── */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Account Information</h3>
            <p>Personal and company details</p>
          </div>
        </div>

        {!editing ? (
          <div className="profile-info-grid">
            <InfoField label="Full Name" value={profile.name} />
            <InfoField label="Position" value={profile.position} />
            <InfoField label="Email" value={profile.email} />
            <InfoField label="Phone" value={profile.phone} />
            <InfoField label="Company" value={profile.company} />
          </div>
        ) : (
          <div className="profile-info-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Position</label>
              <input
                className="form-input"
                value={draft.position}
                onChange={e => setDraft({ ...draft, position: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                value={draft.email}
                readOnly
                title="Email is your login address and cannot be changed"
                style={{ opacity: 0.65, cursor: 'not-allowed' }}
                onChange={() => {}}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="form-input"
                value={draft.phone}
                onChange={e => setDraft({ ...draft, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input
                className="form-input"
                value={draft.company}
                onChange={e => setDraft({ ...draft, company: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/* ─────────────────────────────────────────────
 *  InfoField — display-only field
 * ───────────────────────────────────────────── */
function InfoField({ label, value }) {
  return (
    <div>
      <div className="info-field-label">{label}</div>
      <div className="info-field-value">{value}</div>
    </div>
  )
}