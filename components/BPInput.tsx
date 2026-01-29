'use client';

interface BPInputProps {
  name: string;
  label: string;
  register: any;
  error?: any;
  placeholder?: string;
}

const BPInput: React.FC<BPInputProps> = ({ 
  name, 
  label, 
  register, 
  error, 
  placeholder = "120/80"
}) => {
  const { ref, ...registerProps } = register(name);

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-brand-teal mb-2">
        {label}
      </label>
      <input
        id={name}
        ref={ref}
        type="text"
        placeholder={placeholder}
        className="block w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none transition-all"
        {...registerProps}
      />
      <p className="text-xs text-gray-500 mt-1">Format: Systolic/Diastolic (e.g., 120/80)</p>
      {error && (
        <p className="mt-1.5 text-sm text-brand-red flex items-center">
          <span className="mr-1">⚠</span>
          {error.message}
        </p>
      )}
    </div>
  );
};

export default BPInput;
