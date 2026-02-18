"use client";

import { SagaState, PipelineStep } from "@/lib/types";

interface ProcessingPipelineProps {
  state: SagaState | null;
}

export default function ProcessingPipeline({ state }: ProcessingPipelineProps) {
  if (!state) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Processing Pipeline</h2>
        <div className="text-center text-gray-500 py-8">
          Upload a CSV file to start the pipeline
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Processing Pipeline</h2>
        <StatusBadge status={state.status} />
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">File:</span>
          <span className="font-medium">{state.fileName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Size:</span>
          <span className="font-medium">{formatBytes(state.fileSize)}</span>
        </div>
        {state.processedRows !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Rows Processed:</span>
            <span className="font-medium">{state.processedRows}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Saga ID:</span>
          <span className="font-mono text-xs">{state.sagaId}</span>
        </div>
      </div>

      <div className="space-y-3">
        {state.steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            isActive={state.currentStepIndex === index}
            isCompensating={state.status === "compensating"}
          />
        ))}
      </div>

      {state.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">Error:</span>
            <span>{state.error}</span>
          </div>
          {state.status === "compensating" && (
            <p className="text-sm text-red-600 mt-1">
              Rolling back previous steps...
            </p>
          )}
        </div>
      )}

      {state.completedAt && state.startedAt && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Total time: {((state.completedAt - state.startedAt) / 1000).toFixed(2)}s
        </div>
      )}
    </div>
  );
}

function StepCard({
  step,
  index,
  isActive,
  isCompensating,
}: {
  step: PipelineStep;
  index: number;
  isActive: boolean;
  isCompensating: boolean;
}) {
  const getStepStyles = () => {
    switch (step.status) {
      case "completed":
        return "border-green-300 bg-green-50";
      case "processing":
        return "border-blue-400 bg-blue-50 animate-pulse";
      case "failed":
        return "border-red-300 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getIcon = () => {
    if (isCompensating && step.status === "processing") {
      return "⏪";
    }
    switch (step.status) {
      case "completed":
        return "✅";
      case "processing":
        return "⏳";
      case "failed":
        return "❌";
      default:
        return "⬜";
    }
  };

  const getAWSIcon = () => {
    switch (step.id) {
      case "s3_upload":
        return "☁️";
      case "sqs_enqueue":
        return "📨";
      case "lambda_process":
        return "λ";
      case "db_write":
        return "🗄️";
      case "webhook_notify":
        return "🔔";
      default:
        return "📦";
    }
  };

  return (
    <div
      className={`
        border-2 rounded-lg p-4 transition-all duration-300
        ${getStepStyles()}
        ${isActive ? "ring-2 ring-blue-400 ring-offset-2" : ""}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{getIcon()}</div>
        <div className="text-2xl">{getAWSIcon()}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Step {index + 1}</span>
            <span className="font-semibold text-gray-900">{step.name}</span>
          </div>
          <p className="text-sm text-gray-600">{step.description}</p>
        </div>
        {step.startedAt && step.completedAt && (
          <div className="text-xs text-gray-400">
            {((step.completedAt - step.startedAt) / 1000).toFixed(2)}s
          </div>
        )}
      </div>
      {step.error && (
        <div className="mt-2 text-sm text-red-600 bg-red-100 rounded px-2 py-1">
          {step.error}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: SagaState["status"] }) {
  const styles = {
    idle: "bg-gray-100 text-gray-700",
    running: "bg-blue-100 text-blue-700 animate-pulse",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    compensating: "bg-yellow-100 text-yellow-700 animate-pulse",
  };

  const labels = {
    idle: "Idle",
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    compensating: "Rolling Back",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
