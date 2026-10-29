# Skill Swap Platform - Backend Setup & Running Guide

## Prerequisites

- **Java 21** or higher
- **Maven 3.8.0** or higher
- **MySQL 8.0** or higher
- Git

---

## Database Setup

### Create Database

```bash
mysql -u root -p

# In MySQL console:
CREATE DATABASE skill_swap;
USE skill_swap;
```

Or configure your database credentials in `application.yml` first.

### Configure Database Connection

Edit `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/skill_swap
    username: root              # Change if needed
    password: root              # Change if needed
  jpa:
    hibernate:
      ddl-auto: update          # Auto-create/update tables
```

---

## Build & Run

### Build the Project

```bash
cd backend
mvn clean compile
```

### Run the Application

```bash
# Option 1: Using Maven
mvn spring-boot:run

# Option 2: Using JAR
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

The application will start on: **`http://localhost:8080`**

### Check Server Status

```bash
curl http://localhost:8080/api/skills
```

---

## Important Configuration

### JWT Secret (Production)

Update in `application.yml`:
```yaml
app:
  jwt:
    secret: your-super-secret-key-min-64-chars
    expiration-ms: 86400000  # 24 hours
```

### CORS Configuration

Update `SecurityConfig.java` to add your frontend URLs:
```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:3000",
    "http://localhost:5173",
    "https://your-domain.com"
));
```

### Database Auto-Init

The application automatically:
1. Creates all tables (JPA `ddl-auto: update`)
2. Seeds 20+ skills on first run (DataInitializer)

---

## First API Test

### 1. Register a User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": 1,
  "email": "john@example.com",
  "role": "USER"
}
```

### 2. Use Token for Protected Requests

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

### 3. List Skills

```bash
curl -X GET http://localhost:8080/api/skills \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

---

## Troubleshooting

### Database Connection Error

**Error**: `Communications link failure`

**Solution**:
1. Verify MySQL is running: `mysql -u root -p`
2. Check credentials in `application.yml`
3. Ensure database exists: `CREATE DATABASE skill_swap;`

### Port Already in Use

**Error**: `Address already in use :8080`

**Solution**: Change port in `application.yml`:
```yaml
server:
  port: 8081
```

### Compilation Errors

**Solution**:
```bash
mvn clean compile -X  # Shows detailed output
```

### JWT Token Issues

**Error**: `401 Unauthorized`

**Solution**:
1. Verify token format: `Authorization: Bearer <token>`
2. Check token expiration (24 hours by default)
3. Get new token from login endpoint

---

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/skillswap/
│   │   │   ├── config/           # Configurations
│   │   │   ├── controller/       # REST endpoints
│   │   │   ├── dto/              # Request/response DTOs
│   │   │   ├── entity/           # JPA entities
│   │   │   ├── enums/            # Enumerations
│   │   │   ├── exception/        # Custom exceptions
│   │   │   ├── repository/       # Data access
│   │   │   ├── security/         # Security classes
│   │   │   ├── service/          # Business logic
│   │   │   └── SkillSwapApplication.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
├── pom.xml                        # Maven configuration
└── API_REFERENCE.md              # API documentation
```

---

## Development

### Hot Reload (Optional)

Install Spring Boot DevTools:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
</dependency>
```

Then enable auto-restart in IDE.

### Logging

Current log level is `INFO`. Change in `application.yml`:
```yaml
logging:
  level:
    root: INFO
    com.skillswap: DEBUG
```

---

## Database Schema

**Auto-created tables**:
- `users` - User accounts
- `skills` - Available skills catalog
- `user_offered_skills` - Skills users teach
- `user_wanted_skills` - Skills users want to learn
- `matches` - User compatibility matches
- `swap_requests` - Skill exchange requests
- `chats` - Chat conversations
- `messages` - Chat messages
- `sessions` - Learning sessions
- `reviews` - Reviews and ratings
- `notifications` - In-app notifications

All tables have `id`, `created_at`, `updated_at` columns automatically.

---

## WebSocket Testing

### Using Postman

1. Choose **Request** → **WebSocket**
2. URL: `ws://localhost:8080/ws/chat`
3. Connect
4. Send message to `/app/chat.send`
5. Subscribe to `/topic/chat/{matchId}`

### Using JavaScript (Stomp.js)

See API_REFERENCE.md for WebSocket examples.

---

## Production Deployment

### Build JAR

```bash
mvn clean package
```

### Run with Docker

```dockerfile
FROM openjdk:21
COPY target/backend-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java","-jar","app.jar"]
```

```bash
docker build -t skill-swap-api .
docker run -p 8080:8080 -e SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/skill_swap skill-swap-api
```

### Environment Variables

```bash
SPRING_DATASOURCE_URL=jdbc:mysql://host:3306/skill_swap
SPRING_DATASOURCE_USERNAME=user
SPRING_DATASOURCE_PASSWORD=pass
APP_JWT_SECRET=your-secret-key-64-chars-min
APP_JWT_EXPIRATION_MS=86400000
```

---

## Support & Debugging

### Check API Documentation

See `API_REFERENCE.md` for all endpoints.

### View Logs

```bash
# In running app (if using Maven)
# Press Ctrl+C to stop

tail -f logs/application.log  # If logs are saved to file
```

### SQL Debug

Enable SQL logging in `application.yml`:
```yaml
spring.jpa.show-sql: true
spring.jpa.properties.hibernate.format_sql: true
```

---

## Next Steps

1. ✅ Backend is ready
2. → Start frontend development
3. → Connect frontend to `http://localhost:8080`
4. → Use JWT tokens from auth endpoints
5. → Test WebSocket chat connections
6. → Deploy to production

---

**Contact**: For issues, check the logs and ensure all prerequisites are installed.
