"use client";

import { Subject } from "@/lib/types";

interface SubjectCardProps {
  subject: Subject;
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500">ID: {subject.id}</span>
          <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-600">{subject.image_id}</span>
        </div>
      </div>
    </div>
  );
}
