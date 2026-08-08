'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, Calendar, BarChart3, PieChart, 
  ArrowUpRight, DollarSign, Users, Clock, UserCheck
} from 'lucide-react';
import { CardSkeleton } from '@/components/LoadingStates';
import { PatientVisitAnalytics } from '@/components/PatientVisitAnalytics';

interface PaymentAnalytics {
  totalIncome: number;
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  averageInvoice: number;
  conversionRate: number;
  monthlyIncome: { month: string; amount: number }[];
  paymentMethods: { method: string; count: number; amount: number }[];
  topPatients: { name: string; amount: number; invoices: number; visits: number }[];
  paymentTrend: { date: string; amount: number }[];
  invoiceStats: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
  patientStats: {
    totalPatients: number;
    returningPatients: number;
    averageVisitsPerPatient: number;
    topRevenuePatients: { name: string; patientId: string; totalRevenue: number; totalVisits: number }[];
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName?: string;
  amount: number;
  status: string;
  dueDate: string;
  createdAt: string;
  visitId?: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  invoiceId?: string;
}

interface Visit {
  id: string;
  patientId: string;
  patientName?: string;
  visitDate: string;
  notes?: string;
  paidBy?: string;
  fees?: { total: number }[];
}

export function PaymentAnalytics({ 
  invoices, 
  payments, 
  visits = [] 
}: { 
  invoices: Invoice[]; 
  payments: Payment[]; 
  visits?: Visit[];
}) {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'patients'>('overview');

  useEffect(() => {
    calculateAnalytics();
  }, [invoices, payments, visits, timeRange]);

  const calculateAnalytics = () => {
    setIsLoading(true);

    // Filter data based on time range
    const now = new Date();
    const rangeMs = timeRange === '7d' ? 7 * 24 * 60 * 60 * 1000 : 
                    timeRange === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                    timeRange === '90d' ? 90 * 24 * 60 * 60 * 1000 : Infinity;

    const filteredInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.createdAt).getTime();
      return now.getTime() - invDate <= rangeMs;
    });

    const filteredPayments = payments.filter(pay => {
      const payDate = new Date(pay.createdAt).getTime();
      return now.getTime() - payDate <= rangeMs;
    });

    // Calculate totals
    const paidInvoices = filteredInvoices.filter(inv => inv.status?.toLowerCase() === 'paid');
    const pendingInvoices = filteredInvoices.filter(inv => inv.status?.toLowerCase() === 'pending');
    
    const totalIncome = filteredInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalRefunded = 0; // Would need refund data

    // Calculate averages
    const averageInvoice = filteredInvoices.length > 0 ? totalIncome / filteredInvoices.length : 0;
    const conversionRate = totalIncome > 0 ? (totalPaid / totalIncome) * 100 : 0;

    // Monthly breakdown - show paid invoices
    const monthlyMap = new Map<string, number>();
    paidInvoices.forEach(inv => {
      const date = new Date(inv.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + (inv.amount || 0));
    });

    const monthlyIncome = Array.from(monthlyMap.entries())
      .sort()
      .slice(-12)
      .map(([month, amount]) => ({
        month: new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount,
      }))
      .filter(m => m.amount > 0);

    // Payment methods - aggregate from actual paid invoices
    const paymentMethodMap = new Map<string, { count: number; amount: number }>();
    
    paidInvoices.forEach(inv => {
      // Get payment method from invoice metadata or default to 'cash'
      const method = (inv as any).paymentMethod || 'cash';
      const methodName = method.charAt(0).toUpperCase() + method.slice(1);
      
      const existing = paymentMethodMap.get(methodName) || { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += inv.amount || 0;
      paymentMethodMap.set(methodName, existing);
    });

    // Ensure all payment methods are shown even if no transactions
    const paymentMethods = [
      { method: 'Cash', ...paymentMethodMap.get('Cash') || { count: 0, amount: 0 } },
      { method: 'Card', ...paymentMethodMap.get('Card') || { count: 0, amount: 0 } },
      { method: 'Upi', ...paymentMethodMap.get('Upi') || { count: 0, amount: 0 } },
    ];

    // Patient analytics from visits
    const filteredVisits = visits.filter(visit => {
      const visitDate = new Date(visit.visitDate).getTime();
      return now.getTime() - visitDate <= rangeMs;
    });

    // Calculate patient statistics
    const patientVisitMap = new Map<string, { name: string; visits: number; totalRevenue: number }>();
    
    filteredVisits.forEach(visit => {
      // Use visit.fees array (from VisitFee table) for accurate revenue.
      // extractFeesFromNotes is deprecated and always returns null for new visits.
      const visitRevenue = visit.fees
        ? visit.fees.reduce((sum, fee) => sum + (fee.total || 0), 0)
        : 0;
      
      const key = visit.patientId;
      const existing = patientVisitMap.get(key) || { 
        name: visit.patientName || 'Unknown', 
        visits: 0, 
        totalRevenue: 0 
      };
      existing.visits += 1;
      existing.totalRevenue += visitRevenue;
      patientVisitMap.set(key, existing);
    });

    const totalPatients = patientVisitMap.size;
    const returningPatients = Array.from(patientVisitMap.values()).filter(p => p.visits > 1).length;
    const averageVisitsPerPatient = totalPatients > 0 ? 
      Array.from(patientVisitMap.values()).reduce((sum, p) => sum + p.visits, 0) / totalPatients : 0;

    const topRevenuePatients = Array.from(patientVisitMap.entries())
      .map(([patientId, data]) => ({
        name: data.name,
        patientId,
        totalRevenue: data.totalRevenue,
        totalVisits: data.visits,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    const patientStats = {
      totalPatients,
      returningPatients,
      averageVisitsPerPatient,
      topRevenuePatients,
    };

    // Top patients (enhanced with visit data)
    const patientMap = new Map<string, { name: string; amount: number; invoices: number; visits: number }>();
    filteredInvoices.forEach(inv => {
      const key = inv.patientId;
      const visitData = patientVisitMap.get(key);
      const existing = patientMap.get(key) || { 
        name: inv.patientName || 'Unknown', 
        amount: 0, 
        invoices: 0, 
        visits: visitData?.visits || 0 
      };
      existing.amount += inv.amount || 0;
      existing.invoices += 1;
      patientMap.set(key, existing);
    });

    const topPatients = Array.from(patientMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Payment trend (last 30 days) - use paid invoices
    const trendMap = new Map<string, number>();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    paidInvoices.forEach(inv => {
      const invDate = new Date(inv.createdAt);
      if (invDate >= last30Days) {
        const dateKey = invDate.toISOString().split('T')[0];
        trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + (inv.amount || 0));
      }
    });

    const paymentTrend = Array.from(trendMap.entries())
      .sort()
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount,
      }));

    // Invoice stats
    const invoiceStats = {
      total: filteredInvoices.length,
      paid: filteredInvoices.filter(inv => inv.status?.toLowerCase() === 'paid').length,
      pending: filteredInvoices.filter(inv => inv.status?.toLowerCase() === 'pending').length,
      overdue: filteredInvoices.filter(inv => {
        const dueDate = new Date(inv.dueDate);
        return dueDate < now && inv.status?.toLowerCase() !== 'paid';
      }).length,
    };

    setAnalytics({
      totalIncome,
      totalPaid,
      totalPending,
      totalRefunded,
      averageInvoice,
      conversionRate,
      monthlyIncome,
      paymentMethods,
      topPatients,
      paymentTrend,
      invoiceStats,
      patientStats,
    });

    setIsLoading(false);
  };

  if (isLoading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'overview'
              ? 'text-brand-teal border-b-2 border-brand-teal'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Payment Overview
        </button>
        <button
          onClick={() => setActiveTab('patients')}
          className={`px-4 py-2 font-medium transition-all ${
            activeTab === 'patients'
              ? 'text-brand-teal border-b-2 border-brand-teal'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Patient Visit Analytics
        </button>
      </div>

      {activeTab === 'patients' ? (
        <PatientVisitAnalytics />
      ) : (
        <>
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  timeRange === range
                    ? 'bg-brand-teal text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last 90 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Income</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ₹{analytics.totalIncome.toFixed(0)}
                  </p>
                  {analytics.conversionRate > 0 && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {analytics.conversionRate.toFixed(1)}% collected
                    </p>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Paid</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ₹{analytics.totalPaid.toFixed(0)}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    {analytics.conversionRate.toFixed(1)}% conversion
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ₹{analytics.totalPending.toFixed(0)}
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    {analytics.invoiceStats.pending} invoices
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avg Invoice</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ₹{analytics.averageInvoice.toFixed(0)}
                  </p>
                  <p className="text-xs text-purple-600 mt-2">
                    {analytics.invoiceStats.total} invoices
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

          {/* Patient Statistics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {analytics.patientStats.totalPatients}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    {analytics.patientStats.returningPatients} returning
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avg Visits/Patient</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {analytics.patientStats.averageVisitsPerPatient.toFixed(1)}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    Patient retention
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Return Rate</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {analytics.patientStats.totalPatients > 0 ? 
                      ((analytics.patientStats.returningPatients / analytics.patientStats.totalPatients) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-xs text-purple-600 mt-2">
                    Patient loyalty
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          </div>

      {/* Invoice Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-teal" />
            Invoice Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-700">Paid</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{analytics.invoiceStats.paid}</p>
                <p className="text-xs text-gray-600">
                  {((analytics.invoiceStats.paid / analytics.invoiceStats.total) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-700">Pending</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{analytics.invoiceStats.pending}</p>
                <p className="text-xs text-gray-600">
                  {((analytics.invoiceStats.pending / analytics.invoiceStats.total) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-700">Overdue</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{analytics.invoiceStats.overdue}</p>
                <p className="text-xs text-gray-600">
                  {((analytics.invoiceStats.overdue / analytics.invoiceStats.total) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-teal" />
            Payment Methods
          </h3>
          <div className="space-y-3">
            {analytics.paymentMethods.map((method) => (
              <div key={method.method} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-brand-teal"></div>
                  <span className="text-gray-700">{method.method}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{method.amount.toFixed(0)}</p>
                  <p className="text-xs text-gray-600">{method.count} transactions</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

          {/* Top Patients */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-teal" />
              Top Patients by Revenue
            </h3>
            <div className="space-y-3">
              {analytics.topPatients.map((patient, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-teal/20 flex items-center justify-center text-sm font-semibold text-brand-teal">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <p className="text-xs text-gray-600">{patient.invoices} invoices • {patient.visits} visits</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">₹{patient.amount.toFixed(0)}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly Income Trend */}
          {analytics.monthlyIncome.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-teal" />
                Monthly Income Trend
              </h3>
              <div className="space-y-2">
                {analytics.monthlyIncome.map((month, index) => {
                  const maxAmount = Math.max(...analytics.monthlyIncome.map(m => m.amount), 1);
                  const percentage = (month.amount / maxAmount) * 100;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-12">{month.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-brand-teal to-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                        ₹{month.amount.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
