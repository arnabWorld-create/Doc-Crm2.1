'use client';

import { useState, useRef, useEffect } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { commonConditions } from '@/lib/medicalData';

interface ConditionInputProps {
  name: string;
  label: string;
  error?: any;
  placeholder?: string;
}

const ConditionInput: React.FC<ConditionInputProps> = ({ name, label, error, placeholder }) => {
  const { control } = useFormContext();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredConditions, setFilteredConditions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const updateSuggestions = (value: string) => {
    const lastWord = value.split(/[\s,]+/).pop() || '';
    
    if (lastWord.length >= 2) {
      const filtered = commonConditions.filter(condition =>
        condition.toLowerCase().includes(lastWord.toLowerCase())
      );
      setFilteredConditions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectCondition = (condition: string, currentValue: string, onChange: (value: string) => void) => {
    const words = currentValue.split(/[\s,]+/);
    words[words.length - 1] = condition;
    const newValue = words.join(', ') + ', ';
    
    onChange(newValue);
    setShowSuggestions(false);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newValue.length, newValue.length);
      }
    }, 10);
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
                onChange(newValue);
                updateSuggestions(newValue);
              }}
              onKeyDown={(e) => {
                if (!showSuggestions || filteredConditions.length === 0) return;

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSelectedIndex((prev) => 
                    prev < filteredConditions.length - 1 ? prev + 1 : prev
                  );
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
                } else if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault();
                  handleSelectCondition(filteredConditions[selectedIndex], value, onChange);
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              rows={3}
              placeholder={placeholder}
              className="block w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all resize-none"
            />
            
            {showSuggestions && filteredConditions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-10 w-full mt-1 bg-white border-2 border-brand-teal rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                <div className="p-2">
                  <p className="text-xs text-gray-500 mb-2 px-2">Suggested conditions:</p>
                  {filteredConditions.map((condition, index) => (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectCondition(condition, value, onChange);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                        index === selectedIndex
                          ? 'bg-brand-teal text-white'
                          : 'hover:bg-brand-teal hover:text-white'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
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
            Type symptoms/conditions separated by commas. Autocomplete available.
          </p>
        </div>
      )}
    />
  );
};

export default ConditionInput;
