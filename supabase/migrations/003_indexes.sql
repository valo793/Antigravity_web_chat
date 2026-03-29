-- =========================================================
-- Performance Indexes
-- =========================================================

CREATE INDEX idx_conversations_owner ON conversations (owner_user_id);
CREATE INDEX idx_conversations_external_thread ON conversations (external_thread_id);
CREATE INDEX idx_conversations_last_message ON conversations (last_message_at DESC);
CREATE INDEX idx_conversations_agent ON conversations (agent_id);

CREATE INDEX idx_messages_conversation ON messages (conversation_id);
CREATE INDEX idx_messages_created ON messages (created_at);
CREATE INDEX idx_messages_external_id ON messages (external_message_id);

CREATE INDEX idx_notifications_owner ON notifications (owner_user_id);
CREATE INDEX idx_notifications_is_read ON notifications (is_read);
CREATE INDEX idx_notifications_created ON notifications (created_at DESC);

CREATE INDEX idx_webhook_events_event_id ON webhook_events (event_id);
CREATE INDEX idx_webhook_events_source ON webhook_events (source);
CREATE INDEX idx_webhook_events_status ON webhook_events (processing_status);
