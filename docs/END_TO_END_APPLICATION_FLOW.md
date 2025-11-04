# 4Trades Voice Agent Onboarding Platform - End-to-End Flow

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Complete User Journey](#complete-user-journey)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Email Notification System](#email-notification-system)
9. [Deployment Guide](#deployment-guide)

---

## 🎯 System Overview

The **4Trades Voice Agent Onboarding Platform** is a full-stack web application that allows trade businesses (fencing, HVAC, plumbing, etc.) to onboard their AI voice agent by providing business information, configuring the agent's behavior, and setting up call handling preferences.

### Key Features:
- **User Authentication**: Secure signup/login with JWT tokens
- **Multi-Step Onboarding**: 6-step wizard to collect all necessary information
- **Auto-Save Progress**: Submissions saved to MongoDB in real-time
- **Admin Notifications**: Automatic email to admin via Mailchimp Marketing API
- **Status Tracking**: Users can view their submission status

---

## 🛠 Technology Stack

### Frontend (vasop-client)
- **Framework**: Next.js 15 (App Router)
- **Language**: JavaScript/React
- **UI Library**: Shadcn/ui + TailwindCSS
- **Form Validation**: React Hook Form + Zod
- **Notifications**: Sonner (Toast)
- **HTTP Client**: Fetch API
- **Styling**: Zinc color scheme (zinc-900/zinc-100)

### Backend (vasop-server)
- **Framework**: NestJS (TypeScript)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (Passport-JWT)
- **Validation**: Class-validator + Class-transformer
- **Email Service**: Mailchimp Marketing API
- **Encryption**: Bcrypt for passwords

### Infrastructure
- **Database**: MongoDB (Local or Atlas)
- **Email Provider**: Mailchimp Marketing API
- **Ports**: 
  - Client: 3000
  - Server: 3001

---

## 🏗 Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                    (http://localhost:3000)                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP/HTTPS
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    NEXT.JS CLIENT                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Pages: Login, Signup, Onboarding, Status           │   │
│  │  Components: 6 Step Components + Progress           │   │
│  │  Context: AuthContext (JWT management)              │   │
│  │  API Client: lib/api.js                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ REST API (JSON)
                 │ Authorization: Bearer <JWT>
                 │
┌────────────────▼────────────────────────────────────────────┐
│                    NESTJS SERVER                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Module                                         │   │
│  │    - POST /auth/signup                               │   │
│  │    - POST /auth/login                                │   │
│  │    - GET  /auth/me (protected)                       │   │
│  │                                                       │   │
│  │  Onboarding Module                                   │   │
│  │    - POST /onboarding/save (protected)               │   │
│  │    - GET  /onboarding/my-submission (protected)      │   │
│  │    - POST /onboarding/submit (protected)             │   │
│  │                                                       │   │
│  │  Email Service                                       │   │
│  │    - Mailchimp Marketing API Integration            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│   MONGODB    │  │  MAILCHIMP API   │
│              │  │  (Email Sending) │
│  Collections:│  └──────────────────┘
│  - users     │
│  - onboardings│
└──────────────┘
```

---

## 🚀 Complete User Journey

### Phase 1: Authentication

#### 1.1 User Arrives at Landing Page
```
Browser → http://localhost:3000
        ↓
      page.js (root) checks auth
        ↓
   Not authenticated → Redirect to /login
```

#### 1.2 Signup Flow
```
User clicks "Sign Up"
        ↓
/signup page loads
        ↓
User fills form:
  - Full Name
  - Email
  - Phone
  - Password (min 8 chars)
        ↓
Form validated by Zod schema
        ↓
POST /auth/signup
  Body: { name, email, phone, password }
        ↓
SERVER: AuthService.signup()
  - Check if email exists → Error if duplicate
  - Hash password with bcrypt
  - Create user in MongoDB
  - Generate JWT token
  - Return { token, user }
        ↓
CLIENT: AuthContext.signup()
  - Save token to localStorage
  - Set user in context
  - Redirect to /onboarding
```

#### 1.3 Login Flow
```
User enters credentials
        ↓
POST /auth/login
  Body: { email, password }
        ↓
SERVER: AuthService.login()
  - Find user by email
  - Verify password with bcrypt
  - Update lastLoginAt timestamp
  - Generate JWT token
  - Return { token, user }
        ↓
CLIENT: AuthContext.login()
  - Save token to localStorage
  - Set user in context
  - Redirect to /onboarding
```

---

### Phase 2: Onboarding Process

#### 2.1 Onboarding Page Load
```
/onboarding page loads
        ↓
useEffect hook runs
        ↓
GET /onboarding/my-submission
  Headers: { Authorization: Bearer <token> }
        ↓
SERVER: OnboardingService.getUserSubmission()
  - Find submission by userId
  - Check if already submitted → Redirect to /status
  - Return draft data if exists
        ↓
CLIENT: Load draft into state
  - Set formData from submission
  - Set currentStep from submission
```

#### 2.2 Step 1: Business Profile
```
User fills:
  - Business Name
  - Industry (dropdown)
  - Website
  - Phone
  - Email
  - Address (street, city, state, zip)
  - Business Hours (M-F, Sat, Sun)
        ↓
User clicks "Continue to Step 2"
        ↓
Form validated by Zod
        ↓
handleNext() called
        ↓
POST /onboarding/save
  Body: {
    currentStep: 1,
    businessProfile: { ...data }
  }
        ↓
SERVER: OnboardingService.saveProgress()
  - Find or create draft submission
  - Update businessProfile field
  - Generate submissionId (e.g., "4t-WT4-2025-11-03")
  - Track behavior (step events, timestamps)
  - Save to MongoDB
  - Return { success, currentStep, submissionId }
        ↓
CLIENT: Update state
  - Move to Step 2
  - Show success toast
```

#### 2.3 Step 2: Voice Agent Configuration
```
User fills:
  - Agent Name
  - Agent Personality (dropdown)
  - Greeting Message (with auto-generate option)
        ↓
Auto-generate greeting:
  - Uses business name from Step 1
  - Template: "Hi there, I'm [agentName], [businessName]'s virtual assistant..."
        ↓
Live preview shows greeting as typed
        ↓
User clicks "Continue to Step 3"
        ↓
POST /onboarding/save
  Body: {
    currentStep: 2,
    voiceAgentConfig: {
      agentName,
      agentPersonality,
      greeting
    }
  }
        ↓
SERVER: Save to MongoDB
        ↓
CLIENT: Move to Step 3
```

#### 2.4 Step 3: Information Collection
```
User selects standard fields:
  ☑ Name
  ☑ Phone
  ☐ Email
  ☑ Reason for call
  ☐ Urgency level
  ☐ Property address
  ☐ Best time to callback
        ↓
User adds custom questions:
  - "What type of fence are you interested in?"
  - "What is your budget range?"
        ↓
POST /onboarding/save
  Body: {
    currentStep: 3,
    collectionFields: {
      name: true,
      phone: true,
      customFields: [...]
    }
  }
        ↓
Move to Step 4
```

#### 2.5 Step 4: Emergency Handling
```
User toggles "Enable Emergency Forwarding"
        ↓
If enabled:
  - Enter emergency phone number
  - Trigger method: "Press # Key" (only option)
  - Info card explains: "If this is an emergency, press the pound key now."
        ↓
Preview shows example call flow
        ↓
POST /onboarding/save
  Body: {
    currentStep: 4,
    emergencyHandling: {
      enabled: true,
      forwardToNumber: "555-9999",
      triggerMethod: "pound_key"
    }
  }
        ↓
Move to Step 5
```

#### 2.6 Step 5: Email Configuration
```
User enters:
  - Email address for call summaries
  - Toggle "Enable email summaries" (default: on)
        ↓
Preview shows email format:
  Subject: New Call - [Customer Name]
  Content:
    - Customer contact information
    - Reason for their call
    - All details they provided
    - Urgency level (if collected)
        ↓
POST /onboarding/save
  Body: {
    currentStep: 5,
    emailConfig: {
      recipientEmail: "owner@business.com",
      summaryEnabled: true
    }
  }
        ↓
Move to Step 6 (Review)
```

#### 2.7 Step 6: Review & Submit
```
User reviews all information:
  - Business Profile (with Edit button)
  - Voice Agent Config (with Edit button)
  - Collection Fields (with Edit button)
  - Emergency Handling (with Edit button)
  - Email Config (with Edit button)
        ↓
User clicks "Submit for Review"
        ↓
Confirmation dialog appears
        ↓
User confirms
        ↓
POST /onboarding/submit
  Body: {
    businessProfile: {...},
    voiceAgentConfig: {...},
    emailConfig: {...}
  }
        ↓
SERVER: OnboardingService.submitOnboarding()
  - Find draft submission
  - Mark as submitted (isSubmitted: true)
  - Set status: "submitted"
  - Set submittedAt timestamp
  - Calculate totalTimeSpentSeconds
  - Save to MongoDB
        ↓
  - EmailService.sendAdminNotification()
    ↓
    Mailchimp Marketing API:
      1. Check if admin email exists in audience
      2. Add to audience if not exists
      3. Create campaign with submission details
      4. Set HTML/Text content
      5. Send campaign
    ↓
  - Update adminNotification field:
    {
      emailSent: true,
      sentAt: timestamp,
      sentTo: "doug@sherpaprompt.com",
      mailchimpCampaignId: "campaign_id"
    }
  - Return { success, submissionId, message }
        ↓
CLIENT:
  - Clear localStorage draft
  - Show success toast
  - Redirect to /status after 2 seconds
```

---

### Phase 3: Post-Submission

#### 3.1 Status Page
```
/status page loads
        ↓
GET /onboarding/my-submission
        ↓
Display:
  - ✅ Submission received
  - Submission ID: 4t-WT4-2025-11-03
  - Status: Under Review
  - Expected timeline: 2-3 business days
        ↓
User can:
  - View submission details
  - Logout
```

#### 3.2 Admin Receives Email
```
Mailchimp sends email to doug@sherpaprompt.com
        ↓
Email contains:
  - Business Name
  - Owner Name
  - Contact Email
  - Submission ID
  - Next Steps:
    1. Review submission in MongoDB
    2. Set up voice agent configuration
    3. Purchase Twilio number
    4. Deploy agent to ahca-server
    5. Contact business owner with phone number
  - MongoDB query info
```

---

## 📊 Data Flow Diagrams

### Authentication Flow

```
┌─────────┐                                    ┌──────────┐
│ Browser │                                    │  Server  │
└────┬────┘                                    └────┬─────┘
     │                                              │
     │  POST /auth/signup                           │
     │  { name, email, phone, password }            │
     ├─────────────────────────────────────────────>│
     │                                              │
     │                                    Check if email exists
     │                                              │
     │                                    Hash password (bcrypt)
     │                                              │
     │                                    Save to users collection
     │                                              │
     │                                    Generate JWT token
     │                                              │
     │  { token, user }                             │
     │<─────────────────────────────────────────────┤
     │                                              │
     │  Save token to localStorage                  │
     │  Set user in AuthContext                     │
     │  Redirect to /onboarding                     │
     │                                              │
```

### Onboarding Save Flow

```
┌─────────┐                                    ┌──────────┐        ┌─────────┐
│ Browser │                                    │  Server  │        │ MongoDB │
└────┬────┘                                    └────┬─────┘        └────┬────┘
     │                                              │                   │
     │  POST /onboarding/save                       │                   │
     │  Authorization: Bearer <JWT>                 │                   │
     │  { currentStep, businessProfile, ... }       │                   │
     ├─────────────────────────────────────────────>│                   │
     │                                              │                   │
     │                              Verify JWT token│                   │
     │                              Extract userId  │                   │
     │                                              │                   │
     │                                              │  Find/Create draft│
     │                                              ├──────────────────>│
     │                                              │                   │
     │                                              │  Submission found │
     │                                              │<──────────────────┤
     │                                              │                   │
     │                              Update fields   │                   │
     │                              Track behavior  │                   │
     │                                              │                   │
     │                                              │  Save document    │
     │                                              ├──────────────────>│
     │                                              │                   │
     │                                              │  Success          │
     │                                              │<──────────────────┤
     │                                              │                   │
     │  { success, currentStep, submissionId }      │                   │
     │<─────────────────────────────────────────────┤                   │
     │                                              │                   │
     │  Update UI                                   │                   │
     │  Show toast notification                     │                   │
     │                                              │                   │
```

### Submission & Email Flow

```
┌─────────┐         ┌──────────┐        ┌─────────┐        ┌──────────────┐
│ Browser │         │  Server  │        │ MongoDB │        │  Mailchimp   │
└────┬────┘         └────┬─────┘        └────┬────┘        └──────┬───────┘
     │                   │                   │                     │
     │  POST /onboarding/submit              │                     │
     │  { all form data }│                   │                     │
     ├──────────────────>│                   │                     │
     │                   │                   │                     │
     │           Find draft│                 │                     │
     │                   ├──────────────────>│                     │
     │                   │  Draft found      │                     │
     │                   │<──────────────────┤                     │
     │                   │                   │                     │
     │           Update: │                   │                     │
     │           - isSubmitted: true         │                     │
     │           - status: "submitted"       │                     │
     │           - submittedAt: timestamp    │                     │
     │                   ├──────────────────>│                     │
     │                   │  Saved            │                     │
     │                   │<──────────────────┤                     │
     │                   │                   │                     │
     │           Send admin email            │                     │
     │                   ├──────────────────────────────────────>  │
     │                   │                   │  1. Check member   │
     │                   │                   │  2. Add if needed  │
     │                   │                   │  3. Create campaign│
     │                   │                   │  4. Set content    │
     │                   │                   │  5. Send email     │
     │                   │                   │                     │
     │                   │  { campaignId }   │                     │
     │                   │<──────────────────────────────────────  │
     │                   │                   │                     │
     │           Update adminNotification    │                     │
     │                   ├──────────────────>│                     │
     │                   │<──────────────────┤                     │
     │                   │                   │                     │
     │  { success, submissionId, message }   │                     │
     │<──────────────────┤                   │                     │
     │                   │                   │                     │
     │  Show toast       │                   │                     │
     │  Redirect /status │                   │                     │
     │                   │                   │                     │
```

---

## 🔌 API Endpoints

### Authentication Endpoints

#### POST /auth/signup
**Purpose**: Create new user account

**Request**:
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
- 400 Bad Request: Validation errors

---

#### POST /auth/login
**Purpose**: Authenticate existing user

**Request**:
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
**Purpose**: Get current user profile

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

**Errors**:
- 401 Unauthorized: Invalid or missing token

---

### Onboarding Endpoints

#### POST /onboarding/save
**Purpose**: Save draft progress

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request**:
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

---

#### GET /onboarding/my-submission
**Purpose**: Retrieve user's submission (draft or submitted)

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
    "lastSavedAt": "2025-11-03T12:46:36.504Z",
    "businessProfile": { ... },
    "voiceAgentConfig": { ... },
    "emailConfig": { ... },
    "behaviorTracking": { ... },
    "createdAt": "2025-11-03T12:46:36.763Z",
    "updatedAt": "2025-11-03T12:46:36.763Z"
  },
  "status": "draft",
  "currentStep": 1,
  "isSubmitted": false,
  "lastSavedAt": "2025-11-03T12:46:36.504Z"
}
```

**Response** (200) when no submission:
```json
null
```

---

#### POST /onboarding/submit
**Purpose**: Final submission - triggers admin email

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request**:
```json
{
  "businessProfile": { ... },
  "voiceAgentConfig": {
    "agentName": "Sarah",
    "agentPersonality": "Professional and friendly",
    "greeting": "Hi, I'm Sarah from Superior Fencing...",
    "collectionFields": {
      "name": true,
      "phone": true,
      "email": false,
      "reason": true,
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
  role: string (default: "business_owner"),
  emailVerified: boolean (default: false),
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
  submissionId: string (unique, e.g., "4t-WT4-2025-11-03"),
  status: string (default: "draft"),
  isSubmitted: boolean (default: false),
  submittedAt: Date,
  currentStep: number (default: 1),
  lastSavedAt: Date,
  
  businessProfile: {
    businessName: string,
    industry: string,
    website: string,
    phone: string,
    email: string,
    address: {
      street: string,
      city: string,
      state: string,
      zip: string
    },
    hours: {
      mondayFriday: string,
      saturday: string,
      sunday: string
    }
  },
  
  voiceAgentConfig: {
    agentName: string,
    agentPersonality: string,
    greeting: string,
    collectionFields: {
      name: boolean,
      phone: boolean,
      email: boolean,
      reason: boolean,
      urgency: boolean,
      propertyAddress: boolean,
      bestTimeToCallback: boolean,
      customFields: [
        {
          question: string,
          required: boolean
        }
      ]
    },
    emergencyHandling: {
      enabled: boolean,
      forwardToNumber: string,
      triggerMethod: string
    }
  },
  
  emailConfig: {
    recipientEmail: string,
    summaryEnabled: boolean
  },
  
  adminNotification: {
    emailSent: boolean,
    sentAt: Date,
    sentTo: string,
    mailchimpCampaignId: string
  },
  
  behaviorTracking: {
    submissionStarted: Date,
    submissionCompleted: Date,
    stepEvents: [
      {
        step: number,
        action: string,
        timestamp: Date,
        timeSpentSeconds: number
      }
    ],
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
- `{ userId: 1, isSubmitted: 1 }` (partial, unique where isSubmitted: false)
  - Ensures only one draft per user

---

## 📧 Email Notification System

### Mailchimp Marketing API Integration

The application uses **Mailchimp Marketing API** (not Transactional API) to send admin notifications.

#### Flow:

1. **Check Member Existence**
   ```
   GET /3.0/lists/{audienceId}/members/{subscriberHash}
   ```
   - Hash = MD5(email.toLowerCase())

2. **Add Member if Needed**
   ```
   POST /3.0/lists/{audienceId}/members
   Body: {
     email_address,
     status: "subscribed",
     merge_fields: { FNAME, LNAME }
   }
   ```

3. **Create Campaign**
   ```
   POST /3.0/campaigns
   Body: {
     type: "regular",
     recipients: {
       list_id,
       segment_opts: {
         conditions: [{ field: "EMAIL", op: "is", value: email }]
       }
     },
     settings: {
       subject_line,
       from_name,
       reply_to,
       title
     }
   }
   ```

4. **Set Campaign Content**
   ```
   PUT /3.0/campaigns/{campaignId}/content
   Body: {
     html: "<html>...",
     plain_text: "..."
   }
   ```

5. **Send Campaign**
   ```
   POST /3.0/campaigns/{campaignId}/actions/send
   ```

#### Email Template

**Subject**: `New Voice Agent Onboarding: [Business Name]`

**HTML Content**:
- Header with 4Trades branding
- Business information section
- Next steps for admin
- MongoDB query details
- Professional footer

**Recipients**: Admin email (default: doug@sherpaprompt.com)

---

## 🚀 Deployment Guide

### Prerequisites

1. **MongoDB**: Local or Atlas
2. **Mailchimp Account**: Marketing API key
3. **Node.js**: v18+ recommended

---

### Backend Deployment (vasop-server)

1. **Install Dependencies**:
   ```bash
   cd vasop-server
   npm install
   ```

2. **Configure Environment** (`.env`):
   ```env
   PORT=3001
   NODE_ENV=production
   
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vasop
   
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=7d
   
   FRONTEND_URL=https://yourdomain.com
   
   MAILCHIMP_API_KEY=your-key-us12
   MAILCHIMP_SERVER_PREFIX=us12
   MAILCHIMP_AUDIENCE_ID=your-audience-id
   ADMIN_EMAIL=doug@sherpaprompt.com
   ```

3. **Build**:
   ```bash
   npm run build
   ```

4. **Start Production**:
   ```bash
   npm run start:prod
   ```

5. **PM2 (Recommended)**:
   ```bash
   pm2 start dist/main.js --name vasop-server
   pm2 save
   pm2 startup
   ```

---

### Frontend Deployment (vasop-client)

1. **Install Dependencies**:
   ```bash
   cd vasop-client
   npm install
   ```

2. **Configure Environment** (`.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

3. **Build**:
   ```bash
   npm run build
   ```

4. **Start Production**:
   ```bash
   npm run start
   ```

5. **Deploy to Vercel** (Recommended):
   ```bash
   vercel deploy --prod
   ```

---

### Production Checklist

- [ ] Update JWT_SECRET to strong random string
- [ ] Configure production MongoDB connection
- [ ] Set up Mailchimp Marketing API
- [ ] Update CORS origin to production domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure MongoDB indexes
- [ ] Set up monitoring (e.g., PM2, DataDog)
- [ ] Configure backup strategy for MongoDB
- [ ] Test all API endpoints in production
- [ ] Test email delivery
- [ ] Set up error logging (e.g., Sentry)

---

## 🔐 Security Considerations

1. **Password Storage**: Bcrypt with salt rounds = 10
2. **JWT Tokens**: HttpOnly recommended for cookies (currently localStorage)
3. **CORS**: Configured for specific origin only
4. **Input Validation**: Zod on client, class-validator on server
5. **MongoDB Injection**: Mongoose automatically escapes queries
6. **Rate Limiting**: Should be added for production (e.g., express-rate-limit)
7. **HTTPS**: Required for production

---

## 📊 Monitoring & Logging

### Server Logs

- MongoDB connection status
- Email service initialization
- Mailchimp API calls
- Route mapping
- Error stack traces

### Database Queries

View submissions in MongoDB:
```javascript
// All drafts
db.onboardings.find({ isSubmitted: false })

// All submitted
db.onboardings.find({ isSubmitted: true }).sort({ submittedAt: -1 })

// Specific submission
db.onboardings.findOne({ submissionId: "4t-WT4-2025-11-03" })

// Failed email notifications
db.onboardings.find({ "adminNotification.emailSent": false })
```

---

## 🧪 Testing

### API Testing with cURL

See API Endpoints section for examples.

### Frontend Testing

```bash
cd vasop-client
npm run dev
```

Open browser:
1. http://localhost:3000 → Should redirect to /login
2. Create account → Should redirect to /onboarding
3. Fill 6 steps → Should save progress
4. Submit → Should show success and redirect to /status

---

## 📝 Future Enhancements

1. **Email Verification**: Confirm email before onboarding
2. **Password Reset**: Forgot password flow
3. **Admin Dashboard**: View/approve submissions
4. **Real-time Status**: WebSocket updates
5. **File Uploads**: Business logo, documents
6. **Multi-language**: i18n support
7. **Rate Limiting**: Prevent abuse
8. **2FA**: Two-factor authentication
9. **Analytics**: Track user behavior
10. **Twilio Integration**: Automated phone number provisioning

---

## 🆘 Troubleshooting

### MongoDB Connection Failed
- Check MONGODB_URI format
- Verify database is running
- Check network/firewall settings

### Email Not Sending
- Verify Mailchimp API key
- Check MAILCHIMP_SERVER_PREFIX matches API key
- Verify MAILCHIMP_AUDIENCE_ID exists
- Check Mailchimp account status

### JWT Token Invalid
- Check JWT_SECRET matches between requests
- Verify token hasn't expired
- Clear localStorage and re-login

### CORS Errors
- Verify FRONTEND_URL in server .env
- Check client API_URL points to server
- Ensure credentials: true on both sides

---

## 📞 Support

For issues or questions:
- Email: doug@sherpaprompt.com
- MongoDB Database: `vasop`
- Collections: `users`, `onboardings`

---

**Document Version**: 1.0  
**Last Updated**: November 3, 2025  
**Author**: 4Trades Development Team

