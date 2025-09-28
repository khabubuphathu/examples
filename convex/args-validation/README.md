# Convex Args Validation - Feature Cheatsheet

A comprehensive reference for Convex features demonstrated in this args-validation example project.

## 📋 Project Overview

This project demonstrates Convex argument validation in a simple chat application. It showcases core Convex features including queries, mutations, argument validation, and React integration.

## 🔧 Core Convex Features Used

### 1. Backend Functions (convex/messages.ts)

#### **Mutations** - Data Writing Operations
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const send = mutation({
  args: {
    body: v.string(),      // Required string argument
    author: v.string()     // Required string argument
  },
  returns: v.null(),       // Specify return type
  handler: async (ctx, args) => {
    const { body, author } = args;
    await ctx.db.insert("messages", { body, author });
  },
});
```

**Key Points:**
- Use `mutation` for operations that modify data
- `args` object defines and validates input parameters
- `returns` specifies the return type
- `ctx.db.insert()` adds records to database
- Automatic argument validation with `v` validators

#### **Queries** - Data Reading Operations
```typescript
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("messages").collect();
  },
});
```

**Key Points:**
- Use `query` for read-only operations
- No arguments needed for simple queries
- `ctx.db.query()` retrieves data from tables
- `.collect()` returns all matching records

### 2. Argument Validation System

#### **Available Validators from `convex/values`:**
```typescript
import { v } from "convex/values";

// Basic types
v.string()           // String validation
v.number()           // Number validation
v.boolean()          // Boolean validation
v.null()             // Null validation

// Complex types
v.object({           // Object with specific shape
  field1: v.string(),
  field2: v.number()
})
v.array(v.string())  // Array of strings
v.optional(v.string()) // Optional string field
v.union(v.string(), v.number()) // Either string or number
```

### 3. Frontend Integration (React)

#### **Setting up Convex Provider**
```typescript
// src/main.tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";

const address = import.meta.env.VITE_CONVEX_URL;
const convex = new ConvexReactClient(address);

// Wrap your app
<ConvexProvider client={convex}>
  <App />
</ConvexProvider>
```

#### **Using Queries in Components**
```typescript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

// In component
const messages = useQuery(api.messages.list) || [];
```

**Key Points:**
- `useQuery` returns data or `undefined` while loading
- Provide fallback with `|| []` for arrays
- Automatically re-renders when data changes
- Type-safe with generated API types

#### **Using Mutations in Components**
```typescript
import { useMutation } from "convex/react";

// In component
const sendMessage = useMutation(api.messages.send);

// Call mutation
await sendMessage({ body: newMessageText, author: name });
```

**Key Points:**
- `useMutation` returns a function to call the mutation
- Pass arguments as object matching server-side `args`
- Returns a Promise - use `await` or `.then()`
- Automatic argument validation on client and server

### 4. Database Operations

#### **Inserting Data**
```typescript
await ctx.db.insert("tableName", {
  field1: "value1",
  field2: "value2"
});
```

#### **Querying Data**
```typescript
// Get all records
await ctx.db.query("tableName").collect();

// Query with filters (more advanced)
await ctx.db.query("tableName")
  .filter(q => q.eq(q.field("author"), "John"))
  .collect();
```

### 5. Generated Types and API

#### **Auto-generated API**
```typescript
// Generated in convex/_generated/api.ts
import { api } from "../convex/_generated/api";

// Usage
api.messages.send    // Points to your send mutation
api.messages.list    // Points to your list query
```

#### **Document Types**
```typescript
// Auto-generated based on your data
// Access via ctx.db operations
// Includes _id and _creationTime automatically
```

## 🚀 Development Workflow

### **Scripts in package.json**
```json
{
  "scripts": {
    "dev": "npm-run-all --parallel dev:backend dev:frontend",
    "dev:backend": "convex dev",
    "dev:frontend": "vite --open --clearScreen false",
    "predev": "convex dev --until-success"
  }
}
```

### **Key Commands**
```bash
# Start development (both frontend and backend)
npm run dev

# Start only Convex backend
npm run dev:backend

# Start only frontend
npm run dev:frontend
```

## 📁 Project Structure

```
convex/
├── _generated/          # Auto-generated types and API
│   ├── api.d.ts        # API definitions
│   ├── api.js          # API implementation
│   ├── dataModel.d.ts  # Database types
│   └── server.js       # Server runtime
├── messages.ts         # Your backend functions
└── tsconfig.json       # TypeScript config for backend

src/
├── app.tsx            # Main React component
├── main.tsx           # App entry point with ConvexProvider
└── styles.css         # Styling
```

## 🔍 Best Practices Demonstrated

### **1. Argument Validation**
- Always validate mutation arguments with `v` validators
- Use descriptive argument names
- Specify return types for better type safety

### **2. Error Handling**
- Convex automatically handles validation errors
- Client-side validation happens before server calls
- Type safety prevents many runtime errors

### **3. Real-time Updates**
- Queries automatically update when data changes
- No need to manually refresh or poll for updates
- Reactive UI updates out of the box

### **4. Type Safety**
- Generated API provides full TypeScript support
- Arguments and return types are type-checked
- IntelliSense support in your IDE

## 🔄 Data Flow

1. **User Action** → Component calls `useMutation`
2. **Client Validation** → Arguments validated against schema
3. **Server Validation** → Arguments re-validated on server
4. **Database Operation** → Data inserted/updated
5. **Automatic Update** → All `useQuery` hooks re-run
6. **UI Update** → Components re-render with new data

## 🔗 Environment Setup

Create `.env.local`:
```bash
VITE_CONVEX_URL=your_convex_deployment_url
```

## 📚 Additional Resources

- [Convex Docs](https://docs.convex.dev/)
- [Argument Validation](https://docs.convex.dev/functions/args-validation)
- [React Integration](https://docs.convex.dev/client/react)
- [Database Operations](https://docs.convex.dev/database)

---

This cheatsheet covers the essential Convex patterns used in this args-validation example. Use it as a reference for implementing similar functionality in your future projects!