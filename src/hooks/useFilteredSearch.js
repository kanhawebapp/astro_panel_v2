"use client";
import { useSearch } from "@/ContextAPi/SearchContext";

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const useFilteredSearch = (data = [], fields = []) => {
  const { searchQuery } = useSearch();

  const query = searchQuery?.toLowerCase().trim();

  if (!query) return data;

  const filteredData = Array.isArray(data)
    ? data.filter((item) =>
        fields.some((field) => {
          const value = getNestedValue(item, field);
          return value && value.toString().toLowerCase().includes(query);
        })
      )
    : [];

  return filteredData;
};

export default useFilteredSearch;
