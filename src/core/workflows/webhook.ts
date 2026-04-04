import { BaseWorkflow, WorkflowContext, WorkflowStage } from "./base";

export interface ProcessWebhookContext extends WorkflowContext {
  supabase: any; // Using any for now to avoid coupling heavily in Sprint 2, will refine later
  requestBody: string;
  signature: string | null;
  secret?: string;
  signatureValid: boolean;
  
  parsedJson?: Record<string, unknown>;
  parsedEvent?: any; 
  webhookEventId?: string;
  isDuplicate?: boolean;
  
  ownerId?: string;
  agent?: any;
  conversation?: any;
  message?: any;

  httpResponse?: { status: number, body: any };
}

// Stages
class ValidateSignatureStage implements WorkflowStage<ProcessWebhookContext> {
  name = "ValidateSignatureStage";
  async execute(context: ProcessWebhookContext) {
    const { verifyWebhookSignature } = await import("@/infrastructure/services/webhook/verify-signature");
    
    context.signatureValid = false;
    const hasRealSecret = context.secret && context.secret !== "your-webhook-secret";

    if (hasRealSecret && context.signature) {
      context.signatureValid = verifyWebhookSignature(context.requestBody, context.signature, context.secret!);
    } else if (!hasRealSecret) {
      context.signatureValid = true; // Dev mode
    }

    if (hasRealSecret && !context.signatureValid) {
      context.httpResponse = { status: 401, body: { success: false, error: "Invalid signature" } };
      throw new Error("Invalid signature");
    }
  }
}

class ParseJSONStage implements WorkflowStage<ProcessWebhookContext> {
  name = "ParseJSONStage";
  async execute(context: ProcessWebhookContext) {
    try {
      context.parsedJson = JSON.parse(context.requestBody);
    } catch {
      context.httpResponse = { status: 400, body: { success: false, error: "Invalid JSON" } };
      throw new Error("Invalid JSON");
    }
  }
}

class LogEventStage implements WorkflowStage<ProcessWebhookContext> {
  name = "LogEventStage";
  async execute(context: ProcessWebhookContext) {
    const { createWebhookEvent } = await import("@/infrastructure/database/repositories/webhook.repository");
    
    try {
      context.webhookEventId = await createWebhookEvent(context.supabase, {
        source: "antigravity",
        event_id: (context.parsedJson?.event_id as string) || "unknown",
        signature_valid: context.signatureValid,
        payload: context.parsedJson,
      });
    } catch (err) {
      context.httpResponse = { status: 500, body: { success: false, error: "Internal error logging event" } };
      throw err;
    }
  }
}

class ParseWebhookPayloadStage implements WorkflowStage<ProcessWebhookContext> {
  name = "ParseWebhookPayloadStage";
  async execute(context: ProcessWebhookContext) {
    const { parseWebhookPayload } = await import("@/infrastructure/services/webhook/parse-event");
    context.parsedEvent = parseWebhookPayload(context.parsedJson);
  }
}

class DeduplicationStage implements WorkflowStage<ProcessWebhookContext> {
  name = "DeduplicationStage";
  async execute(context: ProcessWebhookContext) {
    const { isDuplicateEvent } = await import("@/infrastructure/services/webhook/dedupe");
    const { updateWebhookEventStatus } = await import("@/infrastructure/database/repositories/webhook.repository");

    const duplicate = await isDuplicateEvent(context.supabase, context.parsedEvent.event_id);
    if (duplicate) {
      context.isDuplicate = true;
      if (context.webhookEventId) {
        await updateWebhookEventStatus(context.supabase, context.webhookEventId, "success");
      }
      context.httpResponse = { 
        status: 200, 
        body: { success: true, message: "Event already processed", event_id: context.parsedEvent.event_id } 
      };
      // Short-circuit the workflow by throwing a special control flow error (or returning early)
      // Since BaseWorkflow doesn't support early return, throwing a custom handled error is one way.
      throw new Error("DUPLICATE_EVENT");
    }
  }
}

class ResolveAgentStage implements WorkflowStage<ProcessWebhookContext> {
  name = "ResolveAgentStage";
  async execute(context: ProcessWebhookContext) {
    const { getOrCreateAgent } = await import("@/infrastructure/database/repositories/agent.repository");
    context.agent = await getOrCreateAgent(context.supabase, context.parsedEvent.agent_slug);
  }
}

class ResolveUserStage implements WorkflowStage<ProcessWebhookContext> {
  name = "ResolveUserStage";
  async execute(context: ProcessWebhookContext) {
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id")
      .limit(1);

    context.ownerId = profiles?.[0]?.id;
    if (!context.ownerId) {
      throw new Error("No owner profile found. User must log in first.");
    }
  }
}

class ResolveConversationStage implements WorkflowStage<ProcessWebhookContext> {
  name = "ResolveConversationStage";
  async execute(context: ProcessWebhookContext) {
    const { getConversationByExternalThread, createConversation } = await import("@/infrastructure/database/repositories/conversation.repository");
    const { createNotification } = await import("@/infrastructure/database/repositories/notification.repository");
    
    let conversation = await getConversationByExternalThread(
      context.supabase,
      context.parsedEvent.external_thread_id
    );

    if (!conversation) {
      conversation = await createConversation(context.supabase, {
        owner_user_id: context.ownerId!,
        title: `Conversa com ${context.agent.name}`,
        external_thread_id: context.parsedEvent.external_thread_id,
        agent_id: context.agent.id,
      });

      await createNotification(context.supabase, {
        owner_user_id: context.ownerId!,
        conversation_id: conversation.id,
        title: `Nova conversa com ${context.agent.name}`,
        body: "Uma nova conversa foi iniciada",
        kind: "system",
      });
    }
    context.conversation = conversation;
  }
}

class ProcessMessageStage implements WorkflowStage<ProcessWebhookContext> {
  name = "ProcessMessageStage";
  async execute(context: ProcessWebhookContext) {
    const { createMessage } = await import("@/infrastructure/database/repositories/message.repository");
    const { createNotification } = await import("@/infrastructure/database/repositories/notification.repository");
    const { shouldNotifyUser, getNotificationTitle } = await import("@/infrastructure/services/webhook/parse-event");
    const event = context.parsedEvent;
    
    if (event.message) {
      const msg = await createMessage(context.supabase, {
        conversation_id: context.conversation.id,
        sender_type: event.message.sender_type,
        sender_label: event.message.sender_label,
        content: event.message.content,
        content_format: event.message.content_format,
        external_message_id: event.message.external_message_id,
        status: "received",
        metadata: event.metadata as Record<string, unknown> | undefined,
      });
      context.message = msg;

      if (shouldNotifyUser(event.event_type)) {
        const title = getNotificationTitle(
          event.event_type,
          event.message.sender_label
        );
        await createNotification(context.supabase, {
          owner_user_id: context.ownerId!,
          conversation_id: context.conversation.id,
          message_id: msg.id,
          title,
          body: event.message.content.substring(0, 100),
          kind: event.event_type === "error" ? "agent_error" : "new_message",
        });
      }
    }
  }
}

class MarkSuccessStage implements WorkflowStage<ProcessWebhookContext> {
  name = "MarkSuccessStage";
  async execute(context: ProcessWebhookContext) {
    const { updateWebhookEventStatus } = await import("@/infrastructure/database/repositories/webhook.repository");
    if (context.webhookEventId) {
       await updateWebhookEventStatus(context.supabase, context.webhookEventId, "success");
    }
    context.httpResponse = { 
      status: 200, 
      body: { success: true, event_id: context.parsedEvent.event_id } 
    };
  }
}

export class ProcessWebhookWorkflow extends BaseWorkflow<ProcessWebhookContext> {
  constructor(context: ProcessWebhookContext) {
    super(context);
    this.stages = [
      new ValidateSignatureStage(),
      new ParseJSONStage(),
      new LogEventStage(),
      new ParseWebhookPayloadStage(),
      new DeduplicationStage(),
      new ResolveAgentStage(),
      new ResolveUserStage(),
      new ResolveConversationStage(),
      new ProcessMessageStage(),
      new MarkSuccessStage()
    ];
  }
  
  public async executeSafely(): Promise<ProcessWebhookContext> {
    try {
      await this.execute();
    } catch (error: any) {
      if (error.message === "DUPLICATE_EVENT") {
        return this.context;
      }
      
      console.error("[Workflow Error]", error);
      
      // Update webhook event if it failed
      if (this.context.webhookEventId && !this.context.httpResponse) {
         try {
           const { updateWebhookEventStatus } = await import("@/infrastructure/database/repositories/webhook.repository");
           await updateWebhookEventStatus(this.context.supabase, this.context.webhookEventId, "failed", error.message);
         } catch (e) {
           console.error("Failed to mark webhook event as failed inside workflow catch block.", e);
         }
      }
      
      if (!this.context.httpResponse) {
        this.context.httpResponse = { status: 422, body: { success: false, error: error.message } };
      }
    }
    
    return this.context;
  }
}
