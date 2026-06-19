import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function PaymentMethodCard({ name, description, color, icon, badge, badgeColor, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:border-gray-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-md`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 dark:text-white">{name}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
      </div>
    </button>
  );
}