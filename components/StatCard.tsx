
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  prefix?: string;
  icon?: React.ReactNode;
  variant?: 'blue' | 'light-blue';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, prefix = 'R$', icon, variant = 'blue', onClick }) => {
  const isLight = variant === 'light-blue';
  
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden p-5 rounded-xl shadow-lg flex flex-col justify-between h-32 transition-all ${
        onClick ? 'cursor-pointer hover:scale-[1.03] active:scale-[0.98] hover:shadow-xl' : ''
      } ${
        isLight ? 'bg-[#5da9ff]' : 'bg-[#3378ff]'
      } text-white group`}
    >
      <div className="z-10">
        <h3 className="text-2xl font-bold flex items-baseline gap-1">
          <span className="text-lg opacity-80 font-normal">{prefix}</span>
          {value}
        </h3>
        <p className="text-xs font-medium opacity-90 mt-1 uppercase tracking-tight">{title}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-[10px] font-bold">
            <span className="text-emerald-400">▲ {trend}</span>
          </div>
        )}
      </div>
      <div className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-80 scale-125 transition-transform ${onClick ? 'group-hover:scale-150' : ''}`}>
        {icon}
      </div>
      {onClick && (
        <div className="absolute bottom-2 right-4 text-[8px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-60 transition-opacity">
          Clique para Ver
        </div>
      )}
    </div>
  );
};

export default StatCard;
