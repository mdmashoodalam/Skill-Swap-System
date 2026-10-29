# ⚡ Quick Start Guide

Get the Skill Swap Platform running in 5 minutes!

## 🔧 Prerequisites

- **Java 21+** - [Download](https://www.oracle.com/java/technologies/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
- **Git** - [Download](https://git-scm.com/)

## 📥 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd skill-swap-platform
```

### 2. Setup MySQL Database

**Option A: Command Line**
```bash
mysql -u root -p
CREATE DATABASE skillswap;
```

**Option B: MySQL Workbench**
1. Open MySQL Workbench
2. Right-click "Databases"
3. Select "Create New Database"
4. Enter: `skillswap`
5. Click "Apply"

## 🚀 Running the Application

### Terminal 1: Start Backend

```bash
cd backend
mvn clean install -q
mvn spring-boot:run
```

**Expected output:**
```
The following profiles are active: dev
Started SkillSwapApplication in X.XXX seconds
INFO: Server started on port 8080
```

✅ Backend ready at: `http://localhost:8080/api`

### Terminal 2: Start Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

**Expected output:**
```
  LOCAL:   http://localhost:5173/
  press h + enter to show help
```

✅ Frontend ready at: `http://localhost:5173`

## 🌐 Access the Application

Open your browser and go to: **http://localhost:5173**

### Test Credentials

After running both servers, you can:
1. **Register** a new account with any email/password
2. **Login** with your credentials
3. Start exploring the platform!

## 🔍 What You'll See

### Landing Page
- Hero section with "Get Started" and "Sign In" buttons
- Features overview
- Statistics display

### After Login
- **Dashboard**: Overview with stats and quick actions
- **Matches**: Discover people to exchange skills with
- **Requests**: Manage swap requests
- **Messages**: Chat with matches
- **Sessions**: Schedule learning sessions
- **Reviews**: See community ratings
- **Notifications**: Activity feed
- **Profile**: Update your information

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check if port 8080 is in use
# Windows:
netstat -ano | findstr :8080

# If in use, kill process or change port in application.yml
```

### Frontend won't start
```bash
# Clear node modules and reinstall
rm -r node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

### Database connection error
```bash
# Verify MySQL is running
# Check credentials in backend/src/main/resources/application.yml
# Default: root with no password

# If you have a password, update:
spring:
  datasource:
    username: root
    password: your_password
```

### API calls failing
- Check both servers are running
- Look at browser DevTools → Network tab for error details
- Check backend terminal for error messages

## 📱 API Testing

**Get all recommended matches**
```bash
curl -X GET http://localhost:8080/api/matches/recommended/me \
  -H "Authorization: Bearer {YOUR_JWT_TOKEN}" \
  -H "Content-Type: application/json"
```

## 📚 Documentation

- **Backend Setup**: See [`backend/SETUP.md`](backend/SETUP.md)
- **API Reference**: See [`backend/API_REFERENCE.md`](backend/API_REFERENCE.md)
- **Frontend Setup**: See [`frontend/FRONTEND_SETUP.md`](frontend/FRONTEND_SETUP.md)
- **Full Completion Report**: See [`PROJECT_COMPLETION.md`](PROJECT_COMPLETION.md)

## 🎯 Next Steps

1. ✅ Create an account and complete your profile
2. ✅ Add skills you can offer and want to learn
3. ✅ Browse and send requests to matches
4. ✅ Chat with other learners
5. ✅ Schedule and complete sessions
6. ✅ Leave reviews and build your reputation

## 🔒 Security Features

- ✅ JWT authentication
- ✅ BCrypt password hashing
- ✅ CORS protection
- ✅ SQL injection prevention (JPA)
- ✅ Rate limiting ready

## 📊 Development Details

### Backend Stack
- Spring Boot 3.5.0
- MySQL 8.0
- JWT Authentication
- WebSocket STOMP

### Frontend Stack
- React 19.2.5
- Vite 6.4.2
- Tailwind CSS 3.3.0
- Lucide React icons

## 🚢 Deployment

### For Production
```bash
# Backend
mvn clean package
java -jar target/skill-swap-*.jar

# Frontend
npm run build
# Deploy dist/ to Netlify, Vercel, or your hosting
```

## 💡 Tips

- **Save time registering**: Use easy credentials like `test@test.com` / `password123`
- **Test matching**: Create multiple accounts to see recommendations
- **Check logs**: Backend terminal shows all API calls and errors
- **Cache issues**: Hard refresh (Ctrl+Shift+R) if styles look wrong

## ❓ Need Help?

1. Check the documentation files mentioned above
2. Review error messages in terminal
3. Check browser DevTools → Console tab
4. Ensure both backend and frontend servers are running

---

**Happy Skill Swapping! 🚀**
