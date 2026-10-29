# Skill Swap Platform - REST API Reference

**Base URL**: `http://localhost:8080`

---

## Authentication Endpoints

### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}

Response: {
  "token": "eyJhbGc...",
  "userId": 1,
  "email": "john@example.com",
  "role": "USER"
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepass123"
}

Response: {
  "token": "eyJhbGc...",
  "userId": 1,
  "email": "john@example.com",
  "role": "USER"
}
```

### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response: {
  "id": 1,
  "fullName": "John Doe",
  "email": "john@example.com",
  "role": "USER",
  "bio": "...",
  "city": "...",
  "ratingAvg": 4.5,
  "totalReviews": 10
}
```

---

## User Profile Endpoints

### Get User Profile
```
GET /api/users/{userId}
Authorization: Bearer <token>
```

### Get My Profile
```
GET /api/users/me
Authorization: Bearer <token>
```

### Update Profile
```
PUT /api/users/me/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Jane Doe",
  "bio": "Learning Java and UI/UX",
  "city": "Mumbai",
  "country": "India",
  "languages": "English, Hindi",
  "profilePhotoUrl": "https://...",
  "availabilityText": "Weekends"
}
```

---

## Skills Endpoints

### List All Skills
```
GET /api/skills
Authorization: Bearer <token>

Response: [
  {
    "id": 1,
    "name": "Java",
    "category": "Programming",
    "description": "...",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00"
  }
]
```

### Get My Offered Skills
```
GET /api/users/me/offered-skills
Authorization: Bearer <token>
```

### Add Offered Skill
```
POST /api/users/me/offered-skills
Authorization: Bearer <token>
Content-Type: application/json

{
  "skillId": 1,
  "proficiencyLevel": "EXPERT",
  "yearsExperience": 5,
  "description": "Professional Java developer"
}
```

### Remove Offered Skill
```
DELETE /api/users/me/offered-skills/{skillId}
Authorization: Bearer <token>
```

### Get My Wanted Skills
```
GET /api/users/me/wanted-skills
Authorization: Bearer <token>
```

### Add Wanted Skill
```
POST /api/users/me/wanted-skills
Authorization: Bearer <token>
Content-Type: application/json

{
  "skillId": 2,
  "targetLevel": "INTERMEDIATE",
  "purpose": "For job interviews",
  "urgencyLevel": "HIGH"
}
```

### Remove Wanted Skill
```
DELETE /api/users/me/wanted-skills/{skillId}
Authorization: Bearer <token>
```

---

## Matching Endpoints

### Get Recommended Matches
```
GET /api/matches/recommended/me
Authorization: Bearer <token>

Response: [
  {
    "id": 1,
    "user1": { "id": 1, "fullName": "...", "city": "..." },
    "user2": { "id": 2, "fullName": "...", "city": "..." },
    "matchScore": 87,
    "status": "ACTIVE"
  }
]
```

### Get Match Details
```
GET /api/matches/{matchId}
Authorization: Bearer <token>
```

---

## Swap Request Endpoints

### Create Swap Request
```
POST /api/swap-requests/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "receiverId": 2,
  "senderOfferedSkillId": 1,
  "senderWantedSkillId": 2,
  "receiverOfferedSkillId": 3,
  "receiverWantedSkillId": 4,
  "message": "Hi! I'd love to exchange skills with you"
}
```

### Get Incoming Requests
```
GET /api/swap-requests/incoming/me
Authorization: Bearer <token>
```

### Get Outgoing Requests
```
GET /api/swap-requests/outgoing/me
Authorization: Bearer <token>
```

### Accept Request
```
PATCH /api/swap-requests/{requestId}/accept
Authorization: Bearer <token>
```

### Reject Request
```
PATCH /api/swap-requests/{requestId}/reject
Authorization: Bearer <token>
```

### Cancel Request
```
PATCH /api/swap-requests/{requestId}/cancel
Authorization: Bearer <token>
```

---

## Chat Endpoints

### Get Chat History
```
GET /api/chats/{matchId}/messages
Authorization: Bearer <token>

Response: [
  {
    "id": 1,
    "sender": { "id": 1, "fullName": "..." },
    "content": "Hello!",
    "messageType": "TEXT",
    "isRead": true,
    "createdAt": "2024-01-15T10:30:00"
  }
]
```

### Send Message (REST)
```
POST /api/chats/{matchId}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "matchId": 1,
  "senderId": 1,
  "content": "Let's schedule a session!"
}
```

### WebSocket Chat

**Connect**:
```
ws://localhost:8080/ws/chat
```

**Send Message**:
```
Destination: /app/chat.send
Payload: {
  "matchId": 1,
  "senderId": 1,
  "content": "Hello!"
}
```

**Subscribe to Messages**:
```
Destination: /topic/chat/1
```

---

## Session Endpoints

### Create Session
```
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "matchId": 1,
  "hostUserId": 1,
  "learnerUserId": 2,
  "topic": "Java Basics",
  "sessionMode": "ONLINE",
  "scheduledAt": "2024-02-20T15:00:00",
  "durationMinutes": 60,
  "meetingLink": "https://zoom.us/...",
  "location": null,
  "notes": "Come prepared with questions"
}
```

### Get My Sessions
```
GET /api/sessions/me/sessions
Authorization: Bearer <token>
```

### Get Session Details
```
GET /api/sessions/{sessionId}
Authorization: Bearer <token>
```

### Mark Session as Completed
```
PATCH /api/sessions/{sessionId}/complete
Authorization: Bearer <token>
```

### Cancel Session
```
PATCH /api/sessions/{sessionId}/cancel
Authorization: Bearer <token>
```

### Reschedule Session
```
PATCH /api/sessions/{sessionId}/reschedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "scheduledAt": "2024-02-25T16:00:00",
  "durationMinutes": 90,
  "meetingLink": "https://meet.google.com/...",
  "notes": "Updated details"
}
```

---

## Review Endpoints

### Post Review
```
POST /api/reviews/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": 1,
  "revieweeId": 2,
  "rating": 5,
  "comment": "Great teacher, very patient!"
}
```

### Get My Reviews
```
GET /api/reviews/me/reviews
Authorization: Bearer <token>
```

### Get User Reviews
```
GET /api/reviews/user/{userId}
Authorization: Bearer <token>
```

### Get Session Reviews
```
GET /api/reviews/session/{sessionId}
Authorization: Bearer <token>
```

---

## Notification Endpoints

### Get All Notifications
```
GET /api/notifications/me
Authorization: Bearer <token>
```

### Get Unread Notifications
```
GET /api/notifications/me/unread
Authorization: Bearer <token>
```

### Get Unread Count
```
GET /api/notifications/me/unread-count
Authorization: Bearer <token>

Response: 3
```

### Mark Notification as Read
```
PATCH /api/notifications/{notificationId}/read
Authorization: Bearer <token>
```

### Mark All Notifications as Read
```
PATCH /api/notifications/me/read-all
Authorization: Bearer <token>
```

---

## Error Response Format

```json
{
  "error": "Resource not found",
  "status": 404
}
```

For validation errors:
```json
{
  "error": "Validation failed",
  "status": 400,
  "fields": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  }
}
```

---

## HTTP Status Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource created
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Missing/invalid token
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## Authentication Header Format

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

Get token from `/api/auth/login` or `/api/auth/register`

---

## WebSocket Connection Example (JavaScript)

```javascript
const client = new StompJs.Client({
  brokerURL: 'ws://localhost:8080/ws/chat',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

client.onConnect = () => {
  // Subscribe to match messages
  client.subscribe('/topic/chat/1', (message) => {
    console.log(JSON.parse(message.body));
  });
};

// Send message
client.publish({
  destination: '/app/chat.send',
  body: JSON.stringify({
    matchId: 1,
    senderId: 1,
    content: 'Hello!'
  })
});

client.activate();
```

---

## Example Usage Flow

1. **Register/Login** -> Get JWT token
2. **Get Skills** -> List available skills
3. **Add Skills** -> Add offered & wanted skills
4. **Get Matches** -> Find recommended partners
5. **Create Swap Request** -> Send offer
6. **Accept Request** -> Connect with partner
7. **Chat** -> Discuss and plan
8. **Create Session** -> Schedule learning
9. **Complete & Review** -> Rate and give feedback

---

## Notes

- All timestamps are in ISO 8601 format
- Token expires in 24 hours (86400000 ms)
- WebSocket auto-subscribes to topic on connection
- Notifications are created automatically for key events
- Skills are pre-seeded on app startup
