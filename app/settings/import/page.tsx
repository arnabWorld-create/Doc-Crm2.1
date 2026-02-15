'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { notificationManager } from '@/lib/notifications';

type Step = 'upload' | 'mapping' | 'validation' | 'importing' | 'complete';
type DuplicateStrategy = 'skip' | 'update' | 'create';

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [mapping, setMapping] = useState<any>({});
  const [validation, setValidation] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip');
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setIsProcessing(true);
    
    try {
      // Parse file
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      const response = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse file');
      }
      
      const data = await response.json();
      setParsedData(data);
      setMapping(data.suggestedMapping);
      setStep('mapping');
      
      notificationManager.success('File Parsed', `Found ${data.rowCount} rows`);
    } catch (error) {
      notificationManager.error('Parse Error', (error as Error).message);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleValidate = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parsedData.fullData || parsedData.preview, // Validate full data
          mapping,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Validation failed');
      }
      
      const validationResult = await response.json();
      setValidation(validationResult);
      setStep('validation');
      
      if (validationResult.isValid) {
        notificationManager.success('Validation Passed', 'Data is ready to import');
      } else {
        notificationManager.warning('Validation Issues', `Found ${validationResult.errors.length} errors`);
      }
    } catch (error) {
      notificationManager.error('Validation Error', (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleImport = async () => {
    setStep('importing');
    setProgress(0);
    
    // Smooth incremental progress animation
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      if (currentProgress < 90) {
        // Increment by random small amounts for natural feel
        const increment = Math.floor(Math.random() * 3) + 1; // 1-3% at a time
        currentProgress = Math.min(currentProgress + increment, 90);
        setProgress(currentProgress);
      }
    }, 150); // Update every 150ms for smooth incremental animation
    
    try {
      const response = await fetch('/api/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parsedData.fullData || parsedData.preview,
          mapping,
          duplicateStrategy, // Include duplicate strategy
        }),
      });
      
      if (!response.ok) {
        clearInterval(progressInterval);
        throw new Error('Import failed');
      }
      
      // Stream progress
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        clearInterval(progressInterval);
        throw new Error('No response stream');
      }
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.progress !== undefined && data.progress > currentProgress) {
              currentProgress = data.progress;
              setProgress(data.progress);
            }
            
            if (data.result) {
              clearInterval(progressInterval);
              // Animate to 100%
              let finalProgress = currentProgress;
              const finalInterval = setInterval(() => {
                finalProgress += 2;
                if (finalProgress >= 100) {
                  finalProgress = 100;
                  setProgress(100);
                  clearInterval(finalInterval);
                  
                  // Show complete screen after reaching 100%
                  setTimeout(() => {
                    setResult(data.result);
                    setStep('complete');
                    notificationManager.success(
                      'Import Complete',
                      `Imported ${data.result.success} patients successfully`
                    );
                  }, 300);
                } else {
                  setProgress(finalProgress);
                }
              }, 50);
            }
            
            if (data.error) {
              clearInterval(progressInterval);
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (error) {
      clearInterval(progressInterval);
      notificationManager.error('Import Error', (error as Error).message);
      setStep('validation');
    }
  };
  
  const resetImport = () => {
    setStep('upload');
    setFile(null);
    setParsedData(null);
    setMapping({});
    setValidation(null);
    setProgress(0);
    setResult(null);
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-teal">Import Patient Data</h1>
        <p className="text-gray-600 mt-2">
          Upload your existing patient data from Excel, CSV, or JSON files
        </p>
      </div>
      
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {['upload', 'mapping', 'validation', 'importing', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step === s ? 'bg-brand-teal text-white' :
              ['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(step) > i ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(step) > i ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            {i < 4 && (
              <div className={`w-16 h-1 mx-2 ${
                ['upload', 'mapping', 'validation', 'importing', 'complete'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-dashed border-gray-300 hover:border-brand-teal transition-all">
          <div className="text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Upload Your Patient Data</h2>
            <p className="text-gray-600 mb-6">
              Supported formats: Excel (.xlsx), CSV, JSON | Maximum size: 10MB
            </p>
            
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.json"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="hidden"
              id="file-upload"
            />
            
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center px-6 py-3 bg-brand-teal text-white rounded-lg cursor-pointer hover:bg-brand-teal/90 transition-all ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              {isProcessing ? 'Processing...' : 'Choose File'}
            </label>
            
            <div className="mt-8 text-left max-w-md mx-auto">
              <h3 className="font-semibold mb-2">📋 File Requirements:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Must have a header row with column names</li>
                <li>✅ At minimum, include patient names</li>
                <li>✅ Patient columns: Name, Age, Gender, Contact, Blood Group</li>
                <li>✅ Visit columns: Visit Date, Diagnosis, Treatment, Medicines</li>
                <li>✅ Vitals: BP, Temperature, Pulse, SPO2, Weight, RBS</li>
                <li>✅ Maximum 5000 records per file</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Step 2: Column Mapping */}
      {step === 'mapping' && parsedData && (
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Map Your Columns</h2>
          <p className="text-gray-600 mb-6">
            We've auto-detected most columns. Review and adjust if needed.
          </p>
          
          <div className="space-y-4 mb-6">
            {parsedData.columns.map((column: string) => (
              <div key={column} className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">{column}</label>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <select
                  value={mapping[column] || ''}
                  onChange={(e) => setMapping({ ...mapping, [column]: e.target.value })}
                  className="flex-1 rounded-lg border-2 border-gray-200 px-4 py-2 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 outline-none"
                >
                  <option value="">Skip this column</option>
                  <optgroup label="Patient Information">
                    <option value="patientId">Patient ID (from source system)</option>
                    <option value="name">Name *</option>
                    <option value="age">Age</option>
                    <option value="gender">Gender</option>
                    <option value="contact">Contact</option>
                    <option value="bloodGroup">Blood Group</option>
                    <option value="address">Address</option>
                    <option value="allergies">Allergies</option>
                    <option value="chronicConditions">Chronic Conditions</option>
                  </optgroup>
                  <optgroup label="Visit/Consultation Details">
                    <option value="visitDate">Visit Date</option>
                    <option value="visitType">Visit Type</option>
                    <option value="chiefComplaint">Chief Complaint</option>
                    <option value="diagnosis">Diagnosis</option>
                    <option value="treatment">Treatment</option>
                    <option value="medicines">Medicines</option>
                    <option value="signs">Signs/Examination</option>
                    <option value="investigations">Investigations/Tests</option>
                    <option value="notes">Notes</option>
                    <option value="followUpDate">Follow-up Date</option>
                  </optgroup>
                  <optgroup label="Vitals">
                    <option value="bpSystolic">BP Systolic</option>
                    <option value="bpDiastolic">BP Diastolic</option>
                    <option value="bloodPressure">Blood Pressure</option>
                    <option value="temp">Temperature</option>
                    <option value="pulse">Pulse</option>
                    <option value="spo2">SPO2</option>
                    <option value="weight">Weight</option>
                    <option value="rbs">RBS/Blood Sugar</option>
                  </optgroup>
                </select>
              </div>
            ))}
          </div>
          
          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-2">Preview (first 3 rows):</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {Object.keys(mapping).filter(k => mapping[k]).map(col => (
                      <th key={col} className="px-4 py-2 text-left">{mapping[col]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.preview.slice(0, 3).map((row: any, i: number) => (
                    <tr key={i} className="border-b">
                      {Object.keys(mapping).filter(k => mapping[k]).map(col => (
                        <td key={col} className="px-4 py-2">{row[col] || '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={resetImport}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleValidate}
              disabled={isProcessing || !Object.values(mapping).includes('name')}
              className="px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              Next: Validate Data
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Validation */}
      {step === 'validation' && validation && (
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Validation Results</h2>
          
          {validation.errors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">
                  {validation.errors.length} Error{validation.errors.length > 1 ? 's' : ''} Found
                </h3>
              </div>
              <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                {validation.errors.slice(0, 10).map((error: any, i: number) => (
                  <li key={i}>
                    Row {error.row}: {error.message} {error.value && `(value: "${error.value}")`}
                  </li>
                ))}
                {validation.errors.length > 10 && (
                  <li className="font-semibold">... and {validation.errors.length - 10} more errors</li>
                )}
              </ul>
            </div>
          )}
          
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">
                  {validation.warnings.length} Warning{validation.warnings.length > 1 ? 's' : ''}
                </h3>
              </div>
              <p className="text-sm text-yellow-700 mb-2">
                These rows have minor issues but can still be imported
              </p>
              <ul className="text-sm text-yellow-700 space-y-1 max-h-40 overflow-y-auto">
                {validation.warnings.slice(0, 5).map((warning: any, i: number) => (
                  <li key={i}>
                    Row {warning.row}: {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {validation.isValid && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">
                    Data is Valid!
                  </h3>
                  <p className="text-sm text-green-700">
                    Ready to import {validation.validRowCount} patient{validation.validRowCount > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Duplicate Handling Strategy */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-3">How to handle duplicates?</h3>
            <p className="text-sm text-blue-700 mb-3">
              If a patient with the same contact number or name+age already exists:
            </p>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="duplicateStrategy"
                  value="skip"
                  checked={duplicateStrategy === 'skip'}
                  onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                  className="w-4 h-4 text-brand-teal"
                />
                <div>
                  <span className="font-medium text-blue-900">Skip duplicate</span>
                  <p className="text-xs text-blue-600">Don't import if patient already exists (recommended)</p>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="duplicateStrategy"
                  value="update"
                  checked={duplicateStrategy === 'update'}
                  onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                  className="w-4 h-4 text-brand-teal"
                />
                <div>
                  <span className="font-medium text-blue-900">Update existing</span>
                  <p className="text-xs text-blue-600">Update patient info if already exists</p>
                </div>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="duplicateStrategy"
                  value="create"
                  checked={duplicateStrategy === 'create'}
                  onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                  className="w-4 h-4 text-brand-teal"
                />
                <div>
                  <span className="font-medium text-blue-900">Create anyway</span>
                  <p className="text-xs text-blue-600">Create new patient even if duplicate (not recommended)</p>
                </div>
              </label>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep('mapping')}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Mapping
            </button>
            <button
              onClick={handleImport}
              disabled={!validation.isValid}
              className="px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Import {validation.validRowCount} Patient{validation.validRowCount > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
      
      {/* Step 4: Importing */}
      {step === 'importing' && (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-teal mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-4">Importing Data...</h2>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden relative">
            <div
              className="bg-gradient-to-r from-brand-teal to-green-500 h-4 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
            </div>
          </div>
          <p className="text-gray-600 font-semibold">{progress}% complete</p>
          <p className="text-sm text-gray-500 mt-2">Please don't close this page</p>
        </div>
      )}
      
      {/* Step 5: Complete */}
      {step === 'complete' && result && (
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold mb-4">Import Complete!</h2>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-4">
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <p className="text-3xl font-bold text-green-600">{result.success}</p>
                <p className="text-sm text-gray-600">Records Imported</p>
              </div>
              {result.failed > 0 && (
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                  <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-sm text-gray-600">Failed</p>
                </div>
              )}
            </div>
            
            {/* Import Statistics */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Import Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700">Patients Created:</p>
                  <p className="text-2xl font-bold text-blue-900">{result.patientsCreated || 0}</p>
                </div>
                <div>
                  <p className="text-blue-700">Visits Created:</p>
                  <p className="text-2xl font-bold text-blue-900">{result.visitsCreated || 0}</p>
                </div>
                {result.duplicatesSkipped > 0 && (
                  <div>
                    <p className="text-blue-700">Duplicates Skipped:</p>
                    <p className="text-2xl font-bold text-yellow-600">{result.duplicatesSkipped}</p>
                  </div>
                )}
                {result.duplicatesUpdated > 0 && (
                  <div>
                    <p className="text-blue-700">Duplicates Updated:</p>
                    <p className="text-2xl font-bold text-green-600">{result.duplicatesUpdated}</p>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Completed in {result.duration} second{result.duration > 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Error Details */}
          {result.failed > 0 && result.errors && result.errors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">
                  Import Errors ({result.errors.length} shown)
                </h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <ul className="text-sm text-red-700 space-y-2">
                  {result.errors.map((err: any, i: number) => (
                    <li key={i} className="border-b border-red-200 pb-2 last:border-0">
                      <span className="font-medium">Row {err.row}:</span> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
              {result.failed > result.errors.length && (
                <p className="text-xs text-red-600 mt-2">
                  ... and {result.failed - result.errors.length} more errors
                </p>
              )}
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/patients'}
              className="px-6 py-3 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-all"
            >
              View Patients
            </button>
            <button
              onClick={resetImport}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              Import More Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
