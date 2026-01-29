'use client';

import { useState, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Plus, Trash2, Pill } from 'lucide-react';
import { commonMedicines } from '@/lib/medicalData';

interface Medicine {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  timing: string;
  duration: string;
  startFrom: string;
  instructions: string;
}

interface MedicineInputStructuredProps {
  name: string;
  label: string;
  error?: any;
}

const MedicineInputStructured: React.FC<MedicineInputStructuredProps> = ({ name, label, error }) => {
  const { control } = useFormContext();
  const [allMedicines, setAllMedicines] = useState<string[]>(commonMedicines);
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
  const [filteredMedicines, setFilteredMedicines] = useState<{ [key: string]: string[] }>({});
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<{ [key: string]: number }>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ [key: string]: { top: number; left: number } }>({});

  useEffect(() => {
    fetchCustomMedicines();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Close dropdown on scroll to prevent positioning issues
      setShowSuggestions({});
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const fetchCustomMedicines = async () => {
    try {
      const response = await fetch('/api/medicines');
      if (response.ok) {
        const customMeds = await response.json();
        const customMedNames = customMeds.map((m: any) => m.name);
        const allMeds = [...customMedNames, ...commonMedicines];
        const uniqueMap = new Map<string, string>();
        allMeds.forEach(med => {
          const lowerKey = med.toLowerCase().trim();
          if (!uniqueMap.has(lowerKey)) {
            uniqueMap.set(lowerKey, med);
          }
        });
        const uniqueMeds = Array.from(uniqueMap.values());
        setAllMedicines(uniqueMeds);
      }
    } catch (error) {
      console.error('Failed to fetch custom medicines:', error);
      setAllMedicines(commonMedicines);
    }
  };

  const createEmptyMedicine = (): Medicine => ({
    id: Date.now().toString(),
    name: '',
    dose: '',
    frequency: '',
    timing: '',
    duration: '',
    startFrom: '',
    instructions: '',
  });

  const handleSearch = (query: string, medicineId: string) => {
    if (query.trim() && query.length >= 1) {
      const searchTerm = query.trim().toLowerCase();
      const filtered = allMedicines.filter(med =>
        med.toLowerCase().includes(searchTerm)
      );
      
      setFilteredMedicines(prev => ({ ...prev, [medicineId]: filtered }));
      setShowSuggestions(prev => ({ ...prev, [medicineId]: filtered.length > 0 }));
      setSelectedSuggestionIndex(prev => ({ ...prev, [medicineId]: 0 }));
    } else {
      setShowSuggestions(prev => ({ ...prev, [medicineId]: false }));
    }
  };

  const handleSelectMedicine = (medicineName: string, medicineId: string, medicines: Medicine[], onChange: (value: Medicine[]) => void) => {
    const updated = medicines.map(med =>
      med.id === medicineId ? { ...med, name: medicineName } : med
    );
    onChange(updated);
    setShowSuggestions(prev => ({ ...prev, [medicineId]: false }));
  };

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={[createEmptyMedicine()]}
      render={({ field: { onChange, value } }) => {
        const medicines: Medicine[] = value || [createEmptyMedicine()];

        const addMedicine = () => {
          onChange([...medicines, createEmptyMedicine()]);
        };

        const removeMedicine = (id: string) => {
          if (medicines.length > 1) {
            onChange(medicines.filter(med => med.id !== id));
          }
        };

        const updateMedicine = (id: string, field: keyof Medicine, fieldValue: string) => {
          const updated = medicines.map(med =>
            med.id === id ? { ...med, [field]: fieldValue } : med
          );
          onChange(updated);
        };

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-brand-teal">
                <Pill className="h-4 w-4" />
                {label}
              </label>
              <button
                type="button"
                onClick={addMedicine}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-teal hover:bg-brand-teal/90 rounded-lg transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Medicine
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block border-2 border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '100%' }}>
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Medicine</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Dose</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Frequency</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Timing</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Duration</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Start From</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Instructions</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {medicines.map((medicine) => (
                    <tr key={medicine.id} className="hover:bg-gray-50">
                      {/* Medicine Name */}
                      <td className="px-3 py-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={medicine.name}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              updateMedicine(medicine.id, 'name', newValue);
                              handleSearch(newValue, medicine.id);
                            }}
                            onFocus={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPosition(prev => ({
                                ...prev,
                                [medicine.id]: {
                                  top: rect.top - 4,
                                  left: rect.left
                                }
                              }));
                              if (medicine.name) {
                                handleSearch(medicine.name, medicine.id);
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setShowSuggestions(prev => ({ ...prev, [medicine.id]: false }));
                              }, 200);
                            }}
                            onKeyDown={(e) => {
                              const suggestions = filteredMedicines[medicine.id] || [];
                              const currentIndex = selectedSuggestionIndex[medicine.id] || 0;
                              
                              if (showSuggestions[medicine.id] && suggestions.length > 0) {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  const newIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
                                  setSelectedSuggestionIndex(prev => ({ ...prev, [medicine.id]: newIndex }));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  const newIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
                                  setSelectedSuggestionIndex(prev => ({ ...prev, [medicine.id]: newIndex }));
                                } else if (e.key === 'Enter' || e.key === 'Tab') {
                                  e.preventDefault();
                                  handleSelectMedicine(suggestions[currentIndex], medicine.id, medicines, onChange);
                                } else if (e.key === 'Escape') {
                                  setShowSuggestions(prev => ({ ...prev, [medicine.id]: false }));
                                }
                              }
                            }}
                            placeholder="e.g. Bycine CD3"
                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 outline-none"
                          />
                          {showSuggestions[medicine.id] && filteredMedicines[medicine.id]?.length > 0 && (
                            <div 
                              className="fixed z-[9999] w-48 bg-white border border-gray-300 rounded-lg shadow-xl max-h-40 overflow-y-auto"
                              style={{
                                top: `${dropdownPosition[medicine.id]?.top || 0}px`,
                                left: `${dropdownPosition[medicine.id]?.left || 0}px`
                              }}
                            >
                              {filteredMedicines[medicine.id].slice(0, 10).map((med, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectMedicine(med, medicine.id, medicines, onChange);
                                  }}
                                  onMouseEnter={() => {
                                    setSelectedSuggestionIndex(prev => ({ ...prev, [medicine.id]: idx }));
                                  }}
                                  className={`w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 transition-colors flex items-start gap-2 ${
                                    (selectedSuggestionIndex[medicine.id] || 0) === idx
                                      ? 'bg-blue-50'
                                      : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                                      <span className="text-xs font-bold text-red-600">Mx</span>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">
                                      {med}
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Dose - Dropdown */}
                      <td className="px-3 py-2">
                        <select
                          value={medicine.dose}
                          onChange={(e) => updateMedicine(medicine.id, 'dose', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 outline-none"
                        >
                          <option value="">Select</option>
                          <option value="1/2 Tablet">1/2 Tablet</option>
                          <option value="1 Tablet">1 Tablet</option>
                          <option value="2 Tablets">2 Tablets</option>
                          <option value="3 Tablets">3 Tablets</option>
                          <option value="1/2 Capsule">1/2 Capsule</option>
                          <option value="1 Capsule">1 Capsule</option>
                          <option value="2 Capsules">2 Capsules</option>
                          <option value="5ml">5ml</option>
                          <option value="10ml">10ml</option>
                          <option value="15ml">15ml</option>
                          <option value="1 Injection">1 Injection</option>
                          <option value="1 Drop">1 Drop</option>
                          <option value="2 Drops">2 Drops</option>
                        </select>
                      </td>

                      {/* Frequency - Dropdown */}
                      <td className="px-3 py-2">
                        <select
                          value={medicine.frequency}
                          onChange={(e) => updateMedicine(medicine.id, 'frequency', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 outline-none"
                        >
                          <option value="">Select</option>
                          <option value="1-1-1">1-1-1 (Thrice daily)</option>
                          <option value="1-0-1">1-0-1 (Morning & Evening)</option>
                          <option value="0-1-0">0-1-0 (Afternoon only)</option>
                          <option value="1-0-0">1-0-0 (Morning only)</option>
                          <option value="0-0-1">0-0-1 (Evening only)</option>
                          <option value="1-1-0">1-1-0 (Morning & Afternoon)</option>
                          <option value="0-1-1">0-1-1 (Afternoon & Evening)</option>
                          <option value="SOS">SOS (As needed)</option>
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="Every 4 hours">Every 4 hours</option>
                          <option value="Every 6 hours">Every 6 hours</option>
                          <option value="Every 8 hours">Every 8 hours</option>
                          <option value="Every 12 hours">Every 12 hours</option>
                        </select>
                      </td>

                      {/* Timing */}
                      <td className="px-3 py-2">
                        <select
                          value={medicine.timing}
                          onChange={(e) => updateMedicine(medicine.id, 'timing', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 outline-none"
                        >
                          <option value="">Select</option>
                          <option value="After Meal">After Meal</option>
                          <option value="Before Meal">Before Meal</option>
                          <option value="With Meal">With Meal</option>
                          <option value="Empty Stomach">Empty Stomach</option>
                        </select>
                      </td>

                      {/* Duration */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={medicine.duration}
                          onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                          placeholder="5 Days"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 outline-none"
                        />
                      </td>

                      {/* Start From */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={medicine.startFrom}
                          onChange={(e) => updateMedicine(medicine.id, 'startFrom', e.target.value)}
                          placeholder="3 day"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 outline-none"
                        />
                      </td>

                      {/* Instructions */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={medicine.instructions}
                          onChange={(e) => updateMedicine(medicine.id, 'instructions', e.target.value)}
                          placeholder="Instructions"
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 outline-none"
                        />
                      </td>

                      {/* Delete Button */}
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeMedicine(medicine.id)}
                          disabled={medicines.length === 1}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {medicines.map((medicine, index) => (
                <div key={medicine.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500">Medicine #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeMedicine(medicine.id)}
                      disabled={medicines.length === 1}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Medicine Name</label>
                      <input
                        type="text"
                        value={medicine.name}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          updateMedicine(medicine.id, 'name', newValue);
                          handleSearch(newValue, medicine.id);
                        }}
                        onFocus={() => {
                          if (medicine.name) {
                            handleSearch(medicine.name, medicine.id);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowSuggestions(prev => ({ ...prev, [medicine.id]: false }));
                          }, 200);
                        }}
                        placeholder="e.g. Bycine CD3"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                      />
                      {showSuggestions[medicine.id] && filteredMedicines[medicine.id]?.length > 0 && (
                        <div className="absolute top-full left-0 z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                          {filteredMedicines[medicine.id].slice(0, 10).map((med, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectMedicine(med, medicine.id, medicines, onChange);
                              }}
                              className="w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 transition-colors flex items-start gap-2 hover:bg-gray-50"
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                                  <span className="text-xs font-bold text-red-600">Mx</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">
                                  {med}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Dose</label>
                        <select
                          value={medicine.dose}
                          onChange={(e) => updateMedicine(medicine.id, 'dose', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-brand-teal outline-none"
                        >
                          <option value="">Select</option>
                          <option value="1/2 Tablet">1/2 Tablet</option>
                          <option value="1 Tablet">1 Tablet</option>
                          <option value="2 Tablets">2 Tablets</option>
                          <option value="3 Tablets">3 Tablets</option>
                          <option value="1/2 Capsule">1/2 Capsule</option>
                          <option value="1 Capsule">1 Capsule</option>
                          <option value="2 Capsules">2 Capsules</option>
                          <option value="5ml">5ml</option>
                          <option value="10ml">10ml</option>
                          <option value="15ml">15ml</option>
                          <option value="1 Injection">1 Injection</option>
                          <option value="1 Drop">1 Drop</option>
                          <option value="2 Drops">2 Drops</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                        <select
                          value={medicine.frequency}
                          onChange={(e) => updateMedicine(medicine.id, 'frequency', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-brand-teal outline-none"
                        >
                          <option value="">Select</option>
                          <option value="1-1-1">1-1-1 (Thrice daily)</option>
                          <option value="1-0-1">1-0-1 (Morning & Evening)</option>
                          <option value="0-1-0">0-1-0 (Afternoon only)</option>
                          <option value="1-0-0">1-0-0 (Morning only)</option>
                          <option value="0-0-1">0-0-1 (Evening only)</option>
                          <option value="1-1-0">1-1-0 (Morning & Afternoon)</option>
                          <option value="0-1-1">0-1-1 (Afternoon & Evening)</option>
                          <option value="SOS">SOS (As needed)</option>
                          <option value="Once daily">Once daily</option>
                          <option value="Twice daily">Twice daily</option>
                          <option value="Every 4 hours">Every 4 hours</option>
                          <option value="Every 6 hours">Every 6 hours</option>
                          <option value="Every 8 hours">Every 8 hours</option>
                          <option value="Every 12 hours">Every 12 hours</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Timing</label>
                        <select
                          value={medicine.timing}
                          onChange={(e) => updateMedicine(medicine.id, 'timing', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-brand-teal outline-none"
                        >
                          <option value="">Select</option>
                          <option value="After Meal">After Meal</option>
                          <option value="Before Meal">Before Meal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                        <input
                          type="text"
                          value={medicine.duration}
                          onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                          placeholder="5 Days"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-brand-teal outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Instructions</label>
                      <input
                        type="text"
                        value={medicine.instructions}
                        onChange={(e) => updateMedicine(medicine.id, 'instructions', e.target.value)}
                        placeholder="Special instructions"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-brand-teal outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {error && error.message && !error.message.includes('Expected string, received array') && (
              <p className="text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠</span>
                {error.message}
              </p>
            )}

            <p className="text-xs text-gray-500">
              Add medicines with dosage, frequency, and timing. Click "Add Medicine" to add more.
            </p>
          </div>
        );
      }}
    />
  );
};

export default MedicineInputStructured;
