# MongoDB Database Guide - Simple Explanation

## Overview

This guide explains in simple terms how the MongoDB database works for the 4Trades Voice Agent Onboarding platform. Think of MongoDB collections as spreadsheets - each row is a document.

---

## Two Collections (Two Spreadsheets)

### **Collection 1: `users`** - Who's Logged In
### **Collection 2: `va-onboarding`** - Business Submissions

---

## Collection 1: `users`

**Purpose:** Store account login information

**Rule:** One row per person who signs up

### Example Document:
```json
{
  "_id": "abc123",
  "email": "joe@joeshvac.com",      // Login email
  "password": "hashed...",           // Encrypted password
  "name": "Joe Smith",               // Owner name
  "phone": "(555) 123-4567",
  "role": "business_owner",
  "lastLoginAt": "Nov 1, 10:30 AM"   // Last time they logged in
}
```

**Always: 1 user = 1 document** ✓

---

## Collection 2: `va-onboarding`

**Purpose:** Store the onboarding form data

**Links to users collection via `userId` field**

**Important Rule:** MongoDB enforces **only ONE draft per user** (using unique index)

---

## Real-World Scenarios

### **Scenario 1: User Just Started Onboarding (DRAFT)**

Joe signs up, fills Step 1, clicks "Save & Continue Later"

```json
{
  "_id": "xyz789",
  "userId": "abc123",                    // ← Links to Joe in users collection
  "submissionId": "4t-ABC-2024-11-01",
  
  "isSubmitted": false,                  // ← Still a DRAFT
  "status": "draft",
  "currentStep": 1,                      // ← Joe stopped at Step 1
  "lastSavedAt": "Nov 1, 10:15 AM",
  
  "businessProfile": {
    "businessName": "Joe's HVAC",
    "industry": "HVAC",
    "phone": "(555) 123-4567",
    // ... only Step 1 fields filled
  },
  
  "voiceAgentConfig": {},                // ← Empty, hasn't reached Step 2 yet
  "emailConfig": {},                     // ← Empty
  
  "behaviorTracking": {
    "submissionStarted": "Nov 1, 10:00 AM",
    "numberOfSessions": 1,
    "stepEvents": [
      {
        "step": 1,
        "action": "saved",
        "timestamp": "Nov 1, 10:15 AM",
        "timeSpentSeconds": 900
      }
    ]
  }
}
```

**Key Points:**
- `isSubmitted: false` = It's a draft
- `currentStep: 1` = They're still on Step 1
- Only some fields are filled
- Most nested objects are empty

---

### **Scenario 2: User Continues, Saves Progress (DRAFT)**

Joe logs back in next day, completes Steps 2-4, saves again

**Same document gets updated:**
```json
{
  "_id": "xyz789",                       // ← SAME document ID
  "userId": "abc123",
  "submissionId": "4t-ABC-2024-11-01",
  
  "isSubmitted": false,                  // ← Still DRAFT
  "status": "draft",
  "currentStep": 4,                      // ← Now at Step 4
  "lastSavedAt": "Nov 1, 2:30 PM",       // ← Updated timestamp
  
  "businessProfile": {                   // ← Complete now
    "businessName": "Joe's HVAC",
    "industry": "HVAC",
    "phone": "(555) 123-4567",
    "email": "contact@joeshvac.com",
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
  
  "voiceAgentConfig": {                  // ← Now filled (Steps 2-4)
    "agentName": "Alex",
    "agentPersonality": "professional",
    "greeting": "Thanks for calling Joe's HVAC...",
    "collectionFields": {
      "name": true,
      "phone": true,
      "email": true,
      "reason": true,
      "urgency": true,
      "propertyAddress": false
    },
    "emergencyHandling": {
      "enabled": true,
      "forwardToNumber": "(555) 987-6543",
      "triggerMethod": "pound_key"
    }
  },
  
  "emailConfig": {},                     // ← Still empty (Step 5 not done yet)
  
  "behaviorTracking": {
    "submissionStarted": "Nov 1, 10:00 AM",
    "numberOfSessions": 2,               // ← Came back twice
    "lastActiveAt": "Nov 1, 2:30 PM",
    "stepEvents": [
      { "step": 1, "action": "saved", "timestamp": "Nov 1, 10:15 AM" },
      { "step": 2, "action": "entered", "timestamp": "Nov 1, 2:00 PM" },
      { "step": 2, "action": "saved", "timestamp": "Nov 1, 2:10 PM" },
      { "step": 3, "action": "saved", "timestamp": "Nov 1, 2:20 PM" },
      { "step": 4, "action": "saved", "timestamp": "Nov 1, 2:30 PM" }
    ]
  }
}
```

**What Changed:**
- `currentStep`: 1 → 4
- `lastSavedAt`: Updated to latest time
- More fields now populated
- `numberOfSessions`: 1 → 2
- More step events recorded

**Important:** This is the **SAME document**, not a new one! MongoDB's unique index ensures only ONE draft exists per user.

---

### **Scenario 3: User Submits Final Form (SUBMITTED)**

Joe completes all 6 steps and clicks "Submit for Review"

**Same document, now marked as submitted:**
```json
{
  "_id": "xyz789",                       // ← SAME document ID
  "userId": "abc123",
  "submissionId": "4t-ABC-2024-11-01",
  
  "isSubmitted": true,                   // ← NOW SUBMITTED ✓
  "status": "submitted",
  "submittedAt": "Nov 1, 3:45 PM",       // ← NEW: Submission timestamp
  "currentStep": 6,                      // ← Completed all steps
  "lastSavedAt": "Nov 1, 3:45 PM",
  
  "businessProfile": {
    /* ALL fields filled and complete */
  },
  
  "voiceAgentConfig": {
    "agentName": "Alex",
    "agentPersonality": "professional",
    "greeting": "Thanks for calling Joe's HVAC, I'm Alex...",
    "collectionFields": {
      "name": true,
      "phone": true,
      "email": true,
      "reason": true,
      "urgency": true,
      "propertyAddress": true,
      "customFields": [
        {
          "label": "What type of HVAC system do you have?",
          "required": false
        }
      ]
    },
    "emergencyHandling": {
      "enabled": true,
      "forwardToNumber": "(555) 987-6543",
      "triggerMethod": "pound_key"
    }
  },
  
  "emailConfig": {
    "recipientEmail": "joe@joeshvac.com",
    "summaryEnabled": true
  },
  
  "adminNotification": {                 // ← NEW: Email notification tracking
    "emailSent": true,
    "sentAt": "Nov 1, 3:45 PM",
    "sentTo": "doug@sherpaprompt.com",
    "mailchimpCampaignId": "mc_12345"
  },
  
  "behaviorTracking": {
    "submissionStarted": "Nov 1, 10:00 AM",
    "submissionCompleted": "Nov 1, 3:45 PM",  // ← NEW: Completion timestamp
    "totalTimeSpentSeconds": 21300,           // ← Total time: ~6 hours
    "numberOfSessions": 2,
    "stepEvents": [
      /* All step events recorded */
    ]
  },
  
  "createdAt": "Nov 1, 10:00 AM",
  "updatedAt": "Nov 1, 3:45 PM"
}
```

**What Changed:**
- `isSubmitted`: false → **true** ✓
- `status`: "draft" → "submitted"
- `submittedAt`: Now has timestamp
- `adminNotification`: Email sent to Doug
- `behaviorTracking.submissionCompleted`: Marked complete
- All fields are now populated

**Now:**
- User sees "Under Review" status page
- Doug receives email notification
- User cannot edit anymore (MVP1)

---

### **Scenario 4: Emergency Forwarding DISABLED**

If a user chooses to **disable** emergency forwarding in Step 4:

```json
{
  "voiceAgentConfig": {
    "agentName": "Sarah",
    "agentPersonality": "friendly",
    "greeting": "Hi, thanks for calling Smith's Plumbing...",
    "collectionFields": {
      "name": true,
      "phone": true,
      "email": false,              // ← User chose not to collect email
      "reason": true,
      "urgency": false             // ← User chose not to collect urgency
    },
    "emergencyHandling": {
      "enabled": false,            // ← Emergency forwarding DISABLED
      "forwardToNumber": null,     // ← No number collected
      "triggerMethod": null        // ← No trigger method
    }
  }
}
```

**Key Point:** When `enabled: false`, the form doesn't collect forward number or trigger method.

---

### **Scenario 5: User Adds Custom Questions**

If a user adds custom questions in Step 3:

```json
{
  "voiceAgentConfig": {
    "collectionFields": {
      "name": true,
      "phone": true,
      "email": true,
      "reason": true,
      "customFields": [
        {
          "label": "What type of HVAC system do you have?",
          "required": false
        },
        {
          "label": "How old is your system?",
          "required": true          // ← This one is required
        },
        {
          "label": "When did you last have maintenance?",
          "required": false
        }
      ]
    }
  }
}
```

---

## How Collections Connect

```
users collection                va-onboarding collection
┌──────────────┐               ┌──────────────────────┐
│ _id: abc123  │←──────────────│ userId: abc123       │
│ email: joe@  │  references   │ submissionId: 4t-... │
│ name: Joe    │               │ businessProfile: {}  │
│ phone: 555-  │               │ voiceAgentConfig: {} │
└──────────────┘               │ isSubmitted: false   │
                               └──────────────────────┘
```

**To find all info about Joe:**
1. Query `users` collection by email → get `_id: abc123`
2. Query `va-onboarding` collection by `userId: abc123` → get submission

---

## Quick Lookup Guide

### **Common Questions:**

**"Is Joe logged in?"**
- Collection: `users`
- Check: `lastLoginAt` timestamp

**"Has Joe submitted the form?"**
- Collection: `va-onboarding`
- Check: `isSubmitted` field (true/false)

**"Where did Joe stop?"**
- Collection: `va-onboarding`
- Check: `currentStep` field (1-6)

**"When did Joe submit?"**
- Collection: `va-onboarding`
- Check: `submittedAt` field

**"Did Doug get the email?"**
- Collection: `va-onboarding`
- Check: `adminNotification.emailSent` (true/false)

**"Did the user enable emergency forwarding?"**
- Collection: `va-onboarding`
- Check: `voiceAgentConfig.emergencyHandling.enabled`

**"What's the emergency phone number?"**
- Collection: `va-onboarding`
- Check: `voiceAgentConfig.emergencyHandling.forwardToNumber`

**"How long did it take Joe to complete?"**
- Collection: `va-onboarding`
- Check: `behaviorTracking.totalTimeSpentSeconds`

**"How many times did Joe come back?"**
- Collection: `va-onboarding`
- Check: `behaviorTracking.numberOfSessions`

---

## Important Database Rules

### **1. One User = One Document in `users` ✓**
- Each signup creates exactly one user document
- Email is unique (enforced by MongoDB index)

### **2. One User = One DRAFT at a time in `va-onboarding` ✓**
- MongoDB unique index enforces this
- Index: `{ userId: 1, isSubmitted: 1 }` where `isSubmitted: false`
- If user tries to create another draft, MongoDB throws error

### **3. Draft Becomes Submission (Same Document)**
- User's draft document gets updated when they submit
- `isSubmitted` changes from `false` → `true`
- Same `_id`, same document, just updated fields

### **4. After Submission, User Can't Edit (MVP1)**
- Once `isSubmitted: true`, no more edits allowed
- User sees status page only
- For future: Could allow multiple submissions per user

---

## MongoDB Indexes

### **users collection:**
```javascript
// Ensure unique emails
db.users.createIndex({ email: 1 }, { unique: true })
```

### **va-onboarding collection:**
```javascript
// Ensure only ONE draft per user
db['va-onboarding'].createIndex(
  { userId: 1, isSubmitted: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { isSubmitted: false },
    name: "one_draft_per_user"
  }
)

// Fast lookup by submission ID
db['va-onboarding'].createIndex({ submissionId: 1 }, { unique: true })

// Fast lookup by user ID
db['va-onboarding'].createIndex({ userId: 1 })

// Fast queries for submitted forms
db['va-onboarding'].createIndex({ status: 1, submittedAt: -1 })
```

---

## Example MongoDB Queries

### **Find Joe's account:**
```javascript
db.users.findOne({ email: "joe@joeshvac.com" })
```

### **Find Joe's draft or submission:**
```javascript
db['va-onboarding'].findOne({ userId: ObjectId("abc123") })
```

### **Find only Joe's draft:**
```javascript
db['va-onboarding'].findOne({ 
  userId: ObjectId("abc123"),
  isSubmitted: false 
})
```

### **Find all submitted forms:**
```javascript
db['va-onboarding'].find({ isSubmitted: true }).sort({ submittedAt: -1 })
```

### **Find forms waiting for Doug (submitted today):**
```javascript
db['va-onboarding'].find({ 
  isSubmitted: true,
  submittedAt: { $gte: new Date("2024-11-01") }
})
```

### **Count how many users have submitted:**
```javascript
db['va-onboarding'].countDocuments({ isSubmitted: true })
```

### **Count drafts (incomplete submissions):**
```javascript
db['va-onboarding'].countDocuments({ isSubmitted: false })
```

### **Find all businesses with emergency forwarding enabled:**
```javascript
db['va-onboarding'].find({ 
  "voiceAgentConfig.emergencyHandling.enabled": true 
})
```

---

## Visual Summary

**The Journey of ONE Document:**

```
Step 1: User signs up
┌─────────────────────────────┐
│ users collection            │
│ { email, password, name }   │
└─────────────────────────────┘

Step 2: User starts onboarding
┌─────────────────────────────┐
│ va-onboarding collection    │
│ isSubmitted: false          │  ← DRAFT created
│ currentStep: 1              │
│ businessProfile: { ... }    │
└─────────────────────────────┘

Step 3: User saves progress
┌─────────────────────────────┐
│ va-onboarding collection    │
│ isSubmitted: false          │  ← Still DRAFT
│ currentStep: 3              │  ← Updated
│ lastSavedAt: [new time]     │  ← Updated
└─────────────────────────────┘

Step 4: User submits
┌─────────────────────────────┐
│ va-onboarding collection    │
│ isSubmitted: true           │  ← SUBMITTED ✓
│ currentStep: 6              │
│ submittedAt: [timestamp]    │  ← New field
│ adminNotification: {...}    │  ← Email sent
└─────────────────────────────┘
```

**Same document, different stages!** 🎯

---

## Tips for Doug (Admin)

**To review a submission:**
1. Check email for submission ID (e.g., `4t-ABC-2024-11-01`)
2. Open MongoDB Compass or CLI
3. Query: `db['va-onboarding'].findOne({ submissionId: "4t-ABC-2024-11-01" })`
4. Review all fields
5. Manually create voice agent config in ahca-server

**To see all pending submissions:**
```javascript
db['va-onboarding'].find({ 
  isSubmitted: true 
}).sort({ submittedAt: -1 })
```

**To check if email was sent:**
```javascript
db['va-onboarding'].findOne(
  { submissionId: "4t-ABC-2024-11-01" },
  { adminNotification: 1 }
)
```

---

**Simple Mental Model:**

Think of `va-onboarding` as a **single form that saves its progress**:
- Starts as draft (`isSubmitted: false`)
- Gets updated as user progresses
- Becomes submission when user clicks "Submit" (`isSubmitted: true`)
- All in the same document! 📝

---

**Document Version:** 1.0  
**Last Updated:** November 1, 2024  
**Status:** Ready for Implementation

