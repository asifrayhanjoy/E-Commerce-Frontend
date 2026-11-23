import React from "react";

const QuickActionCard = ({ Icon, title, description }: any) => {
  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md">
      <Icon className="mt-1 h-6 w-6 text-blue-600" />

      <div>
        <h4 className="mb-1 text-sm font-bold text-slate-900">
          {title}
        </h4>

        <p className="text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
};

export default QuickActionCard;