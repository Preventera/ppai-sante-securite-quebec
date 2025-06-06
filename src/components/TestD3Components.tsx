import React from 'react';
import { EnhancedRiskAnalytics } from '@/components/EnhancedRiskAnalytics';

export const TestD3Components: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Test des Composants D3.js</h1>
      <EnhancedRiskAnalytics />
    </div>
  );
};
