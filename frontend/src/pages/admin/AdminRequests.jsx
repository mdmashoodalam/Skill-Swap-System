import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, MessageSquare } from 'lucide-react';
import api from '../../api/client';

export default function AdminRequests() {
  const [requests, setRequests]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => { fetchRequests() }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // ✅ FIX: removed /api prefix
      const response = await api.get('/swap-requests/all');
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      // ✅ FIX: removed /api prefix
      await api.put(`/swap-requests/${requestId}`, { status: newStatus });
      setRequests((current) => current.map(r =>
        r.id === requestId ? { ...r, status: newStatus } : r
      ));
      alert('Request status updated');
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request');
    }
  };

  const filteredRequests = filterStatus === 'ALL'
    ? requests
    : requests.filter(r => r.status === filterStatus);

  const statuses = [...new Set(requests.map(r => r.status))];
  const statusIcons = {
    PENDING:   <Clock size={16} className="text-yellow-500" />,
    ACCEPTED:  <CheckCircle size={16} className="text-green-500" />,
    REJECTED:  <XCircle size={16} className="text-red-500" />,
    COMPLETED: <CheckCircle size={16} className="text-blue-500" />,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Swap Requests</h2>
        <p className="text-gray-600">Total: {requests.length}</p>
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
          All ({requests.length})
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              filterStatus === status
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {statusIcons[status]}
            {status} ({requests.filter(r => r.status === status).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">From</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">To</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Message</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">#{request.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-800">{request.sender?.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium text-gray-800">{request.receiver?.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-gray-400" />
                        {request.message}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'PENDING'  ? 'bg-yellow-100 text-yellow-700' :
                        request.status === 'ACCEPTED' ? 'bg-green-100 text-green-700'  :
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-700'      :
                                                        'bg-blue-100 text-blue-700'
                      }`}>
                        {statusIcons[request.status]}
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'ACCEPTED')}
                            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'REJECTED')}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
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
