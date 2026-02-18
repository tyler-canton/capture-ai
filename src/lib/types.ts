export interface Subject {
  id: number;
  name: string;
  image_id: string;
}

export interface SearchOptions {
  limit?: number;
}

export interface ImageResult {
  id: number;
  image_id: string;
}

export type StepStatus = "pending" | "processing" | "completed" | "failed";

export interface PipelineStep {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: unknown;
}

export interface SagaState {
  sagaId: string;
  fileName: string;
  fileSize: number;
  status: "idle" | "running" | "completed" | "failed" | "compensating";
  steps: PipelineStep[];
  currentStepIndex: number;
  startedAt?: number;
  completedAt?: number;
  processedRows?: number;
  error?: string;
}
