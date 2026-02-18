"use client";

import { useState, useCallback, useRef } from "react";

interface CsvUploadProps {
  onUpload: (content: string, fileName: string, fileSize: number) => void;
  disabled?: boolean;
}

export default function CsvUpload({ onUpload, disabled }: CsvUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv")) {
        alert("Please upload a CSV file");
        return;
      }

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target?.result as string;

        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
        }

        content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        onUpload(content, file.name, file.size);
      };
      reader.readAsText(file, 'UTF-8');
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-200
        ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />

      <div className="space-y-2">
        <div className="text-4xl">
          {fileName ? "📄" : "📤"}
        </div>
        <p className="text-lg font-medium text-gray-700">
          {fileName || "Drop CSV file here"}
        </p>
        <p className="text-sm text-gray-500">
          {fileName ? "Click to upload another file" : "or click to browse"}
        </p>
      </div>
    </div>
  );
}
