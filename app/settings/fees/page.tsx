'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { notificationManager } from '@/lib/notifications';
import { PageHero } from '@/components/ui/page-hero';

interface ServiceFee {
  id: string;
  name: string;
  description?: string;
  amount: number;
  category: 'opd' | 'consultation' | 'procedure' | 'test' | 'other';
}

const STORAGE_KEY = 'clinic_fees';

export default function FeesManagementPage() {
  const [fees, setFees] = useState<ServiceFee[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: 'opd' as 'opd' | 'consultation' | 'procedure' | 'test' | 'other',
  });

  useEffect(() => {
    loadFees();
  }, []);

  const loadFees = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFees(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load fees:', error);
    }
  };

  const saveFees = (newFees: ServiceFee[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFees));
      setFees(newFees);
    } catch (error) {
      notificationManager.error('Error', 'Failed to save fees');
    }
  };

  const handleAddFee = () => {
    if (!formData.name || !formData.amount) {
      notificationManager.error('Error', 'Please fill in all required fields');
      return;
    }

    const newFee: ServiceFee = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
    };

    const updatedFees = [...fees, newFee];
    saveFees(updatedFees);
    notificationManager.success('Success', 'Fee added successfully');
    setFormData({ name: '', description: '', amount: '', category: 'opd' });
    setIsAdding(false);
  };

  const handleUpdateFee = (id: string) => {
    if (!formData.name || !formData.amount) {
      notificationManager.error('Error', 'Please fill in all required fields');
      return;
    }

    const updatedFees = fees.map(fee =>
      fee.id === id
        ? {
            ...fee,
            name: formData.name,
            description: formData.description,
            amount: parseFloat(formData.amount),
            category: formData.category,
          }
        : fee
    );

    saveFees(updatedFees);
    notificationManager.success('Success', 'Fee updated successfully');
    setFormData({ name: '', description: '', amount: '', category: 'opd' });
    setEditingId(null);
  };

  const handleDeleteFee = (id: string) => {
    if (!confirm('Are you sure you want to delete this fee?')) return;

    const updatedFees = fees.filter(fee => fee.id !== id);
    saveFees(updatedFees);
    notificationManager.success('Success', 'Fee deleted successfully');
  };

  const handleEdit = (fee: ServiceFee) => {
    setFormData({
      name: fee.name,
      description: fee.description || '',
      amount: fee.amount.toString(),
      category: fee.category,
    });
    setEditingId(fee.id);
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', amount: '', category: 'opd' });
    setEditingId(null);
    setIsAdding(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'opd':
        return 'bg-blue-100 text-blue-800';
      case 'consultation':
        return 'bg-purple-100 text-purple-800';
      case 'procedure':
        return 'bg-red-100 text-red-800';
      case 'test':
        return 'bg-green-100 text-green-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'opd':
        return 'OPD';
      case 'consultation':
        return 'Consultation';
      case 'procedure':
        return 'Procedure';
      case 'test':
        return 'Test';
      case 'other':
        return 'Other';
      default:
        return category;
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Settings"
        eyebrowIcon={<DollarSign className="h-3.5 w-3.5" />}
        title="Fee Management"
        subtitle="Manage OPD fees and service charges"
        stats={[{ label: 'Services', value: fees.length }]}
        actions={
          !isAdding && !editingId ? (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30 transition-all"
            >
              <Plus className="h-4 w-4" />
              Add Fee
            </button>
          ) : undefined
        }
      />

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <Card className="p-6 border-2 border-brand-teal">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingId ? 'Edit Fee' : 'Add New Fee'}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., OPD Consultation"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none"
                >
                  <option value="opd">OPD</option>
                  <option value="consultation">Consultation</option>
                  <option value="procedure">Procedure</option>
                  <option value="test">Test</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={() => editingId ? handleUpdateFee(editingId) : handleAddFee()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg font-medium hover:bg-brand-teal/90 transition-all"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Update' : 'Add'} Fee
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Fees List */}
      {fees.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No fees configured yet</p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-brand-teal text-white rounded-lg font-medium hover:bg-brand-teal/90 transition-all"
          >
            Add First Fee
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fees.map((fee) => (
            <Card key={fee.id} className="p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{fee.name}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getCategoryColor(fee.category)}`}>
                    {getCategoryLabel(fee.category)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(fee)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFee(fee.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {fee.description && (
                <p className="text-sm text-gray-600 mb-3">{fee.description}</p>
              )}

              <div className="border-t pt-3">
                <p className="text-2xl font-bold text-brand-teal">
                  ₹{fee.amount.toFixed(2)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {fees.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-brand-teal/10 to-brand-teal/5">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Fee Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Fees</p>
              <p className="text-2xl font-bold text-brand-teal">{fees.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">OPD Fees</p>
              <p className="text-2xl font-bold text-blue-600">{fees.filter(f => f.category === 'opd').length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Consultation</p>
              <p className="text-2xl font-bold text-purple-600">{fees.filter(f => f.category === 'consultation').length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Procedures</p>
              <p className="text-2xl font-bold text-red-600">{fees.filter(f => f.category === 'procedure').length}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
