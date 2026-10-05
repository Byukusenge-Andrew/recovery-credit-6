'use client';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex items-center gap-4 relative overflow-hidden">
      <div 
        className="absolute left-0 top-0 bottom-0 w-1" 
        style={{ backgroundColor: color }}
      />
      <div className="text-4xl">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
