# Convex Cron Jobs - Feature Cheatsheet

A comprehensive reference for Convex cron jobs and scheduled tasks demonstrated in this example project.

## 📋 Project Overview

This project demonstrates Convex cron jobs functionality in a chat application that automatically clears messages every minute. It showcases cron job scheduling, internal mutations, and automated task execution.

## ⏰ Core Cron Jobs Features

### 1. Cron Job Setup (convex/crons.ts)

#### **Basic Cron Job Configuration**
```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Interval-based cron job
crons.interval(
  "clear messages table",    // Job name/description
  { minutes: 1 },           // Schedule configuration
  internal.messages.clearAll // Function to execute
);

export default crons;
```

**Key Points:**
- Import `cronJobs` from `"convex/server"`
- Use `internal` API to reference internal mutations
- Export the configured crons as default
- Job names should be descriptive for monitoring

#### **Scheduling Options**
```typescript
// Time-based intervals
crons.interval("job-name", { seconds: 30 }, internal.func);
crons.interval("job-name", { minutes: 5 }, internal.func);
crons.interval("job-name", { hours: 2 }, internal.func);
crons.interval("job-name", { days: 1 }, internal.func);

// Cron expression format
crons.cron("job-name", "0 */5 * * *", internal.func); // Every 5 minutes
crons.cron("job-name", "0 0 * * *", internal.func);   // Daily at midnight
crons.cron("job-name", "0 0 * * 1", internal.func);   // Weekly on Monday

// Monthly schedule
crons.monthly("job-name", { day: 1, hourUTC: 0, minuteUTC: 0 }, internal.func);
```

### 2. Internal Mutations for Cron Jobs

#### **Internal Mutation Definition**
```typescript
import { internalMutation } from "./_generated/server";

export const clearAll = internalMutation({
  handler: async (ctx) => {
    // Get all messages
    for (const message of await ctx.db.query("messages").collect()) {
      await ctx.db.delete(message._id);
    }
  },
});
```

**Key Points:**
- Use `internalMutation` for cron job handlers
- Internal mutations can only be called by server-side code
- Not accessible from client-side React components
- Perfect for automated maintenance tasks

#### **Internal vs Public Functions**
```typescript
// PUBLIC - Can be called from client
export const send = mutation({
  handler: async (ctx, args) => { /* ... */ }
});

// INTERNAL - Only callable by server/crons
export const clearAll = internalMutation({
  handler: async (ctx) => { /* ... */ }
});
```

### 3. Database Operations in Cron Jobs

#### **Bulk Delete Operations**
```typescript
export const clearAll = internalMutation({
  handler: async (ctx) => {
    // Method 1: Delete each document individually
    for (const message of await ctx.db.query("messages").collect()) {
      await ctx.db.delete(message._id);
    }
    
    // Method 2: More efficient batch operations (if available)
    // const messages = await ctx.db.query("messages").collect();
    // await Promise.all(messages.map(msg => ctx.db.delete(msg._id)));
  },
});
```

#### **Conditional Cleanup**
```typescript
export const cleanupOldMessages = internalMutation({
  handler: async (ctx) => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    const oldMessages = await ctx.db
      .query("messages")
      .filter(q => q.lt(q.field("_creationTime"), oneDayAgo))
      .collect();
      
    for (const message of oldMessages) {
      await ctx.db.delete(message._id);
    }
  },
});
```

## 🔧 Standard Convex Features Used

### 1. Regular Mutations and Queries

#### **Public Mutations**
```typescript
export const send = mutation({
  handler: async (ctx, { body, author }) => {
    const message = { body, author };
    await ctx.db.insert("messages", message);
  },
});
```

#### **Queries**
```typescript
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("messages").collect();
  },
});
```

### 2. React Integration

#### **Standard Hooks Usage**
```typescript
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// In component
const messages = useQuery(api.messages.list) || [];
const sendMessage = useMutation(api.messages.send);

// Note: Cannot use internal functions from React
// ❌ This won't work: useMutation(api.messages.clearAll)
// ✅ Internal functions only work in cron jobs
```

## 🎯 Common Cron Job Use Cases

### **1. Data Cleanup**
```typescript
// Clean up old logs every day
crons.interval("cleanup-logs", { days: 1 }, internal.logs.cleanup);

// Delete expired sessions every hour
crons.interval("session-cleanup", { hours: 1 }, internal.auth.cleanupSessions);
```

### **2. Periodic Data Processing**
```typescript
// Generate daily reports
crons.cron("daily-report", "0 1 * * *", internal.reports.generateDaily);

// Send weekly newsletters
crons.cron("weekly-newsletter", "0 9 * * 1", internal.email.sendNewsletter);
```

### **3. Maintenance Tasks**
```typescript
// Database optimization
crons.interval("db-maintenance", { hours: 6 }, internal.maintenance.optimize);

// Cache refresh
crons.interval("cache-refresh", { minutes: 30 }, internal.cache.refresh);
```

### **4. Monitoring and Alerts**
```typescript
// Health checks
crons.interval("health-check", { minutes: 5 }, internal.monitoring.healthCheck);

// Send alerts for system issues
crons.interval("alert-check", { minutes: 10 }, internal.alerts.checkAndSend);
```

## 🔄 Cron Job Execution Flow

1. **Schedule Definition** → Cron job configured with timing
2. **Server Execution** → Convex server runs job at scheduled time
3. **Internal Function Call** → Only internal mutations can be executed
4. **Database Operations** → Perform cleanup, processing, or maintenance
5. **Automatic Retry** → Failed jobs are automatically retried
6. **Logging** → Execution status logged for monitoring

## 📁 Project Structure

```
convex/
├── _generated/          # Auto-generated types and API
├── crons.ts            # Cron job definitions
├── messages.ts         # Functions (queries, mutations, internal)
└── tsconfig.json       # TypeScript config

src/                    # React frontend (standard setup)
├── app.tsx            # Main component
├── main.tsx           # Entry point
└── styles.css         # Styling
```

## 🔍 Best Practices

### **1. Internal Function Security**
- Always use `internalMutation` for cron job handlers
- Never expose internal functions to client-side code
- Keep sensitive operations server-side only

### **2. Error Handling**
```typescript
export const robustCleanup = internalMutation({
  handler: async (ctx) => {
    try {
      const messages = await ctx.db.query("messages").collect();
      for (const message of messages) {
        await ctx.db.delete(message._id);
      }
      console.log(`Cleaned up ${messages.length} messages`);
    } catch (error) {
      console.error("Cleanup failed:", error);
      // Convex will automatically retry failed cron jobs
    }
  },
});
```

### **3. Efficient Batch Operations**
```typescript
// Prefer batch operations for better performance
export const batchCleanup = internalMutation({
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    
    // Process in batches to avoid timeouts
    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      await Promise.all(batch.map(msg => ctx.db.delete(msg._id)));
    }
  },
});
```

### **4. Descriptive Job Names**
```typescript
// ✅ Good: Descriptive names
crons.interval("cleanup-expired-sessions", { hours: 1 }, internal.auth.cleanup);
crons.interval("send-daily-digest-emails", { days: 1 }, internal.email.sendDigest);

// ❌ Bad: Generic names
crons.interval("job1", { hours: 1 }, internal.func1);
crons.interval("cleanup", { days: 1 }, internal.func2);
```

## 🚀 Development Workflow

### **Cron Job Development**
```bash
# Start development server
npm run dev:backend

# Cron jobs will run automatically in development
# Check Convex dashboard for job execution logs
```

### **Testing Cron Jobs**
```typescript
// Create a test version with shorter intervals for development
const crons = cronJobs();

if (process.env.NODE_ENV === "development") {
  // Test every 10 seconds in development
  crons.interval("test-cleanup", { seconds: 10 }, internal.messages.clearAll);
} else {
  // Production schedule
  crons.interval("cleanup-messages", { minutes: 60 }, internal.messages.clearAll);
}
```

## 📊 Monitoring Cron Jobs

### **Convex Dashboard**
- View job execution history
- Monitor success/failure rates
- Check execution logs and errors
- Manage job schedules

### **Logging in Functions**
```typescript
export const loggedCleanup = internalMutation({
  handler: async (ctx) => {
    const startTime = Date.now();
    const messages = await ctx.db.query("messages").collect();
    
    console.log(`Starting cleanup of ${messages.length} messages`);
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    const duration = Date.now() - startTime;
    console.log(`Cleanup completed in ${duration}ms`);
  },
});
```

## 🔗 Environment Setup

Same as standard Convex setup:
```bash
VITE_CONVEX_URL=your_convex_deployment_url
```

## 📚 Additional Resources

- [Convex Cron Jobs Documentation](https://docs.convex.dev/scheduling/cron-jobs)
- [Internal Functions](https://docs.convex.dev/functions/internal-functions)
- [Convex Dashboard](https://dashboard.convex.dev/)
- [Scheduling Patterns](https://docs.convex.dev/scheduling)

---

This cheatsheet covers Convex cron jobs and automated task scheduling. Use it as a reference for implementing scheduled operations in your future projects!
