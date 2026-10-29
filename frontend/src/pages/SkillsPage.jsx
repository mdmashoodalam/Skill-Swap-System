import { useState, useEffect } from 'react'
import client from '../api/client'
import {
  Plus, Trash2, Loader, Zap, BookOpen,
  ChevronDown, CheckCircle, AlertCircle
} from 'lucide-react'

const PROFICIENCY_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']
const URGENCY_LEVELS = ['LOW', 'MEDIUM', 'HIGH']

const PROFICIENCY_COLOR = {
  BEGINNER: 'bg-blue-100 text-blue-700',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-700',
  ADVANCED: 'bg-orange-100 text-orange-700',
  EXPERT: 'bg-green-100 text-green-700',
}

const URGENCY_COLOR = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-600',
}

export default function SkillsPage() {
  const [allSkills, setAllSkills] = useState([])
  const [offeredSkills, setOfferedSkills] = useState([])
  const [wantedSkills, setWantedSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  // Add-offered form state
  const [showAddOffered, setShowAddOffered] = useState(false)
  const [offeredForm, setOfferedForm] = useState({
    skillId: '', proficiencyLevel: 'BEGINNER', yearsExperience: '', description: ''
  })
  const [savingOffered, setSavingOffered] = useState(false)

  // Add-wanted form state
  const [showAddWanted, setShowAddWanted] = useState(false)
  const [wantedForm, setWantedForm] = useState({
    skillId: '', targetLevel: 'BEGINNER', purpose: '', urgencyLevel: 'MEDIUM'
  })
  const [savingWanted, setSavingWanted] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    try {
      const [skillsRes, offeredRes, wantedRes] = await Promise.all([
        client.get('/skills'),
        client.get('/users/me/offered-skills'),
        client.get('/users/me/wanted-skills'),
      ])
      setAllSkills(Array.isArray(skillsRes.data)
        ? skillsRes.data.filter((skill) => skill.isActive)
        : [])
      setOfferedSkills(offeredRes.data || [])
      setWantedSkills(wantedRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // ---------- Offered ----------
  const handleAddOffered = async (e) => {
    e.preventDefault()
    if (!offeredForm.skillId) return showMsg('error', 'Please select a skill')
    setSavingOffered(true)
    try {
      const res = await client.post('/users/me/offered-skills', {
        skillId: parseInt(offeredForm.skillId),
        proficiencyLevel: offeredForm.proficiencyLevel,
        yearsExperience: offeredForm.yearsExperience ? parseInt(offeredForm.yearsExperience) : null,
        description: offeredForm.description || null,
      })
      setOfferedSkills(prev => [...prev, res.data])
      setOfferedForm({ skillId: '', proficiencyLevel: 'BEGINNER', yearsExperience: '', description: '' })
      setShowAddOffered(false)
      showMsg('success', 'Skill added to your offerings!')
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Failed to add skill')
    } finally {
      setSavingOffered(false)
    }
  }

  const handleDeleteOffered = async (id) => {
    try {
      await client.delete(`/users/me/offered-skills/${id}`)
      setOfferedSkills(prev => prev.filter(s => s.id !== id))
      showMsg('success', 'Skill removed')
    } catch (err) {
      showMsg('error', 'Failed to remove skill')
    }
  }

  // ---------- Wanted ----------
  const handleAddWanted = async (e) => {
    e.preventDefault()
    if (!wantedForm.skillId) return showMsg('error', 'Please select a skill')
    setSavingWanted(true)
    try {
      const res = await client.post('/users/me/wanted-skills', {
        skillId: parseInt(wantedForm.skillId),
        targetLevel: wantedForm.targetLevel,
        purpose: wantedForm.purpose || null,
        urgencyLevel: wantedForm.urgencyLevel,
      })
      setWantedSkills(prev => [...prev, res.data])
      setWantedForm({ skillId: '', targetLevel: 'BEGINNER', purpose: '', urgencyLevel: 'MEDIUM' })
      setShowAddWanted(false)
      showMsg('success', 'Skill added to your wishlist!')
    } catch (err) {
      showMsg('error', err.response?.data?.error || 'Failed to add skill')
    } finally {
      setSavingWanted(false)
    }
  }

  const handleDeleteWanted = async (id) => {
    try {
      await client.delete(`/users/me/wanted-skills/${id}`)
      setWantedSkills(prev => prev.filter(s => s.id !== id))
      showMsg('success', 'Skill removed')
    } catch (err) {
      showMsg('error', 'Failed to remove skill')
    }
  }

  // Skills already added — exclude from dropdown
  const offeredSkillIds = new Set(offeredSkills.map(s => s.skill?.id))
  const wantedSkillIds = new Set(wantedSkills.map(s => s.skill?.id))

  const availableForOffered = allSkills.filter(s => !offeredSkillIds.has(s.id))
  const availableForWanted = allSkills.filter(s => !wantedSkillIds.has(s.id))

  // Group available skills by category
  const groupByCategory = (skills) =>
    skills.reduce((acc, s) => {
      const cat = s.category || 'Other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(s)
      return acc
    }, {})

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Loader className="animate-spin text-primary" size={40} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-primary mb-2">My Skills</h1>
        <p className="text-grey-400">
          Add skills you can teach and skills you want to learn — this powers your matches.
        </p>
      </div>

      {/* Toast message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {message.type === 'success'
            ? <CheckCircle className="text-success shrink-0" size={20} />
            : <AlertCircle className="text-red-500 shrink-0" size={20} />}
          <span className={message.type === 'success' ? 'text-success' : 'text-red-700'}>
            {message.text}
          </span>
        </div>
      )}

      {/* ── Skills I Offer ── */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Skills I Can Teach</h2>
              <p className="text-sm text-grey-400">What you can offer to others</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAddOffered(v => !v); setShowAddWanted(false) }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Skill
          </button>
        </div>

        {/* Add offered form */}
        {showAddOffered && (
          <form onSubmit={handleAddOffered} className="bg-cream-50 border border-surface-300 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-primary">Add a skill you can teach</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Skill *</label>
                <select
                  className="input"
                  value={offeredForm.skillId}
                  onChange={e => setOfferedForm(f => ({ ...f, skillId: e.target.value }))}
                  required
                >
                  <option value="">— Select a skill —</option>
                  {Object.entries(groupByCategory(availableForOffered)).map(([cat, skills]) => (
                    <optgroup key={cat} label={cat}>
                      {skills.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Proficiency Level *</label>
                <select
                  className="input"
                  value={offeredForm.proficiencyLevel}
                  onChange={e => setOfferedForm(f => ({ ...f, proficiencyLevel: e.target.value }))}
                >
                  {PROFICIENCY_LEVELS.map(l => (
                    <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  className="input"
                  placeholder="e.g. 2"
                  value={offeredForm.yearsExperience}
                  onChange={e => setOfferedForm(f => ({ ...f, yearsExperience: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Short Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Built 5+ production apps"
                  value={offeredForm.description}
                  onChange={e => setOfferedForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={savingOffered} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {savingOffered ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                {savingOffered ? 'Adding...' : 'Add Skill'}
              </button>
              <button type="button" onClick={() => setShowAddOffered(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* List of offered skills */}
        {offeredSkills.length === 0 ? (
          <div className="text-center py-8 text-grey-400">
            <Zap size={32} className="mx-auto mb-2 opacity-30" />
            <p>No skills added yet. Add skills you can teach!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offeredSkills.map(s => (
              <div key={s.id} className="flex items-start justify-between gap-4 p-4 bg-white border border-surface-300 rounded-xl hover:border-primary/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-primary">{s.skill?.name}</span>
                    <span className={`badge text-xs ${PROFICIENCY_COLOR[s.proficiencyLevel] || 'bg-grey-100 text-grey-600'}`}>
                      {s.proficiencyLevel}
                    </span>
                    {s.yearsExperience != null && (
                      <span className="text-xs text-grey-400">{s.yearsExperience} yr{s.yearsExperience !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {s.description && (
                    <p className="text-sm text-grey-500 mt-1">{s.description}</p>
                  )}
                  {s.skill?.category && (
                    <span className="text-xs text-grey-400 mt-1 inline-block">{s.skill.category}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteOffered(s.id)}
                  className="p-2 hover:bg-red-50 text-grey-400 hover:text-red-500 rounded-lg transition-colors shrink-0"
                  title="Remove skill"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Skills I Want to Learn ── */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <BookOpen size={20} className="text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Skills I Want to Learn</h2>
              <p className="text-sm text-grey-400">What you want others to teach you</p>
            </div>
          </div>
          <button
            onClick={() => { setShowAddWanted(v => !v); setShowAddOffered(false) }}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Skill
          </button>
        </div>

        {/* Add wanted form */}
        {showAddWanted && (
          <form onSubmit={handleAddWanted} className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-primary">Add a skill you want to learn</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Skill *</label>
                <select
                  className="input"
                  value={wantedForm.skillId}
                  onChange={e => setWantedForm(f => ({ ...f, skillId: e.target.value }))}
                  required
                >
                  <option value="">— Select a skill —</option>
                  {Object.entries(groupByCategory(availableForWanted)).map(([cat, skills]) => (
                    <optgroup key={cat} label={cat}>
                      {skills.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Target Level *</label>
                <select
                  className="input"
                  value={wantedForm.targetLevel}
                  onChange={e => setWantedForm(f => ({ ...f, targetLevel: e.target.value }))}
                >
                  {PROFICIENCY_LEVELS.map(l => (
                    <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Urgency</label>
                <select
                  className="input"
                  value={wantedForm.urgencyLevel}
                  onChange={e => setWantedForm(f => ({ ...f, urgencyLevel: e.target.value }))}
                >
                  {URGENCY_LEVELS.map(l => (
                    <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Purpose / Goal</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. For a new job, hobby project"
                  value={wantedForm.purpose}
                  onChange={e => setWantedForm(f => ({ ...f, purpose: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={savingWanted} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {savingWanted ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                {savingWanted ? 'Adding...' : 'Add Skill'}
              </button>
              <button type="button" onClick={() => setShowAddWanted(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* List of wanted skills */}
        {wantedSkills.length === 0 ? (
          <div className="text-center py-8 text-grey-400">
            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p>No learning goals yet. Add skills you want to learn!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wantedSkills.map(s => (
              <div key={s.id} className="flex items-start justify-between gap-4 p-4 bg-white border border-surface-300 rounded-xl hover:border-amber-200 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-primary">{s.skill?.name}</span>
                    <span className={`badge text-xs ${PROFICIENCY_COLOR[s.targetLevel] || 'bg-grey-100 text-grey-600'}`}>
                      Target: {s.targetLevel}
                    </span>
                    {s.urgencyLevel && (
                      <span className={`badge text-xs ${URGENCY_COLOR[s.urgencyLevel]}`}>
                        {s.urgencyLevel} urgency
                      </span>
                    )}
                  </div>
                  {s.purpose && (
                    <p className="text-sm text-grey-500 mt-1">{s.purpose}</p>
                  )}
                  {s.skill?.category && (
                    <span className="text-xs text-grey-400 mt-1 inline-block">{s.skill.category}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteWanted(s.id)}
                  className="p-2 hover:bg-red-50 text-grey-400 hover:text-red-500 rounded-lg transition-colors shrink-0"
                  title="Remove skill"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tips box */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <p className="font-semibold text-primary mb-2">💡 Tips for better matches</p>
        <ul className="text-sm text-grey-600 space-y-1">
          <li>• Add at least <strong>1 skill you offer</strong> and <strong>1 skill you want</strong> to appear in others' matches</li>
          <li>• The more skills you add, the higher your match scores will be</li>
          <li>• You need at least 1 offered skill before you can send swap requests</li>
        </ul>
      </div>
    </div>
  )
}
