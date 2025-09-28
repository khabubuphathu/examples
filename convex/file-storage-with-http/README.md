# Convex File Storage with HTTP - Feature Cheatsheet

A comprehensive reference for Convex HTTP actions and file storage via HTTP endpoints demonstrated in this chat application with direct HTTP file handling.

## 📋 Project Overview

This project demonstrates Convex HTTP actions combined with file storage, allowing direct HTTP endpoints for file upload and retrieval. It showcases HTTP routing, CORS handling, direct storage operations, and seamless integration with regular Convex functions.

## 🌐 Core HTTP Action Features

### 1. HTTP Router Setup

#### **Basic HTTP Router Configuration**
```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Export as default
export default http;
```

**Key Points:**
- Import `httpRouter` from `"convex/server"`
- Use `httpAction` for HTTP endpoint handlers
- Always export the router as default
- HTTP actions run in isolated context

### 2. HTTP Route Definition

#### **File Upload Endpoint**
```typescript
http.route({
  path: "/sendImage",              // URL path
  method: "POST",                  // HTTP method
  handler: httpAction(async (ctx, request) => {
    console.log("Received /sendImage request");
    
    // Get file from request body
    const blob = await request.blob();
    
    // Store directly in Convex storage
    const storageId = await ctx.storage.store(blob);
    
    // Extract parameters from URL
    const author = new URL(request.url).searchParams.get("author");
    
    // Call regular Convex mutation
    await ctx.runMutation(api.messages.sendImage, { storageId, author });
    
    return new Response(null, {
      status: 200,
      headers: new Headers({
        "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN!,
        Vary: "origin",
      }),
    });
  }),
});
```

**Key Points:**
- `request.blob()` extracts file from request body
- `ctx.storage.store(blob)` directly stores file
- `ctx.runMutation()` calls regular Convex functions
- `new URL(request.url).searchParams` extracts query parameters
- Return proper HTTP responses with CORS headers

#### **File Retrieval Endpoint**
```typescript
http.route({
  path: "/getImage",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const { searchParams } = new URL(request.url);
    const storageId = searchParams.get("storageId")! as Id<"_storage">;
    
    // Retrieve file from storage
    const blob = await ctx.storage.get(storageId);
    if (blob === null) {
      return new Response("Image not found", {
        status: 404,
      });
    }
    
    return new Response(blob, {
      status: 200,
      headers: new Headers({
        "Content-Type": blob.type,
        "Cross-Origin-Resource-Policy": "cross-origin",
      }),
    });
  }),
});
```

**Key Points:**
- `ctx.storage.get(storageId)` retrieves file by ID
- Return blob directly as Response body
- Set appropriate `Content-Type` header
- Handle missing files with 404 responses

### 3. CORS Configuration

#### **OPTIONS Preflight Handler**
```typescript
http.route({
  path: "/sendImage",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    
    // Check if it's a CORS preflight request
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN!,
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Digest",
          "Access-Control-Max-Age": "86400"
        }),
      });
    } else {
      return new Response();
    }
  }),
});
```

**Key Points:**
- Handle CORS preflight requests with OPTIONS method
- Check for required CORS headers
- Set appropriate CORS response headers
- Use environment variables for allowed origins

## 🔧 HTTP Storage Operations

### 1. Direct File Storage

#### **Store Files via HTTP**
```typescript
// In HTTP action
const blob = await request.blob();
const storageId = await ctx.storage.store(blob);
```

#### **Retrieve Files via HTTP**
```typescript
// In HTTP action
const blob = await ctx.storage.get(storageId);
if (blob === null) {
  return new Response("File not found", { status: 404 });
}
return new Response(blob, {
  headers: { "Content-Type": blob.type }
});
```

### 2. Integration with Regular Functions

#### **Calling Mutations from HTTP Actions**
```typescript
import { api } from "./_generated/api";

// In HTTP action
await ctx.runMutation(api.messages.sendImage, { 
  storageId, 
  author 
});
```

#### **Calling Queries from HTTP Actions**
```typescript
// In HTTP action
const messages = await ctx.runQuery(api.messages.list);
return Response.json(messages);
```

### 3. Regular Convex Functions

#### **Standard Mutations**
```typescript
export const sendImage = mutation({
  handler: async (ctx, { storageId, author }) => {
    const message = { 
      body: storageId, 
      author, 
      format: "image" 
    };
    await ctx.db.insert("messages", message);
  },
});
```

## 🖥️ Frontend Integration

### 1. HTTP Endpoint Usage

#### **File Upload via HTTP**
```tsx
const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL;

async function handleSendImage(event: FormEvent) {
  event.preventDefault();

  // Construct URL with parameters
  const sendImageUrl = new URL(`${convexSiteUrl}/sendImage`);
  sendImageUrl.searchParams.set("author", name);

  // Direct fetch to HTTP endpoint
  await fetch(sendImageUrl, {
    method: "POST",
    headers: { "Content-Type": selectedImage!.type },
    body: selectedImage,
  });

  // Reset form
  setSelectedImage(null);
  imageInput.current!.value = "";
}
```

#### **File Display via HTTP**
```tsx
function Image({ storageId }: { storageId: string }) {
  const getImageUrl = new URL(`${convexSiteUrl}/getImage`);
  getImageUrl.searchParams.set("storageId", storageId);

  return <img src={getImageUrl.href} height="300px" width="auto" />;
}
```

### 2. Environment Configuration

#### **Required Environment Variables**
```bash
# .env.local
VITE_CONVEX_URL=your_convex_deployment_url
VITE_CONVEX_SITE_URL=your_convex_site_url
CLIENT_ORIGIN=http://localhost:5173  # For CORS
```

## 🎯 Advanced HTTP Patterns

### 1. File Upload with Metadata

#### **Enhanced Upload Endpoint**
```typescript
http.route({
  path: "/uploadFile",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const blob = await request.blob();
    const storageId = await ctx.storage.store(blob);
    
    const url = new URL(request.url);
    const metadata = {
      author: url.searchParams.get("author"),
      fileName: url.searchParams.get("fileName"),
      category: url.searchParams.get("category"),
    };
    
    await ctx.runMutation(api.files.create, {
      storageId,
      ...metadata,
      fileSize: blob.size,
      mimeType: blob.type,
    });
    
    return Response.json({ storageId, success: true });
  }),
});
```

### 2. Batch File Operations

#### **Multiple File Upload**
```typescript
http.route({
  path: "/uploadBatch",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const formData = await request.formData();
    const files: { storageId: string; fileName: string }[] = [];
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const storageId = await ctx.storage.store(value);
        files.push({ storageId, fileName: value.name });
      }
    }
    
    await ctx.runMutation(api.files.createBatch, { files });
    
    return Response.json({ files, count: files.length });
  }),
});
```

### 3. File Processing

#### **Image Processing Endpoint**
```typescript
http.route({
  path: "/processImage",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const blob = await request.blob();
    
    // Process image (resize, compress, etc.)
    const processedBlob = await processImage(blob);
    
    const storageId = await ctx.storage.store(processedBlob);
    
    await ctx.runMutation(api.images.save, {
      storageId,
      originalSize: blob.size,
      processedSize: processedBlob.size,
    });
    
    return Response.json({ storageId });
  }),
});

// Helper function (would need actual image processing library)
async function processImage(blob: Blob): Promise<Blob> {
  // Image processing logic here
  return blob; // Placeholder
}
```

### 4. Streaming Responses

#### **Large File Streaming**
```typescript
http.route({
  path: "/download/:storageId",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const storageId = url.pathname.split('/').pop() as Id<"_storage">;
    
    const blob = await ctx.storage.get(storageId);
    if (!blob) {
      return new Response("File not found", { status: 404 });
    }
    
    return new Response(blob.stream(), {
      headers: {
        "Content-Type": blob.type,
        "Content-Length": blob.size.toString(),
        "Content-Disposition": "attachment",
      },
    });
  }),
});
```

## 🔄 HTTP vs Standard Storage Comparison

### **HTTP Actions Approach**
```typescript
// Direct HTTP upload
const blob = await request.blob();
const storageId = await ctx.storage.store(blob);

// Direct HTTP retrieval  
const blob = await ctx.storage.get(storageId);
return new Response(blob);
```

### **Standard Convex Approach**
```typescript
// Generate upload URL
const uploadUrl = await ctx.storage.generateUploadUrl();

// Client uploads to URL, gets storage ID
// Then call mutation to save reference
```

## 🔍 Best Practices

### **1. Security**
```typescript
// Validate file types
http.route({
  path: "/uploadImage",
  method: "POST", 
  handler: httpAction(async (ctx, request) => {
    const blob = await request.blob();
    
    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(blob.type)) {
      return new Response("Invalid file type", { status: 400 });
    }
    
    // Validate file size
    if (blob.size > 10 * 1024 * 1024) { // 10MB
      return new Response("File too large", { status: 413 });
    }
    
    const storageId = await ctx.storage.store(blob);
    // ... rest of handler
  }),
});
```

### **2. Error Handling**
```typescript
http.route({
  path: "/upload",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const blob = await request.blob();
      const storageId = await ctx.storage.store(blob);
      
      await ctx.runMutation(api.files.create, { storageId });
      
      return Response.json({ success: true, storageId });
    } catch (error) {
      console.error("Upload failed:", error);
      return new Response("Upload failed", { status: 500 });
    }
  }),
});
```

### **3. CORS Management**
```typescript
// Centralized CORS headers
function corsHeaders() {
  return new Headers({
    "Access-Control-Allow-Origin": process.env.CLIENT_ORIGIN!,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  });
}

// Use in responses
return new Response(data, {
  status: 200,
  headers: corsHeaders(),
});
```

## 📁 Project Structure

```
convex/
├── _generated/          # Auto-generated types and API
├── http.ts             # HTTP router and actions
├── messages.ts         # Regular Convex functions
└── tsconfig.json       # TypeScript config

src/
├── app.tsx            # HTTP endpoint usage
├── main.tsx           # App entry point
└── styles.css         # Styling
```

## 🚀 Development Workflow

### **HTTP Actions Development**
```bash
# Start development server
npm run dev:backend

# HTTP endpoints available at:
# https://your-deployment.convex.site/your-endpoint
```

### **Testing HTTP Endpoints**
```bash
# Test file upload
curl -X POST \
  -H "Content-Type: image/jpeg" \
  --data-binary @image.jpg \
  "https://your-deployment.convex.site/sendImage?author=test"

# Test file retrieval
curl "https://your-deployment.convex.site/getImage?storageId=your-storage-id"
```

## 🔗 Environment Setup

```bash
# .env.local
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
CLIENT_ORIGIN=http://localhost:5173
```

## 📊 Use Cases

### **When to Use HTTP Actions**
- ✅ Direct file uploads/downloads
- ✅ Webhook endpoints
- ✅ Integration with external services  
- ✅ Custom API endpoints
- ✅ File streaming
- ✅ Non-Convex client integration

### **When to Use Standard Convex**
- ✅ Real-time updates
- ✅ React integration
- ✅ Type-safe operations
- ✅ Optimistic updates
- ✅ Automatic retries

## 📚 Additional Resources

- [Convex HTTP Actions Documentation](https://docs.convex.dev/functions/http-actions)
- [HTTP Router API Reference](https://docs.convex.dev/api/modules/server#httpRouter)
- [File Storage with HTTP](https://docs.convex.dev/file-storage/serve-files)
- [CORS Configuration](https://docs.convex.dev/functions/http-actions#cors)

---

This cheatsheet covers Convex HTTP actions and file storage via HTTP endpoints. Use it as a reference for implementing custom HTTP APIs with file handling in your future projects!
