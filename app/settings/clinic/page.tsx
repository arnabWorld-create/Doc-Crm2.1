'use client';

import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, MapPin, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { notificationManager } from '@/lib/notifications';

interface ClinicSettings {
  clinicName: string;
  clinicEmail: string;
  clinicPhone: string;
  clinicAddress: string;
  clinicWebsite?: string;
  invoiceHeader?: string;
  invoiceFooter?: string;
  receiptHeader?: string;
  receiptFooter?: string;
}

export default function ClinicSettingsPage() {
  const [settings, setSettings] = useState<ClinicSettings>({
    clinicName: '',
    clinicEmail: '',
    clinicPhone: '',
    clinicAddress: '',
    clinicWebsite: '',
    invoiceHeader: '',
    invoiceFooter: '',
    receiptHeader: '',
    receiptFooter: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('clinic_settings');
        console.log('Loaded clinic settings:', stored);
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('clinic_settings', JSON.stringify(settings));
        console.log('Saved clinic settings:', settings);
        notificationManager.success('Success', 'Clinic settings saved successfully');
      }
    } catch (error) {
      notificationManager.error('Error', 'Failed to save settings');
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clinic Settings</h1>
          <p className="text-gray-600 mt-1">Configure your clinic information for invoices and receipts</p>
        </div>
        <div className="p-3 bg-brand-teal/10 rounded-lg">
          <Building2 className="w-8 h-8 text-brand-teal" />
        </div>
      </div>

      {/* Clinic Information */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Clinic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Name</label>
            <input
              type="text"
              name="clinicName"
              value={settings.clinicName}
              onChange={handleChange}
              placeholder="e.g., Dr. Smith's Clinic"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              name="clinicEmail"
              value={settings.clinicEmail}
              onChange={handleChange}
              placeholder="contact@clinic.com"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              name="clinicPhone"
              value={settings.clinicPhone}
              onChange={handleChange}
              placeholder="+91-XXXXXXXXXX"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="text"
              name="clinicWebsite"
              value={settings.clinicWebsite}
              onChange={handleChange}
              placeholder="www.clinic.com"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              name="clinicAddress"
              value={settings.clinicAddress}
              onChange={handleChange}
              placeholder="Street, City, State, PIN"
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Invoice Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Invoice Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Header</label>
            <textarea
              name="invoiceHeader"
              value={settings.invoiceHeader}
              onChange={handleChange}
              placeholder="Additional header text for invoices"
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Footer</label>
            <textarea
              name="invoiceFooter"
              value={settings.invoiceFooter}
              onChange={handleChange}
              placeholder="Terms, conditions, or additional footer text for invoices"
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Receipt Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Receipt Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Header</label>
            <textarea
              name="receiptHeader"
              value={settings.receiptHeader}
              onChange={handleChange}
              placeholder="Additional header text for receipts"
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Footer</label>
            <textarea
              name="receiptFooter"
              value={settings.receiptFooter}
              onChange={handleChange}
              placeholder="Thank you message or additional footer text for receipts"
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-brand-teal focus:outline-none resize-none"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-lg font-medium hover:bg-brand-teal/90 disabled:opacity-50 transition-all"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
