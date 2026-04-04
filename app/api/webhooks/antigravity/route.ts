import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/database/supabase/server";
import { ProcessWebhookWorkflow, ProcessWebhookContext } from "@/core/workflows/webhook";
import { logger } from "@/core/utils/logger";

export async function POST(request: NextRequest) {
  logger.info("Received Antigravity Webhook POST request");
  const supabase = createAdminClient();
  const requestBody = await request.text();
  
  const secret = process.env.ANTIGRAVITY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-webhook-signature");

  const initialContext: ProcessWebhookContext = {
    supabase,
    requestBody,
    signature,
    secret,
    signatureValid: false, // Will be set by stage
  };

  const workflow = new ProcessWebhookWorkflow(initialContext);
  const finalContext = await workflow.executeSafely();

  if (finalContext.httpResponse) {
    if (finalContext.httpResponse.status >= 400) {
      logger.warn("Webhook processed with error status", { status: finalContext.httpResponse.status, body: finalContext.httpResponse.body });
    } else {
      logger.info("Webhook processed successfully", { status: finalContext.httpResponse.status });
    }
    return NextResponse.json(
      finalContext.httpResponse.body,
      { status: finalContext.httpResponse.status }
    );
  }

  // Fallback in case of an extremely unexpected failure that doesn't set httpResponse
  logger.error("Catastrophic failure in workflow: httpResponse not set");
  return NextResponse.json(
    { success: false, error: "Catastrophic failure in workflow" },
    { status: 500 }
  );
}
