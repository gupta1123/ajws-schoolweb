# Teacher Messages Page - Complete Documentation

## Overview

The Teacher Messages Page is a comprehensive chat system that allows teachers to communicate with parents, students, and other staff members. It features real-time messaging, automatic refresh, WebSocket connectivity, and fallback mechanisms for reliable communication.

## Architecture

The messages system consists of two main screens:
- **ChatScreen.js**: Main messages list and conversation management
- **ChatDetailScreen.js**: Individual chat conversation interface

## Core Features

### 1. Real-time Messaging
- WebSocket-based real-time communication
- HTTP API fallback for reliability
- Optimistic UI updates for instant feedback
- Message status tracking (sending, sent, delivered, read, failed)

### 2. Auto-refresh and Polling
- Automatic message polling when WebSocket fails
- Pull-to-refresh functionality
- Background message synchronization
- Connection status monitoring

### 3. Thread Management
- Automatic thread creation
- Existing thread detection
- Thread subscription management
- Conversation history

## API Endpoints

### Chat Thread Management

#### 1. Fetch Chat Threads
```http
GET https://ajws-school-ba8ae5e3f955.herokuapp.com/api/chat/threads
Authorization: Bearer {token}
Content-Type: application/json
```

**Purpose**: Retrieves all chat conversations/threads for the teacher

**Response Structure**:
```json
{
  "status": "success",
  "data": {
    "threads": [
      {
        "id": "thread-uuid",
        "title": "Chat with Parent Name",
        "thread_type": "direct",
        "participants": [
          {
            "user_id": "user-uuid",
            "user": {
              "id": "user-uuid",
              "full_name": "Parent Name"
            }
          }
        ],
        "last_message": [
          {
            "id": "message-uuid",
            "content": "Last message content",
            "created_at": "2025-01-XX",
            "sender_id": "sender-uuid"
          }
        ],
        "created_at": "2025-01-XX",
        "updated_at": "2025-01-XX"
      }
    ]
  }
}
```

#### 2. Check Existing Thread
```http
POST https://ajws-school-ba8ae5e3f955.herokuapp.com/api/chat/check-existing-thread
Authorization: Bearer {token}
Content-Type: application/json
```

**Payload**:
```json
{
  "participants": ["participant-uuid"],
  "thread_type": "direct"
}
```

**Purpose**: Checks if a conversation already exists with a specific participant

**Response**:
```json
{
  "status": "success",
  "data": {
    "exists": true,
    "thread": {
      "id": "thread-uuid",
      "title": "Existing Chat",
      "participants": [...]
    }
  }
}
```

#### 3. Create New Thread
```http
POST https://ajws-school-ba8ae5e3f955.herokuapp.com/api/chat/start-conversation
Authorization: Bearer {token}
Content-Type: application/json
```

**Payload**:
```json
{
  "participants": ["participant-uuid"],
  "thread_type": "direct",
  "title": "Chat with Parent Name",
  "message_content": "Hello! This is the start of our conversation."
}
```

**Purpose**: Creates a new chat conversation

### Message Management

#### 4. Fetch Messages
```http
GET https://ajws-school-ba8ae5e3f955.herokuapp.com/api/chat/messages?thread_id={threadId}&after_id={lastMessageId}&limit=10
Authorization: Bearer {token}
Content-Type: application/json
```

**Parameters**:
- `thread_id`: Chat thread ID (required)
- `after_id`: For pagination - fetch messages after this ID (optional)
- `limit`: Number of messages to fetch (optional, default: 10)

**Purpose**: Retrieves messages for a specific chat thread

**Response**:
```json
{
  "status": "success",
  "data": {
    "messages": [
      {
        "id": "message-uuid",
        "content": "Message content",
        "sender_id": "sender-uuid",
        "sender": {
          "id": "sender-uuid",
          "full_name": "Sender Name"
        },
        "created_at": "2025-01-XX",
        "status": "sent",
        "message_type": "text",
        "attachments": []
      }
    ]
  }
}
```

#### 5. Send Message (HTTP Fallback)
```http
POST https://ajws-school-ba8ae5e3f955.herokuapp.com/api/chat/send-message
Authorization: Bearer {token}
Content-Type: application/json
```

**Payload**:
```json
{
  "thread_id": "thread-uuid",
  "content": "Message text",
  "message_type": "text"
}
```

**Purpose**: Sends a message when WebSocket is unavailable

### Teacher Data Endpoints

#### 6. Get Teacher's Assigned Classes
```http
GET https://ajws-school-ba8ae5e3f955.herokuapp.com/api/academic/my-teacher-id
Authorization: Bearer {token}
Content-Type: application/json
```

**Purpose**: Fetches classes assigned to the teacher for chat selection

**Response**:
```json
{
  "status": "success",
  "data": {
    "assigned_classes": [
      {
        "class_division_id": "division-uuid",
        "class_name": "Class 5A",
        "class_level": "5",
        "division": "A",
        "subject": "Mathematics",
        "assignment_type": "subject",
        "is_primary": false
      }
    ]
  }
}
```

#### 7. Get Linked Parents and Principal
```http
GET https://ajws-school-ba8ae5e3f955.herokuapp.com/api/users/teacher-linked-parents
Authorization: Bearer {token}
Content-Type: application/json
```

**Purpose**: Fetches parents linked to the teacher and principal for chat

**Response**:
```json
{
  "status": "success",
  "data": {
    "linked_parents": [
      {
        "parent_id": "parent-uuid",
        "full_name": "Parent Name",
        "linked_students": [
          {
            "student_name": "Student Name",
            "class_name": "Class 5A"
          }
        ]
      }
    ],
    "principal": {
      "id": "principal-uuid",
      "full_name": "Principal Name"
    }
  }
}
```

#### 8. Get Parents by Division
```http
GET https://ajws-school-ba8ae5e3f955.herokuapp.com/api/users/division/{divisionId}/parents
Authorization: Bearer {token}
Content-Type: application/json
```

**Purpose**: Fetches parents of students in specific class divisions

**Response**:
```json
{
  "status": "success",
  "data": {
    "parents": [
      {
        "id": "parent-uuid",
        "name": "Parent Name",
        "students": [
          {
            "student": {
              "id": "student-uuid",
              "name": "Student Name",
              "roll_number": "001"
            }
          }
        ]
      }
    ]
  }
}
```

## WebSocket Implementation

### Connection Management

The system attempts multiple WebSocket endpoints for maximum compatibility:

```javascript
const wsUrls = [
  `wss://ajws-school-ba8ae5e3f955.herokuapp.com?token=${encodeURIComponent(token)}`,
  `wss://ajws-school-ba8ae5e3f955.herokuapp.com/ws?token=${encodeURIComponent(token)}`,
  `wss://ajws-school-ba8ae5e3f955.herokuapp.com/websocket?token=${encodeURIComponent(token)}`
];
```

### WebSocket Message Types

#### 1. Subscribe to Thread
```json
{
  "type": "subscribe_thread",
  "thread_id": "thread-uuid"
}
```

**Purpose**: Subscribe to real-time updates for a specific chat thread

#### 2. Send Message
```json
{
  "type": "send_message",
  "thread_id": "thread-uuid",
  "content": "Message content",
  "message_type": "text"
}
```

**Purpose**: Send a message through WebSocket for real-time delivery

#### 3. Incoming Messages
```json
{
  "type": "new_message",
  "thread_id": "thread-uuid",
  "message": {
    "id": "message-uuid",
    "content": "Message content",
    "sender_id": "sender-uuid",
    "sender": {
      "full_name": "Sender Name"
    },
    "created_at": "2025-01-XX"
  }
}
```

**Purpose**: Receive new messages in real-time

### Connection States

- **Connecting**: Initial connection attempt
- **Connected**: WebSocket is active and ready
- **Disconnected**: Connection lost, fallback to HTTP
- **Reconnecting**: Attempting to restore connection
- **Failed**: Connection failed, using HTTP only

## Auto-refresh and Polling System

### 1. Message Polling

When WebSocket is unavailable, the system falls back to HTTP polling:

```javascript
const fetchNewMessages = async () => {
  if (!activeThreadId) return;
  
  try {
    const token = await StorageManager.getToken();
    let url = `https://ajws-school-ba8ae5e3f955.herokuapp.com/api/chat/messages?thread_id=${activeThreadId}`;
    
    if (lastMessageId) {
      url += `&after_id=${lastMessageId}`;
    } else {
      url += `&limit=10`;
    }
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Process and update messages
    if (response.data.status === 'success') {
      const newMessages = response.data.data.messages || [];
      // Update UI with new messages
    }
  } catch (error) {
    console.error('Error polling for messages:', error);
  }
};
```

### 2. Pull-to-Refresh

Users can manually refresh the chat list:

```javascript
const onRefresh = () => {
  fetchThreads(true);
};

// In JSX
<RefreshControl
  refreshing={refreshing}
  onRefresh={onRefresh}
  colors={['#25D366']}
  tintColor="#25D366"
/>
```

### 3. Background Synchronization

The system automatically syncs messages in the background:

- **Interval**: Every 3-5 seconds when WebSocket is disconnected
- **Trigger**: Screen focus, new message send, manual refresh
- **Optimization**: Only fetches messages newer than the last known message

## User Interface Flow

### 1. Chat List Screen (ChatScreen.js)

#### Initial Load
1. Load current user ID from storage
2. Fetch chat threads from API
3. Display conversations with last message preview
4. Show loading skeletons during fetch

#### New Chat Creation
1. User taps "New Chat" button
2. Fetch teacher's assigned classes
3. Display class selection interface
4. Fetch available parents for selected classes
5. Allow parent selection
6. Create or find existing thread
7. Navigate to chat detail screen

#### Thread Display
- **Direct Chats**: Show other participant's name
- **Group Chats**: Show thread title
- **Last Message**: Preview of most recent message
- **Timestamp**: Relative time (e.g., "2h ago", "Yesterday")
- **Unread Count**: Badge for unread messages

### 2. Chat Detail Screen (ChatDetailScreen.js)

#### Message Display
- **Sent Messages**: Right-aligned, blue background
- **Received Messages**: Left-aligned, gray background
- **Message Status**: Icons for sending, sent, delivered, read, failed
- **Timestamps**: Relative time for each message
- **Auto-scroll**: Automatically scroll to bottom for new messages

#### Message Sending
1. User types message
2. Optimistic update (immediate UI feedback)
3. Attempt WebSocket send
4. Fallback to HTTP if WebSocket fails
5. Update message status based on result

#### Real-time Updates
- **WebSocket**: Instant message delivery
- **Polling**: Fallback for connection issues
- **Optimistic Updates**: Immediate UI response
- **Message Deduplication**: Prevent duplicate messages

## Error Handling

### 1. Connection Errors

```javascript
// WebSocket connection failure
if (event.code === 1006) {
  console.log('WebSocket closed with 1006. Disabling WebSocket for this session.');
  setDisableWebSocket(true);
  // Switch to HTTP polling
}

// HTTP API errors
if (error.response?.status === 401) {
  Alert.alert('Authentication failed', 'Please log in again.');
} else if (error.response?.status === 403) {
  Alert.alert('Permission denied', 'You cannot access this conversation.');
} else if (error.response?.status === 404) {
  Alert.alert('Not found', 'Conversation not found.');
}
```

### 2. Message Send Failures

- **Network Issues**: Retry mechanism with exponential backoff
- **Authentication**: Prompt user to re-login
- **Permission**: Clear error messages
- **Server Errors**: Graceful degradation

### 3. Data Synchronization

- **Duplicate Prevention**: Check message IDs before adding
- **Optimistic Replacement**: Replace temporary messages with server versions
- **Conflict Resolution**: Server data takes precedence

## Performance Optimizations

### 1. Message Pagination

- Load only recent messages initially
- Fetch older messages on scroll
- Limit API calls with `after_id` parameter

### 2. Caching

- Cache user data in local storage
- Store authentication tokens securely
- Minimize redundant API calls

### 3. UI Optimizations

- **Skeleton Loading**: Show loading placeholders
- **Optimistic Updates**: Immediate UI feedback
- **Debounced Input**: Prevent excessive API calls
- **Virtual Scrolling**: Handle large message lists

## Security Considerations

### 1. Authentication

- All API calls require Bearer token
- Token stored securely in device storage
- Automatic token refresh on expiration

### 2. Message Privacy

- Messages encrypted in transit (HTTPS/WSS)
- User can only access authorized conversations
- Thread permissions validated server-side

### 3. Data Validation

- Input sanitization for message content
- Server-side validation for all operations
- Rate limiting to prevent abuse

## Testing and Debugging

### 1. Debug Logging

```javascript
console.log('🔍 CHAT DEBUG: Complete threads API response:', JSON.stringify(response.data, null, 2));
console.log('📊 ChatDetailScreen: Polling for messages. LastMessageId:', lastMessageId);
console.log('🚀 ChatDetailScreen: Starting to send message');
```

### 2. Connection Monitoring

- WebSocket connection status tracking
- API call success/failure logging
- Performance metrics collection

### 3. Error Reporting

- Comprehensive error logging
- User-friendly error messages
- Fallback mechanisms for all operations

## Future Enhancements

### 1. Advanced Features

- **File Attachments**: Image and document sharing
- **Message Reactions**: Emoji responses
- **Message Search**: Find specific messages
- **Message Forwarding**: Share messages between chats

### 2. Performance Improvements

- **Offline Support**: Queue messages when offline
- **Push Notifications**: Real-time alerts
- **Message Encryption**: End-to-end encryption
- **Voice Messages**: Audio message support

### 3. User Experience

- **Typing Indicators**: Show when others are typing
- **Message Status**: Read receipts and delivery confirmations
- **Chat Themes**: Customizable appearance
- **Message Scheduling**: Send messages at specific times

## Conclusion

The Teacher Messages Page provides a robust, real-time communication system with comprehensive error handling, automatic refresh capabilities, and fallback mechanisms. The hybrid WebSocket/HTTP approach ensures reliable message delivery while providing instant user feedback through optimistic updates.

The system is designed to handle various network conditions gracefully, providing teachers with a seamless communication experience with parents and other staff members.
