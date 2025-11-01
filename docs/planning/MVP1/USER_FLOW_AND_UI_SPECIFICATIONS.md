# 4Trades Voice Agent Onboarding - User Flow & UI Specifications

## Overview
This document provides a detailed, layman-friendly breakdown of the entire user experience, including every field, UI element, helper text, and visual design specification.

---

## 🚀 Landing Experience

### **Page 1: Login Page** (Default Landing Page)

**URL:** `/` or `/login`

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│    [Logo/Header]                    │
│    4Trades Voice Agent Onboarding   │
│                                     │
│    ┌─────────────────────────┐     │
│    │                         │     │
│    │   Welcome Back          │     │
│    │                         │     │
│    │   Email: [________]     │     │
│    │   Password: [______]    │     │
│    │                         │     │
│    │   [Log In Button]       │     │
│    │                         │     │
│    └─────────────────────────┘     │
│                                     │
│    Don't have an account?           │
│    [Sign Up]                        │
│                                     │
└─────────────────────────────────────┘
```

**Fields:**

1. **Email Address**
   - Input type: `email`
   - Placeholder: `your@email.com`
   - Helper text: None needed
   - Validation: Valid email format required
   - Error message: "Please enter a valid email address"

2. **Password**
   - Input type: `password`
   - Placeholder: `Enter your password`
   - Show/hide password toggle icon on the right
   - Helper text: None needed
   - Error message: "Password is required"

**Login Button:**
- Text: "Log In"
- Style: Dark zinc-900 background, zinc-100 text
- Full width of the card
- Loading state: Shows spinner and text "Logging in..."

**Sign Up Link:**
- Text: "Don't have an account? **Sign Up**"
- "Sign Up" is clickable and styled as a link
- Takes user to `/signup` page

**Error Handling:**
- If credentials are wrong: Red toast notification appears: "Invalid email or password"
- If server error: "Unable to log in. Please try again later."

---

### **Page 2: Sign Up Page**

**URL:** `/signup`

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│    [Logo/Header]                    │
│    4Trades Voice Agent Onboarding   │
│                                     │
│    ┌─────────────────────────┐     │
│    │                         │     │
│    │   Create Your Account   │     │
│    │                         │     │
│    │   Name: [__________]    │     │
│    │   Email: [_________]    │     │
│    │   Phone: [_________]    │     │
│    │   Password: [_______]   │     │
│    │                         │     │
│    │   [Create Account]      │     │
│    │                         │     │
│    └─────────────────────────┘     │
│                                     │
│    Already have an account?         │
│    [Log In]                         │
│                                     │
└─────────────────────────────────────┘
```

**Fields:**

1. **Full Name**
   - Input type: `text`
   - Placeholder: `John Smith`
   - Helper text below field: "Your full name as the business owner"
   - Validation: Required, minimum 2 characters
   - Error message: "Please enter your full name"

2. **Email Address**
   - Input type: `email`
   - Placeholder: `john@example.com`
   - Helper text: "You'll use this to log in"
   - Validation: Valid email format, must be unique
   - Error messages:
     - "Please enter a valid email address"
     - "This email is already registered"

3. **Phone Number**
   - Input type: `tel`
   - Placeholder: `(555) 123-4567`
   - Helper text: "Your contact number"
   - Validation: Valid phone format
   - Error message: "Please enter a valid phone number"

4. **Password**
   - Input type: `password`
   - Placeholder: `Create a strong password`
   - Helper text: "Must be at least 8 characters"
   - Show/hide password toggle
   - Validation: Minimum 8 characters
   - Error message: "Password must be at least 8 characters long"
   - Visual feedback: Green checkmark appears when valid

**Create Account Button:**
- Text: "Create Account"
- Style: Dark zinc-900 background, zinc-100 text
- Full width of the card
- Loading state: Shows spinner and text "Creating account..."

**Success:**
- Toast notification: "Account created successfully!"
- Automatically logs user in
- Redirects to `/onboarding` (Step 1)

**Login Link:**
- Text: "Already have an account? **Log In**"
- Takes user back to `/login`

---

## 📝 Onboarding Flow

### **Progress Bar Design**

**Visual Representation:**
```
Step 1          Step 2          Step 3          Step 4          Step 5          Step 6
  ●━━━━━━━━━━━━━○━━━━━━━━━━━━━○━━━━━━━━━━━━━○━━━━━━━━━━━━━○━━━━━━━━━━━━━○
Business      Voice Agent    Collection    Emergency      Email         Review
Profile        Config         Fields       Handling      Config      & Submit
```

**Implementation Details:**
- Circles (nodes) represent each step
- Filled circle (●) = current step or completed step
- Empty circle (○) = upcoming step
- Lines between nodes show progression
- Current step has larger circle and bold text
- Completed steps have checkmark inside circle ✓
- Color: zinc-900 for active/completed, zinc-300 for inactive
- Fixed at top of onboarding page, always visible
- Mobile: Shows "Step X of 6" text instead of full bar

**Interactive Behavior:**
- Can click on previous (completed) steps to go back and edit
- Cannot click on future steps
- Hover shows step name in tooltip

---

### **Step 1: Business Profile**

**URL:** `/onboarding` (step=1)

**Page Header:**
```
[Progress Bar: Step 1 of 6]

Tell Us About Your Business
Let's start with the basics about your business
```

**Layout:** Single column form with clear sections

---

#### **Section 1: Basic Information**

**1. Business Name**
- Input type: `text`
- Label: "Business Name *"
- Placeholder: `Joe's HVAC`
- Helper text: "The name of your business as customers know it"
- Validation: Required, 2-100 characters
- Error: "Business name is required"

**2. Industry**
- Input type: `select` (dropdown)
- Label: "Industry *"
- Options:
  - HVAC
  - Plumbing
  - Roofing
  - Electrical
  - Construction
  - Landscaping
  - Fencing
  - Other
- Placeholder: "Select your industry"
- Helper text: "What type of services does your business provide?"
- Validation: Required
- Error: "Please select an industry"

**3. Website**
- Input type: `url`
- Label: "Website (Optional)"
- Placeholder: `www.yourbusiness.com`
- Helper text: "Your business website if you have one"
- Validation: Optional, but must be valid URL if provided
- Error: "Please enter a valid website URL"

**4. Business Phone**
- Input type: `tel`
- Label: "Business Phone Number *"
- Placeholder: `(555) 123-4567`
- Helper text: "Main phone number for your business"
- Validation: Required, valid phone format
- Error: "Please enter a valid phone number"

**5. Business Email**
- Input type: `email`
- Label: "Business Email *"
- Placeholder: `contact@yourbusiness.com`
- Helper text: "Main email address for your business"
- Validation: Required, valid email format
- Error: "Please enter a valid email address"

---

#### **Section 2: Business Address**

**Visual grouping with light background card**

**6. Street Address**
- Input type: `text`
- Label: "Street Address *"
- Placeholder: `123 Main Street`
- Validation: Required
- Error: "Street address is required"

**7. City**
- Input type: `text`
- Label: "City *"
- Placeholder: `Portland`
- Validation: Required
- Error: "City is required"

**8. State**
- Input type: `select` (dropdown with US states)
- Label: "State *"
- Placeholder: "Select state"
- Validation: Required
- Error: "Please select a state"

**9. ZIP Code**
- Input type: `text`
- Label: "ZIP Code *"
- Placeholder: `97201`
- Validation: Required, 5 digits
- Error: "Please enter a valid ZIP code"

---

#### **Section 3: Business Hours**

**Visual: Three rows, each with label and time input**

Helper text above section: "When is your business typically available?"

**10. Monday - Friday Hours**
- Input type: `text` or time range picker
- Label: "Monday - Friday"
- Placeholder: `8 AM - 6 PM`
- Example shown: "e.g., 8 AM - 6 PM, 9 AM - 5 PM"
- Validation: Required
- Error: "Please enter your weekday hours"

**11. Saturday Hours**
- Input type: `text`
- Label: "Saturday"
- Placeholder: `9 AM - 4 PM` or `Closed`
- Example: "e.g., 9 AM - 4 PM or type 'Closed'"
- Validation: Required
- Error: "Please enter Saturday hours or 'Closed'"

**12. Sunday Hours**
- Input type: `text`
- Label: "Sunday"
- Placeholder: `Closed`
- Example: "e.g., 10 AM - 2 PM or type 'Closed'"
- Validation: Required
- Error: "Please enter Sunday hours or 'Closed'"

---

**Bottom of Step 1:**

Action Buttons:
```
[Save & Continue Later]        [Continue to Step 2 →]
   (outline button)              (solid dark button)
```

- **Save & Continue Later**: Saves progress, shows toast "Progress saved! You can return anytime", stays on page
- **Continue**: Validates form, shows errors if any, moves to Step 2 if valid

**Auto-save:**
- Form auto-saves every 30 seconds if there are changes
- Small text at bottom: "Auto-saved 5 seconds ago" (updates dynamically)
- Prevents data loss

---

### **Step 2: Voice Agent Configuration**

**URL:** `/onboarding` (step=2)

**Page Header:**
```
[Progress Bar: Step 2 of 6]

Configure Your Voice Agent
Customize how your AI assistant will interact with callers
```

---

#### **Section 1: Agent Identity**

**13. Agent Name**
- Input type: `text`
- Label: "Agent Name *"
- Placeholder: `Alex`
- Helper text: "Choose a friendly, professional name for your AI assistant (e.g., Mason, Alex, Sarah)"
- Validation: Required, 2-20 characters
- Error: "Please enter an agent name"
- Visual: Small avatar icon next to input

**14. Agent Personality**
- Input type: `radio` (cards with descriptions)
- Label: "Agent Personality *"
- Helper text: "How should your agent communicate with callers?"

Options displayed as selectable cards:
```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ ○ Professional       │  │ ○ Friendly           │  │ ○ Formal             │
│                      │  │                      │  │                      │
│ Efficient and        │  │ Warm and             │  │ Business-like and    │
│ business-focused.    │  │ conversational.      │  │ corporate tone.      │
│ Gets to the point.   │  │ Casual but helpful.  │  │ Very professional.   │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

- Selected card has darker border and filled radio button
- Validation: Required
- Error: "Please select a personality type"

---

#### **Section 2: Greeting Message**

**15. Custom Greeting**
- Input type: `textarea`
- Label: "Greeting Message *"
- Rows: 4
- Placeholder: `Thanks for calling [Business Name], I'm [Agent Name], the AI assistant...`
- Helper text: "This is what your agent will say when answering calls. Keep it clear and welcoming."
- Character counter: "125 / 500 characters"
- Validation: Required, 20-500 characters
- Error: "Please enter a greeting message (20-500 characters)"

**Auto-Generate Feature:**
Below the textarea:
```
[✨ Auto-Generate Greeting]  (button with magic wand icon)
```
- When clicked: Uses business name + agent name + personality to generate greeting
- Shows loading state: "Generating..."
- Fills textarea with generated greeting
- Toast: "Greeting generated! Feel free to customize it"

**Preview Card:**
Below the textarea, shows live preview:
```
┌────────────────────────────────────────┐
│ 🎤 Preview                             │
│                                        │
│ "Thanks for calling Joe's HVAC, I'm    │
│  Alex, the AI assistant. How can I     │
│  help you today?"                      │
└────────────────────────────────────────┘
```
- Updates in real-time as user types
- Light zinc-100 background
- Shows exactly what callers will hear

---

**Bottom of Step 2:**
```
[← Back to Step 1]   [Save & Continue Later]   [Continue to Step 3 →]
```

---

### **Step 3: Information Collection**

**URL:** `/onboarding` (step=3)

**Page Header:**
```
[Progress Bar: Step 3 of 6]

Information Collection
Choose what information your agent should collect from callers
```

Helper text below header:
"These are the details your agent will ask callers for during conversations."

---

#### **Section 1: Standard Fields**

Visual: Checkboxes with labels and descriptions

**Always Collected (Disabled/Checked):**

**16. Customer Name**
- Checkbox: `checked` and `disabled`
- Label: "Customer Name ✓"
- Badge: "Required"
- Helper text: "Agent will ask: 'Could I get your name?'"
- Visual: Light zinc-100 background since it's locked

**17. Phone Number**
- Checkbox: `checked` and `disabled`
- Label: "Phone Number ✓"
- Badge: "Required"
- Helper text: "Agent will ask: 'What's the best number to reach you?'"

**18. Reason for Call**
- Checkbox: `checked` and `disabled`
- Label: "Reason for Call ✓"
- Badge: "Required"
- Helper text: "Agent will ask: 'What are you calling about?'"

---

**Optional Fields (User can toggle):**

**19. Email Address**
- Checkbox: `unchecked` (user can check)
- Label: "Email Address"
- Badge: "Optional"
- Helper text: "Agent will ask: 'Do you have an email address?'"

**20. Urgency Level**
- Checkbox: `unchecked`
- Label: "Urgency Level"
- Badge: "Optional"
- Helper text: "Agent will ask: 'Would you like us to call you back on the next business day?'"

**21. Property Address**
- Checkbox: `unchecked`
- Label: "Property Address"
- Badge: "Optional"
- Helper text: "Agent will ask: 'What's the property address where service is needed?'"

**22. Best Time to Call Back**
- Checkbox: `unchecked`
- Label: "Best Time to Call Back"
- Badge: "Optional"
- Helper text: "Agent will ask: 'What's the best time for us to reach you?'"

---

#### **Section 2: Custom Questions**

**Visual:** List of custom fields with ability to add more

Header with description:
```
Custom Questions
Add specific questions unique to your business
```

**23. Custom Fields**
- Component: Dynamic list with add/remove functionality
- Each custom field has:
  - Text input: "Question text"
  - Placeholder: `e.g., What type of HVAC system do you have?`
  - Toggle: "Make this required"
  - Delete button: [🗑️]

**Example shown by default (empty state):**
```
┌─────────────────────────────────────────────┐
│ No custom questions yet                     │
│                                             │
│ Add questions specific to your business    │
│                                             │
│ [+ Add Custom Question]                     │
└─────────────────────────────────────────────┘
```

**When fields are added:**
```
┌─────────────────────────────────────────────┐
│ Custom Question 1                           │
│ Question: [What type of system?        ] 🗑️ │
│ ☐ Required field                            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Custom Question 2                           │
│ Question: [How old is the system?      ] 🗑️ │
│ ☑ Required field                            │
└─────────────────────────────────────────────┘

[+ Add Another Custom Question]
```

Limit: Maximum 5 custom questions
When limit reached: Button disabled with tooltip "Maximum 5 custom questions"

---

**Bottom of Step 3:**
```
[← Back to Step 2]   [Save & Continue Later]   [Continue to Step 4 →]
```

---

### **Step 4: Emergency Call Handling**

**URL:** `/onboarding` (step=4)

**Page Header:**
```
[Progress Bar: Step 4 of 6]

Emergency Call Handling (Optional)
Allow customers to reach you immediately for urgent situations
```

---

#### **Main Toggle Section**

**24. Enable Emergency Forwarding**

Visual card with toggle:
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  Emergency Call Forwarding                    [Toggle]│
│                                                        │
│  Allow customers to be forwarded to you immediately   │
│  for urgent issues. When enabled, callers can press   │
│  a button or say a keyword to reach you directly.     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

- Toggle: Large iOS-style switch
- Default: OFF
- Color: zinc-900 when ON, zinc-300 when OFF

---

#### **If Toggle is OFF:**

Show informational message:
```
┌────────────────────────────────────────────────────────┐
│  ℹ️  Emergency forwarding is disabled                  │
│                                                        │
│  All calls will follow the standard information       │
│  collection flow. You can enable this feature later   │
│  if needed.                                           │
└────────────────────────────────────────────────────────┘
```

Bottom buttons:
```
[← Back to Step 3]   [Save & Continue Later]   [Continue to Step 5 →]
```

---

#### **If Toggle is ON:**

Two additional fields appear with smooth animation:

**25. Forward Emergency Calls To**
- Input type: `tel`
- Label: "Phone Number for Emergency Forwarding *"
- Placeholder: `(555) 123-4567`
- Helper text: "This number will receive emergency calls immediately. Make sure it's always available."
- Icon: 📞 next to input
- Validation: Required when emergency enabled, valid phone format
- Error: "Please enter a valid phone number for emergency forwarding"

**26. Emergency Trigger Method**
- Input type: `radio` (cards)
- Label: "How Should Customers Trigger Emergency Forwarding? *"

Options displayed as cards:
```
┌───────────────────────────────┐  ┌───────────────────────────────┐
│ ○ Press # Key                 │  │ ○ Say "Emergency"             │
│                               │  │                               │
│ Recommended                   │  │                               │
│                               │  │                               │
│ Customer hears: "If this is   │  │ AI detects keywords like      │
│ an emergency, press the pound │  │ "emergency", "urgent", or     │
│ key now."                     │  │ "help now" and forwards call. │
│                               │  │                               │
│ ✓ Clear and simple            │  │ ⚠️ May have false triggers    │
│ ✓ Works for all callers       │  │                               │
└───────────────────────────────┘  └───────────────────────────────┘
```

- "Recommended" badge on first option
- Visual warning icon on second option
- Validation: Required when emergency enabled
- Error: "Please select how emergencies should be triggered"

**Preview Box:**
```
┌────────────────────────────────────────────────────────┐
│ 📞 How it will work:                                   │
│                                                        │
│ When a customer calls, they'll hear:                   │
│                                                        │
│ "Thanks for calling Joe's HVAC, I'm Alex. If this is  │
│  an emergency, press the pound key now to speak with  │
│  someone immediately."                                 │
│                                                        │
│ If they press #, the call forwards to (555) 123-4567  │
└────────────────────────────────────────────────────────┘
```
- Updates dynamically based on selections
- Shows greeting with emergency instruction
- Shows forwarding number

---

**Bottom of Step 4:**
```
[← Back to Step 3]   [Save & Continue Later]   [Continue to Step 5 →]
```

---

### **Step 5: Email Configuration**

**URL:** `/onboarding` (step=5)

**Page Header:**
```
[Progress Bar: Step 5 of 6]

Email Configuration
Where should we send call summaries?
```

Helper text:
"After each call, you'll receive an email with the customer's information and conversation details."

---

**27. Summary Email Address**
- Input type: `email`
- Label: "Send Call Summaries To *"
- Pre-filled with: User's account email (from signup)
- Placeholder: `joe@joeshvac.com`
- Helper text: "You'll receive an email after each customer call with their details and what they needed."
- Icon: 📧 next to input
- Validation: Required, valid email format
- Error: "Please enter a valid email address"

**Edit allowed:** User can change to different email

**Preview Box:**
```
┌────────────────────────────────────────────────────────┐
│ 📧 Email Summary Preview                               │
│                                                        │
│ Subject: New Call - [Customer Name] - [Date/Time]     │
│                                                        │
│ You'll receive:                                        │
│ ✓ Customer contact information                        │
│ ✓ Reason for their call                               │
│ ✓ All details they provided                           │
│ ✓ Urgency level (if collected)                        │
│ ✓ Conversation transcript                             │
│ ✓ Timestamp of call                                   │
└────────────────────────────────────────────────────────┘
```

**Additional Option (Always Enabled for MVP1):**
```
☑ Enable call summaries (Always enabled)
```
- Checkbox checked and disabled
- Helper text: "Email summaries are required for MVP1"

---

**Bottom of Step 5:**
```
[← Back to Step 4]   [Save & Continue Later]   [Continue to Step 6 →]
```

---

### **Step 6: Review & Submit**

**URL:** `/onboarding` (step=6)

**Page Header:**
```
[Progress Bar: Step 6 of 6]

Review Your Information
Please review all your information before submitting
```

Helper text:
"Make sure everything looks correct. You can go back to edit any section."

---

**Layout:** Collapsible cards for each section

---

#### **Card 1: Business Profile**

```
┌────────────────────────────────────────────────────────┐
│ Business Profile                          [Edit Step 1]│
│                                                        │
│ Business Name:    Joe's HVAC                           │
│ Industry:         HVAC                                 │
│ Website:          www.joeshvac.com                     │
│ Phone:            (555) 123-4567                       │
│ Email:            contact@joeshvac.com                 │
│                                                        │
│ Address:          123 Main Street                      │
│                   Portland, OR 97201                   │
│                                                        │
│ Business Hours:                                        │
│   Mon-Fri:        8 AM - 6 PM                         │
│   Saturday:       9 AM - 4 PM                         │
│   Sunday:         Closed                               │
└────────────────────────────────────────────────────────┘
```

- Clean key-value pairs
- [Edit Step 1] button at top-right
- Clicking Edit takes back to Step 1 with data filled

---

#### **Card 2: Voice Agent Configuration**

```
┌────────────────────────────────────────────────────────┐
│ Voice Agent Configuration                 [Edit Step 2]│
│                                                        │
│ Agent Name:       Alex                                 │
│ Personality:      Professional                         │
│                                                        │
│ Greeting:                                              │
│ "Thanks for calling Joe's HVAC, I'm Alex, the AI      │
│  assistant. How can I help you today?"                │
└────────────────────────────────────────────────────────┘
```

---

#### **Card 3: Information Collection**

```
┌────────────────────────────────────────────────────────┐
│ Information Collection                    [Edit Step 3]│
│                                                        │
│ Required Fields:                                       │
│   ✓ Customer Name                                      │
│   ✓ Phone Number                                       │
│   ✓ Reason for Call                                    │
│                                                        │
│ Optional Fields Enabled:                               │
│   ✓ Email Address                                      │
│   ✓ Urgency Level                                      │
│   ✓ Property Address                                   │
│                                                        │
│ Custom Questions:                                      │
│   1. What type of HVAC system do you have?            │
│   2. How old is your system? (Required)               │
└────────────────────────────────────────────────────────┘
```

- Shows checkmarks for enabled fields
- Lists custom questions with required flag if applicable
- If no custom questions: Shows "No custom questions"

---

#### **Card 4: Emergency Handling**

**If Emergency is Enabled:**
```
┌────────────────────────────────────────────────────────┐
│ Emergency Call Handling                   [Edit Step 4]│
│                                                        │
│ Status:           ✓ Enabled                            │
│ Forward To:       (555) 987-6543                       │
│ Trigger Method:   Press # Key                          │
└────────────────────────────────────────────────────────┘
```

**If Emergency is Disabled:**
```
┌────────────────────────────────────────────────────────┐
│ Emergency Call Handling                   [Edit Step 4]│
│                                                        │
│ Status:           ✗ Disabled                           │
│                                                        │
│ All calls will follow standard flow                   │
└────────────────────────────────────────────────────────┘
```

---

#### **Card 5: Email Configuration**

```
┌────────────────────────────────────────────────────────┐
│ Email Configuration                       [Edit Step 5]│
│                                                        │
│ Call Summaries:   Enabled                              │
│ Send To:          joe@joeshvac.com                     │
└────────────────────────────────────────────────────────┘
```

---

**Important Notice Box:**
```
┌────────────────────────────────────────────────────────┐
│ ⓘ What Happens Next?                                   │
│                                                        │
│ After you submit:                                      │
│ 1. Your information will be reviewed by our team       │
│ 2. We'll manually set up your voice agent              │
│ 3. Our team will contact you with your phone number    │
│    and next steps                                      │
│                                                        │
│ Expected setup time: 2-3 business days                 │
└────────────────────────────────────────────────────────┘
```

---

**Bottom Action Buttons:**

```
[← Back to Step 5]   [Save & Continue Later]   [Submit for Review →]
                      (outline button)            (prominent button)
```

**Submit Button Behavior:**
- Text: "Submit for Review"
- Style: Large, dark zinc-900, full width on mobile
- Hover: Shows tooltip "Your application will be sent for review"
- Loading state: "Submitting..." with spinner
- Cannot be clicked twice (disabled after first click)

---

**After Submission:**

1. **Success Toast Notification:**
   ```
   ✓ Success!
   Your information has been successfully submitted.
   Admin will review and contact you soon.
   ```
   - Green checkmark
   - Auto-disappears after 5 seconds

2. **Automatic Redirect:**
   - Redirects to `/status` page after 2 seconds
   - Shows transition message: "Redirecting..."

---

### **Page 3: Status Page**

**URL:** `/status`

**Access Control:**
- If NOT submitted: Redirects to `/onboarding`
- If submitted: Shows this page

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│    [Logo/Header]                        │
│    4Trades Voice Agent Onboarding       │
│    [Logout]                             │
│                                         │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    │   🕐 Under Review            │     │
│    │                             │     │
│    │   Your application is being │     │
│    │   reviewed by our team      │     │
│    │                             │     │
│    │   Submitted: Oct 31, 2024   │     │
│    │                             │     │
│    │   We'll contact you within  │     │
│    │   2-3 business days         │     │
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
│    Your Submission ID:                  │
│    4t-ABC-2024-10-31                    │
│                                         │
└─────────────────────────────────────────┘
```

**Elements:**

1. **Status Card**
   - Large icon: Clock emoji 🕐
   - Heading: "Under Review"
   - Subtext: Clear explanation
   - Submission date displayed
   - Expected timeline

2. **Submission ID**
   - Displayed prominently
   - Format: `4t-ABC-2024-10-31`
   - Small text: "Save this ID for reference"
   - Copy button next to ID

3. **Header Actions**
   - Logo at top
   - Logout button at top-right

**No Edit Options:**
- Cannot go back to edit after submission (MVP1 limitation)
- Only option: Wait for admin contact

---

## 🎨 Visual Design System

### **Color Palette**

**Primary Colors:**
- **Dark:** `zinc-900` (#18181b) - Buttons, headers, dark backgrounds
- **Light:** `zinc-100` (#f4f4f5) - Input backgrounds, light cards

**Supporting Colors:**
- **Text on Dark:** `zinc-100` (white-ish)
- **Text on Light:** `zinc-900` (black-ish)
- **Borders:** `zinc-300` (light gray)
- **Disabled:** `zinc-400` (medium gray)

**Status Colors:**
- **Success:** Green toast notifications
- **Error:** Red error messages
- **Warning:** Yellow/amber for warnings
- **Info:** Blue for informational messages

---

### **Typography**

**Font Family:** Poppins (all weights)
- Import from Google Fonts: `https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap`

**Hierarchy:**
- **H1 (Page Headers):** 32px, font-bold
- **H2 (Section Headers):** 24px, font-semibold
- **H3 (Card Headers):** 20px, font-semibold
- **Body Text:** 16px, font-normal
- **Helper Text:** 14px, font-normal, zinc-600
- **Small Text:** 12px, font-normal

---

### **Component Styling**

#### **Buttons**

**Primary Button:**
- Background: `zinc-900`
- Text: `zinc-100`
- Padding: 12px 24px
- Border radius: 8px
- Hover: `zinc-800`
- Loading: Spinner + grayed out
- Disabled: `zinc-400`, cursor-not-allowed

**Secondary/Outline Button:**
- Background: transparent
- Border: 1px solid `zinc-300`
- Text: `zinc-900`
- Hover: `zinc-100` background

#### **Input Fields**

- Background: `zinc-100`
- Border: 1px solid `zinc-300`
- Text: `zinc-900`
- Padding: 10px 14px
- Border radius: 6px
- Focus: Border becomes `zinc-900`, blue outline
- Error state: Red border

#### **Cards**

- Background: `zinc-100` or `zinc-900` (depending on context)
- Border radius: 12px
- Padding: 20px
- Shadow: Subtle drop shadow
- Border: 1px solid `zinc-300` (for light cards)

#### **Checkboxes/Radio Buttons**

- Unchecked: White background, `zinc-300` border
- Checked: `zinc-900` background, white checkmark
- Disabled: `zinc-400` background
- Label: 16px, font-medium

---

### **Spacing & Layout**

- **Page margins:** 20px on mobile, 40px on desktop
- **Section spacing:** 32px between sections
- **Field spacing:** 16px between form fields
- **Card spacing:** 20px between cards
- **Max content width:** 800px (centered)

---

### **Responsive Breakpoints**

- **Mobile:** < 768px
  - Single column
  - Full-width buttons
  - Progress bar shows text only
  - Larger touch targets (48px minimum)

- **Tablet:** 768px - 1024px
  - Two columns where appropriate
  - Side-by-side buttons

- **Desktop:** > 1024px
  - Full progress bar with nodes
  - Optimal reading width (800px max)
  - Hover states visible

---

## 🔄 User Flow Summary

### **First-Time User Journey**

1. **Lands on** `/login` → Clicks "Sign Up"
2. **Signs up** at `/signup` → Auto-logged in
3. **Starts onboarding** at `/onboarding` (Step 1)
4. **Fills Steps 1-6** → Can save and return anytime
5. **Submits at Step 6** → Success toast
6. **Redirected to** `/status` → Waits for admin

### **Returning User Journey (Not Submitted)**

1. **Logs in** at `/login`
2. **Auto-redirected to** `/onboarding` at saved step
3. **Sees restore prompt** if local changes exist
4. **Continues from where left off**
5. **Completes and submits**
6. **Redirected to** `/status`

### **Returning User Journey (Already Submitted)**

1. **Logs in** at `/login`
2. **Auto-redirected to** `/status`
3. **Sees application under review**
4. **Can only view status** (no editing in MVP1)

---

## 🔐 Security & Data Handling

### **Password Requirements**
- Minimum 8 characters
- Hashed with bcrypt before storage
- No plain text storage

### **Session Management**
- JWT tokens with 7-day expiration
- Stored in httpOnly cookies
- Auto-logout on token expiry

### **Data Privacy**
- All data encrypted in transit (HTTPS)
- MongoDB passwords hashed
- No sensitive data in localStorage (only form data)

### **Auto-Save**
- Saves to server every 30 seconds
- Saves to localStorage every 5 seconds
- Prevents data loss on connection issues

---

## ✅ Form Validation Summary

### **Real-time Validation**
- Shows errors as user types (after first blur)
- Green checkmark for valid fields
- Red border + error text for invalid fields

### **Submit Validation**
- Cannot proceed to next step if current step has errors
- Shows all errors at once when clicking Continue
- Scrolls to first error
- Focus on first error field

### **Required Field Indicator**
- Red asterisk (*) next to required labels
- Helper text mentions if optional

---

**Document Version:** 1.0  
**Last Updated:** November 1, 2024  
**Status:** Ready for Implementation

