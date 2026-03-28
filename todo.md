# Antigravity Chat - TODO

## Schema & Database
- [x] Create schema SQL with profiles, agents, conversations, messages, notifications, webhook_events, user_preferences, attachments tables
- [x] Implement RLS policies for all tables (documentation provided)
- [x] Create indexes for performance optimization
- [x] Apply migrations to Supabase

## Authentication
- [x] Restrict login to owner only (Manus OAuth) - implemented in auth router
- [x] Implement owner check in auth middleware
- [x] Add logout functionality
- [ ] Add password recovery (optional) - PENDING

## Design System (Brutalist Typographic)
- [x] Create global CSS with brutalist aesthetic (sans-serif heavy, black on white)
- [x] Implement geometric lines and brackets for hierarchy
- [x] Set up typography scale and spacing system
- [x] Create color palette (black, white, grays)
- [ ] Build UI component library (buttons, cards, badges, etc) - PENDING

## Layout & Navigation
- [ ] Create main dashboard layout with sidebar
- [ ] Implement sidebar navigation for conversations
- [ ] Create topbar with user profile and logout
- [ ] Add responsive mobile layout

## Chat Module
- [ ] Implement conversations list with unread badges
- [ ] Create message thread view
- [ ] Display message history (user, agent, system)
- [ ] Implement Supabase Realtime for live updates
- [ ] Add message composer
- [ ] Display message timestamps and sender info

## Notifications Module
- [ ] Create notifications list page
- [ ] Implement mark as read/unread functionality
- [ ] Add notification badge to sidebar
- [ ] Implement real-time notification updates
- [ ] Add notification bell icon to topbar

## Webhook Integration
- [ ] Create secure webhook endpoint (/api/webhooks/antigravity)
- [ ] Implement HMAC signature validation
- [ ] Add payload schema validation
- [ ] Implement event deduplication by event_id
- [ ] Create conversation auto-creation logic
- [ ] Implement message persistence
- [ ] Add error logging and monitoring

## File Upload & Storage
- [ ] Implement S3 file upload functionality
- [ ] Create attachments table and relationships
- [ ] Add file preview in messages
- [ ] Implement secure file access control
- [ ] Add file size and type validation

## Settings Page
- [ ] Create settings layout
- [ ] Implement integration settings (webhook secret display)
- [ ] Add agent management interface
- [ ] Implement notification preferences
- [ ] Add theme/appearance settings

## Owner Notifications
- [ ] Implement automatic notification when new conversation starts
- [ ] Send notification on critical messages
- [ ] Use Manus notifyOwner API

## API Routes
- [ ] GET /api/conversations - List user conversations
- [ ] GET /api/conversations/[id]/messages - Get conversation messages
- [ ] POST /api/chat/send - Send user message
- [ ] GET /api/notifications - List notifications
- [ ] POST /api/notifications/[id]/read - Mark notification as read
- [ ] POST /api/webhooks/antigravity - Receive webhook events
- [ ] GET /api/health - Health check endpoint
- [ ] POST /api/upload - Handle file uploads

## Testing & Quality
- [ ] Write vitest tests for API routes
- [ ] Write vitest tests for webhook validation
- [ ] Write vitest tests for auth middleware
- [ ] Test Realtime subscriptions
- [ ] Test file upload functionality
- [ ] Verify RLS policies work correctly

## Documentation
- [ ] Create Supabase implementation guide (Markdown)
- [ ] Document webhook payload format
- [ ] Document environment variables needed
- [ ] Document RLS policies and security model
- [ ] List pending features and known limitations

## Deployment
- [ ] Verify all environment variables are set
- [ ] Test webhook signature validation in production
- [ ] Test Realtime connections
- [ ] Create checkpoint before publishing
- [ ] Deploy to Vercel
