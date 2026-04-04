export interface WorkflowContext {
  [key: string]: any;
}

export interface WorkflowStage<TContext extends WorkflowContext> {
  name: string;
  execute(context: TContext): Promise<void>;
}

export abstract class BaseWorkflow<TContext extends WorkflowContext> {
  protected stages: WorkflowStage<TContext>[] = [];

  constructor(protected context: TContext) {}

  public async execute(): Promise<TContext> {
    for (const stage of this.stages) {
      try {
        await stage.execute(this.context);
      } catch (error) {
        // Here we could add telemetry or error handling
        throw new Error(`[Workflow Stage Failed] ${stage.name}: ${error instanceof Error ? error.message : error}`);
      }
    }
    return this.context;
  }
}
