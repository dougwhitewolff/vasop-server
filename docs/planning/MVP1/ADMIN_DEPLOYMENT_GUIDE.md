# Admin Deployment Guide - MVP1

## Overview

This guide shows how to manually deploy a voice agent for a business after they submit the onboarding form.

**Process**: Business submits → Doug gets email → Review in MongoDB → Create configs → Deploy → Contact business

**Note**: MVP1 has no admin dashboard. Developer works directly with MongoDB and receives email notifications.

---

## Step-by-Step Deployment Process

### Step 1: Receive Email Notification

When a business completes onboarding, Doug receives an automated email via Mailchimp:

```
Subject: [Business Name] has onboarded for Voice Agent

[Business Name] has onboarded their business for the voice agent.

Contact: [business email]
Submission ID: 4t-ABC-2024-10-31

Action Required: Please review and inform them.

View submission in MongoDB: va-onboarding collection, ID: 4t-ABC-2024-10-31
```

### Step 2: Review Submission in MongoDB

1. Open MongoDB Compass (or use CLI/Atlas web interface)
2. Connect to database
3. Navigate to `va-onboarding` collection
4. Find document by `submissionId: "4t-ABC-2024-10-31"`
5. Review all information:
   - businessProfile (name, industry, phone, email, address, hours)
   - voiceAgentConfig (agent name, personality, greeting, collection fields, emergency)
   - emailConfig (where to send summaries)
6. Verify completeness and accuracy

### Step 3: Generate Business ID

Convert business name to a URL-friendly ID:

```
Business Name: "Joe's HVAC Service"
Business ID: "joes-hvac"

Rules:
- Lowercase
- Replace spaces with hyphens
- Remove special characters (', &, etc.)
- Keep it short and clear
- Example: "Joe's HVAC Service" → "joes-hvac"
```

### Step 4: Create Config Files in ahca-server

Navigate to: `/ahca-server/configs/businesses/`

Create new directory: `/ahca-server/configs/businesses/{businessId}/`

#### Create `config.json`

**Template:**
```json
{
  "businessId": "{businessId}",
  "businessName": "{from submission: businessProfile.businessName}",
  "phoneNumber": "{assigned Twilio number}",
  "description": "{businessProfile.businessName} - {businessProfile.industry}",
  
  "features": {
    "ragEnabled": false,
    "appointmentBookingEnabled": false,
    "emergencyCallHandling": true,
    "basicInfoCollection": true
  },
  
  "database": {
    "collectionName": "{businessId}_knowledge_base",
    "vectorIndexName": "{businessId}_vector_index",
    "note": "RAG is disabled but collection/index names reserved for future use"
  },
  
  "calendar": {
    "provider": "disabled",
    "note": "Calendar integration disabled - no appointment booking for MVP1"
  },
  
  "email": {
    "provider": "mailchimp",
    "apiKey": "${MAILCHIMP_API_KEY}",
    "fromEmail": "{from submission: emailConfig.recipientEmail}",
    "fromName": "{from submission: businessProfile.businessName}",
    "note": "Using shared Mailchimp account"
  },
  
  "sms": {
    "enabled": true,
    "adminNumbers": ["{from submission: businessOwner.phone}"]
  },
  
  "companyInfo": {
    "name": "{from submission: businessProfile.businessName}",
    "phone": "{from submission: businessProfile.phone}",
    "email": "{from submission: businessProfile.email}",
    "website": "{from submission: businessProfile.website}",
    "address": "{from submission: businessProfile.address.city}, {businessProfile.address.state}",
    "services": [
      "{infer from industry or ask business owner}"
    ],
    "hours": {
      "monday_friday": "{from submission: businessProfile.hours.monday_friday}",
      "saturday": "{from submission: businessProfile.hours.saturday}",
      "sunday": "{from submission: businessProfile.hours.sunday}"
    },
    "emergencyContact": {
      "available": true,
      "phone": "{from submission: voiceAgentConfig.emergencyHandling.forwardToNumber}",
      "instructions": "Press # for emergency or time-sensitive issues"
    }
  },
  
  "promptConfig": {
    "agentName": "{from submission: voiceAgentConfig.agentName}",
    "agentPersonality": "{from submission: voiceAgentConfig.agentPersonality}",
    "greeting": "{from submission: voiceAgentConfig.greeting}"
  },
  
  "agent": {
    "name": "{from submission: voiceAgentConfig.agentName}",
    "role": "Virtual Assistant",
    "personality": "{from submission: voiceAgentConfig.agentPersonality}",
    "primaryFunction": "Information collection and emergency routing"
  },
  
  "twilio": {
    "note": "Twilio number assigned: {Twilio number}",
    "emergencyHandling": {
      "enabled": true,
      "trigger": "user presses # or mentions emergency",
      "action": "Route to emergency handler function"
    }
  }
}
```

#### Create `prompt_rules.json`

**Template:**
```json
{
  "realtimeSystem": {
    "full": "You are {voiceAgentConfig.agentName}, {businessProfile.businessName}'s {voiceAgentConfig.agentPersonality} virtual assistant. Your role is to collect customer information and handle emergency routing.\n\n{businessProfile.businessName} Services:\n{list services here}\n\nYour Capabilities:\n- Collect customer {list collectionFields}\n- Handle emergency situations by routing to on-call team\n- Provide basic company information\n- Take messages for team follow-up\n- Handle interruptions gracefully\n\nCRITICAL EMERGENCY HANDLING:\n- ONLY if user presses the # key, connect to on-call team right away\n- DO NOT assume emergency based on words like 'urgent', 'emergency', or 'time-sensitive'\n- Emergency response (ONLY for # key): \"I understand this is urgent. Let me connect you with our on-call team right away.\"\n\nCRITICAL INFORMATION COLLECTION:\n- ALWAYS collect reason first: \"What are you calling about?\"\n- Then collect name: \"Could I get your name?\"\n- Confirm name: \"Thanks — I heard you say your name is [name], is that right?\"\n- Then collect phone: \"What's the best phone number to reach you at?\"\n{if email enabled: \"- Then collect email: 'Do you have an email address?'\"}\n{if urgency enabled: \"- Ask about urgency: 'Would you like us to call you back on the next business day?'\"}\n- After collecting all info, provide FINAL CONFIRMATION\n- NEVER use placeholder names, phone numbers, or information\n\nGuidelines:\n- Be {voiceAgentConfig.agentPersonality}, courteous, and efficient\n- Keep responses concise and focused\n- Stay on script for consistency\n- Don't attempt to schedule appointments\n- For complex questions, note them for team follow-up\n- Allow customers to correct information\n\nOpening behavior:\n- ALWAYS start with this EXACT greeting on first turn: \"{voiceAgentConfig.greeting}\"\n\nImportant: Parts of calls may be recorded to improve service."
  },
  
  "userInfoCollection": {
    "systemPrompt": "You're a {voiceAgentConfig.agentPersonality} voice assistant for {businessProfile.businessName}. Sound efficient and courteous while collecting customer information.",
    "rules": [
      "Collect {list fields from collectionFields}",
      "Always confirm information",
      "Keep responses professional but brief"
    ],
    "closing": "Your job is to collect information efficiently."
  },
  
  "extractUserInfo": {
    "systemPrompt": "You are extracting name, phone number, and reason for call from user speech.",
    "rules": [
      "If user provides SPELLING (e.g., 'it's spelled J-O-H-N'), USE THE SPELLED VERSION",
      "Handle corrections and clarifications",
      "Ignore filler words like 'um', 'uh', 'so'"
    ],
    "outputFormat": "Return ONLY a JSON object like: {\"name\": \"[ACTUAL_NAME]\", \"phone\": \"[ACTUAL_PHONE]\", \"reason\": \"[ACTUAL_REASON]\"}"
  },
  
  "emergencyHandling": {
    "systemPrompt": "You are handling emergency situations for {businessProfile.businessName}. Respond immediately and route to on-call team.",
    "rules": [
      "If user presses #, connect to on-call team right away",
      "Emergency response: 'I understand this is urgent. Let me connect you with our on-call team right away.'",
      "Don't collect additional information during emergencies"
    ]
  }
}
```

### Step 5: Buy Twilio Number

1. **Login to Twilio Console**
   - Go to Twilio console
   - Navigate to Phone Numbers → Buy a Number

2. **Select Number**
   - Search for number in business's area code (from businessProfile.phone)
   - Example: If business is (503) 555-1234, search for 503 area code
   - Choose a local number

3. **Note the Details**
   - Phone number: +15035559999
   - Phone Number SID: PN1234567890abcdef
   - Keep these for later steps

### Step 6: Update Phone Mapping

Edit: `/ahca-server/configs/businesses.json`

Add the new phone number mapping:

```json
{
  "phoneToBusinessMap": {
    "+19713511965": "sherpaprompt",
    "+15035484387": "superior-fencing",
    "{new-twilio-number}": "{businessId}"
  },
  "description": "Maps Twilio phone numbers to business IDs",
  "lastUpdated": "{current date}",
  "version": "1.1"
}
```

### Step 7: Configure Twilio Webhooks

1. **In Twilio Console**, for the purchased number:
   - Voice Configuration:
     - Accept incoming: Voice Calls
     - Configure with: Webhooks, TwiML Bins, Functions, Studio, or Proxy
     - A call comes in: Webhook
     - URL: `https://your-ahca-server.com/twilio/voice/incoming`
     - HTTP Method: POST
     - Status Callback URL: `https://your-ahca-server.com/twilio/voice/status`
     - HTTP Method: POST

2. **Save Configuration**

### Step 8: Test the Voice Agent

1. **Call the Twilio Number**
   - From your phone, call the assigned number
   - Verify greeting plays correctly (agent name, business name)
   - Verify business name is mentioned correctly

2. **Test Emergency Forwarding**
   - Call again and press # key
   - Should forward to business's emergency number
   - Hang up after connection confirmed

3. **Test Full Call Flow**
   - Call again and complete full flow:
     - Provide reason for call
     - Provide name
     - Provide phone number
     - Provide email (if enabled)
     - Provide urgency
     - Confirm all details

4. **Verify Email Summary**
   - Check that email summary was sent to business owner's email
   - Verify all collected information is correct

### Step 9: Contact Business Owner

1. **Send Email to Business Owner**
   ```
   To: [business email from submission]
   Subject: Your Voice Agent is Live!
   
   Hi [business owner name],
   
   Great news! Your voice agent is now live and ready to handle calls.
   
   Your dedicated phone number: [Twilio number]
   Agent name: [agent name]
   
   The voice agent will:
   - Answer calls with your custom greeting
   - Collect [list collection fields]
   - Forward emergencies to [emergency number] when callers press #
   - Send you email summaries at [email address]
   
   Test it out by calling your new number!
   
   If you have any questions or need adjustments, just reply to this email.
   
   Best,
   Doug
   4Trades Voice Agent Team
   ```

2. **Update MongoDB (Optional)**
   - Can add a note field to the submission document
   - Mark as "deployed" for internal tracking
   - But this is optional for MVP1

**That's it! No admin dashboard to update in MVP1.**

---

## Mapping Table: Submission → Config Files

### config.json Mapping

| Config Field | Source in Submission |
|-------------|---------------------|
| `businessId` | Generated from `businessProfile.businessName` |
| `businessName` | `businessProfile.businessName` |
| `phoneNumber` | Assigned Twilio number |
| `email.fromEmail` | `emailConfig.recipientEmail` |
| `email.fromName` | `businessProfile.businessName` |
| `companyInfo.name` | `businessProfile.businessName` |
| `companyInfo.phone` | `businessProfile.phone` |
| `companyInfo.email` | `businessProfile.email` |
| `companyInfo.website` | `businessProfile.website` |
| `companyInfo.address` | `businessProfile.address.*` |
| `companyInfo.hours.*` | `businessProfile.hours.*` |
| `companyInfo.emergencyContact.phone` | `voiceAgentConfig.emergencyHandling.forwardToNumber` |
| `promptConfig.agentName` | `voiceAgentConfig.agentName` |
| `promptConfig.agentPersonality` | `voiceAgentConfig.agentPersonality` |
| `promptConfig.greeting` | `voiceAgentConfig.greeting` |

### prompt_rules.json Mapping

| Prompt Field | Source in Submission |
|-------------|---------------------|
| `realtimeSystem.full` - Agent name | `voiceAgentConfig.agentName` |
| `realtimeSystem.full` - Business name | `businessProfile.businessName` |
| `realtimeSystem.full` - Personality | `voiceAgentConfig.agentPersonality` |
| `realtimeSystem.full` - Fields to collect | `voiceAgentConfig.collectionFields.*` |
| `realtimeSystem.full` - Opening greeting | `voiceAgentConfig.greeting` |
| `emergencyHandling` - Forward number | `voiceAgentConfig.emergencyHandling.forwardToNumber` |

---

## Example: Complete Deployment

### Submission Data
```json
{
  "submissionId": "vsop-ABC-2024-10-31",
  "businessOwner": {
    "name": "Joe Smith",
    "email": "joe@joeshvac.com",
    "phone": "+15035551234"
  },
  "businessProfile": {
    "businessName": "Joe's HVAC",
    "industry": "HVAC",
    "website": "www.joeshvac.com",
    "phone": "+15035555678",
    "email": "service@joeshvac.com",
    "address": {
      "city": "Portland",
      "state": "OR"
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
    "greeting": "Thanks for calling Joe's HVAC, I'm Alex. If this is an emergency, press the pound key now. What are you calling about?",
    "collectionFields": {
      "name": true,
      "phone": true,
      "email": true,
      "reason": true,
      "urgency": true
    },
    "emergencyHandling": {
      "enabled": true,
      "forwardToNumber": "+15035555678"
    }
  },
  "emailConfig": {
    "recipientEmail": "joe@joeshvac.com"
  }
}
```

### Generated Business ID
```
joes-hvac
```

### Created Files

**`/ahca-server/configs/businesses/joes-hvac/config.json`**
```json
{
  "businessId": "joes-hvac",
  "businessName": "Joe's HVAC",
  "phoneNumber": "+15035559999",
  "description": "Joe's HVAC - HVAC services",
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
    "website": "www.joeshvac.com",
    "address": "Portland, OR",
    "hours": {
      "monday_friday": "8 AM - 6 PM",
      "saturday": "9 AM - 4 PM",
      "sunday": "Closed"
    },
    "emergencyContact": {
      "available": true,
      "phone": "+15035555678",
      "instructions": "Press # for emergency"
    }
  },
  "promptConfig": {
    "agentName": "Alex",
    "agentPersonality": "professional",
    "greeting": "Thanks for calling Joe's HVAC, I'm Alex. If this is an emergency, press the pound key now. What are you calling about?"
  }
}
```

**`/ahca-server/configs/businesses/joes-hvac/prompt_rules.json`**
```json
{
  "realtimeSystem": {
    "full": "You are Alex, Joe's HVAC's professional virtual assistant. Your role is to collect customer information and handle emergency routing.\n\nYour Capabilities:\n- Collect customer name, phone, email, reason, and urgency\n- Handle emergency situations by routing to on-call team\n- Provide basic company information\n\nCRITICAL EMERGENCY HANDLING:\n- ONLY if user presses the # key, connect to on-call team right away\n\nCRITICAL INFORMATION COLLECTION:\n- ALWAYS collect reason first\n- Then collect name\n- Then collect phone\n- Then collect email\n- Then ask about urgency\n- Provide FINAL CONFIRMATION\n\nOpening behavior:\n- ALWAYS start with: 'Thanks for calling Joe's HVAC, I'm Alex. If this is an emergency, press the pound key now. What are you calling about?'"
  }
}
```

**Updated `/ahca-server/configs/businesses.json`**
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

## Testing Checklist

After deployment, test the following:

- [ ] Call the Twilio number
- [ ] Verify greeting plays correctly
- [ ] Verify agent name is correct
- [ ] Test emergency forwarding (press #)
- [ ] Complete a full call flow (reason → name → phone → email → urgency)
- [ ] Verify email summary is received at correct address
- [ ] Verify all collected information is correct
- [ ] Test interruptions and corrections
- [ ] Verify business hours are mentioned correctly

---

## Common Issues

### Greeting Doesn't Play
- Check `promptConfig.greeting` in config.json
- Verify ahca-server reloaded configs
- Check ahca-server logs

### Emergency Forwarding Not Working
- Verify `emergencyContact.phone` in config.json
- Check Twilio webhook configuration
- Test with pound key, not keywords

### Email Not Received
- Check `email.fromEmail` in config.json
- Verify Mailchimp API key
- Check spam folder

### Wrong Information Collected
- Review `prompt_rules.json` collection rules
- Verify all fields are listed correctly

---

## Rollback Procedure

If deployment has issues:

1. Remove config files from ahca-server
2. Remove phone mapping from businesses.json
3. Release Twilio number
4. Change submission status to "rejected" in VASOP
5. Add notes explaining what went wrong
6. Contact business owner if needed

---

## Time Estimate

- **Review submission in MongoDB**: 5 minutes
- **Generate business ID**: 1 minute
- **Create config files**: 15 minutes
- **Buy and configure Twilio number**: 10 minutes
- **Test voice agent**: 10 minutes
- **Contact business owner**: 5 minutes

**Total**: ~45 minutes per business

## Quick Reference Commands

### MongoDB Query to Find Submission
```javascript
// MongoDB Compass or CLI
db.getCollection('va-onboarding').findOne({ submissionId: "4t-ABC-2024-10-31" })

// To find all submitted (not draft)
db.getCollection('va-onboarding').find({ isSubmitted: true, status: "submitted" }).sort({ submittedAt: -1 })
```

### Create ahca-server Directory
```bash
cd /path/to/ahca-server/configs/businesses
mkdir joes-hvac
cd joes-hvac
touch config.json
touch prompt_rules.json
```

### Update businesses.json
```bash
cd /path/to/ahca-server/configs
# Edit businesses.json - add new phone mapping
```

### Git Commands (if using version control)
```bash
git add configs/businesses/joes-hvac/
git add configs/businesses.json
git commit -m "Add Joe's HVAC voice agent configuration"
git push
```

---

**Document Version**: 1.0  
**Last Updated**: October 31, 2024  
**For**: Admin Team

