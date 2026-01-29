'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

// Import standardized medicine list
import { commonMedicines } from '@/lib/medicalData';

interface CustomMedicine {
  id: string;
  name: string;
  usageCount: number;
}

interface MedicineInputProps {
  name: string;
  label: string;
  error?: any;
  placeholder?: string;
}

const MedicineInput: React.FC<MedicineInputProps> = ({ name, label, error, placeholder }) => {
  const { control } = useFormContext();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredMedicines, setFilteredMedicines] = useState<string[]>([]);
  const [allMedicines, setAllMedicines] = useState<string[]>(commonMedicines);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch custom medicines on component mount
  useEffect(() => {
    fetchCustomMedicines();
  }, []);

  // Removed cleanup - medicines are only saved when:
  // 1. User selects from dropdown
  // 2. Form is submitted (handled by VisitForm)

  const fetchCustomMedicines = async () => {
    try {

      const response = await fetch('/api/medicines');
      if (response.ok) {
        const customMeds: CustomMedicine[] = await response.json();

        const customMedNames = customMeds.map(m => m.name);
        
        // Combine and deduplicate medicines (custom first for priority)
        const allMeds = [...customMedNames, ...commonMedicines];
        
        // Deduplicate by creating a Map with lowercase keys
        const uniqueMap = new Map<string, string>();
        allMeds.forEach(med => {
          const lowerKey = med.toLowerCase().trim();
          if (!uniqueMap.has(lowerKey)) {
            uniqueMap.set(lowerKey, med);
          }
        });
        
        const uniqueMeds = Array.from(uniqueMap.values());
        setAllMedicines(uniqueMeds);

      } else {
        console.error('Failed to fetch medicines, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch custom medicines:', error);
    }
  };

  const saveCustomMedicine = async (medicineName: string) => {
    try {
      // Validate medicine name before saving
      const trimmed = medicineName.trim();
      if (trimmed.length < 4) {

        return;
      }


      const response = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      
      if (response.ok) {
        const data = await response.json();

        // Refresh the medicine list
        await fetchCustomMedicines();
      } else {
        console.error('Failed to save medicine, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to save custom medicine:', error);
    }
  };

interface MedicineInputProps {
  name: string;
  label: string;
  error?: any;
  placeholder?: string;
}

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateSuggestions = (value: string, position: number) => {
    const textBeforeCursor = value.substring(0, position);
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    const currentLine = textBeforeCursor.substring(lastNewlineIndex + 1);

    if (currentLine.trim()) {
      const filtered = allMedicines.filter(med =>
        med.toLowerCase().includes(currentLine.trim().toLowerCase())
      );
      setFilteredMedicines(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0); // Reset selection when suggestions change
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectMedicine = (medicine: string, currentValue: string, onChange: (value: string) => void) => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const value = currentValue || '';
    const position = cursorPos;
    const textBeforeCursor = value.substring(0, position);
    const textAfterCursor = value.substring(position);
    
    // Find the start of the current line
    const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
    const lineStart = lastNewlineIndex + 1;
    
    // Replace current line with selected medicine
    const beforeLine = value.substring(0, lineStart);
    const newValue = beforeLine + medicine + textAfterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Save custom medicine if it's not in the default list
    if (!commonMedicines.includes(medicine)) {
      saveCustomMedicine(medicine);
    }
    
    // Set cursor position after the inserted medicine
    setTimeout(() => {
      if (textarea) {
        const newCursorPos = lineStart + medicine.length;
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPos(newCursorPos);
      }
    }, 10);
  };

  // This function is now only called on form submit, not while typing
  const handleSaveMedicines = (value: string) => {
    if (!value) return;
    
    const medicines = value.split('\n').map(m => m.trim()).filter(m => m);
    medicines.forEach(medicine => {
      // Only save complete medicine names (not partial typing)
      if (medicine && medicine.length >= 3 && !commonMedicines.includes(medicine)) {
        saveCustomMedicine(medicine);
      }
    });
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, value } }) => (
        <div className="relative">
          <label htmlFor={name} className="block text-sm font-semibold text-brand-teal mb-2">
            {label}
          </label>
          <div className="relative">
            <textarea
              ref={inputRef}
              id={name}
              value={value || ''}
              onChange={(e) => {
                const newValue = e.target.value;
                const position = e.target.selectionStart;
                onChange(newValue);
                setCursorPos(position);
                updateSuggestions(newValue, position);
              }}
              onBlur={() => {
                // Don't save on blur - only save when user selects from dropdown
                // or when form is submitted
              }}
              onKeyDown={(e) => {
                if (!showSuggestions || filteredMedicines.length === 0) return;

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedIndex((prev) => 
                    prev < filteredMedicines.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSelectMedicine(filteredMedicines[selectedIndex], value, onChange);
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  handleSelectMedicine(filteredMedicines[selectedIndex], value, onChange);
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              onClick={(e) => {
                setCursorPos(e.currentTarget.selectionStart);
              }}
              onKeyUp={(e) => {
                setCursorPos(e.currentTarget.selectionStart);
              }}
              rows={3}
              placeholder={placeholder}
              className="block w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all resize-none"
            />
            
            {showSuggestions && filteredMedicines.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto"
              >
                {filteredMedicines.map((medicine, index) => (
                  <button
                    key={index}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectMedicine(medicine, value, onChange);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors flex items-start gap-3 ${
                      index === selectedIndex
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-red-600">Mx</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">
                        {medicine}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {error && (
            <p className="mt-1.5 text-sm text-brand-red flex items-center">
              <span className="mr-1">⚠</span>
              {error.message}
            </p>
          )}
          
          <p className="mt-1 text-xs text-gray-500">
            Type to search medicines or enter custom names. Press Tab to autocomplete.
          </p>
        </div>
      )}
    />
  );
};

export default MedicineInput;
