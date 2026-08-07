'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

// ─── Brand colours ────────────────────────────────────────────────────────────
const TEAL   = '#007c74';
const YELLOW = '#F6D02F';
const RED    = '#ec1c23';
const BLUE   = '#0ea5e9';
const GRAY   = '#e5e7eb';

// ─── Types ────────────────────────────────────────────────────────────────────
interface WeekData {
  label: string;
  count: number;
}

interface NameCount {
  name: string;
  count: number;
}

interface GenderData {
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  totalPatients: number;
}

interface AgeGroups {
  '0-18': number;
  '19-35': number;
  '36-50': number;
  '51-65': number;
  '65+': number;
}

interface AppointmentData {
  oldPatientAppointments: number;
  newPatientAppointments: number;
  totalAppointments: number;
}

// ─── Weekly registrations bar chart ──────────────────────────────────────────
export function WeeklyRegistrationsChart({ data }: { data: WeekData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRAY} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: `1px solid ${GRAY}`, fontSize: 12 }}
          cursor={{ fill: `${TEAL}18` }}
          formatter={(value: number) => [value, 'Patients']}
        />
        <Bar dataKey="count" fill={TEAL} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Gender distribution pie chart ───────────────────────────────────────────
export function GenderPieChart({ data }: { data: GenderData }) {
  const { maleCount, femaleCount, otherCount } = data;
  const pieData = [
    { name: 'Male',   value: maleCount },
    { name: 'Female', value: femaleCount },
    ...(otherCount > 0 ? [{ name: 'Other', value: otherCount }] : []),
  ].filter((d) => d.value > 0);

  const COLORS = [TEAL, YELLOW, RED];

  if (pieData.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
        >
          {pieData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: `1px solid ${GRAY}`, fontSize: 12 }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Age distribution bar chart ───────────────────────────────────────────────
export function AgeDistributionChart({ data }: { data: AgeGroups }) {
  const chartData = Object.entries(data).map(([range, count]) => ({
    range: `${range} yrs`,
    count,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRAY} vertical={false} />
        <XAxis
          dataKey="range"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: `1px solid ${GRAY}`, fontSize: 12 }}
          cursor={{ fill: `${TEAL}18` }}
          formatter={(value: number) => [value, 'Patients']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={[TEAL, YELLOW, BLUE, RED, '#8b5cf6'][i % 5]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Appointment types donut chart ───────────────────────────────────────────
export function AppointmentTypesChart({ data }: { data: AppointmentData }) {
  const { oldPatientAppointments, newPatientAppointments, totalAppointments } = data;

  const pieData = [
    { name: 'Existing Patients', value: oldPatientAppointments },
    { name: 'New / Walk-in',     value: newPatientAppointments },
  ].filter((d) => d.value > 0);

  if (totalAppointments === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
        No appointment data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          label={({ percent }) =>
            percent !== undefined ? `${(percent * 100).toFixed(0)}%` : ''
          }
          labelLine={false}
        >
          <Cell fill={TEAL} />
          <Cell fill={YELLOW} />
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: `1px solid ${GRAY}`, fontSize: 12 }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Top conditions horizontal bar chart ─────────────────────────────────────
export function TopConditionsChart({ data }: { data: NameCount[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
        No condition data yet
      </div>
    );
  }

  const chartData = [...data].reverse(); // bottom-to-top for horizontal bar

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 30)}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 32, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRAY} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) =>
            v.length > 16 ? v.slice(0, 15) + '…' : v
          }
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: `1px solid ${GRAY}`, fontSize: 12 }}
          formatter={(value: number) => [value, 'Cases']}
        />
        <Bar dataKey="count" fill={TEAL} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Top medicines horizontal bar chart ──────────────────────────────────────
export function TopMedicinesChart({ data }: { data: NameCount[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
        No medicine data yet
      </div>
    );
  }

  const chartData = [...data].reverse();

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 30)}>
      <BarChart
        layout="vertical"
        data={chartData}
        margin={{ top: 4, right: 32, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRAY} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={{ fontSize: 11, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: string) =>
            v.length > 16 ? v.slice(0, 15) + '…' : v
          }
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: `1px solid ${GRAY}`, fontSize: 12 }}
          formatter={(value: number) => [value, 'Prescriptions']}
        />
        <Bar dataKey="count" fill={RED} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}
