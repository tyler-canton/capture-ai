"use client";

import { useState } from "react";
import SearchInterface from "@/components/SearchInterface";
import IdLookupForm from "@/components/IdLookupForm";
import DataTable from "@/components/DataTable";
import CsvUpload from "@/components/CsvUpload";
import ProcessingPipeline from "@/components/ProcessingPipeline";
import { SagaOrchestrator } from "@/lib/SagaOrchestrator";
import { SagaState } from "@/lib/types";
import RagPipeline from "@/components/RagPipeline";

type Tab = "search" | "pipeline" | "patterns" | "rag";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("pipeline");
  const [sagaState, setSagaState] = useState<SagaState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [failAtStep, setFailAtStep] = useState(2);

  const handleUpload = async (content: string, fileName: string, fileSize: number) => {
    setIsProcessing(true);

    const orchestrator = new SagaOrchestrator(fileName, fileSize, (state) => {
      setSagaState({ ...state });
    });

    try {
      if (simulateFailure) {
        await orchestrator.executeWithFailure(content, failAtStep);
      } else {
        await orchestrator.execute(content);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPipeline = () => {
    setSagaState(null);
  };

  return (
    <main className="min-h-screen py-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Capture.ai
          </h1>
          <p className="text-gray-600 mt-2">
            Data Processing Platform with ai integration
          </p>
        </header>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <TabButton
            active={activeTab === "pipeline"}
            onClick={() => setActiveTab("pipeline")}
          >
            1. Saga Pattern
          </TabButton>
          <TabButton
            active={activeTab === "patterns"}
            onClick={() => setActiveTab("patterns")}
          >
            2. TypeScript
          </TabButton>
          <TabButton
            active={activeTab === "rag"}
            onClick={() => setActiveTab("rag")}
          >
            3. RAG Pipeline
          </TabButton>
          <TabButton
            active={activeTab === "search"}
            onClick={() => setActiveTab("search")}
          >
            Search & Data
          </TabButton>
        </div>

        {activeTab === "pipeline" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <h2 className="text-lg font-bold text-blue-900">Bug #1: UTF-8 Encoding → Saga Pattern</h2>
              <p className="text-sm text-blue-700 mt-1">
                The encoding bug was simple to fix, but it made me think: what happens when a malformed file
                reaches Lambda <em>after</em> it&apos;s already been uploaded to S3? You need <strong>compensation logic</strong> to rollback.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Upload CSV for Processing
                </h2>

                <CsvUpload onUpload={handleUpload} disabled={isProcessing} />

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-3">Demo Controls</h3>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                      disabled={isProcessing}
                    />
                    <span className="text-sm text-gray-600">
                      Simulate failure (shows rollback)
                    </span>
                  </label>

                  {simulateFailure && (
                    <div className="mt-2">
                      <label className="text-sm text-gray-600">Fail at step:</label>
                      <select
                        value={failAtStep}
                        onChange={(e) => setFailAtStep(parseInt(e.target.value))}
                        className="ml-2 border rounded px-2 py-1 text-sm"
                        disabled={isProcessing}
                      >
                        <option value={0}>Step 1 - S3 Upload</option>
                        <option value={1}>Step 2 - SQS Enqueue</option>
                        <option value={2}>Step 3 - Lambda Process</option>
                        <option value={3}>Step 4 - DB Write</option>
                        <option value={4}>Step 5 - Webhook</option>
                      </select>
                    </div>
                  )}

                  {sagaState && (
                    <button
                      onClick={resetPipeline}
                      className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      disabled={isProcessing}
                    >
                      Reset Pipeline
                    </button>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <a
                    href="/subject_images.csv"
                    download
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Download sample CSV for testing
                  </a>
                </div>
              </div>

              <ProcessingPipeline state={sagaState} />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Simulated AWS Services</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <ServiceLegend icon="☁️" name="S3" description="File storage" color="orange" />
                <ServiceLegend icon="📨" name="SQS" description="Message queue" color="orange" />
                <ServiceLegend icon="λ" name="Lambda" description="Serverless compute" color="orange" />
                <ServiceLegend icon="🗄️" name="PostgreSQL" description="Database" color="green" />
                <ServiceLegend icon="🔔" name="Webhook" description="Notifications" color="blue" />
              </div>
            </div>
          </div>
        )}

        {activeTab === "patterns" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Bug #2: Type Mismatch</h2>
              <p className="text-gray-600 mb-4">
                JavaScript&apos;s loose typing caused IDs to fail matching. TypeScript catches this at compile time.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                  <h3 className="font-bold text-red-800 mb-3">The Bug (JavaScript)</h3>
                  <pre className="text-sm bg-red-100 p-3 rounded overflow-x-auto">
{`// Original buggy code
const idsSet = new Set(
  subjectIDs.map(String)  // ["1", "101"]
);

return this.rows.filter(row =>
  idsSet.has(row.id)  // row.id = 1 (number)
);

// "1" !== 1  → No matches!`}
                  </pre>
                </div>

                <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <h3 className="font-bold text-green-800 mb-3">The Fix (TypeScript)</h3>
                  <pre className="text-sm bg-green-100 p-3 rounded overflow-x-auto">
{`// Fixed with TypeScript
const idsSet = new Set<number>(subjectIDs);

return this.rows.filter(row =>
  idsSet.has(row.id)  // Both numbers!
);

// 1 === 1  → Matches correctly!`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Why TypeScript Prevents This</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">🔍</div>
                  <h3 className="font-bold text-blue-800">Compile-Time Checking</h3>
                  <p className="text-sm text-blue-700">Errors caught before runtime</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-bold text-blue-800">Type Annotations</h3>
                  <p className="text-sm text-blue-700">Set&lt;number&gt; enforces type</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">🛡️</div>
                  <h3 className="font-bold text-blue-800">Strict Mode</h3>
                  <p className="text-sm text-blue-700">No implicit any allowed</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Try It: ID Lookup</h2>
              <p className="text-gray-600 mb-4">
                Go to the <button onClick={() => setActiveTab("search")} className="text-blue-600 underline">Search & Data</button> tab
                and enter IDs <code className="bg-gray-100 px-2 py-1 rounded">1, 101, 103</code> to see the fix working.
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Expected Result:</h3>
                <pre className="text-sm bg-white p-3 rounded border">
{`[
  { id: 1, image_id: "img_093.jpg" },
  { id: 101, image_id: "img_013.jpg" },
  { id: 103, image_id: "img_009.jpg" }
]`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === "search" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <SearchInterface />
              <IdLookupForm />
            </div>
            <DataTable />
          </div>
        )}

        {activeTab === "rag" && <RagPipeline />}
      </div>
    </main>
  );
}

function TabButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
        active
          ? "bg-white text-blue-600 border-b-2 border-blue-600"
          : "text-gray-600 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}

function ServiceLegend({
  icon,
  name,
  description,
  color,
}: {
  icon: string;
  name: string;
  description: string;
  color: string;
}) {
  const colorClasses = {
    orange: "bg-orange-100 border-orange-300",
    green: "bg-green-100 border-green-300",
    blue: "bg-blue-100 border-blue-300",
  };

  return (
    <div className={`border-2 rounded-lg p-3 text-center ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-2xl">{icon}</div>
      <div className="font-medium text-gray-900">{name}</div>
      <div className="text-xs text-gray-600">{description}</div>
    </div>
  );
}

