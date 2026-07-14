import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp, Check, Filter } from 'lucide-react';
import { Product } from '../../types';
import { extractFamilyProperties, DynamicPropertyMap } from '../../utils/propertyExtractor';

export interface DynamicFilters {
  [propertyKey: string]: string[];
}

interface DynamicPropertyFilterProps {
  products: Product[];
  activeFilters: DynamicFilters;
  onFilterChange: (filters: DynamicFilters) => void;
  lang: 'en' | 'sw';
}

export const DynamicPropertyFilter: React.FC<DynamicPropertyFilterProps> = ({
  products,
  activeFilters = {},
  onFilterChange,
  lang,
}) => {
  const propertyMap = useMemo(() => {
    const rawMap = extractFamilyProperties(products);
    const map = { ...rawMap };
    
    const priceRangeKey = lang === 'sw' ? "Kiwango cha Bei" : "Price Range";
    const availabilityKey = lang === 'sw' ? "Upatikanaji" : "Availability";
    
    // Compute dynamic price ranges based on passed products
    const prices = products.map(p => p.price).filter(p => typeof p === 'number' && p > 0);
    let rangeOptions: string[] = [];
    
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (maxPrice === minPrice) {
        rangeOptions = lang === 'sw'
          ? [`Kama TZS ${minPrice.toLocaleString()}`]
          : [`Around TZS ${minPrice.toLocaleString()}`];
      } else {
        const diff = maxPrice - minPrice;
        const lowerThreshold = Math.round(minPrice + diff / 3);
        const upperThreshold = Math.round(minPrice + (2 * diff) / 3);
        
        const roundToNiceNumber = (num: number) => {
          if (num > 1000000) {
            return Math.round(num / 100000) * 100000;
          } else if (num > 100000) {
            return Math.round(num / 50000) * 50000;
          } else if (num > 10000) {
            return Math.round(num / 5000) * 5000;
          } else if (num > 1000) {
            return Math.round(num / 1000) * 1000;
          }
          return Math.round(num);
        };
        
        const niceLower = roundToNiceNumber(lowerThreshold);
        const niceUpper = roundToNiceNumber(upperThreshold);
        
        if (niceLower <= minPrice || niceLower >= niceUpper || niceUpper >= maxPrice) {
          const mid = roundToNiceNumber(minPrice + diff / 2);
          rangeOptions = lang === 'sw'
            ? [
                `Chini ya TZS ${mid.toLocaleString()}`,
                `Zaidi ya TZS ${mid.toLocaleString()}`
              ]
            : [
                `Under TZS ${mid.toLocaleString()}`,
                `Over TZS ${mid.toLocaleString()}`
              ];
        } else {
          rangeOptions = lang === 'sw'
            ? [
                `Chini ya TZS ${niceLower.toLocaleString()}`,
                `TZS ${niceLower.toLocaleString()} - ${niceUpper.toLocaleString()}`,
                `Zaidi ya TZS ${niceUpper.toLocaleString()}`
              ]
            : [
                `Under TZS ${niceLower.toLocaleString()}`,
                `TZS ${niceLower.toLocaleString()} - ${niceUpper.toLocaleString()}`,
                `Over TZS ${niceUpper.toLocaleString()}`
              ];
        }
      }
    } else {
      rangeOptions = lang === 'sw'
        ? ["Hakuna bidhaa maalumu"]
        : ["No Specific Product"];
    }

    map[priceRangeKey] = new Set(rangeOptions);
    
    map[availabilityKey] = new Set(
      lang === 'sw'
        ? ["In Stock pekee"]
        : ["In Stock Only"]
    );
    
    return map;
  }, [products, lang]);

  const propertyKeys = useMemo(() => {
    const keys = Object.keys(propertyMap);
    const priceRangeKey = lang === 'sw' ? "Kiwango cha Bei" : "Price Range";
    const availabilityKey = lang === 'sw' ? "Upatikanaji" : "Availability";
    
    const sortedKeys: string[] = [];
    if (keys.includes(priceRangeKey)) {
      sortedKeys.push(priceRangeKey);
    }
    if (keys.includes(availabilityKey)) {
      sortedKeys.push(availabilityKey);
    }
    keys.forEach(k => {
      if (k !== priceRangeKey && k !== availabilityKey) {
        sortedKeys.push(k);
      }
    });
    return sortedKeys;
  }, [propertyMap, lang]);

  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(() => {
    const priceRangeKey = lang === 'sw' ? "Kiwango cha Bei" : "Price Range";
    const availabilityKey = lang === 'sw' ? "Upatikanaji" : "Availability";
    return new Set([
      priceRangeKey,
      availabilityKey,
    ]);
  });

  if (propertyKeys.length === 0) return null;

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleToggleOption = (key: string, value: string) => {
    const currentList = activeFilters[key] || [];
    let newList;
    if (currentList.includes(value)) {
      newList = currentList.filter(v => v !== value);
    } else {
      newList = [...currentList, value];
    }

    const newFilters = { ...activeFilters };
    if (newList.length > 0) {
      newFilters[key] = newList;
    } else {
      delete newFilters[key];
    }
    
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 md:p-5 shadow-sm sticky top-24">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <Filter size={18} className="text-indigo-600" />
          <span>{lang === 'sw' ? 'Vigezo' : 'Specifications'}</span>
        </div>
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
          >
            {lang === 'sw' ? 'Safisha' : 'Clear All'}
          </button>
        )}
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
        {propertyKeys.map((key) => {
          const isPriceOrStock = key === "Kiwango cha Bei" || key === "Price Range" || key === "Upatikanaji" || key === "Availability";
          const values = isPriceOrStock
            ? (Array.from(propertyMap[key] || []) as string[])
            : (Array.from(propertyMap[key] || []) as string[]).sort();
          const isExpanded = expandedKeys.has(key);
          const activeCount = (activeFilters[key] || []).length;
          
          return (
            <div key={key} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <button 
                onClick={() => toggleExpand(key)}
                className="w-full flex items-center justify-between py-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 text-sm">{key}</span>
                  {activeCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {activeCount}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-slate-400" />
                ) : (
                  <ChevronDown size={16} className="text-slate-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="mt-2 space-y-2">
                  {values.map(val => {
                    const isSelected = (activeFilters[key] || []).includes(val);
                    return (
                      <div 
                        key={val} 
                        onClick={() => handleToggleOption(key, val)}
                        className="flex items-start gap-2 cursor-pointer group select-none"
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600' 
                            : 'bg-white border-slate-300 group-hover:border-indigo-400'
                        }`}>
                          {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className={`text-xs leading-snug pt-0.5 ${
                          isSelected ? 'text-indigo-700 font-medium' : 'text-slate-600 group-hover:text-slate-900'
                        }`}>
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
