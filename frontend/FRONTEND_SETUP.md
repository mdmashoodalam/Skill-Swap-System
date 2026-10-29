# Skill Swap Platform - Frontend Setup Guide

## 📋 Overview

Modern React frontend for the Skill Swap Platform built with:
- **React 19.2.5** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS 3.3** - Utility-first styling
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **React Router 7.6** - Client-side routing

## 🎨 Design System

### Brand Colors (Custom Tailwind Config)
```
Primary: #1B7A78 (Deep Teal) - Main actions, headings
Background: #fff9e6 (Warm Cream) - Page background
Surface: #f5f5f3 (Off-white) - Cards, containers
Text: #2c2c2c (Deep Charcoal) - Main text
Muted: #a39e97 (Warm Grey) - Secondary text
Success: #2d5016 (Forest Green) - Success actions
Hover: #0F4C48 (Dark Teal) - CTA hover state
```

### Component Classes
- `.btn-primary` - Primary CTA button
- `.btn-secondary` - Secondary button
- `.card` - Card container
- `.input` - Form inputs
- `.badge` - Status badges

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js           # Axios instance with interceptors
│   ├── components/
│   │   ├── Navbar.jsx          # Navigation with responsive mobile menu
│   │   └── ProtectedRoute.jsx  # Route guard for auth
│   ├── context/
│   │   └── AuthContext.jsx    # Global auth state + localStorage
│   ├── layouts/
│   │   └── AppLayout.jsx       # Main app wrapper
│   ├── pages/
│   │   ├── LandingPage.jsx     # Public hero & features
│   │   ├── LoginPage.jsx       # User login form
│   │   ├── RegisterPage.jsx    # Account creation
│   │   ├── DashboardPage.jsx   # User hub with stats
│   │   ├── ProfilePage.jsx     # Profile edit & ratings
│   │   ├── MatchesPage.jsx     # Discover matches grid
│   │   ├── RequestsPage.jsx    # Incoming/outgoing requests
│   │   ├── ChatPage.jsx        # Conversations list
│   │   ├── ChatRoomPage.jsx    # Message interface
│   │   ├── SessionsPage.jsx    # Learning sessions
│   │   ├── ReviewsPage.jsx     # User reviews & ratings
│   │   └── NotificationsPage.jsx # Activity notifications
│   ├── App.jsx                 # Routes & auth provider
│   ├── main.jsx                # App entry point
│   └── styles.css              # Tailwind + custom styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install --legacy-peer-deps
```

### 2. Environment Setup
Create `.env.local` (optional):
```env
VITE_API_URL=http://localhost:8080/api
```

### 3. Start Development Server
```bash
npm run dev
```

Server runs at: `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
npm run preview
```

## 📄 Page Documentation

### LandingPage (`/`)
- **Purpose**: Public entry page, drive conversions
- **Features**:
  - Hero section with CTAs
  - "How It Works" feature cards
  - Stats section (users, skills, ratings)
  - CTA for sign up
  - Auth-aware routing (shows Dashboard link if logged in)

### LoginPage (`/login`)
- **Purpose**: User authentication
- **Features**:
  - Email & password form
  - Error handling with alerts
  - Loading states
  - Link to register page
  - localStorage persistence via AuthContext
- **API**: `POST /auth/login` → Returns `{ token, userId, email, role }`

### RegisterPage (`/register`)
- **Purpose**: New user account creation
- **Features**:
  - Full name, email, password form
  - Password confirmation validation
  - Error states for mismatched passwords
  - Success message before redirect
- **API**: `POST /auth/register` → Returns `{ token, userId, email, role }`

### DashboardPage (`/dashboard`) - Protected
- **Purpose**: Main hub after login, quick overview
- **Features**:
  - Welcome greeting with user name
  - 4-stat cards: Rating, Matches, Requests, Sessions
  - "Recommended Matches" preview (5 matches)
  - "Swap Requests" preview (3 requests)
  - Quick action cards (Profile, Skills, Messages, Reviews)
  - Loading spinner
- **API Calls**:
  - `GET /auth/me` - Current user + stats
  - `GET /matches/recommended/me` - Recommended matches
  - `GET /swap-requests/incoming/me` - Pending requests
  - `GET /sessions/me/sessions` - User sessions

### ProfilePage (`/profile`) - Protected
- **Purpose**: User profile management
- **Features**:
  - Editable form: Full name, city, country, languages, bio
  - Availability field
  - Profile photo URL input
  - Rating display card
  - Save changes button with loading state
  - Success/error message notifications
- **API Calls**:
  - `GET /auth/me` - Fetch profile data
  - `PUT /users/me/profile` - Update profile

### MatchesPage (`/matches`) - Protected
- **Purpose**: Discover compatible skill exchange partners
- **Features**:
  - Grid of match cards (responsive 1-3 columns)
  - Each card shows: User avatar, name, city, match score, rating, skills
  - Sort options: By Match Score, By Rating
  - "Request Swap" button with request sending
  - Empty state with link to update profile
- **API Calls**:
  - `GET /matches/recommended/me` - Get recommended matches
  - `POST /swap-requests` - Send swap request

### RequestsPage (`/requests`) - Protected
- **Purpose**: Manage incoming and outgoing swap requests
- **Features**:
  - Tab navigation: Incoming / Outgoing
  - Request cards showing user, message, status
  - Accept/Reject buttons for incoming (if PENDING)
  - Real-time status updates
  - Empty state per tab
- **API Calls**:
  - `GET /swap-requests/incoming/me` - Fetch incoming requests
  - `GET /swap-requests/outgoing/me` - Fetch outgoing requests
  - `PUT /swap-requests/{id}` - Accept/reject request

### ChatPage (`/chat`) - Protected
- **Purpose**: List of active conversations
- **Features**:
  - Chat item cards with: User avatar, name, last message preview
  - Click to open chat room
  - Timestamp of last message
  - Links to ChatRoomPage on click
- **API Calls**:
  - `GET /chats/me` - Fetch all user chats

### ChatRoomPage (`/chat/:chatId`) - Protected
- **Purpose**: Real-time messaging interface
- **Features**:
  - Header with other user info and back button
  - Message feed (auto-scrolling to latest)
  - Message bubbles: Different colors for sent/received
  - Timestamps on each message
  - Message input with Send button
  - Auto-refresh every 3 seconds (polling)
  - Empty state for new conversations
- **API Calls**:
  - `GET /chats/{chatId}` - Fetch chat with messages
  - `POST /messages` - Send new message

### SessionsPage (`/sessions`) - Protected
- **Purpose**: Schedule and manage learning sessions
- **Features**:
  - Tab navigation: Upcoming / Past
  - Session cards with: Topic, date/time, mode (Online/Offline)
  - For online: Display meeting link
  - For offline: Display location
  - Host info, description
  - Complete/Cancel buttons for upcoming
  - Status badges
- **API Calls**:
  - `GET /sessions/me/sessions` - Fetch all sessions
  - `PUT /sessions/{id}` - Update session status

### ReviewsPage (`/reviews`) - Protected
- **Purpose**: View user ratings and reviews
- **Features**:
  - Summary card: Overall rating, count, star display
  - Tab navigation: Reviews Received / Reviews Given
  - Review cards showing: Reviewer name, rating stars, comment, date
  - Empty states per tab
- **API Calls**:
  - `GET /reviews/me/reviews` - Fetch all reviews

### NotificationsPage (`/notifications`) - Protected
- **Purpose**: Activity feed and system notifications
- **Features**:
  - Tab navigation: All / Unread
  - Notification cards with: Type icon, title, message, timestamp
  - Unread indicator (left border + background highlight)
  - Delete button per notification
  - "Mark all as read" button
  - Empty state per tab
- **API Calls**:
  - `GET /notifications/me` - Fetch notifications
  - `PUT /notifications/{id}/read` - Mark as read
  - `POST /notifications/me/mark-all-read` - Mark all as read
  - `DELETE /notifications/{id}` - Delete notification

## 🔐 Authentication Flow

1. **Register**: User creates account → Backend generates JWT token → Stored in localStorage
2. **Login**: Email + password → Backend validates → Returns JWT token
3. **Protected Routes**: ProtectedRoute checks localStorage for token → Redirects to /login if missing
4. **API Calls**: Axios interceptor automatically includes token in Authorization header
5. **401 Errors**: Interceptor catches 401 responses → Clears localStorage → Redirects to /login
6. **Logout**: Users click logout in Navbar → AuthContext clears token → Redirects to /

## 📡 API Integration

### Base URL
- **Development**: `http://localhost:8080/api`
- **Environment Variable**: `VITE_API_URL`

### Authorization Header
```javascript
Authorization: Bearer {token}
```

### API Response Handling
- Success: Extract data from `response.data`
- Errors: Has `error.response?.data?.error` message
- 401 Unauthorized: Auto-redirect to login

## 🎯 Key Features Implemented

✅ Modern Tailwind UI with brand color scheme
✅ Responsive design (mobile-first)
✅ All 10 main pages with API integration
✅ Real-time chat messaging
✅ Skill matching & swap requests
✅ Session scheduling & management
✅ Review & rating system
✅ Notification center
✅ User profile management
✅ localStorage persistence for auth
✅ Loading states & error handling
✅ Form validation
✅ Lucide React icons throughout

## 📦 Dependencies

```json
{
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-router-dom": "^7.6.0",
  "axios": "^1.15.0",
  "lucide-react": "^0.263.1",
  "tailwindcss": "^3.3.0",
  "@tailwindcss/forms": "^0.5.7"
}
```

## 🛠️ Build & Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```
Creates optimized build in `dist/` folder

### Preview Production Build
```bash
npm run preview
```

## ✨ Styling Notes

- All components use Tailwind utilities
- Custom components defined in `styles.css` using `@layer`
- Brand colors extended in `tailwind.config.js`
- Forms styled with `@tailwindcss/forms` plugin
- Icons from Lucide React (200+ options)
- Responsive breakpoints: `md:` for tablet up

## 🐛 Troubleshooting

**Port 5173 already in use**
```bash
npm run dev -- --port 5174
```

**Dependencies not installing**
```bash
npm install --legacy-peer-deps
```

**Tailwind styles not appearing**
- Check `styles.css` imports are correct
- Run `npm run build` to rebuild CSS
- Clear browser cache (Ctrl+Shift+Del)

**API calls failing**
- Verify backend is running on `http://localhost:8080`
- Check token is stored in localStorage
- Look at network tab in DevTools for 401 errors

## 📝 Next Steps

1. Backend database must have sample data (run DataInitializer)
2. Users must complete their skills profile for matching algorithm
3. Implement WebSocket for real-time chat (currently polls every 3s)
4. Add image upload for profile photos
5. Add calendar view for sessions
6. Implement filters on matches page (city, skill, rating)
