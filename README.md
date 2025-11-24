# 4Trades Voice Agent Onboarding - Backend

A robust NestJS API server for managing trade business onboarding to the AI voice agent platform, with MongoDB storage and Microsoft Graph email notifications.

## 🎯 Features

- **JWT Authentication**: Secure user signup and login
- **MongoDB Integration**: Mongoose ODM for data persistence
- **Email Notifications**: Microsoft Graph API for admin alerts
- **Draft Auto-Save**: Real-time progress tracking
- **Submission Management**: Complete onboarding workflow
- **Behavior Tracking**: User interaction analytics
- **TypeScript**: Full type safety
- **Validation**: Request/response validation with class-validator

## 🛠 Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Passport-JWT)
- **Email**: Microsoft Graph API
- **Validation**: class-validator + class-transformer
- **Security**: Bcrypt for password hashing
- **HTTP Client**: node-fetch

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Microsoft 365 account with Azure AD application configured

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create `.env` file in the root directory:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/vasop
# OR MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vasop?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Microsoft Graph API (for email notifications)
BUSINESS_SHERPAPROMPT_TENANT_ID=your-azure-tenant-id
BUSINESS_SHERPAPROMPT_CLIENT_ID=your-azure-client-id
BUSINESS_SHERPAPROMPT_CLIENT_SECRET=your-azure-client-secret
BUSINESS_SHERPAPROMPT_SENDER_EMAIL=sender@yourdomain.com

# Admin
ADMIN_EMAIL=doug@sherpaprompt.com
```

### 3. Start MongoDB

**Local MongoDB**:
```bash
mongod --dbpath /path/to/data
```

**MongoDB Atlas**: Use connection string from Atlas dashboard

### 4. Run Development Server

```bash
npm run start:dev
```

Server starts on [http://localhost:3001](http://localhost:3001)

### 5. Build for Production

```bash
npm run build
npm run start:prod
```

## 📁 Project Structure

```
vasop-server/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── dto/
│   │       ├── signup.dto.ts
│   │       └── login.dto.ts
│   ├── onboarding/              # Onboarding module
│   │   ├── onboarding.module.ts
│   │   ├── onboarding.controller.ts
│   │   ├── onboarding.service.ts
│   │   └── dto/
│   │       ├── save-progress.dto.ts
│   │       └── submit.dto.ts
│   ├── schemas/                 # MongoDB schemas
│   │   ├── user.schema.ts
│   │   └── onboarding.schema.ts
│   ├── services/                # Shared services
│   │   └── email.service.ts
│   ├── app.module.ts           # Root module
│   └── main.ts                 # Bootstrap file
├── dist/                        # Compiled output
├── test/                        # E2E tests
├── .env                        # Environment variables
├── env.example                 # Environment template
├── nest-cli.json
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Authentication

#### POST /auth/signup
Create new user account.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "securepass123"
}
```

**Response** (201):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6908a41c2b9cd22b7be95401",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890"
  }
}
```

**Errors**:
- 409 Conflict: Email already registered
- 400 Bad Request: Validation failed

---

#### POST /auth/login
Authenticate existing user.

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6908a41c2b9cd22b7be95401",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890"
  }
}
```

**Errors**:
- 401 Unauthorized: Invalid credentials

---

#### GET /auth/me
Get current user profile (protected).

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200):
```json
{
  "id": "6908a41c2b9cd22b7be95401",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "role": "business_owner",
  "createdAt": "2025-11-03T12:46:20.886Z"
}
```

---

### Onboarding

#### POST /onboarding/save
Save draft progress (protected).

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "currentStep": 1,
  "businessProfile": {
    "businessName": "Superior Fencing",
    "industry": "Construction",
    "website": "https://superiorfencing.com",
    "phone": "555-1234",
    "email": "info@superiorfencing.com",
    "address": {
      "street": "123 Main St",
      "city": "Denver",
      "state": "CO",
      "zip": "80202"
    },
    "hours": {
      "mondayFriday": "8AM - 5PM",
      "saturday": "9AM - 2PM",
      "sunday": "Closed"
    }
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "currentStep": 1,
  "lastSavedAt": "2025-11-03T12:46:36.504Z",
  "submissionId": "4t-WT4-2025-11-03"
}
```

**Features**:
- Auto-generates submission ID
- Creates one draft per user (enforced by MongoDB index)
- Tracks behavior and timestamps
- Updates existing draft if present

---

#### GET /onboarding/my-submission
Retrieve user's submission (protected).

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Response** (200):
```json
{
  "submission": {
    "_id": "6908a42c2b9cd22b7be95409",
    "userId": "6908a41c2b9cd22b7be95401",
    "submissionId": "4t-WT4-2025-11-03",
    "status": "draft",
    "isSubmitted": false,
    "currentStep": 1,
    "businessProfile": { ... },
    "voiceAgentConfig": { ... },
    "emailConfig": { ... },
    "behaviorTracking": { ... },
    "createdAt": "2025-11-03T12:46:36.763Z",
    "updatedAt": "2025-11-03T12:46:36.763Z"
  },
  "status": "draft",
  "currentStep": 1,
  "isSubmitted": false
}
```

**Response** when no submission:
```json
null
```

---

#### POST /onboarding/submit
Final submission - triggers admin email (protected).

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "businessProfile": {
    "businessName": "Superior Fencing",
    "industry": "Construction",
    "website": "https://superiorfencing.com",
    "phone": "555-1234",
    "email": "info@superiorfencing.com",
    "address": { ... },
    "hours": { ... }
  },
  "voiceAgentConfig": {
    "agentName": "Sarah",
    "agentPersonality": "Professional and friendly",
    "greeting": "Hi, I'm Sarah from Superior Fencing...",
    "collectionFields": {
      "name": true,
      "phone": true,
      "email": false,
      "reason": true,
      "urgency": false,
      "customFields": [
        {
          "question": "What type of fence?",
          "required": true
        }
      ]
    },
    "emergencyHandling": {
      "enabled": true,
      "forwardToNumber": "555-9999",
      "triggerMethod": "pound_key"
    }
  },
  "emailConfig": {
    "recipientEmail": "owner@superiorfencing.com",
    "summaryEnabled": true
  }
}
```

**Response** (200):
```json
{
  "success": true,
  "submissionId": "4t-WT4-2025-11-03",
  "message": "Your info has been successfully submitted. Admin will review and contact you soon."
}
```

**Side Effects**:
1. Updates submission status to "submitted"
2. Sets `isSubmitted: true`
3. Records submission timestamp
4. Calculates total time spent
5. **Sends email to admin via Microsoft Graph**
6. Records email notification details

---

## 🗄 Database Schema

### Users Collection

```typescript
{
  _id: ObjectId,
  email: string (unique),
  password: string (bcrypt hashed),
  name: string,
  phone: string,
  role: string,
  emailVerified: boolean,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ email: 1 }` (unique)

---

### Onboardings Collection

```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  submissionId: string (unique),
  status: string,
  isSubmitted: boolean,
  submittedAt: Date,
  currentStep: number,
  lastSavedAt: Date,
  businessProfile: { ... },
  voiceAgentConfig: { ... },
  emailConfig: { ... },
  adminNotification: {
    emailSent: boolean,
    sentAt: Date,
    sentTo: string,
    mailchimpCampaignId: string
  },
  behaviorTracking: {
    submissionStarted: Date,
    submissionCompleted: Date,
    stepEvents: [...],
    totalTimeSpentSeconds: number,
    numberOfSessions: number,
    lastActiveAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ submissionId: 1 }` (unique)
- `{ userId: 1 }`
- `{ status: 1, submittedAt: -1 }`
- `{ userId: 1, isSubmitted: 1 }` (partial unique: ensures one draft per user)

---

## 📧 Email Service

### Microsoft Graph API Integration

The `EmailService` uses Microsoft Graph API to send email notifications via Azure AD authentication.

#### Initialization

```typescript
constructor(private configService: ConfigService) {
  const tenantId = configService.get('BUSINESS_SHERPAPROMPT_TENANT_ID');
  const clientId = configService.get('BUSINESS_SHERPAPROMPT_CLIENT_ID');
  const clientSecret = configService.get('BUSINESS_SHERPAPROMPT_CLIENT_SECRET');
  this.senderEmail = configService.get('BUSINESS_SHERPAPROMPT_SENDER_EMAIL');
  this.adminEmail = configService.get('ADMIN_EMAIL');
  
  // Initialize MSAL client for OAuth2 authentication
  this.msalClient = new ConfidentialClientApplication({
    auth: { clientId, authority, clientSecret }
  });
}
```

#### Send Flow

1. **Acquire OAuth2 access token**
   - Uses client credentials flow
   - Scopes: `https://graph.microsoft.com/.default`

2. **Prepare email message**
   - HTML content
   - Recipients list
   - Subject line

3. **Send email via Microsoft Graph**
   - POST `/v1.0/users/{senderEmail}/sendMail`
   - Authorization: Bearer token
   - Saves to sent items

#### Admin Email Content

**Subject**: `New Voice Agent Onboarding: [Business Name]`

**Includes**:
- Business name and contact info
- Submission ID
- Next steps for admin
- MongoDB query to view full submission
- Expected timeline

**Recipient**: Configured via `ADMIN_EMAIL` environment variable

---

## 🔐 Security

### Password Hashing

```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

Salt rounds: 10

### JWT Token

```typescript
const payload = { userId: user._id, email: user.email };
const token = this.jwtService.sign(payload);
```

Expires: 7 days (configurable via `JWT_EXPIRES_IN`)

### Protected Routes

```typescript
@UseGuards(JwtAuthGuard)
async getProfile(@Req() req) {
  return this.authService.getProfile(req.user.userId);
}
```

JWT extracted from `Authorization: Bearer <token>` header.

### CORS

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

### Input Validation

All DTOs validated with class-validator:

```typescript
export class SignupDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
  // ...
}
```

---

## 🧪 Testing

### Manual API Testing

```bash
# Signup
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"1234567890","password":"testpass123"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Get Profile (replace TOKEN)
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer TOKEN"

# Save Progress (replace TOKEN)
curl -X POST http://localhost:3001/onboarding/save \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentStep":1,"businessProfile":{"businessName":"Test Co"}}'

# Get Submission (replace TOKEN)
curl http://localhost:3001/onboarding/my-submission \
  -H "Authorization: Bearer TOKEN"

# Submit (replace TOKEN)
curl -X POST http://localhost:3001/onboarding/submit \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"businessProfile":{...},"voiceAgentConfig":{...},"emailConfig":{...}}'
```

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:cov
```

---

## 🔧 Development

### Available Scripts

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build

# Production start
npm run start:prod

# Debug mode
npm run start:debug

# Linting
npm run lint

# Format code
npm run format

# Tests
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

### Adding New Modules

```bash
nest generate module feature-name
nest generate controller feature-name
nest generate service feature-name
```

### Database Queries

```javascript
// MongoDB Shell

// View all users
db.users.find()

// Find user by email
db.users.findOne({ email: "test@example.com" })

// View all submissions
db.onboardings.find().sort({ createdAt: -1 })

// Find drafts
db.onboardings.find({ isSubmitted: false })

// Find submitted
db.onboardings.find({ isSubmitted: true })

// Find by submission ID
db.onboardings.findOne({ submissionId: "4t-WT4-2025-11-03" })

// Failed email notifications
db.onboardings.find({ "adminNotification.emailSent": false })
```

---

## 🚀 Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Build
npm run build

# Start with PM2
pm2 start dist/main.js --name vasop-server

# Save configuration
pm2 save

# Auto-start on reboot
pm2 startup
```

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
```

Build and run:
```bash
docker build -t vasop-server .
docker run -p 3001:3001 --env-file .env vasop-server
```

### Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Use MongoDB Atlas (not local)
- [ ] Configure Microsoft Graph API (Azure AD application)
- [ ] Set `NODE_ENV=production`
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Enable HTTPS
- [ ] Set up monitoring (PM2, DataDog)
- [ ] Configure backups for MongoDB
- [ ] Set up error logging (Sentry)
- [ ] Add rate limiting
- [ ] Configure firewall rules

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

**Error**: `Unable to connect to the database`

**Solutions**:
- Verify `MONGODB_URI` format
- Check MongoDB is running: `mongod --version`
- Test connection: `mongosh "mongodb://localhost:27017/vasop"`
- For Atlas: Check network access whitelist

### JWT Token Invalid

**Error**: `Unauthorized`

**Solutions**:
- Verify `JWT_SECRET` is set
- Check token hasn't expired (default 7 days)
- Ensure `Authorization` header format: `Bearer <token>`

### Email Not Sending

**Error**: Email notification fails

**Solutions**:
- Verify Azure AD application credentials are correct
- Check `BUSINESS_SHERPAPROMPT_TENANT_ID`, `BUSINESS_SHERPAPROMPT_CLIENT_ID`, and `BUSINESS_SHERPAPROMPT_CLIENT_SECRET`
- Verify `BUSINESS_SHERPAPROMPT_SENDER_EMAIL` has proper permissions in Microsoft 365
- Ensure Azure AD app has `Mail.Send` permission granted
- Check sender email mailbox is active and accessible
- Review server logs for detailed error

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3001`

**Solutions**:
```bash
# Find process on port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run start:dev
```

### Build Errors

**Error**: TypeScript compilation errors

**Solutions**:
- Clear cache: `rm -rf dist`
- Reinstall: `rm -rf node_modules && npm install`
- Check TypeScript version compatibility
- Review `tsconfig.json` settings

---

## 📊 Monitoring

### Logging

All logs include:
- Timestamp
- Module name
- Log level (LOG, ERROR, WARN)
- Message

Example:
```
[Nest] 23236 - 11/03/2025, 6:45:45 PM     LOG [NestApplication] Nest application successfully started
✅ [EmailService] Mailchimp Marketing API initialized with server: us12
```

### Health Checks

Add endpoint for monitoring:

```typescript
@Get('health')
health() {
  return { status: 'ok', timestamp: new Date() };
}
```

### Database Monitoring

Monitor MongoDB:
- Connection status
- Query performance
- Document counts
- Index usage

---

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Mongoose Documentation](https://mongoosejs.com/docs)
- [Passport-JWT](http://www.passportjs.org/packages/passport-jwt/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)
- [MongoDB Documentation](https://docs.mongodb.com)

## 📞 Support

For issues or questions:
- Check `/docs/END_TO_END_APPLICATION_FLOW.md` for detailed documentation
- Email: doug@sherpaprompt.com

## 📄 License

Proprietary - 4Trades Voice Agent Onboarding Platform

---

**Version**: 1.0  
**Last Updated**: November 3, 2025
