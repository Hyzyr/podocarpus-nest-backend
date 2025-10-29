# Global Notifications Architecture Guide

## Overview

The Global Notifications system is designed to handle system-wide announcements that can be targeted to specific user roles. This implementation follows the **Inverse Query Pattern** used by companies like Google, Meta, and X (Twitter) for handling high-scale, low-latency notification systems.

## Problem Statement

**Old Approach** (Not Recommended):
```typescript
// ❌ DOESN'T SCALE - Adding users to notification array
notification.users = [...notification.users, userId]  // Mutating array
```

**Issues:**
- Array mutations are inefficient at scale
- PostgreSQL JSON array updates lock entire record
- No tracking of who viewed vs who didn't
- Impossible to query "unviewed" without scanning all users

## Recommended Architecture: Inverse Query Pattern

**The Key Insight**: Instead of storing "who viewed it", track "which users viewed each notification" via a junction table.

### Database Schema

```prisma
// One - The actual notification broadcast
model GlobalNotification {
  id          String   @id @default(uuid())
  title       String
  message     String
  type        NotificationType
  targetRoles UserRole[]  // Who should see this (empty = all)
  priority    String      // low, normal, high, critical
  isActive    Boolean
  startsAt    DateTime
  expiresAt   DateTime?   // When to stop showing
  
  views       GlobalNotificationView[]  // Many views
}

// Many - Who actually viewed it
model GlobalNotificationView {
  id                   String @id @default(uuid())
  userId               String
  globalNotificationId String
  viewedAt             DateTime
  dismissed            Boolean  // User explicitly dismissed
  
  @@unique([userId, globalNotificationId])  // One view per user
}
```

### Query Patterns (Using Inverse Pattern)

```typescript
// Get active notifications FOR a user (efficient)
await prisma.globalNotification.findMany({
  where: {
    isActive: true,
    startsAt: { lte: now },
    OR: [
      { expiresAt: null },
      { expiresAt: { gte: now } }
    ]
  },
  include: {
    views: {
      where: { userId: currentUserId },  // Only their view
      take: 1
    }
  }
})
// Result: O(n) where n = number of notifications (not users!)

// Mark as viewed (upsert - idempotent)
await prisma.globalNotificationView.upsert({
  where: {
    userId_globalNotificationId: { userId, globalNotificationId }
  },
  create: { userId, globalNotificationId, viewedAt: now },
  update: { viewedAt: now }
})

// Get view statistics (efficient)
await prisma.globalNotificationView.groupBy({
  by: ['globalNotificationId'],
  _count: { id: true }
})
// Returns view count per notification without scanning users table
```

## Why This Approach Wins

### Scalability Comparison

| Operation | Old Approach | Inverse Pattern |
|-----------|-------------|-----------------|
| Get notifications for user | O(n) scan all users in array | O(1) index lookup |
| Track a view | Update entire array + lock | Insert 1 row |
| Get view count | Count array length | Index count |
| Find "unviewed" | O(total_users) filter | Index range scan |
| Concurrent updates | Lock contention | No contention |

### Real Numbers at Scale

**Notification seen by 5M users:**
- Old: 5M item array = 50+ MB, full table lock during updates
- New: 5M rows in junction table with indexes = efficient range queries

## Implementation Details

### Service Methods

```typescript
// Get unviewed notifications for user
async getActiveNotifications(user: CurrentUser) {
  // Filters by user's role automatically
  // Includes view status for each notification
}

// Track a view (idempotent)
async markAsViewed(notificationId, userId, dismissed?) {
  // Uses upsert - safe to call multiple times
  // Records timestamp for analytics
}

// Admin analytics
async getNotificationStats(notificationId) {
  // Total targeted users
  // View count and percentage
  // Dismissal count
  // Time-based trends
}

async getViewAnalytics(notificationId) {
  // Breakdown by user role
  // Hourly view distribution
  // User email list
}
```

### API Endpoints

**For Users:**
```
GET  /global-notifications          - Get active notifications
PATCH /global-notifications/:id/view   - Mark as viewed
PATCH /global-notifications/:id/dismiss - Mark as dismissed
```

**For Admins:**
```
POST  /global-notifications              - Create notification
PATCH /global-notifications/:id          - Update notification
DELETE /global-notifications/:id         - Delete notification
GET   /global-notifications/:id/stats    - View statistics
GET   /global-notifications/:id/analytics - Detailed analytics
GET   /global-notifications/admin/all    - All notifications with counts
```

## Usage Examples

### Creating a Global Notification

```typescript
await globalNotificationsService.create({
  title: 'System Maintenance',
  message: 'Scheduled maintenance on Oct 30, 2-4 PM UTC',
  type: 'system',
  targetRoles: [UserRole.investor],  // Only investors see this
  priority: 'high',
  icon: '⚠️',
  expiresAt: '2025-10-30T20:00:00Z',
  json: {
    maintenanceWindow: '2-4 PM UTC',
    affectedServices: ['API', 'Dashboard']
  }
});
```

### User Viewing Notifications

```typescript
// Get their active notifications (filtered by role)
const notifications = await globalNotificationsService
  .getActiveNotifications(currentUser);

// When user sees notification in UI
await globalNotificationsService.markAsViewed(
  notificationId,
  userId
);

// When user dismisses/closes notification
await globalNotificationsService.dismissNotification(
  notificationId,
  userId
);
```

### Admin Analytics

```typescript
// Get view statistics
const stats = await globalNotificationsService
  .getNotificationStats(notificationId);

console.log({
  targetedUsers: 10000,
  viewedCount: 6400,
  viewPercentage: 64,
  dismissedCount: 280
});

// Get detailed breakdown
const analytics = await globalNotificationsService
  .getViewAnalytics(notificationId);

console.log({
  viewsByRole: {
    investor: { total: 6000, dismissed: 200 },
    broker: { total: 400, dismissed: 80 }
  },
  viewsByHour: {
    0: 100,
    1: 250,
    // ...
  }
});
```

## Advanced Features

### Priority Levels
- **critical**: Shown prominently, can't be dismissed
- **high**: Appears at top of feed
- **normal**: Standard notifications
- **low**: Grouped/archived

### Time-Based Control
- `startsAt`: When notification becomes visible
- `expiresAt`: When notification is hidden (optional)
- Automatically excluded if outside time window

### Target Audience Control
- Empty `targetRoles` = visible to all
- Specific roles = filtered visibility
- Can add roles without rebroadcasting

### Dismissal Tracking
- Users can dismiss (sets `dismissed = true`)
- Dismissed shows in analytics separately from views
- Dismissed notifications can reappear if re-enabled

## Database Considerations

### Indexes (Already in Schema)

```prisma
@@index([isActive, startsAt])           // For active queries
@@index([createdAt])                    // For sorting
@@index([globalNotificationId, viewedAt]) // For view analytics
@@index([userId, viewedAt])             // For user's views
@@unique([userId, globalNotificationId]) // Prevents duplicate views
```

### Performance Notes

- **Insertion**: O(1) - just insert into view table
- **Query for user**: O(log n) - indexed lookup
- **Query for stats**: O(m) where m = views (not users)
- **Update notification**: O(1) - doesn't require view table changes
- **Delete notification**: Cascades delete views automatically

## Comparison with Alternatives

### Alternative 1: JSON Array (Not Recommended)
```prisma
model Notification {
  seenBy String[]  // ARRAY of user IDs
}
```
❌ Doesn't scale beyond ~1000 users per notification
❌ PostgreSQL array updates are expensive
❌ No efficient queries for "unviewed"

### Alternative 2: Separate table PER user (Not Recommended)
```prisma
model UserNotification {
  userId String
  notifications Json[]  // User's notifications
}
```
❌ Duplicate data storage (5M users = 5M rows per notification)
❌ Complex update logic
❌ Doesn't work for "get stats" queries

### Alternative 3: Redis + Database (Recommended for scale > 100M)
```typescript
// Redis for real-time view tracking (fast)
// PostgreSQL for persistence and analytics
// This scales to billions of views
```

## Migration from Old System

If you have existing notifications using the old `Notification` table with `isGlobal`:

```typescript
// The old and new systems can coexist:
// - Old: Notification (user-specific)
// - New: GlobalNotification (broadcast)

// Query both in getRelatedNotifications():
const personal = await prisma.notification.findMany({
  where: { userId: currentUserId }
});

const global = await prisma.globalNotification.findMany({
  // ... role-based filtering
});

return [...personal, ...global];
```

## Best Practices

1. **Always use role-based targeting** - saves unnecessary broadcasts
2. **Set expiration times** - prevents old notifications from cluttering UI
3. **Use priorities** - helps users focus on important items
4. **Track dismissals** - measure engagement separately from views
5. **Regular analytics** - delete old notifications after 30-60 days
6. **Batch creation** - for multi-role notifications, create once not per role
7. **Monitor view times** - adjust notification frequency if view% is low

## Troubleshooting

**Issue**: "User not seeing notifications"
- Check `targetRoles` includes user's role
- Verify `isActive = true`
- Check `startsAt <= now` and `expiresAt > now`
- Confirm user's role is in Prisma schema

**Issue**: "View count seems off"
- Check unique constraint on `userId_globalNotificationId`
- Verify upsert is being used (not create + update)
- Run `getViewAnalytics()` to see breakdown

**Issue**: "Database slow"
- Ensure indexes exist (check schema)
- Archive old notifications (older than 90 days)
- Use pagination for admin list endpoint

---

**Created**: October 29, 2025
**Architecture Pattern**: Inverse Query Pattern (Google/Meta/X scale)
**Database**: PostgreSQL with Prisma ORM
