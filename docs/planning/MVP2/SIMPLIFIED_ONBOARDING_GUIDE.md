# Self-Service Voice Agent Onboarding - Simplified Guide

## 🎯 What This Platform Does

This is a website where any business owner can set up their own AI-powered phone assistant in about 20 minutes, without needing any technical knowledge. It's like **"Shopify for AI Phone Assistants"**.

**Current Process (Manual):**
- Technical team manually creates configuration files
- Sets up databases and phone numbers
- Takes days/weeks + technical expertise

**New Process (Self-Service):**
- Business owners fill out 7-step form (20 minutes)
- Everything happens automatically (5 minutes)
- Phone agent works immediately

---

## 🏗️ System Architecture

### **Frontend (Next.js)**
- Step-by-step wizard interface
- Business-friendly forms (no technical jargon)
- Real-time progress tracking

### **Backend (NestJS)**
- Automation engine that creates all configurations
- Integrates with existing ahca-server
- Handles file generation and database setup

### **Integration with ahca-server**
- Creates configuration files that ahca-server reads
- No changes needed to ahca-server
- Backward compatible with existing businesses

---

## 📝 Step-by-Step User Flow

### **Step 1: Account Creation (2 minutes)**
```
Form Fields:
- Business name: "Joe's HVAC"
- Email: joe@joeshvac.com
- Password: ********
- Phone: (555) 123-4567

[Create Account] button
```

### **Step 2: Business Profile (3 minutes)**
```
Form Fields:
- Industry: [Dropdown: HVAC, Plumbing, Construction, etc.]
- Business address: "123 Main St, Portland, OR"
- Website: "www.joeshvac.com"
- Business hours: "8 AM - 6 PM Mon-Fri"

[Continue] button
```

### **Step 3: AI Assistant Design (3 minutes)**
```
Form Fields:
- AI Agent Name: "Alex"
- Personality: [Dropdown]
  ○ Professional & Efficient
  ○ Friendly & Casual  
  ○ Formal & Corporate

Greeting Message: [Text Area]
[Auto-Fill Template] button - fills with:
"Hi, I'm [AI_NAME] from [BUSINESS_NAME]. If this is an emergency, 
press # now. Otherwise, I can take your info for our team to 
follow up during business hours. Could I start with your name?"

[Continue] button
```

### **Step 4: Call Flow Design (4 minutes)**
```
What info should your AI collect? [All Checkboxes]
☑ Customer name (required)
☑ Phone number (required)
☑ Reason for call (required)
☑ Urgency level
☐ Email address
☐ Property address
☐ Best time to call back

Emergency Handling:
Forward emergency calls to: [Number Input Field]
Example: (555) 123-4567

[Continue] button
```

### **Step 5: Features (3 minutes)**
```
Choose Features:

📚 Knowledge Base (AI answers questions)
☐ Enable - Upload business documents

📅 Appointment Booking
☐ Enable - Connect Google/Outlook calendar

📧 Email Summaries
☑ Enable - Send call summaries to: [email field]

[Continue] button
```

### **Step 6: Upload Documents (2 minutes - Optional)**
```
If Knowledge Base enabled:

Drag & drop files or click to browse
Accepted: .txt, .json only
Max size: 10MB per file

Uploaded Files:
✓ services.txt (45 KB)
✓ pricing.json (120 KB)

Note: Files will be automatically converted to proper format

[Continue] button
```

### **Step 7: Review & Launch (Dashboard View)**
```
Nice dashboard showing:
✓ Business: Joe's HVAC
✓ AI Agent: Alex (Friendly & Casual)
✓ Collects: Name, Phone, Reason, Urgency
✓ Features: Email summaries
✓ Emergency: Forwards to (555) 123-4567

[Edit] button - enables editing mode with [Cancel] [Save] options
[Launch My Voice Agent] button

After launch:
⏳ Creating database...           [████████████] 100% ✅
⏳ Setting up AI agent...         [████████████] 100% ✅
⏳ Processing documents...        [██████░░░░░░]  60% ⏳
⏳ Configuring phone system...    [░░░░░░░░░░░░]   0% ⏳

🎉 Setup Complete!
📞 Your phone number will be assigned by our team
📧 Email sent to admin for phone number setup
```

---

## 🔧 Backend Automation (What Happens Automatically)

### **1. Configuration Files (2 seconds)**
Creates these files in ahca-server:
```
/configs/businesses/joes-hvac/
├── config.json      # Business settings & credentials
└── prompt_rules.json # AI behavior & conversation flow
```

### **2. Database Setup (3 seconds)**
- Creates MongoDB collection: `knowledge_base_joes_hvac`
- Sets up vector search index for AI document search
- Inserts placeholder data

### **3. Document Processing (30 seconds - 5 minutes)**
For uploaded .txt/.json files:
- Converts to SherpaPrompt format (like product_knowledge_1.2.json)
- Creates embeddings for AI search
- Stores in business-specific database collection

### **4. Phone Number Assignment (Manual)**
- System sends email to doug@sherpaprompt.com via Mailchimp:
  ```
  Subject: New Voice Agent Setup: [Business Name]
  
  [Business Name] has completed voice agent setup.
  Please assign phone number and update configuration.
  
  Business ID: joes-hvac
  Owner: joe@joeshvac.com
  ```

### **5. Admin Phone Setup (Manual Process)**
Admin team will:
1. Buy Twilio phone number
2. Update `businesses.json` phone mapping:
   ```json
   {
     "phoneToBusinessMap": {
       "+15035489876": "joes-hvac"
     }
   }
   ```
3. Notify business owner of their phone number

---

## 📊 Generated Configuration Examples

### **config.json**
```json
{
  "businessId": "joes-hvac",
  "businessName": "Joe's HVAC",
  "phoneNumber": "TBD - assigned by admin",
  "features": {
    "ragEnabled": true,
    "appointmentBookingEnabled": false,
    "emergencyCallHandling": true,
    "basicInfoCollection": true
  },
  "database": {
    "collectionName": "joes_hvac_knowledge_base",
    "vectorIndexName": "joes_hvac_vector_index"
  },
  "email": {
    "provider": "mailchimp",
    "fromEmail": "joe@joeshvac.com",
    "fromName": "Joe's HVAC"
  },
  "companyInfo": {
    "name": "Joe's HVAC",
    "phone": "(555) 123-4567",
    "website": "www.joeshvac.com",
    "address": "123 Main St, Portland, OR",
    "hours": "8 AM - 6 PM Mon-Fri"
  },
  "promptConfig": {
    "agentName": "Alex",
    "agentPersonality": "friendly and casual",
    "greeting": "Hi, I'm Alex from Joe's HVAC..."
  }
}
```

### **prompt_rules.json**
```json
{
  "realtimeSystem": {
    "full": "You are Alex, Joe's HVAC's friendly and casual virtual assistant..."
  },
  "userInfoCollection": {
    "fields": ["name", "phone", "reason", "urgency"],
    "emergencyForwarding": {
      "enabled": true,
      "forwardTo": "(555) 123-4567"
    }
  }
}
```

---

## 🔄 How Calls Work After Setup

### **Customer Experience:**
1. Customer calls assigned phone number
2. "Hi, I'm Alex from Joe's HVAC. If this is an emergency, press # now..."
3. Alex collects name, phone, reason, urgency
4. "Thanks! Our team will call you back during business hours."

### **Business Owner Experience:**
Gets email summary:
```
Subject: New Lead: Sarah Johnson - Furnace Repair

Customer Info:
• Name: Sarah Johnson
• Phone: (503) 555-7890  
• Reason: Furnace not working
• Urgency: Next business day

[View Dashboard]
```

### **Technical Flow:**
1. Twilio receives call → looks up phone in `businesses.json`
2. ahca-server loads `/configs/businesses/joes-hvac/` configs
3. Starts AI agent "Alex" with Joe's HVAC personality
4. Follows conversation flow from setup
5. Sends email summary to joe@joeshvac.com

---

## 🎯 Key Benefits

### **For Business Owners:**
- **No technical knowledge needed** - just fill out forms
- **Fast setup** - 20 minutes vs days/weeks
- **Immediate results** - AI agent ready when phone number assigned
- **Full control** - can edit everything later
- **Affordable** - ~$50/month total cost

### **For Platform:**
- **Scalable** - onboard hundreds of businesses automatically
- **No manual work** - everything automated except phone assignment
- **Recurring revenue** - monthly subscription model

### **For ahca-server:**
- **No code changes** - just reads new config files
- **Backward compatible** - existing businesses unaffected
- **Unlimited businesses** - scales automatically

---

## 📋 Implementation Notes

### **File Processing:**
- Only accept .txt and .json files
- Auto-convert to SherpaPrompt format (like product_knowledge_1.2.json)
- Store in business-specific MongoDB collection

### **Phone Number Management:**
- Manual process handled by admin team
- Automated email notification to doug@sherpaprompt.com
- Admin updates businesses.json mapping

### **Database Automation:**
- Auto-create MongoDB collections
- Auto-setup vector search indexes
- Business-specific naming: `knowledge_base_{businessId}`

### **Configuration Generation:**
- Auto-generate config.json from form data
- Auto-generate prompt_rules.json from conversation flow
- Store in `/configs/businesses/{businessId}/`

---

## 🚀 Next Steps

1. **Build frontend wizard** - 7-step form with specified UI components
2. **Build backend automation** - file generation, database setup
3. **Test with sample business** - end-to-end flow
4. **Admin tools** - for phone number assignment
5. **Launch beta** - with select businesses

---

**Document Version:** 1.0  
**Last Updated:** October 30, 2024  
**Status:** Implementation Ready
