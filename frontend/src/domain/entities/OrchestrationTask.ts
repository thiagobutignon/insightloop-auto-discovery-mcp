export enum TaskStatus {
  PENDING = 'pending',
  PLANNING = 'planning',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface TaskStep {
  action: string
  description?: string
  tool?: string
  args?: Record<string, unknown>
  result?: unknown
  error?: string
  timestamp?: Date
}

export interface TaskEvent {
  event: string
  message?: string
  data?: unknown
  timestamp: Date
}

export class OrchestrationTask {
  public events: TaskEvent[] = []
  public steps: TaskStep[] = []
  public result?: unknown
  public error?: string

  constructor(
    public readonly id: string,
    public readonly serverId: string,
    public readonly prompt: string,
    public status: TaskStatus = TaskStatus.PENDING,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  addEvent(event: string, message?: string, data?: unknown): void {
    this.events.push({
      event,
      message,
      data,
      timestamp: new Date(),
    })
    this.updatedAt = new Date()
  }

  addStep(step: TaskStep): void {
    this.steps.push({
      ...step,
      timestamp: new Date(),
    })
    this.updatedAt = new Date()
  }

  updateStatus(status: TaskStatus): void {
    this.status = status
    this.updatedAt = new Date()
  }

  complete(result: unknown): void {
    this.result = result
    this.status = TaskStatus.COMPLETED
    this.updatedAt = new Date()
  }

  fail(error: string): void {
    this.error = error
    this.status = TaskStatus.FAILED
    this.updatedAt = new Date()
  }

  isActive(): boolean {
    return [TaskStatus.PLANNING, TaskStatus.EXECUTING].includes(this.status)
  }

  getDuration(): number {
    return this.updatedAt.getTime() - this.createdAt.getTime()
  }
}