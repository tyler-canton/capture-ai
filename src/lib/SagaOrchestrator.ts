import { SagaState, PipelineStep, StepStatus, Subject } from "./types";

const STEP_DELAYS = {
  s3Upload: 1500,
  sqsEnqueue: 800,
  lambdaProcess: 2000,
  dbWrite: 1200,
  webhookNotify: 600,
};

type StepHandler = (state: SagaState, data: unknown) => Promise<unknown>;
type CompensationHandler = (state: SagaState, data: unknown) => Promise<void>;

interface StepDefinition {
  id: string;
  name: string;
  description: string;
  handler: StepHandler;
  compensation?: CompensationHandler;
}

const s3Storage: Map<string, string> = new Map();
const sqsQueue: Array<{ messageId: string; body: unknown }> = [];
const database: Subject[] = [];

export class SagaOrchestrator {
  private state: SagaState;
  private steps: StepDefinition[];
  private onStateChange?: (state: SagaState) => void;

  constructor(fileName: string, fileSize: number, onStateChange?: (state: SagaState) => void) {
    this.onStateChange = onStateChange;

    this.state = {
      sagaId: `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName,
      fileSize,
      status: "idle",
      steps: [],
      currentStepIndex: -1,
    };

    this.steps = [
      {
        id: "s3_upload",
        name: "Upload to S3",
        description: "Uploading CSV file to S3 bucket",
        handler: this.handleS3Upload.bind(this),
        compensation: this.compensateS3Upload.bind(this),
      },
      {
        id: "sqs_enqueue",
        name: "Queue Message (SQS)",
        description: "Sending processing message to SQS queue",
        handler: this.handleSQSEnqueue.bind(this),
      },
      {
        id: "lambda_process",
        name: "Process CSV (Lambda)",
        description: "Lambda worker parsing and validating CSV data",
        handler: this.handleLambdaProcess.bind(this),
        compensation: this.compensateLambdaProcess.bind(this),
      },
      {
        id: "db_write",
        name: "Write to Database",
        description: "Storing processed records in PostgreSQL",
        handler: this.handleDBWrite.bind(this),
        compensation: this.compensateDBWrite.bind(this),
      },
      {
        id: "webhook_notify",
        name: "Webhook Callback",
        description: "Notifying external system of completion",
        handler: this.handleWebhookNotify.bind(this),
      },
    ];

    this.state.steps = this.steps.map((step) => ({
      id: step.id,
      name: step.name,
      description: step.description,
      status: "pending" as StepStatus,
    }));
  }

  private updateState(partial: Partial<SagaState>) {
    this.state = { ...this.state, ...partial };
    this.onStateChange?.(this.state);
  }

  private updateStepStatus(index: number, status: StepStatus, extra?: Partial<PipelineStep>) {
    const steps = [...this.state.steps];
    steps[index] = { ...steps[index], status, ...extra };
    this.updateState({ steps });
  }

  async execute(csvContent: string): Promise<SagaState> {
    this.updateState({
      status: "running",
      startedAt: Date.now(),
      currentStepIndex: 0
    });

    let data: unknown = csvContent;

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      this.updateState({ currentStepIndex: i });
      this.updateStepStatus(i, "processing", { startedAt: Date.now() });

      try {
        data = await step.handler(this.state, data);
        this.updateStepStatus(i, "completed", {
          completedAt: Date.now(),
          result: data
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        this.updateStepStatus(i, "failed", {
          completedAt: Date.now(),
          error: errorMessage
        });

        await this.compensate(i - 1, data);

        this.updateState({
          status: "failed",
          completedAt: Date.now(),
          error: errorMessage
        });

        return this.state;
      }
    }

    this.updateState({
      status: "completed",
      completedAt: Date.now()
    });

    return this.state;
  }

  private async compensate(fromIndex: number, data: unknown): Promise<void> {
    this.updateState({ status: "compensating" });

    for (let i = fromIndex; i >= 0; i--) {
      const step = this.steps[i];
      if (step.compensation) {
        this.updateStepStatus(i, "processing");
        try {
          await step.compensation(this.state, data);
          this.updateStepStatus(i, "pending");
        } catch {
          console.error(`Compensation failed for step ${step.id}`);
        }
      }
    }
  }

  private async handleS3Upload(_state: SagaState, csvContent: unknown): Promise<string> {
    await this.delay(STEP_DELAYS.s3Upload);
    const s3Key = `uploads/${this.state.sagaId}/${this.state.fileName}`;
    s3Storage.set(s3Key, csvContent as string);
    return s3Key;
  }

  private async compensateS3Upload(): Promise<void> {
    await this.delay(300);
    const s3Key = `uploads/${this.state.sagaId}/${this.state.fileName}`;
    s3Storage.delete(s3Key);
  }

  private async handleSQSEnqueue(_state: SagaState, s3Key: unknown): Promise<string> {
    await this.delay(STEP_DELAYS.sqsEnqueue);
    const messageId = `msg_${Date.now()}`;
    sqsQueue.push({
      messageId,
      body: { s3Key, sagaId: this.state.sagaId }
    });
    return messageId;
  }

  private async handleLambdaProcess(_state: SagaState, _messageId: unknown): Promise<Subject[]> {
    await this.delay(STEP_DELAYS.lambdaProcess);

    const s3Key = `uploads/${this.state.sagaId}/${this.state.fileName}`;
    const csvContent = s3Storage.get(s3Key);

    if (!csvContent) {
      throw new Error("CSV file not found in S3");
    }

    const lines = csvContent.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim());

    const subjects: Subject[] = lines.slice(1).map((line) => {
      const values = line.split(",").map(v => v.trim());
      return {
        id: parseInt(values[headers.indexOf("id")] || "0", 10),
        name: values[headers.indexOf("name")] || "",
        image_id: values[headers.indexOf("image_id")] || "",
      };
    }).filter(s => s.id > 0);

    this.updateState({ processedRows: subjects.length });

    return subjects;
  }

  private async compensateLambdaProcess(): Promise<void> {
    await this.delay(200);
  }

  private async handleDBWrite(_state: SagaState, subjects: unknown): Promise<number> {
    await this.delay(STEP_DELAYS.dbWrite);
    const subjectArray = subjects as Subject[];
    database.push(...subjectArray);
    return subjectArray.length;
  }

  private async compensateDBWrite(): Promise<void> {
    await this.delay(400);
    const count = this.state.processedRows || 0;
    database.splice(-count, count);
  }

  private async handleWebhookNotify(_state: SagaState, recordCount: unknown): Promise<{ notified: boolean }> {
    await this.delay(STEP_DELAYS.webhookNotify);
    console.log(`Webhook: Processing complete. ${recordCount} records inserted.`);
    return { notified: true };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getState(): SagaState {
    return this.state;
  }

  async executeWithFailure(csvContent: string, failAtStep: number): Promise<SagaState> {
    this.updateState({
      status: "running",
      startedAt: Date.now(),
      currentStepIndex: 0
    });

    let data: unknown = csvContent;

    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      this.updateState({ currentStepIndex: i });
      this.updateStepStatus(i, "processing", { startedAt: Date.now() });

      if (i === failAtStep) {
        await this.delay(1000);
        this.updateStepStatus(i, "failed", {
          completedAt: Date.now(),
          error: `Simulated failure at ${step.name}`
        });

        await this.compensate(i - 1, data);

        this.updateState({
          status: "failed",
          completedAt: Date.now(),
          error: `Simulated failure at ${step.name}`
        });

        return this.state;
      }

      try {
        data = await step.handler(this.state, data);
        this.updateStepStatus(i, "completed", {
          completedAt: Date.now(),
          result: data
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        this.updateStepStatus(i, "failed", {
          completedAt: Date.now(),
          error: errorMessage
        });

        await this.compensate(i - 1, data);

        this.updateState({
          status: "failed",
          completedAt: Date.now(),
          error: errorMessage
        });

        return this.state;
      }
    }

    this.updateState({
      status: "completed",
      completedAt: Date.now()
    });

    return this.state;
  }
}

export function getMockS3(): Map<string, string> {
  return s3Storage;
}

export function getMockSQS(): Array<{ messageId: string; body: unknown }> {
  return sqsQueue;
}

export function getMockDB(): Subject[] {
  return database;
}

export function clearMocks(): void {
  s3Storage.clear();
  sqsQueue.length = 0;
  database.length = 0;
}
