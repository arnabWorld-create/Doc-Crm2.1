'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Users, TrendingUp, Calendar, DollarSign, 
  ArrowUpRight, ArrowDownRight, Filter, 
  BarChart3, Clock, CreditCard, Eye
} from 'lucide-react';
import { CardSkeleton } from '@/components/LoadingStates';

interface PatientAnalytics {
  id: string;
  patientId: string;
  name: string;
  contact?: string | null;
  totalVisits: number;
  totalFeesGenerated: number;
  averageFeePerVisit: number;
  firstVisitDate: string;
  lastVisitDate: string;
  visitFrequency: 'High' | 'Medium' | 'Low';
  paymentMethods: { [key: string]: number };
  monthlyVisits: { month: string; visits: number; fees: number }[];
  recentVisits: {
    id: string;
    visitDate: string;
    visitType: string;
    fees: number;
    paidBy?: string;
  }[];
}

interface AnalyticsSummary {
  totalPatients: number;
  totalVisitsAll: number;
  totalRevenueAll: number;
  averageVisitsPerPatient: number;
  averageRevenuePerPatient: number;
  topRevenuePatient: PatientAnalytics | null;
  frequencyDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

interface PatientVisitAnalyticsProps {
  onPatientSelect?: (patientId: string) => void;
}

export function PatientVisitAnalytics({ onPatientSelect }: PatientVisitAnalyticsProps) {
  const [analytics, setAnalytics] = useState<PatientAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientAnalytics | null>(null);
  
  // Filters
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | '6m' | '1y' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'totalFeesGenerated' | 'totalVisits' | 'name' | 'averageFeePerVisit'>('totalFeesGenerated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [minVisits, setMinVisits] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, sortBy, sortOrder, minVisits, currentPage]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        minVisits: minVisits.toString(),
        timeRange,
      });

      const response = await fetch(`/api/patients/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch patient analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'High': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return '💵';
      case 'upi': return '📱';
      case 'card': return '💳';
      default: return '💰';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalPatients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenueAll)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold text-purple-600">{summary.totalVisitsAll}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Revenue/Patient</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.averageRevenuePerPatient)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="totalFeesGenerated">Total Revenue</option>
            <option value="totalVisits">Total Visits</option>
            <option value="averageFeePerVisit">Avg Fee/Visit</option>
            <option value="name">Patient Name</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="desc">Highest First</option>
            <option value="asc">Lowest First</option>
          </select>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Min Visits:</label>
            <input
              type="number"
              value={minVisits}
              onChange={(e) => setMinVisits(parseInt(e.target.value) || 1)}
              min="1"
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Patient Analytics Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Patient Visit & Revenue Analytics</h3>
          <div className="text-sm text-gray-500">
            Showing {analytics.length} patients
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Patient</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Total Visits</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Total Revenue</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Avg/Visit</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Frequency</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Last Visit</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Payment Methods</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((patient, index) => (
                <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{patient.name}</div>
                      <div className="text-sm text-gray-500">{patient.patientId}</div>
                      {patient.contact && (
                        <div className="text-sm text-gray-500">{patient.contact}</div>
                      )}
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {patient.totalVisits}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(patient.totalFeesGenerated)}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-gray-700">
                      {formatCurrency(patient.averageFeePerVisit)}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(patient.visitFrequency)}`}>
                      {patient.visitFrequency}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4 text-sm text-gray-600">
                    {formatDate(patient.lastVisitDate)}
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex justify-center gap-1">
                      {Object.entries(patient.paymentMethods).map(([method, count]) => (
                        <span key={method} className="text-sm" title={`${method}: ${count} times`}>
                          {getPaymentMethodIcon(method)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-center py-3 px-4">
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {analytics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No patient data found for the selected criteria.
          </div>
        )}
      </Card>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedPatient.name} - Visit Analytics
                </h3>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedPatient.totalVisits}</div>
                    <div className="text-sm text-gray-600">Total Visits</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedPatient.totalFeesGenerated)}
                    </div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(selectedPatient.averageFeePerVisit)}
                    </div>
                    <div className="text-sm text-gray-600">Average per Visit</div>
                  </div>
                </Card>
              </div>

              {/* Monthly Visits Chart */}
              {selectedPatient.monthlyVisits.length > 0 && (
                <Card className="p-4 mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Monthly Visit & Revenue Trend</h4>
                  <div className="space-y-2">
                    {selectedPatient.monthlyVisits.map((month) => (
                      <div key={month.month} className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="text-sm font-medium text-gray-700">
                          {new Date(month.month + '-01').toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-blue-600">{month.visits} visits</span>
                          <span className="text-sm text-green-600">{formatCurrency(month.fees)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recent Visits */}
              <Card className="p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Visits</h4>
                <div className="space-y-3">
                  {selectedPatient.recentVisits.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(visit.visitDate)}
                        </div>
                        <div className="text-sm text-gray-600">{visit.visitType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(visit.fees)}
                        </div>
                        {visit.paidBy && (
                          <div className="text-xs text-gray-500">
                            {getPaymentMethodIcon(visit.paidBy)} {visit.paidBy}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}