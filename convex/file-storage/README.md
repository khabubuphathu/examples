# Convex File Storage - Feature Cheatsheet

A comprehensive reference for Convex file storage and upload functionality demonstrated in this chat application with image support.

## 📋 Project Overview

This project demonstrates Convex file storage capabilities in a chat application that supports both text messages and image uploads. It showcases file upload generation, storage operations, URL retrieval, and frontend file handling.

## 📁 Core File Storage Features

### 1. File Upload URL Generation

#### **Generate Upload URL Mutation**
```typescript
import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
```

**Key Points:**
- `ctx.storage.generateUploadUrl()` creates a temporary upload URL
- Returns a URL that clients can POST files to
- URLs are time-limited and single-use
- No arguments needed for basic upload URL generation

#### **Frontend Upload URL Usage**
```typescript
// In React component
const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

// Generate URL and upload file
const postUrl = await generateUploadUrl();
const result = await fetch(postUrl, {
  method: "POST",
  headers: { "Content-Type": selectedImage.type },
  body: selectedImage,
});
```

### 2. File Storage Operations

#### **Storage ID Validation**
```typescript
import { v } from "convex/values";

export const sendImage = mutation({
  args: { 
    storageId: v.id("_storage"),  // Validates storage ID format
    author: v.string() 
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      body: args.storageId,      // Store the storage ID
      author: args.author,
      format: "image",           // Mark as image type
    });
  },
});
```

**Key Points:**
- Use `v.id("_storage")` to validate storage IDs
- Storage IDs reference files in Convex's storage system
- Store storage IDs in database records
- Use format fields to distinguish file types

#### **Retrieving File URLs**
```typescript
export const list = query({
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    return Promise.all(
      messages.map(async (message) => ({
        ...message,
        // Add URL field for images
        ...(message.format === "image"
          ? { url: await ctx.storage.getUrl(message.body) }
          : {}),
      })),
    );
  },
});
```

**Key Points:**
- `ctx.storage.getUrl(storageId)` converts storage ID to accessible URL
- URLs are generated on-demand during queries
- Use conditional logic for different message formats
- Promise.all for efficient parallel URL generation

### 3. Frontend File Handling

#### **File Input and Selection**
```tsx
import { useRef, useState } from "react";

const imageInput = useRef<HTMLInputElement>(null);
const [selectedImage, setSelectedImage] = useState<File | null>(null);

// File input JSX
<input
  type="file"
  accept="image/*"           // Restrict to images
  ref={imageInput}
  onChange={(event) => setSelectedImage(event.target.files![0])}
  disabled={selectedImage !== null}
/>
```

#### **Complete Upload Flow**
```tsx
async function handleSendImage(event: FormEvent) {
  event.preventDefault();

  // Step 1: Generate upload URL
  const postUrl = await generateUploadUrl();
  
  // Step 2: Upload file to Convex storage
  const result = await fetch(postUrl, {
    method: "POST",
    headers: { "Content-Type": selectedImage!.type },
    body: selectedImage,
  });
  
  // Step 3: Extract storage ID from response
  const json = await result.json();
  if (!result.ok) {
    throw new Error(`Upload failed: ${JSON.stringify(json)}`);
  }
  const { storageId } = json;
  
  // Step 4: Save reference in database
  await sendImage({ storageId, author: name });

  // Step 5: Reset form
  setSelectedImage(null);
  imageInput.current!.value = "";
}
```

### 4. File Display and Rendering

#### **Conditional Rendering by Format**
```tsx
{messages.map((message) => (
  <li key={message._id}>
    <span>{message.author}:</span>
    {message.format === "image" ? (
      <Image message={message} />
    ) : (
      <span>{message.body}</span>
    )}
    <span>{new Date(message._creationTime).toLocaleTimeString()}</span>
  </li>
))}
```

#### **Image Component**
```tsx
function Image({ message }: { message: { url: string } }) {
  return <img src={message.url} height="300px" width="auto" />;
}
```

## 🔧 Advanced File Storage Patterns

### 1. File Type Validation

#### **Server-side MIME Type Validation**
```typescript
export const sendFile = mutation({
  args: { 
    storageId: v.id("_storage"),
    author: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(args.mimeType)) {
      throw new Error('Invalid file type');
    }
    
    await ctx.db.insert("messages", {
      body: args.storageId,
      author: args.author,
      format: args.mimeType.startsWith('image/') ? 'image' : 'file',
      mimeType: args.mimeType,
    });
  },
});
```

### 2. File Metadata Storage

#### **Enhanced Message Schema**
```typescript
export const sendFileWithMetadata = mutation({
  args: { 
    storageId: v.id("_storage"),
    author: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      body: args.storageId,
      author: args.author,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      format: "file",
    });
  },
});
```

### 3. Multiple File Types Support

#### **Generic File Handler**
```typescript
export const listWithFiles = query({
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").collect();
    return Promise.all(
      messages.map(async (message) => {
        if (message.format === "text") {
          return message;
        }
        
        // Add URL for any file type
        const url = await ctx.storage.getUrl(message.body);
        return {
          ...message,
          url,
          isImage: message.mimeType?.startsWith('image/'),
          isPdf: message.mimeType === 'application/pdf',
          isVideo: message.mimeType?.startsWith('video/'),
        };
      }),
    );
  },
});
```

### 4. File Upload with Progress

#### **Upload with Progress Tracking**
```tsx
const [uploadProgress, setUploadProgress] = useState(0);

async function handleSendImageWithProgress(event: FormEvent) {
  event.preventDefault();
  
  const postUrl = await generateUploadUrl();
  
  // Create XMLHttpRequest for progress tracking
  const xhr = new XMLHttpRequest();
  
  return new Promise((resolve, reject) => {
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        setUploadProgress(progress);
      }
    });
    
    xhr.addEventListener('load', async () => {
      if (xhr.status === 200) {
        const json = JSON.parse(xhr.responseText);
        await sendImage({ storageId: json.storageId, author: name });
        setUploadProgress(0);
        resolve(json);
      } else {
        reject(new Error('Upload failed'));
      }
    });
    
    xhr.open('POST', postUrl);
    xhr.setRequestHeader('Content-Type', selectedImage!.type);
    xhr.send(selectedImage);
  });
}
```

## 🎯 Common File Storage Use Cases

### **1. Profile Pictures**
```typescript
// Upload profile image
export const uploadProfilePicture = mutation({
  args: { storageId: v.id("_storage"), userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      profilePictureId: args.storageId,
    });
  },
});

// Get profile with image URL
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    
    const profilePictureUrl = user.profilePictureId 
      ? await ctx.storage.getUrl(user.profilePictureId)
      : null;
      
    return { ...user, profilePictureUrl };
  },
});
```

### **2. Document Attachments**
```typescript
export const addDocumentAttachment = mutation({
  args: {
    documentId: v.id("documents"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("attachments", {
      documentId: args.documentId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
    });
  },
});
```

### **3. Media Galleries**
```typescript
export const createGallery = mutation({
  args: {
    title: v.string(),
    images: v.array(v.object({
      storageId: v.id("_storage"),
      caption: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const galleryId = await ctx.db.insert("galleries", {
      title: args.title,
    });
    
    for (const image of args.images) {
      await ctx.db.insert("gallery_images", {
        galleryId,
        storageId: image.storageId,
        caption: image.caption,
      });
    }
    
    return galleryId;
  },
});
```

## 🔄 File Storage Flow

1. **Generate Upload URL** → Client requests temporary upload URL
2. **Client Upload** → File uploaded directly to Convex storage
3. **Extract Storage ID** → Server returns unique storage identifier
4. **Save Reference** → Storage ID saved in database record
5. **Retrieve URL** → Convert storage ID to accessible URL when needed
6. **Display File** → Use URL in frontend components

## 📁 Project Structure

```
convex/
├── _generated/          # Auto-generated types and API
├── messages.ts         # File storage functions
└── tsconfig.json       # TypeScript config

src/
├── app.tsx            # File upload/display UI
├── main.tsx           # App entry point
└── styles.css         # Styling
```

## 🔍 Best Practices

### **1. Security**
- Always validate file types on server-side
- Use `v.id("_storage")` for storage ID validation
- Implement file size limits
- Sanitize file names before storage

### **2. Performance**
- Generate URLs only when needed (in queries)
- Use Promise.all for parallel URL generation
- Consider pagination for large file lists
- Cache URLs on client-side when appropriate

### **3. Error Handling**
```typescript
async function handleFileUpload() {
  try {
    const postUrl = await generateUploadUrl();
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    
    if (!result.ok) {
      throw new Error(`Upload failed: ${result.status}`);
    }
    
    const { storageId } = await result.json();
    await saveFile({ storageId, /* other args */ });
  } catch (error) {
    console.error("File upload failed:", error);
    // Show user-friendly error message
  }
}
```

### **4. File Organization**
```typescript
// Organize files by type/category
export const sendCategorizedFile = mutation({
  args: { 
    storageId: v.id("_storage"),
    category: v.union(v.literal("image"), v.literal("document"), v.literal("video")),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("files", {
      storageId: args.storageId,
      category: args.category,
      tags: args.tags || [],
      uploadedAt: Date.now(),
    });
  },
});
```

## 🚀 Development Workflow

### **File Storage Development**
```bash
# Start development server
npm run dev

# File uploads work in development mode
# Check Convex dashboard for storage usage
```

### **Storage Limits**
- Development: Generous limits for testing
- Production: Check Convex pricing for storage quotas
- Monitor usage in Convex dashboard

## 📊 Storage Management

### **File Cleanup**
```typescript
// Internal mutation for cleaning up unused files
export const cleanupUnusedFiles = internalMutation({
  handler: async (ctx) => {
    // Get all storage IDs from database
    const messages = await ctx.db.query("messages").collect();
    const usedStorageIds = new Set(
      messages
        .filter(m => m.format === "image")
        .map(m => m.body)
    );
    
    // Note: Convex doesn't currently expose API to list all files
    // This is a conceptual example
    console.log(`Found ${usedStorageIds.size} files in use`);
  },
});
```

## 🔗 Environment Setup

Same as standard Convex setup:
```bash
VITE_CONVEX_URL=your_convex_deployment_url
```

## 📚 Additional Resources

- [Convex File Storage Documentation](https://docs.convex.dev/file-storage)
- [Upload API Reference](https://docs.convex.dev/api/modules/server#storage)
- [File Storage Best Practices](https://docs.convex.dev/file-storage/storage-best-practices)
- [Storage Pricing](https://www.convex.dev/pricing)

---

This cheatsheet covers Convex file storage and upload functionality. Use it as a reference for implementing file handling in your future projects!
