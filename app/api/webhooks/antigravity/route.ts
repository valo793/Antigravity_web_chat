import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/database/supabase/server";
import { ProcessWebhookWorkflow, ProcessWebhookContext } from "@/core/workflows/webhook";

export async function POST(request: NextRequest) {
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
    return NextResponse.json(
      finalContext.httpResponse.body,
      { status: finalContext.httpResponse.status }
    );
  }

  // Fallback in case of an extremely unexpected failure that doesn't set httpResponse
  return NextResponse.json(
    { success: false, error: "Catastrophic failure in workflow" },
    { status: 500 }
  );
}
