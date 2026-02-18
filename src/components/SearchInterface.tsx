"use client";

import { useState, useEffect, useCallback } from "react";
import { Subject } from "@/lib/types";
import SubjectCard from "./SubjectCard";

export default function SearchInterface() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/subjects?search=${encodeURIComponent(searchQuery)}&limit=10`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Search by Name</h2>
      <p className="text-sm text-gray-600 mb-4">
        Search for subjects by name. Supports fuzzy matching (e.g., &quot;Javl&quot; finds &quot;Jack&quot;).
      </p>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a name to search..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {searched && (
        <div className="mt-4">
          {results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Found {results.length} result{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((subject) => (
                <SubjectCard key={`${subject.id}-${subject.image_id}`} subject={subject} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No results found</p>
          )}
        </div>
      )}
    </div>
  );
}
