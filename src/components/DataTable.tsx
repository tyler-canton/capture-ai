"use client";

import { useState, useEffect, useMemo } from "react";
import { Subject } from "@/lib/types";

type SortField = "id" | "name" | "image_id";
type SortDirection = "asc" | "desc";

export default function DataTable() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const response = await fetch("/api/subjects?all=true");
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSubjects();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...subjects];

    if (filter) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerFilter) ||
          s.image_id.toLowerCase().includes(lowerFilter) ||
          s.id.toString().includes(lowerFilter)
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [subjects, filter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSorted.length / pageSize);
  const paginatedData = filteredAndSorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return (
      <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold text-gray-900">All Subjects</h2>
        <input
          type="text"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Filter table..."
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all w-full sm:w-64"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b-2 border-gray-200">
              <th
                onClick={() => handleSort("id")}
                className="pb-3 cursor-pointer hover:text-blue-600 transition-colors"
              >
                ID <SortIcon field="id" />
              </th>
              <th
                onClick={() => handleSort("name")}
                className="pb-3 cursor-pointer hover:text-blue-600 transition-colors"
              >
                Name <SortIcon field="name" />
              </th>
              <th
                onClick={() => handleSort("image_id")}
                className="pb-3 cursor-pointer hover:text-blue-600 transition-colors"
              >
                Image ID <SortIcon field="image_id" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((subject) => (
              <tr
                key={`${subject.id}-${subject.image_id}`}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 font-medium text-gray-900">{subject.id}</td>
                <td className="py-3 text-gray-700">{subject.name}</td>
                <td className="py-3 text-gray-600">{subject.image_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredAndSorted.length)} of{" "}
            {filteredAndSorted.length} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
