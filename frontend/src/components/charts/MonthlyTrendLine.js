import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const data = [
  { month: 'Jan', ps: 4000, mooe: 2400 },
  { month: 'Feb', ps: 3000, mooe: 1398 },
  { month: 'Mar', ps: 2000, mooe: 9800 },
  { month: 'Apr', ps: 2780, mooe: 3908 },
  { month: 'May', ps: 1890, mooe: 4800 },
  { month: 'Jun', ps: 2390, mooe: 3800 },
  { month: 'Jul', ps: 3490, mooe: 4300 },
  { month: 'Aug', ps: 4000, mooe: 2400 },
  { month: 'Sep', ps: 3000, mooe: 1398 },
  { month: 'Oct', ps: 2000, mooe: 9800 },
  { month: 'Nov', ps: 2780, mooe: 3908 },
  { month: 'Dec', ps: 1890, mooe: 4800 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-neutral-200 shadow-lg rounded-lg">
        <p className="text-xs font-bold text-neutral-800 mb-2">{label} 2024</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-[11px] text-neutral-500 font-medium">{entry.name}:</span>
            <span className="text-[11px] font-bold text-neutral-900">
              ₱{entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MonthlyTrendLine = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
          <defs>
            <linearGradient id="colorPs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMooe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            tickFormatter={(value) => `₱${value/1000}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', paddingBottom: '20px' }}
          />
          <Area
            name="PS Budget"
            type="monotone"
            dataKey="ps"
            stroke="#15803d"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPs)"
          />
          <Area
            name="MOOE Budget"
            type="monotone"
            dataKey="mooe"
            stroke="#22c55e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorMooe)"
          />
        </AreaChart>
      </ResponsiveContainer>
  );
};

export default MonthlyTrendLine;
