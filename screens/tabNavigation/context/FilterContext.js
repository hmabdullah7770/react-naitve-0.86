import React, { createContext, useContext, useState, useCallback } from 'react';

const FilterContext = createContext(null);

export const FILTER_OPTIONS = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'username', label: 'Username' },
];

export const FilterProvider = ({ children }) => {
  const [selectedFilters, setSelectedFilters] = useState([]); // e.g. ['title', 'username']

  const toggleFilter = useCallback((key) => {
      console.log('toggleFilter called with', key); // temp debug
    setSelectedFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  }, []);

  const removeFilter = useCallback((key) => {
    setSelectedFilters((prev) => prev.filter((f) => f !== key));
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedFilters([]);
  }, []);

  const getLabel = useCallback((key) => {
    return FILTER_OPTIONS.find((f) => f.key === key)?.label ?? key;
  }, []);

  return (
    <FilterContext.Provider
      value={{
        selectedFilters,
        toggleFilter,
        removeFilter,
        resetFilters,
        getLabel,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return ctx;
};