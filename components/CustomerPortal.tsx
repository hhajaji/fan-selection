import React, { useState, useMemo } from 'react';
import { Fan } from '../types';
import FanSelectorForm from './FanSelectorForm';
import FanResults from './FanResults';
import FanDetails from './FanDetails';
import FanComparison from './FanComparison';
import AIVoiceFilter from './AIVoiceFilter';

interface CustomerPortalProps {
  fans: Fan[];
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ fans }) => {
  const [filters, setFilters] = useState({
    airflow: 15000, // m³/h
    staticPressure: 400, // Pa
    temperature: 25, // °C
  });

  const [selectedFan, setSelectedFan] = useState<Fan | null>(null);
  const [compareList, setCompareList] = useState<Fan[]>([]);
  const [view, setView] = useState<'list' | 'details' | 'compare'>('list');

  const filteredFans = useMemo(() => {
    return fans.filter(fan => 
      fan.maxAirflow >= filters.airflow &&
      fan.maxStaticPressure >= filters.staticPressure &&
      fan.minTemp <= filters.temperature &&
      fan.maxTemp >= filters.temperature
    );
  }, [fans, filters]);

  const handleSelectFan = (fan: Fan) => {
    setSelectedFan(fan);
    setView('details');
  };

  const handleToggleCompare = (fan: Fan) => {
    setCompareList(prev => 
      prev.some(f => f.id === fan.id) 
        ? prev.filter(f => f.id !== fan.id)
        : [...prev, fan].slice(0, 4) // Max 4 fans to compare
    );
  };
  
  const handleShowComparison = () => {
      if (compareList.length > 1) {
          setView('compare');
      }
  };

  const handleBackToList = () => {
    setSelectedFan(null);
    setView('list');
  };
  
  const handleBackFromCompare = () => {
      setView('list');
  };

  const renderContent = () => {
    if (view === 'details' && selectedFan) {
      return <FanDetails fan={selectedFan} onBack={handleBackToList} />;
    }
    
    if (view === 'compare' && compareList.length > 1) {
        return <FanComparison fans={compareList} onBack={handleBackFromCompare} />;
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
          <AIVoiceFilter onFiltersUpdate={setFilters} />
          <FanSelectorForm filters={filters} onFilterChange={setFilters} />
        </div>
        <div className="lg:col-span-3">
          <FanResults
            fans={filteredFans}
            onSelectFan={handleSelectFan}
            onToggleCompare={handleToggleCompare}
            compareList={compareList}
            onShowComparison={handleShowComparison}
          />
        </div>
      </div>
    );
  };

  return <>{renderContent()}</>;
};

export default CustomerPortal;