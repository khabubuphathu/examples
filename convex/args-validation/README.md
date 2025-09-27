# Convex Argument Validation Example

A practical example demonstrating **runtime argument validation** in Convex functions using the built-in validation system.

## 🎯 What This Project Does

This is a simple **chat application** that showcases how to properly validate function arguments in Convex. Instead of trusting that frontend code will always send the right data types, this example shows how to enforce type safety at the database function level.

### Key Features
- ✅ **Runtime argument validation** using Convex's `v` validators
- 🔒 **Type safety** between frontend and backend
- 💬 **Real-time chat interface** with React
- 🎲 **Random username generation** for demo purposes

## 🏗️ Architecture Overview

```
Frontend (React) → Convex Functions → Database
     ↓                    ↓
  User input         Validation      Messages
                    (v.string())      stored
```

### Core Files
- **`convex/messages.ts`** - Contains the validation logic and database functions
- **`src/app.tsx`** - React frontend with chat interface
- **`package.json`** - Project dependencies and scripts

## 🔍 Validation Implementation

The magic happens in `convex/messages.ts`:

```typescript
export const send = mutation({
  args: {
    body: v.string(),    // Message content must be string
    author: v.string(),  // Author name must be string
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // args are guaranteed to be validated at this point
    const { body, author } = args;
    await ctx.db.insert("messages", { body, author });
  },
});
```

**What this prevents:**
- ❌ Sending numbers instead of strings
- ❌ Sending undefined/null values
- ❌ Sending objects when strings are expected
- ❌ Missing required fields

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Convex:**
   ```bash
   npx convex dev
   ```
   Follow the setup prompts to create your Convex project.

3. **Start development:**
   ```bash
   npm run dev
   ```
   This runs both the Convex backend and React frontend simultaneously.

### Available Scripts

- `npm run dev` - Run both backend and frontend in parallel
- `npm run dev:backend` - Run only Convex backend
- `npm run dev:frontend` - Run only React frontend
- `npm run build` - Build for production

## 🧪 Testing the Validation

Try these scenarios to see validation in action:

1. **Normal usage** - Type a message and send (should work)
2. **Browser console** - Try calling the function with wrong types:
   ```javascript
   // This will fail validation
   api.messages.send({ body: 123, author: "test" })
   ```

## 🛠️ Technology Stack

- **Framework:** React 19
- **Backend:** Convex (real-time database)
- **Build Tool:** Vite
- **Language:** TypeScript
- **Validation:** Convex built-in validators (`convex/values`)

## 📚 Key Learnings

When you return to this project, remember:

1. **Always validate inputs** - Don't trust frontend data
2. **Use `v` validators** - Convex provides built-in validation
3. **Type safety matters** - Validation catches runtime errors
4. **Real-time by default** - Convex automatically syncs data

## 🔗 Related Concepts

- Convex mutations vs queries
- Real-time data synchronization
- TypeScript integration with Convex
- Frontend-backend type safety

---

*Last updated: September 2025*