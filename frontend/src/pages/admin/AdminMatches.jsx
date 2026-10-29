import React, { useState, useEffect } from 'react';
import { Users, TrendingUp } from 'lucide-react';
import api from '../../api/client';

export default function AdminMatches() {
  const [matches, setMatches]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => { fetchMatches() }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      // ✅ FIX: removed /api prefix — baseURL already includes /api
      const response = await api.get('/matches/all');
      setMatches(response.data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (matchId, newStatus) => {
    try {
      // ✅ FIX: removed /api prefix
      await api.put(`/matches/${matchId}`, { status: newStatus });
      setMatches((current) => current.map(m =>
        m.id === matchId ? { ...m, status: newStatus } : m
      ));
      alert('Match status updated');
    } catch (error) {
      console.error('Error updating match:', error);
      alert('Failed to update match');
    }
  };

  const filteredMatches = filterStatus === 'ALL'
    ? matches
    : matches.filter(m => m.status === filterStatus);

  const statuses = [...new Set(matches.map(m => m.status))];
  const statusColors = {
    ACTIVE:    'bg-green-100 text-green-700',
    BLOCKED:   'bg-red-100 text-red-700',
    ENDED:     'bg-gray-100 text-gray-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Matches Overview</h2>
        <p className="text-gray-600">Total: {matches.length}</p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filterStatus === 'ALL'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All ({matches.length})
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === status
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status} ({matches.filter(m => m.status === status).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading matches...</div>
        ) : filteredMatches.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No matches found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User 1</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">User 2</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMatches.map((match) => (
                  <tr key={match.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">#{match.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-800">{match.user1?.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-800">{match.user2?.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-green-500" />
                        <span className="font-medium text-gray-800">
                          {(match.matchScore || 0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[match.status] || 'bg-gray-100 text-gray-700'
                      }`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={match.status}
                        onChange={(event) => handleUpdateStatus(match.id, event.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 bg-white"
                        aria-label={`Update match ${match.id} status`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="ENDED">Ended</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
