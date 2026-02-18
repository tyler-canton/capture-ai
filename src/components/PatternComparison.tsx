"use client";

import { useState } from "react";

type PatternType = "orchestrator" | "choreography";

export default function PatternComparison() {
  const [activePattern, setActivePattern] = useState<PatternType>("orchestrator");

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Saga Patterns Comparison</h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActivePattern("orchestrator")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activePattern === "orchestrator"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Orchestrator
        </button>
        <button
          onClick={() => setActivePattern("choreography")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activePattern === "choreography"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Choreography
        </button>
      </div>

      {activePattern === "orchestrator" ? (
        <OrchestratorDiagram />
      ) : (
        <ChoreographyDiagram />
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        {activePattern === "orchestrator" ? (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Orchestrator Pattern</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Central controller manages entire workflow</li>
              <li>• Easy to understand and debug</li>
              <li>• Single point of failure (the orchestrator)</li>
              <li>• Good for: Complex workflows, sequential steps</li>
            </ul>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Choreography Pattern</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Services communicate via events</li>
              <li>• No single point of failure</li>
              <li>• Harder to track overall flow</li>
              <li>• Good for: Simple flows, highly decoupled services</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function OrchestratorDiagram() {
  return (
    <div className="relative">
      <div className="flex justify-center mb-4">
        <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg">
          Saga Orchestrator
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <svg width="400" height="60" className="overflow-visible">
          <line x1="200" y1="0" x2="50" y2="50" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
          <line x1="200" y1="0" x2="140" y2="50" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
          <line x1="200" y1="0" x2="260" y2="50" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
          <line x1="200" y1="0" x2="350" y2="50" stroke="#3B82F6" strokeWidth="2" markerEnd="url(#arrowBlue)" />
          <defs>
            <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#3B82F6" />
            </marker>
          </defs>
        </svg>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <ServiceBox name="S3" icon="☁️" color="orange" />
        <ServiceBox name="SQS" icon="📨" color="orange" />
        <ServiceBox name="Lambda" icon="λ" color="orange" />
        <ServiceBox name="Database" icon="🗄️" color="green" />
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Orchestrator directly commands each service in sequence
      </div>
    </div>
  );
}

function ChoreographyDiagram() {
  return (
    <div className="relative">
      <div className="flex justify-center items-center gap-4 flex-wrap">
        <div className="flex flex-col items-center">
          <ServiceBox name="S3" icon="☁️" color="orange" />
          <Arrow direction="right" />
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs mb-2">
            FileUploaded Event
          </div>
          <Arrow direction="right" />
        </div>
        <div className="flex flex-col items-center">
          <ServiceBox name="SQS" icon="📨" color="orange" />
          <Arrow direction="right" />
        </div>
        <div className="flex flex-col items-center">
          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs mb-2">
            MessageQueued Event
          </div>
          <Arrow direction="right" />
        </div>
        <div className="flex flex-col items-center">
          <ServiceBox name="Lambda" icon="λ" color="orange" />
        </div>
      </div>

      <div className="flex justify-center items-center gap-4 mt-4">
        <div className="flex flex-col items-center">
          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs mb-2">
            ProcessingComplete Event
          </div>
        </div>
        <Arrow direction="right" />
        <ServiceBox name="Database" icon="🗄️" color="green" />
        <Arrow direction="right" />
        <div className="flex flex-col items-center">
          <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-xs mb-2">
            DataStored Event
          </div>
        </div>
        <Arrow direction="right" />
        <ServiceBox name="Webhook" icon="🔔" color="blue" />
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Each service publishes events, others subscribe and react
      </div>
    </div>
  );
}

function ServiceBox({ name, icon, color }: { name: string; icon: string; color: string }) {
  const colorClasses = {
    orange: "bg-orange-100 border-orange-300 text-orange-800",
    green: "bg-green-100 border-green-300 text-green-800",
    blue: "bg-blue-100 border-blue-300 text-blue-800",
  };

  return (
    <div className={`border-2 rounded-lg p-3 text-center ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-2xl">{icon}</div>
      <div className="text-sm font-medium">{name}</div>
    </div>
  );
}

function Arrow({ direction }: { direction: "right" | "down" }) {
  if (direction === "right") {
    return <span className="text-gray-400 text-xl">→</span>;
  }
  return <span className="text-gray-400 text-xl">↓</span>;
}
