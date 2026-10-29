import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Check, X } from 'lucide-react';
import api from '../../api/client';

export default function AdminSkills() {
  const [skills, setSkills]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [formData, setFormData]   = useState({ name: '', category: '', description: '' });

  useEffect(() => { fetchSkills() }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      // ✅ FIX: removed /api prefix
      const response = await api.get('/skills');
      setSkills(response.data || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      // ✅ FIX: removed /api prefix
      const response = await api.post('/skills', { ...formData, isActive: true });
      setSkills([...skills, response.data]);
      setFormData({ name: '', category: '', description: '' });
      setShowForm(false);
      alert('Skill added successfully');
    } catch (error) {
      console.error('Error adding skill:', error);
      alert('Failed to add skill');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      try {
        // ✅ FIX: removed /api prefix
        await api.delete(`/skills/${skillId}`);
        setSkills(skills.filter(s => s.id !== skillId));
        alert('Skill deleted successfully');
      } catch (error) {
        console.error('Error deleting skill:', error);
        alert('Failed to delete skill');
      }
    }
  };

  const handleToggleSkill = async (skill) => {
    try {
      // ✅ FIX: removed /api prefix
      await api.put(`/skills/${skill.id}`, { ...skill, isActive: !skill.isActive });
      setSkills(skills.map(s => s.id === skill.id ? { ...s, isActive: !s.isActive } : s));
    } catch (error) {
      console.error('Error updating skill:', error);
    }
  };

  const categories = [...new Set(skills.map(s => s.category))];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Skill Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} /> Add Skill
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleAddSkill}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text" placeholder="Skill Name" value={formData.name} required
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text" placeholder="Category" value={formData.category} required
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text" placeholder="Description" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
                Add Skill
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Skills by Category */}
      {loading ? (
        <div className="text-center text-gray-500">Loading skills...</div>
      ) : categories.length === 0 ? (
        <div className="text-center text-gray-500">No skills found</div>
      ) : (
        categories.map((category) => (
          <div key={category} className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills
                .filter(s => s.category === category)
                .map((skill) => (
                  <div key={skill.id}
                       className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-800">{skill.name}</h4>
                        <p className="text-gray-600 text-sm mt-1">{skill.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        skill.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {skill.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleSkill(skill)}
                        className="flex-1 flex items-center justify-center gap-2 p-2 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                      >
                        {skill.isActive ? <X size={16} /> : <Check size={16} />}
                        {skill.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}