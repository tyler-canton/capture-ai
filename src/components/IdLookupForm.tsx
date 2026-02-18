"use client";

import { useState, FormEvent } from "react";
import { ImageResult } from "@/lib/types";

export default function IdLookupForm() {
  const [ids, setIds] = useState("");
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!ids.trim()) {
      setError("Please enter at least one ID");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(`/api/images?ids=${encodeURIComponent(ids)}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || "Failed to fetch images");
        setResults([]);
      }
    } catch (err) {
      console.error("Lookup failed:", err);
      setError("Failed to fetch images");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">ID Lookup</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter comma-separated subject IDs to get their images.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={ids}
            onChange={(e) => setIds(e.target.value)}
            placeholder="e.g., 1, 101, 103"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading..." : "Lookup"}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </form>

      {searched && !error && (
        <div className="mt-4">
          {results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Found {results.length} image{results.length !== 1 ? "s" : ""}
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600">
                      <th className="pb-2">ID</th>
                      <th className="pb-2">Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.id} className="border-t border-gray-200">
                        <td className="py-2 font-medium">{result.id}</td>
                        <td className="py-2 text-gray-600">{result.image_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No images found for the given IDs</p>
          )}
        </div>
      )}
    </div>
  );
}
