# 4Trades Voice Agent Onboarding - MVP1 Architecture

## Overview

4Trades Voice Agent Onboarding MVP1 is a simple onboarding platform where business owners provide information to get a voice agent set up for their business, similar to Superior Fencing's voice agent implementation. This is a **data collection platform** - business owners submit their info, Doug gets notified via email, and manually deploys the voice agent.

**Key Principle**: MVP1 is intentionally simple. No admin dashboard, no RAG, no appointments, no automated provisioning. Just collect business information, email admin, and store for manual processing.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│           4TRADES VOICE AGENT ONBOARDING MVP1            │
│              (Business Data Collection Only)             │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌──────────────┐                    ┌──────────────┐
│   Frontend    │◄──────────────────►│   Backend     │
│   (Next.js)   │        REST        │   (NestJS)    │
│               │        APIs        │               │
│ - Login       │                    │ - Auth        │
│ - Signup      │                    │ - Onboarding  │
│ - Onboarding  │                    │ - Mailchimp   │
│ - Status Page │                    │               │
└──────────────┘                    └──────────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐
                  │   MongoDB     │  │   Mailchimp   │  │    Doug      │
                  │               │  │               │  │  (Email)     │
                  │ va-onboarding │  │  Auto Email   │  │              │
                  │  collection   │  │  on Submit    │  │ Manual Deploy│
                  └──────────────┘  └──────────────┘  └─────────────┘
```

### Tech Stack

**Frontend (vasop-client)**
- Next.js 14 (React)
- Shadcn/ui components (already set up)
- TailwindCSS (zinc-900 and zinc-100 only)
- Poppins font (only font used)
- React Hook Form + Zod validation
- Toast notifications (Sonner)

**Backend (vasop-server)**
- NestJS (TypeScript)
- MongoDB (Mongoose)
- JWT authentication
- RESTful APIs
- Mailchimp integration for email notifications

**Database**
- MongoDB
- Two collections:
  - `users` - Authentication data (credentials, profile)
  - `va-onboarding` - Onboarding submissions (references users)
- Each onboarding document = one business submission with progress tracking
- Indexes for performance and constraints

**Design System**
- Colors: zinc-900 (dark), zinc-100 (light) only
- Font: Poppins
- Logo: "4Trades Voice Agent Onboarding" text
- Minimal, clean design

---

## What MVP1 Does

### Business Owner Flow
1. Business owner signs up / logs in
2. Fills out a multi-step onboarding form (6 steps)
3. Can save progress and continue later
4. Can edit previous steps while filling the form
5. Submits the form
6. Sees toast notification: "Your info has been successfully submitted. Admin will review and contact you soon."
7. Redirected to status page: "Your application is still under review"
8. Receives email confirmation (optional)

### Admin Team Flow (Manual - No Dashboard)
1. Doug receives automated email via Mailchimp: "[Business Name] has onboarded their business for the voice agent. Please review and inform them."
2. Developer reviews submission data directly in MongoDB
3. Developer manually creates the voice agent configuration in ahca-server
4. Doug contacts business owner directly (email/phone) when deployed / regarding subscription

**NO admin dashboard in MVP1** - Doug gets email notifications and reviews data in MongoDB directly.

---

## Superior Fencing Flow Reference

The voice agent businesses get will work like Superior Fencing's agent:

### Features
- Basic information collection (name, phone, email, reason for call)
- **Emergency call handling (OPTIONAL)** - business can enable/disable
  - If enabled: press # to forward to business
  - If disabled: no emergency forwarding, standard flow only
- Email summaries after each call
- No RAG (knowledge base)
- No appointment booking

### Conversation Flow
1. **Greeting**: "Thanks for calling [Business Name], I'm [Agent Name], the AI assistant..."
2. **Emergency handling** (only if enabled): "If this is an emergency, press the pound key..."
3. **Reason collection**: "What are you calling about?"
4. **Name collection**: "Could I get your name?"
5. **Phone collection** (if enabled): "What's the best phone number to reach you at?"
6. **Email collection** (if enabled): "Do you have an email address?"
7. **Urgency**: "Would you like us to call you back on the next business day?"
8. **Confirmation**: Confirm all collected details
9. **Closing**: "Thank you, our team will get back to you..."

**Note**: Steps 2, 5 and 6 are conditional based on business owner's choices during onboarding.

---

## Database Schema

### Collection: `users` (Authentication)

```typescript
{
  _id: ObjectId,
  
  // Authentication
  email: string,                     // unique, used for login
  password: string,                  // hashed with bcrypt
  
  // Profile
  name: string,
  phone: string,
  
  // Metadata
  role: string,                      // "business_owner" (for future: "admin")
  emailVerified: boolean,            // for future email verification
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date | null
}
```

**Indexes:**
```javascript
db.users.createIndex({ email: 1 }, { unique: true })
```

---

### Collection: `va-onboarding` (Business Submissions)

```typescript
{
  _id: ObjectId,
  
  // User Reference (IMPORTANT: References users collection)
  userId: ObjectId,                  // References users._id
  
  // Submission metadata
  submissionId: string,              // e.g., "4t-ABC-2024-10-31", unique
  status: string,                    // "draft", "submitted"
  isSubmitted: boolean,              // false = draft, true = submitted
  submittedAt: Date | null,
  currentStep: number,               // 1-6, tracks progress for save & continue
  lastSavedAt: Date,
  
  // Business profile
  businessProfile: {
    businessName: string,            // e.g., "Joe's HVAC"
    industry: string,                // e.g., "HVAC", "Construction", "Plumbing"
    website: string,
    phone: string,                   // business phone
    email: string,                   // business email for summaries
    address: {
      street: string,
      city: string,
      state: string,
      zip: string
    },
    hours: {
      monday_friday: string,         // e.g., "8 AM - 6 PM"
      saturday: string,
      sunday: string
    }
  },
  
  // Voice agent configuration (collected from business owner)
  voiceAgentConfig: {
    agentName: string,               // e.g., "Mason", "Alex"
    agentPersonality: string,        // "professional", "friendly", "formal"
    greeting: string,                // Custom greeting message
    
    // Information to collect from callers
    collectionFields: {
      name: boolean,                 // always true
      phone: boolean,                // always true
      email: boolean,
      reason: boolean,                // always true
      urgency: boolean,
      propertyAddress: boolean,
      bestTimeToCallback: boolean,
      customFields: Array<{          // business can add custom questions
        label: string,
        required: boolean
      }>
    },
    
    // Emergency handling (OPTIONAL - user can disable)
    emergencyHandling: {
      enabled: boolean,              // user choice: enable or disable
      forwardToNumber: string | null, // only required if enabled=true
      triggerMethod: string | null   // "pound_key" or "keyword", only if enabled=true
    }
  },
  
  // Email configuration
  emailConfig: {
    recipientEmail: string,          // where to send call summaries
    summaryEnabled: boolean          // always true for MVP1
  },
  
  // Admin notification (sent automatically on submission)
  adminNotification: {
    emailSent: boolean,
    sentAt: Date | null,
    sentTo: string,                  // doug@sherpaprompt.com
    mailchimpCampaignId: string | null
  },
  
  // User behavior tracking (for analytics)
  behaviorTracking: {
    submissionStarted: Date,         // When user first started onboarding
    submissionCompleted: Date | null, // When user completed submission
    stepEvents: Array<{
      step: number,                  // 1-6
      action: string,                // "entered", "saved", "abandoned"
      timestamp: Date,
      timeSpentSeconds: number | null
    }>,
    totalTimeSpentSeconds: number,   // Total time from start to submit
    numberOfSessions: number,        // How many times user logged in to work on this
    lastActiveAt: Date
  },
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
```javascript
// Ensure one active draft per user
db['va-onboarding'].createIndex(
  { userId: 1, isSubmitted: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { isSubmitted: false },
    name: "one_draft_per_user"
  }
)

// For quick lookups
db['va-onboarding'].createIndex({ submissionId: 1 }, { unique: true })
db['va-onboarding'].createIndex({ userId: 1 })
db['va-onboarding'].createIndex({ status: 1, submittedAt: -1 })
```

**Index Explanation:**
- `{ userId: 1, isSubmitted: 1 }` with `partialFilterExpression` ensures only ONE draft (isSubmitted: false) per user
- If user tries to create another draft while one exists, MongoDB will throw duplicate key error
- Once submitted (isSubmitted: true), user can theoretically submit another (for future multi-business support)

### Example Documents

#### users Collection Example
```json
{
  "_id": "672345abcdef123456789012",
  "email": "joe@joeshvac.com",
  "password": "$2b$10$abcdefghijklmnopqrstuvwxyz",
  "name": "Joe Smith",
  "phone": "+15035551234",
  "role": "business_owner",
  "emailVerified": false,
  "createdAt": "2024-10-31T10:00:00Z",
  "updatedAt": "2024-10-31T10:30:00Z",
  "lastLoginAt": "2024-10-31T10:29:00Z"
}
```

#### va-onboarding Collection Example
```json
{
  "_id": "672345ffffffffff123456789",
  "userId": "672345abcdef123456789012",
  "submissionId": "4t-ABC-2024-10-31",
  "status": "submitted",
  "isSubmitted": true,
  "submittedAt": "2024-10-31T10:30:00Z",
  "currentStep": 6,
  "lastSavedAt": "2024-10-31T10:30:00Z",
  
  "businessProfile": {
    "businessName": "Joe's HVAC",
    "industry": "HVAC",
    "website": "www.joeshvac.com",
    "phone": "+15035555678",
    "email": "service@joeshvac.com",
    "address": {
      "street": "123 Main St",
      "city": "Portland",
      "state": "OR",
      "zip": "97201"
    },
    "hours": {
      "monday_friday": "8 AM - 6 PM",
      "saturday": "9 AM - 4 PM",
      "sunday": "Closed"
    }
  },
  
  "voiceAgentConfig": {
    "agentName": "Alex",
    "agentPersonality": "professional",
    "greeting": "Thanks for calling Joe's HVAC, I'm Alex, the AI assistant. If this is an emergency, press the pound key now. What are you calling about?",
    "collectionFields": {
      "name": true,
      "phone": true,
      "email": true,
      "reason": true,
      "urgency": true,
      "propertyAddress": true,
      "bestTimeToCallback": false,
      "customFields": [
        {
          "label": "What type of HVAC system do you have?",
          "required": false
        }
      ]
    },
    "emergencyHandling": {
      "enabled": true,                    // User opted IN to emergency forwarding
      "forwardToNumber": "+15035555678",
      "triggerMethod": "pound_key"
    }
  },
  
  "emailConfig": {
    "recipientEmail": "joe@joeshvac.com",
    "summaryEnabled": true
  }
}
```

#### Example Document (Emergency Forwarding Disabled)
```json
{
  "_id": "672345gggggggg123456789",
  "userId": "672345abcdef123456789012",
  "submissionId": "4t-DEF-2024-11-01",
  "status": "submitted",
  "isSubmitted": true,
  "submittedAt": "2024-11-01T14:00:00Z",
  "currentStep": 6,
  
  "businessProfile": {
    "businessName": "Smith's Plumbing",
    "industry": "Plumbing",
    "phone": "+15035556789",
    "email": "contact@smithsplumbing.com"
  },
  
  "voiceAgentConfig": {
    "agentName": "Sarah",
    "agentPersonality": "friendly",
    "greeting": "Hi, thanks for calling Smith's Plumbing, I'm Sarah. How can I help you today?",
    "collectionFields": {
      "name": true,
      "phone": true,
      "email": false,
      "reason": true,
      "urgency": true
    },
    "emergencyHandling": {
      "enabled": false,                   // User opted OUT of emergency forwarding
      "forwardToNumber": null,            // Not collected
      "triggerMethod": null               // Not collected
    }
  },
  
  "emailConfig": {
    "recipientEmail": "joe@joeshvac.com",
    "summaryEnabled": true
  },
  
  "adminNotification": {
    "emailSent": true,
    "sentAt": "2024-10-31T10:30:05Z",
    "sentTo": "doug@sherpaprompt.com",
    "mailchimpCampaignId": "mc_12345"
  },
  
  "behaviorTracking": {
    "submissionStarted": "2024-10-31T10:00:00Z",
    "submissionCompleted": "2024-10-31T10:30:00Z",
    "stepEvents": [
      {
        "step": 1,
        "action": "entered",
        "timestamp": "2024-10-31T10:00:00Z",
        "timeSpentSeconds": null
      },
      {
        "step": 1,
        "action": "saved",
        "timestamp": "2024-10-31T10:05:00Z",
        "timeSpentSeconds": 300
      },
      {
        "step": 2,
        "action": "entered",
        "timestamp": "2024-10-31T10:05:00Z",
        "timeSpentSeconds": null
      },
      {
        "step": 2,
        "action": "saved",
        "timestamp": "2024-10-31T10:10:00Z",
        "timeSpentSeconds": 300
      }
    ],
    "totalTimeSpentSeconds": 1800,
    "numberOfSessions": 1,
    "lastActiveAt": "2024-10-31T10:30:00Z"
  },
  
  "createdAt": "2024-10-31T10:00:00Z",
  "updatedAt": "2024-10-31T10:30:00Z"
}
```

---

## API Endpoints

### Base URL
- Development: `http://localhost:3001/api`
- Production: `https://api.vasop.com/api`

### Authentication

```typescript
POST /auth/signup
Body: {
  name: string,
  email: string,        // must be unique
  password: string,     // min 8 chars
  phone: string
}
Response: {
  token: string,
  user: { 
    id: ObjectId, 
    name: string, 
    email: string,
    phone: string
  }
}
Note: Creates user in 'users' collection

POST /auth/login
Body: {
  email: string,
  password: string
}
Response: {
  token: string,
  user: { 
    id: ObjectId, 
    name: string, 
    email: string 
  }
}
Note: Updates lastLoginAt in 'users' collection

GET /auth/me
Headers: { Authorization: "Bearer <token>" }
Response: {
  user: { 
    id: ObjectId, 
    name: string, 
    email: string, 
    phone: string,
    createdAt: Date
  }
}
```

### Onboarding Submissions

```typescript
// Save progress (draft - not submitted yet)
POST /onboarding/save
Headers: { Authorization: "Bearer <token>" }
Body: {
  currentStep: number,              // 1-6
  businessProfile: {...},           // partial or complete
  voiceAgentConfig: {...},         // partial or complete
  emailConfig: {...},              // partial or complete
  stepEvent: {                     // Track behavior
    step: number,
    action: "saved",
    timeSpentSeconds: number
  }
}
Response: {
  success: boolean,
  message: "Progress saved",
  currentStep: number,
  lastSavedAt: Date,               // For localStorage comparison
  submissionId: string             // For reference
}
Note: 
- MongoDB unique index ensures only ONE draft per userId
- Updates behaviorTracking.stepEvents and behaviorTracking.lastActiveAt
- If user has existing draft, updates it; otherwise creates new draft

// Get user's draft/submission
GET /onboarding/my-submission
Headers: { Authorization: "Bearer <token>" }
Response: {
  submission: {...},               // full submission object
  status: "draft" | "submitted",
  currentStep: number,             // where they left off
  isSubmitted: boolean,
  lastSavedAt: Date,               // For localStorage comparison
  hasLocalChanges: boolean         // Computed by comparing timestamps
}
Note: Returns user's ONLY draft (if exists) or their submitted submission

// Sync local backup with server
POST /onboarding/sync
Headers: { Authorization: "Bearer <token>" }
Body: {
  localData: {...},                // Data from localStorage
  localLastSavedAt: Date           // Timestamp from localStorage
}
Response: {
  action: "use_server" | "use_local" | "conflict",
  serverData: {...},               // Server's version
  serverLastSavedAt: Date,
  recommendation: string
}
Note: Compares timestamps, returns which version to use

// Final submission (triggers admin email)
POST /onboarding/submit
Headers: { Authorization: "Bearer <token>" }
Body: {
  businessProfile: {...},
  voiceAgentConfig: {...},
  emailConfig: {...}
}
Response: {
  success: boolean,
  submissionId: string,
  message: "Your info has been successfully submitted. Admin will review and contact you soon."
}
Note: 
- Marks draft as submitted (isSubmitted: true)
- Logs submissionCompleted in behaviorTracking
- Calculates totalTimeSpentSeconds
- Sends email to Doug via Mailchimp
```

### Internal Endpoints (for future admin tools if needed)

```typescript
// NO ADMIN DASHBOARD IN MVP1
// Doug receives emails and reviews MongoDB directly

// Internal API for sending admin notification (called automatically)
POST /internal/notify-admin
Body: {
  submissionId: string,
  businessName: string,
  businessEmail: string
}
Response: {
  success: boolean,
  emailSent: boolean
}
```

### Utility Endpoints

```typescript
// Get industry options for dropdown
GET /utils/industries
Response: {
  industries: ["HVAC", "Construction", "Plumbing", "Roofing", "Electrical", "Other"]
}

// Get personality options for dropdown
GET /utils/personalities
Response: {
  personalities: [
    { value: "professional", label: "Professional & Efficient" },
    { value: "friendly", label: "Friendly & Casual" },
    { value: "formal", label: "Formal & Corporate" }
  ]
}

// Generate example greeting
POST /utils/generate-greeting
Body: {
  businessName: string,
  agentName: string,
  personality: string
}
Response: {
  greeting: string  // auto-generated greeting based on inputs
}
```

---

## Frontend Structure

### Page Routes

```
/                           → Landing page with signup/login (public)
/signup                     → Signup form
/login                      → Login form
/onboarding                 → Multi-step onboarding form (protected)
                              - If first time: Start from step 1
                              - If returning: Continue from saved step
                              - Can navigate back to edit previous steps
/status                     → Application status page (protected)
                              - If not submitted: Redirects to /onboarding
                              - If submitted: Shows "Under review" message
```

### Component Structure

```
src/
├── app/
│   ├── page.js                          # Landing page (signup/login)
│   ├── signup/
│   │   └── page.js                      # Signup form
│   ├── login/
│   │   └── page.js                      # Login form
│   ├── onboarding/
│   │   └── page.js                      # Multi-step form (with save & continue)
│   └── status/
│       └── page.js                      # "Under review" status page
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx                   # Logo: "4Trades Voice Agent Onboarding"
│   │   └── Footer.jsx                   # Simple footer
│   │
│   ├── auth/
│   │   ├── SignupForm.jsx               # Signup form
│   │   └── LoginForm.jsx                # Login form
│   │
│   ├── onboarding/
│   │   ├── OnboardingWizard.jsx         # Main wizard container
│   │   ├── StepIndicator.jsx            # Progress indicator (1/6, 2/6, etc.)
│   │   ├── BusinessProfileStep.jsx      # Step 1: Business info
│   │   ├── AgentConfigStep.jsx          # Step 2: Agent config
│   │   ├── CollectionFieldsStep.jsx     # Step 3: What to collect
│   │   ├── EmergencyHandlingStep.jsx    # Step 4: Emergency setup
│   │   ├── EmailConfigStep.jsx          # Step 5: Email config
│   │   ├── ReviewStep.jsx               # Step 6: Review & submit
│   │   └── SaveProgressButton.jsx       # Save & continue later button
│   │
│   ├── status/
│   │   └── UnderReviewCard.jsx          # Status display card
│   │
│   └── ui/                                # Shadcn components (zinc-900/100 theme)
│       ├── button.jsx
│       ├── input.jsx
│       ├── card.jsx
│       ├── form.jsx
│       └── toast.jsx                    # Sonner toast
│
├── lib/
│   ├── api.js                           # API client functions
│   ├── auth.js                          # Auth utilities
│   └── utils.js                         # Helper functions
│
└── hooks/
    ├── useAuth.js                       # Auth hook
    ├── useOnboarding.js                 # Onboarding state + save/restore
    ├── useLocalBackup.js                # localStorage backup/restore logic
    └── useBehaviorTracking.js           # Track time spent, step events
```

### Multi-Step Onboarding Form

The onboarding form has 6 steps:

#### Step 1: Business Profile
```jsx
<BusinessProfileStep>
  <Input label="Business Name" required />
  <Select label="Industry" options={industries} required />
  <Input label="Website" />
  <Input label="Business Phone" required />
  <Input label="Business Email" required />
  <AddressInputs />
  <BusinessHoursInputs />
  <Button>Continue</Button>
</BusinessProfileStep>
```

#### Step 2: Voice Agent Configuration
```jsx
<AgentConfigStep>
  <Input label="Agent Name" placeholder="e.g., Mason, Alex" required />
  <Select label="Personality" options={personalities} required />
  <Textarea label="Greeting Message" rows={4} />
  <Button onClick={generateGreeting}>Auto-Generate Greeting</Button>
  <PreviewCard greeting={greeting} />
  <Button>Continue</Button>
</AgentConfigStep>
```

#### Step 3: Collection Fields
```jsx
<CollectionFieldsStep>
  <h3>What information should your voice agent collect?</h3>
  
  {/* Always required */}
  <Checkbox label="Customer Name" checked disabled />
  <Checkbox label="Phone Number" checked disabled />
  <Checkbox label="Reason for Call" checked disabled />
  
  {/* Optional fields */}
  <Checkbox label="Email Address" />
  <Checkbox label="Urgency Level" />
  <Checkbox label="Property Address" />
  <Checkbox label="Best Time to Call Back" />
  
  {/* Custom fields */}
  <h4>Custom Questions</h4>
  <CustomFieldsList />
  <Button onClick={addCustomField}>+ Add Custom Question</Button>
  
  <Button>Continue</Button>
</CollectionFieldsStep>
```

#### Step 4: Emergency Handling (Optional)
```jsx
<EmergencyHandlingStep>
  <Card className="bg-zinc-100 text-zinc-900">
    <h3>Emergency Call Forwarding (Optional)</h3>
    <p className="text-sm text-zinc-600 mb-4">
      Allow customers to be forwarded to you immediately for urgent issues
    </p>
    
    <Toggle 
      label="Enable emergency call forwarding" 
      checked={emergencyEnabled}
      onChange={setEmergencyEnabled}
    />
  </Card>
  
  {emergencyEnabled && (
    <Card className="bg-zinc-100 text-zinc-900 mt-4">
      <Input 
        label="Forward emergencies to" 
        type="tel" 
        required 
        placeholder="(555) 123-4567"
        description="Phone number to receive emergency calls"
      />
      <RadioGroup label="How should emergencies be triggered?">
        <Radio 
          value="pound_key" 
          label="Customer presses # key (recommended)" 
          description="Customer hears option to press # for emergency"
        />
        <Radio 
          value="keyword" 
          label="Customer says 'emergency'" 
          description="AI detects emergency keywords"
        />
      </RadioGroup>
    </Card>
  )}
  
  {!emergencyEnabled && (
    <p className="text-sm text-zinc-600 mt-4">
      Emergency forwarding is disabled. All calls will follow standard information collection.
    </p>
  )}
  
  <Button>Continue</Button>
</EmergencyHandlingStep>
```

#### Step 5: Email Configuration
```jsx
<EmailConfigStep>
  <Input label="Send call summaries to" type="email" required />
  <p>You'll receive an email after each call with customer details and transcript.</p>
  <Button>Continue</Button>
</EmailConfigStep>
```

#### Step 6: Review & Submit
```jsx
<ReviewStep>
  <Card className="bg-zinc-900 text-zinc-100">
    <h3>Business Profile</h3>
    <DisplayField label="Business Name" value={businessName} />
    <DisplayField label="Industry" value={industry} />
    {/* ... all fields ... */}
    <Button onClick={() => setStep(1)} variant="outline">Edit</Button>
  </Card>
  
  <Card className="bg-zinc-900 text-zinc-100">
    <h3>Voice Agent Configuration</h3>
    {/* ... all agent config ... */}
    <Button onClick={() => setStep(2)} variant="outline">Edit</Button>
  </Card>
  
  {/* ... other sections ... */}
  
  <div className="flex gap-4">
    <Button onClick={handleSave} variant="outline">
      Save & Continue Later
    </Button>
    <Button onClick={handleSubmit} size="lg" className="bg-zinc-900">
      Submit for Review
    </Button>
  </div>
</ReviewStep>
```

---

## Backend Structure

### Module Organization

```
src/
├── main.ts                              # Bootstrap
├── app.module.ts                        # Root module
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   └── dto/
│       ├── signup.dto.ts
│       └── login.dto.ts
│
├── onboarding/
│   ├── onboarding.module.ts
│   ├── onboarding.controller.ts
│   ├── onboarding.service.ts
│   ├── schemas/
│   │   ├── user.schema.ts               # User/auth schema
│   │   └── onboarding.schema.ts         # Onboarding submission schema
│   └── dto/
│       ├── save-progress.dto.ts
│       ├── submit.dto.ts
│       └── sync.dto.ts                  # For localStorage sync
│
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.service.ts         # Mailchimp email service
│   └── templates/
│       └── admin-notification.ts        # Email template for Doug
│
├── utils/
│   ├── utils.module.ts
│   ├── utils.controller.ts
│   └── utils.service.ts
│
├── database/
│   └── database.module.ts               # MongoDB connection
│
└── common/
    ├── guards/
    │   └── jwt-auth.guard.ts
    └── interceptors/
        └── logging.interceptor.ts
```

### Key Services

#### OnboardingService

```typescript
@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Onboarding') private onboardingModel: Model<OnboardingDocument>,
    private notificationsService: NotificationsService
  ) {}

  // Save progress (can call multiple times before submit)
  async saveProgress(userId: ObjectId, data: SaveProgressDto) {
    const now = new Date();
    
    try {
      // Try to find existing draft
      let submission = await this.onboardingModel.findOne({ 
        userId,
        isSubmitted: false 
      });
      
      if (!submission) {
        // Create new draft - MongoDB index ensures only one draft per user
        submission = new this.onboardingModel({
          submissionId: this.generateSubmissionId(),
          userId,
          status: 'draft',
          isSubmitted: false,
          currentStep: data.currentStep,
          lastSavedAt: now,
          behaviorTracking: {
            submissionStarted: now,
            submissionCompleted: null,
            stepEvents: [{
              step: data.currentStep,
              action: 'entered',
              timestamp: now,
              timeSpentSeconds: null
            }],
            totalTimeSpentSeconds: 0,
            numberOfSessions: 1,
            lastActiveAt: now
          },
          ...data
        });
      } else {
        // Update existing draft
        Object.assign(submission, data);
        submission.currentStep = data.currentStep;
        submission.lastSavedAt = now;
        
        // Track behavior
        submission.behaviorTracking.lastActiveAt = now;
        if (data.stepEvent) {
          submission.behaviorTracking.stepEvents.push({
            step: data.stepEvent.step,
            action: data.stepEvent.action,
            timestamp: now,
            timeSpentSeconds: data.stepEvent.timeSpentSeconds
          });
        }
      }
      
      await submission.save();
      
      return { 
        success: true, 
        currentStep: submission.currentStep,
        lastSavedAt: submission.lastSavedAt,
        submissionId: submission.submissionId
      };
      
    } catch (error) {
      // Handle duplicate key error from MongoDB index
      if (error.code === 11000) {
        // Should not happen, but handle gracefully
        const existing = await this.onboardingModel.findOne({ 
          userId, 
          isSubmitted: false 
        });
        if (existing) {
          // Update the existing one
          Object.assign(existing, data);
          existing.currentStep = data.currentStep;
          existing.lastSavedAt = now;
          await existing.save();
          return { 
            success: true, 
            currentStep: existing.currentStep,
            lastSavedAt: existing.lastSavedAt,
            submissionId: existing.submissionId
          };
        }
      }
      throw error;
    }
  }

  // Get user's submission (draft or submitted)
  async getUserSubmission(userId: ObjectId) {
    // Find draft first, if not found, find submitted
    let submission = await this.onboardingModel.findOne({ 
      userId,
      isSubmitted: false 
    });
    
    if (!submission) {
      submission = await this.onboardingModel.findOne({ 
        userId,
        isSubmitted: true 
      });
    }
    
    return submission;
  }

  // Sync local backup with server (resolve conflicts)
  async syncLocalBackup(userId: ObjectId, syncDto: SyncDto) {
    const serverSubmission = await this.onboardingModel.findOne({ 
      userId,
      isSubmitted: false 
    });
    
    if (!serverSubmission) {
      // No server draft, use local
      return {
        action: 'use_local',
        serverData: null,
        serverLastSavedAt: null,
        recommendation: 'No server draft found. Use local data.'
      };
    }
    
    const serverTime = serverSubmission.lastSavedAt.getTime();
    const localTime = new Date(syncDto.localLastSavedAt).getTime();
    
    if (serverTime > localTime) {
      // Server is newer
      return {
        action: 'use_server',
        serverData: serverSubmission,
        serverLastSavedAt: serverSubmission.lastSavedAt,
        recommendation: 'Server has newer data. Use server version.'
      };
    } else if (localTime > serverTime) {
      // Local is newer (network issue probably)
      return {
        action: 'use_local',
        serverData: serverSubmission,
        serverLastSavedAt: serverSubmission.lastSavedAt,
        recommendation: 'Local has newer data. You can restore from local backup.'
      };
    } else {
      // Same timestamp
      return {
        action: 'use_server',
        serverData: serverSubmission,
        serverLastSavedAt: serverSubmission.lastSavedAt,
        recommendation: 'Data is in sync.'
      };
    }
  }

  // Final submission - sends email to Doug
  async submitOnboarding(userId: ObjectId, data: SubmitDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    let submission = await this.onboardingModel.findOne({ 
      userId,
      isSubmitted: false 
    });
    
    if (!submission) {
      submission = new this.onboardingModel({
        submissionId: this.generateSubmissionId(),
        userId,
        behaviorTracking: {
          submissionStarted: new Date(),
          submissionCompleted: null,
          stepEvents: [],
          totalTimeSpentSeconds: 0,
          numberOfSessions: 1,
          lastActiveAt: new Date()
        }
      });
    }
    
    const now = new Date();
    
    // Calculate total time spent
    const startTime = submission.behaviorTracking.submissionStarted.getTime();
    const endTime = now.getTime();
    const totalSeconds = Math.floor((endTime - startTime) / 1000);
    
    // Update with final data
    Object.assign(submission, data);
    submission.status = 'submitted';
    submission.isSubmitted = true;
    submission.submittedAt = now;
    submission.currentStep = 6;
    
    // Update behavior tracking
    submission.behaviorTracking.submissionCompleted = now;
    submission.behaviorTracking.totalTimeSpentSeconds = totalSeconds;
    submission.behaviorTracking.lastActiveAt = now;
    
    await submission.save();
    
    // Send email to Doug via Mailchimp
    const emailSent = await this.notificationsService.sendAdminNotification({
      businessName: submission.businessProfile.businessName,
      businessEmail: user.email,
      businessOwner: user.name,
      submissionId: submission.submissionId
    });
    
    submission.adminNotification = {
      emailSent,
      sentAt: new Date(),
      sentTo: 'doug@sherpaprompt.com',
      mailchimpCampaignId: emailSent ? 'mc_123' : null
    };
    
    await submission.save();
    
    return {
      success: true,
      submissionId: submission.submissionId,
      message: 'Your info has been successfully submitted. Admin will review and contact you soon.'
    };
  }

  private generateSubmissionId(): string {
    const date = new Date().toISOString().split('T')[0];
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `4t-${random}-${date}`;
  }
}
```

#### NotificationsService

```typescript
@Injectable()
export class NotificationsService {
  constructor(
    @Inject('MAILCHIMP_CLIENT') private mailchimpClient: any
  ) {}

  // Send email to Doug when business submits
  async sendAdminNotification(data: {
    businessName: string;
    businessEmail: string;
    businessOwner: string;
    submissionId: string;
  }): Promise<boolean> {
    try {
      const emailContent = {
        to: 'doug@sherpaprompt.com',
        from: 'notifications@4trades.com',
        subject: `${data.businessName} has onboarded for Voice Agent`,
        html: `
          <h2>${data.businessName} Voice Agent Onboarding</h2>
          <p><strong>${data.businessName}</strong> has onboarded their business for the voice agent.</p>
          <p><strong>Owner:</strong> ${data.businessOwner}</p>
          <p><strong>Contact:</strong> ${data.businessEmail}</p>
          <p><strong>Submission ID:</strong> ${data.submissionId}</p>
          <p><strong>Action Required:</strong> Please review and inform them.</p>
          <p>View submission in MongoDB:</p>
          <ul>
            <li>Database: <code>4trades-voice-onboarding</code></li>
            <li>Collection: <code>va-onboarding</code></li>
            <li>Query: <code>{ submissionId: "${data.submissionId}" }</code></li>
          </ul>
        `
      };
      
      await this.mailchimpClient.messages.send(emailContent);
      console.log(`✅ Admin notification sent for: ${data.businessName}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error);
      return false;
    }
  }
}
```

---

## Implementation Checklist

### Phase 1: Design & Setup
- [ ] Configure Tailwind with zinc-900/zinc-100 theme
- [ ] Add Poppins font to project
- [ ] Set up MongoDB connection in NestJS
- [ ] Create User mongoose schema (users collection)
- [ ] Create Onboarding mongoose schema (va-onboarding collection)
- [ ] Create MongoDB indexes:
  - [ ] users: email unique index
  - [ ] va-onboarding: userId + isSubmitted partial unique index (one draft per user)
  - [ ] va-onboarding: submissionId unique index
- [ ] Implement JWT authentication

### Phase 2: Backend APIs
- [ ] Auth endpoints (signup, login, me) - uses users collection
- [ ] Onboarding save progress endpoint with behavior tracking
- [ ] Onboarding get submission endpoint
- [ ] Onboarding sync endpoint (localStorage conflict resolution)
- [ ] Onboarding submit endpoint with behavior tracking
- [ ] Mailchimp integration for admin notifications
- [ ] Utility endpoints (industries, personalities, generate greeting)
- [ ] Error handling for duplicate draft (MongoDB index constraint)

### Phase 3: Frontend Core
- [ ] Landing page with signup/login
- [ ] Signup form
- [ ] Login form
- [ ] Header with logo: "4Trades Voice Agent Onboarding"
- [ ] Toast notifications setup (Sonner)

### Phase 4: Onboarding Form
- [ ] OnboardingWizard with step navigation and save/restore
- [ ] All 6 step components (zinc-900/100 styling)
- [ ] Step indicator (1/6, 2/6, etc.)
- [ ] Save & Continue Later button (auto-save on each step)
- [ ] Back button to edit previous steps
- [ ] Final submit button
- [ ] localStorage backup mechanism:
  - [ ] Save form data to localStorage on every change
  - [ ] Save lastSavedAt timestamp
  - [ ] On page load, check server vs localStorage timestamps
  - [ ] Show restore prompt if localStorage is newer
  - [ ] Clear localStorage after successful submit
- [ ] Behavior tracking:
  - [ ] Track time spent on each step
  - [ ] Log step entered/saved/abandoned events
  - [ ] Send tracking data with save/submit requests

### Phase 5: Status Page
- [ ] "Under review" status page
- [ ] Redirect logic (not submitted → onboarding, submitted → status)

### Phase 6: Integration & Testing
- [ ] Connect frontend to backend APIs
- [ ] Form validation with Zod
- [ ] Save progress functionality
- [ ] Restore progress on login
- [ ] localStorage backup/restore flow
- [ ] Test conflict resolution (server vs localStorage)
- [ ] Submit triggers admin email
- [ ] Toast notifications on actions
- [ ] Test MongoDB index constraint (one draft per user)
- [ ] Test behavior tracking data collection
- [ ] End-to-end testing

### Phase 7: Polish
- [ ] Responsive design (mobile-friendly)
- [ ] Loading states
- [ ] Error messages
- [ ] Consistent zinc-900/100 theming
- [ ] Poppins font applied everywhere

---

## Environment Variables

### Backend (.env)
```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/vasop
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vasop

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000

# Mailchimp
MAILCHIMP_API_KEY=your-mailchimp-api-key
MAILCHIMP_SERVER_PREFIX=us1
ADMIN_EMAIL=doug@sherpaprompt.com
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Example Flow

### Business Owner Onboarding

1. **Signup**
   ```
   POST /api/auth/signup
   { name: "Joe Smith", email: "joe@joeshvac.com", password: "...", phone: "..." }
   → Returns JWT token
   → Redirects to /onboarding (starts at step 1)
   ```

2. **Fill Onboarding Form (can save progress)**
   - Step 1: Business profile → Auto-saves
   - Step 2: Agent config → Auto-saves
   - Step 3: Collection fields → Auto-saves
   - Step 4: Emergency handling → Auto-saves
   - Step 5: Email config → Auto-saves
   - Step 6: Review → Can go back to edit any step

3. **Save Progress (anytime during onboarding)**
   ```
   POST /api/onboarding/save
   Headers: { Authorization: "Bearer <token>" }
   Body: { currentStep: 3, ...partial data... }
   → Returns success
   ```

4. **Return Later (logs in again)**
   ```
   POST /api/auth/login
   { email: "joe@joeshvac.com", password: "..." }
   → Returns JWT token
   
   GET /api/onboarding/my-submission
   → Returns { currentStep: 3, isSubmitted: false, ...data }
   → Frontend redirects to /onboarding at step 3
   ```

5. **Final Submit**
   ```
   POST /api/onboarding/submit
   Headers: { Authorization: "Bearer <token>" }
   Body: { ...all complete form data... }
   → Triggers admin email to Doug
   → Toast: "Your info has been successfully submitted. Admin will review and contact you soon."
   → Redirects to /status
   ```

6. **View Status**
   ```
   GET /api/onboarding/my-submission
   → Returns { isSubmitted: true, status: "submitted", submittedAt: "..." }
   → Shows "Under review" page
   ```

### Doug's Manual Review & Deployment (No Dashboard)

1. **Doug Receives Email**
   ```
   Subject: Joe's HVAC has onboarded for Voice Agent
   
   Joe's HVAC has onboarded their business for the voice agent.
   Contact: joe@joeshvac.com
   Submission ID: 4t-ABC-2024-10-31
   
   Action Required: Please review and inform them.
   View in MongoDB: va-onboarding collection, ID: 4t-ABC-2024-10-31
   ```

2. **Doug Reviews Data in MongoDB**
   - Opens MongoDB Compass or CLI
   - Finds submission by ID: `4t-ABC-2024-10-31`
   - Reviews all business information

3. **Doug Manually Creates Voice Agent**
   - Creates config files in ahca-server:
     ```
     /configs/businesses/joes-hvac/
       config.json
       prompt_rules.json
     ```
   - Buys Twilio number for the business
   - Updates businesses.json mapping
   - Tests the voice agent

4. **Doug Contacts Business Owner**
   - Sends email to joe@joeshvac.com
   - Provides phone number and instructions
   - No status update in platform (MVP1 simplicity)
   
**Note**: MVP1 has no admin dashboard. Doug works directly with MongoDB and email.

---

## What Gets Deployed (Manual Process)

When admin deploys a business, they create files similar to superior-fencing:

### config.json
```json
{
  "businessId": "joes-hvac",
  "businessName": "Joe's HVAC",
  "phoneNumber": "+15035559999",
  "features": {
    "ragEnabled": false,
    "appointmentBookingEnabled": false,
    "emergencyCallHandling": true,
    "basicInfoCollection": true
  },
  "email": {
    "provider": "mailchimp",
    "fromEmail": "joe@joeshvac.com",
    "fromName": "Joe's HVAC"
  },
  "companyInfo": {
    "name": "Joe's HVAC",
    "phone": "+15035555678",
    "email": "service@joeshvac.com",
    "address": "Portland, OR",
    "hours": {
      "monday_friday": "8 AM - 6 PM",
      "saturday": "9 AM - 4 PM",
      "sunday": "Closed"
    }
  },
  "promptConfig": {
    "agentName": "Alex",
    "agentPersonality": "professional",
    "greeting": "Thanks for calling Joe's HVAC..."
  }
}
```

### prompt_rules.json
```json
{
  "realtimeSystem": {
    "full": "You are Alex, Joe's HVAC's professional virtual assistant..."
  },
  "userInfoCollection": {
    "fields": ["name", "phone", "email", "reason", "urgency"],
    "emergencyForwarding": {
      "enabled": true,
      "forwardTo": "+15035555678"
    }
  }
}
```

### businesses.json update
```json
{
  "phoneToBusinessMap": {
    "+19713511965": "sherpaprompt",
    "+15035484387": "superior-fencing",
    "+15035559999": "joes-hvac"
  }
}
```

---

## Future Enhancements (Not MVP1)

- Automated config file generation
- Automated Twilio number provisioning
- RAG/knowledge base support
- Appointment booking integration
- Real-time preview of voice agent
- Automated testing of voice agent
- Analytics dashboard for businesses
- Self-service editing of voice agent

**For MVP1, keep it simple: collect data, store in MongoDB, manual deployment by admin.**

---

## Development Timeline

- **Week 1**: Backend (users collection, va-onboarding collection, indexes, auth, save/submit APIs with behavior tracking, Mailchimp)
- **Week 2**: Frontend (signup/login, onboarding form with save/restore, localStorage backup)
- **Week 3**: Status page, conflict resolution UI, polish zinc-900/100 theme, Poppins font
- **Week 4**: Testing (behavior tracking, localStorage sync, MongoDB constraints), bug fixes, deployment

## Design Specifications

### Color Palette
- **Primary Dark**: `zinc-900` (#18181b)
- **Primary Light**: `zinc-100` (#f4f4f5)
- **Text on Dark**: `text-zinc-100`
- **Text on Light**: `text-zinc-900`
- **Borders**: `border-zinc-300` or `border-zinc-700`

### Typography
- **Font Family**: Poppins (all weights)
- **Headings**: font-semibold or font-bold
- **Body**: font-normal or font-medium
- **Import**: Google Fonts Poppins

### Component Styling
- **Buttons**: `bg-zinc-900 text-zinc-100 hover:bg-zinc-800`
- **Input Fields**: `bg-zinc-100 border-zinc-300 text-zinc-900`
- **Cards**: `bg-zinc-900 text-zinc-100` or `bg-zinc-100 text-zinc-900`
- **Logo**: Simple text "4Trades Voice Agent Onboarding" in Poppins font-bold

### Example Tailwind Config
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          dark: '#18181b', // zinc-900
          light: '#f4f4f5', // zinc-100
        },
      },
    },
  },
}
```

---

## Local Backup Implementation

### Frontend localStorage Strategy

```typescript
// lib/localStorage.js
const LOCAL_BACKUP_KEY = '4trades-onboarding-backup';

export const saveToLocalBackup = (data, currentStep) => {
  const backup = {
    data,
    currentStep,
    lastSavedAt: new Date().toISOString(),
    version: '1.0'
  };
  localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(backup));
};

export const getLocalBackup = () => {
  const backup = localStorage.getItem(LOCAL_BACKUP_KEY);
  return backup ? JSON.parse(backup) : null;
};

export const clearLocalBackup = () => {
  localStorage.removeItem(LOCAL_BACKUP_KEY);
};

export const compareWithServer = async (serverData, serverLastSavedAt) => {
  const localBackup = getLocalBackup();
  
  if (!localBackup) {
    return { useServer: true, reason: 'no_local_backup' };
  }
  
  const localTime = new Date(localBackup.lastSavedAt).getTime();
  const serverTime = new Date(serverLastSavedAt).getTime();
  
  if (localTime > serverTime) {
    return { 
      useServer: false, 
      reason: 'local_newer',
      timeDiff: (localTime - serverTime) / 1000 // seconds
    };
  }
  
  return { useServer: true, reason: 'server_newer_or_equal' };
};
```

### useLocalBackup Hook

```typescript
// hooks/useLocalBackup.js
import { useState, useEffect } from 'react';
import { saveToLocalBackup, getLocalBackup, clearLocalBackup, compareWithServer } from '@/lib/localStorage';

export const useLocalBackup = (serverData, serverLastSavedAt) => {
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [localBackup, setLocalBackup] = useState(null);
  
  useEffect(() => {
    const checkBackup = async () => {
      const backup = getLocalBackup();
      if (!backup || !serverData) return;
      
      const comparison = await compareWithServer(serverData, serverLastSavedAt);
      
      if (!comparison.useServer && comparison.timeDiff > 5) {
        // Local is newer by more than 5 seconds
        setLocalBackup(backup);
        setShowRestorePrompt(true);
      }
    };
    
    checkBackup();
  }, [serverData, serverLastSavedAt]);
  
  const restoreFromLocal = () => {
    setShowRestorePrompt(false);
    return localBackup;
  };
  
  const useServerData = () => {
    setShowRestorePrompt(false);
    clearLocalBackup();
  };
  
  return {
    showRestorePrompt,
    localBackup,
    restoreFromLocal,
    useServerData,
    saveToLocalBackup,
    clearLocalBackup
  };
};
```

### Restore Prompt Component

```jsx
// components/onboarding/RestorePrompt.jsx
export const RestorePrompt = ({ localTime, serverTime, onRestore, onUseServer }) => {
  return (
    <div className="fixed inset-0 bg-zinc-900/50 flex items-center justify-center z-50">
      <Card className="bg-zinc-100 text-zinc-900 max-w-md p-6">
        <h3 className="font-bold text-lg mb-4">Restore Local Changes?</h3>
        <p className="mb-4">
          We found unsaved changes from your last session that are newer than what's on the server.
        </p>
        <div className="text-sm text-zinc-600 mb-6">
          <p>Local: {new Date(localTime).toLocaleString()}</p>
          <p>Server: {new Date(serverTime).toLocaleString()}</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={onUseServer} variant="outline">
            Use Server Version
          </Button>
          <Button onClick={onRestore} className="bg-zinc-900">
            Restore Local Changes
          </Button>
        </div>
      </Card>
    </div>
  );
};
```

---

## Behavior Tracking & Analytics

### What We Track

1. **Submission Flow Events:**
   - `submissionStarted` - When user begins onboarding
   - `submissionCompleted` - When user submits final form
   - `stepAbandoned` - When user leaves without saving

2. **Step Events:**
   - `entered` - User navigates to a step
   - `saved` - User saves progress on a step
   - Time spent on each step (in seconds)

3. **Session Metrics:**
   - Total time from start to completion
   - Number of sessions (login count while working on draft)
   - Last active timestamp

### Analytics Queries (MongoDB)

```javascript
// Find submissions with high drop-off rate
db['va-onboarding'].aggregate([
  {
    $match: { isSubmitted: false }
  },
  {
    $group: {
      _id: "$currentStep",
      count: { $sum: 1 }
    }
  },
  {
    $sort: { count: -1 }
  }
])

// Average time spent on each step
db['va-onboarding'].aggregate([
  {
    $match: { isSubmitted: true }
  },
  {
    $unwind: "$behaviorTracking.stepEvents"
  },
  {
    $group: {
      _id: "$behaviorTracking.stepEvents.step",
      avgTime: { $avg: "$behaviorTracking.stepEvents.timeSpentSeconds" }
    }
  }
])

// Completion rate and average completion time
db['va-onboarding'].aggregate([
  {
    $facet: {
      completed: [
        { $match: { isSubmitted: true } },
        { $count: "count" },
        {
          $project: {
            count: 1,
            avgCompletionTime: { $avg: "$behaviorTracking.totalTimeSpentSeconds" }
          }
        }
      ],
      abandoned: [
        { $match: { isSubmitted: false } },
        { $count: "count" }
      ]
    }
  }
])
```

---

**Document Version**: 1.0  
**Last Updated**: October 31, 2024  
**Status**: Ready for implementation

