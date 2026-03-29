import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/webhook/verify-signature";
import { parseWebhookPayload, shouldNotifyUser, getNotificationTitle } from "@/lib/webhook/parse-event";
import { isDuplicateEvent } from "@/lib/webhook/dedupe";
import {
  createWebhookEvent,
  updateWebhookEventStatus,
  getConversationByExternalThread,
  createConversation,
  createMessage,
  createNotification,
  getOrCreateAgent,
} from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  const rawBody = await request.text();

  // --- Validate signature ---
  const secret = process.env.ANTIGRAVITY_WEBHOOK_SECRET;
  const signature = request.headers.get("x-webhook-signature");

  let signatureValid = false;
  const hasRealSecret = secret && secret !== "your-webhook-secret";

  if (hasRealSecret && signature) {
    signatureValid = verifyWebhookSignature(rawBody, signature, secret);
  } else if (!hasRealSecret) {
    // No real secret configured — allow all (dev mode)
    signatureValid = true;
  }

  // If secret is configured but signature invalid, reject
  if (hasRealSecret && !signatureValid) {
    return NextResponse.json(
      { success: false, error: "Invalid signature" },
      { status: 401 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  // --- Log the webhook event ---
  let webhookEventId: string;
  try {
    webhookEventId = await createWebhookEvent(supabase, {
      source: "antigravity",
      event_id: (payload.event_id as string) || "unknown",
      signature_valid: signatureValid,
      payload,
    });
  } catch (err) {
    console.error("[Webhook] Failed to log event:", err);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }

  try {
    // --- Parse and validate ---
    const event = parseWebhookPayload(payload);

    // --- Deduplication ---
    const duplicate = await isDuplicateEvent(supabase, event.event_id);
    if (duplicate) {
      await updateWebhookEventStatus(supabase, webhookEventId, "success");
      return NextResponse.json({
        success: true,
        message: "Event already processed",
        event_id: event.event_id,
      });
    }

    // --- Resolve or auto-create agent ---
    const agent = await getOrCreateAgent(supabase, event.agent_slug);

    // --- Find or create owner profile ---
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    const ownerId = profiles?.[0]?.id;
    if (!ownerId) {
      throw new Error("No owner profile found. User must log in first.");
    }

    // --- Find or create conversation ---
    let conversation = await getConversationByExternalThread(
      supabase,
      event.external_thread_id
    );

    if (!conversation) {
      conversation = await createConversation(supabase, {
        owner_user_id: ownerId,
        title: `Conversa com ${agent.name}`,
        external_thread_id: event.external_thread_id,
        agent_id: agent.id,
      });

      await createNotification(supabase, {
        owner_user_id: ownerId,
        conversation_id: conversation.id,
        title: `Nova conversa com ${agent.name}`,
        body: "Uma nova conversa foi iniciada",
        kind: "system",
      });
    }

    // --- Insert message ---
    if (event.message) {
      const msg = await createMessage(supabase, {
        conversation_id: conversation.id,
        sender_type: event.message.sender_type,
        sender_label: event.message.sender_label,
        content: event.message.content,
        content_format: event.message.content_format,
        external_message_id: event.message.external_message_id,
        status: "received",
        metadata: event.metadata as Record<string, unknown> | undefined,
      });

      // --- Create notification ---
      if (shouldNotifyUser(event.event_type)) {
        const title = getNotificationTitle(
          event.event_type,
          event.message.sender_label
        );
        await createNotification(supabase, {
          owner_user_id: ownerId,
          conversation_id: conversation.id,
          message_id: msg.id,
          title,
          body: event.message.content.substring(0, 100),
          kind: event.event_type === "error" ? "agent_error" : "new_message",
        });
      }
    }

    await updateWebhookEventStatus(supabase, webhookEventId, "success");
    return NextResponse.json({ success: true, event_id: event.event_id });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Webhook] Processing failed:", errorMessage);
    await updateWebhookEventStatus(supabase, webhookEventId, "failed", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 422 }
    );
  }
}
