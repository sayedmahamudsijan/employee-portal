# MBD Portal — User Manual

**Version:** 2.0 | **Portal URL:** https://employee-portal-flame.vercel.app

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Access Levels at a Glance](#2-access-levels-at-a-glance)
3. [Dashboard](#3-dashboard)
4. [Workspace — Daily Use Features](#4-workspace--daily-use-features)
   - 4.1 Attendance
   - 4.2 Tasks
   - 4.3 Work Log
   - 4.4 Leave
   - 4.5 Expenses
   - 4.6 1:1 Meetings
   - 4.7 Helpdesk
   - 4.8 Onboarding
5. [Growth — Personal Development](#5-growth--personal-development)
   - 5.1 Goals
   - 5.2 OKRs
   - 5.3 Career Path
   - 5.4 Mentorship
   - 5.5 Performance
6. [Company — Collaboration](#6-company--collaboration)
   - 6.1 Team Calendar
   - 6.2 Projects
   - 6.3 Team Directory
   - 6.4 Kudos
   - 6.5 Announcements
   - 6.6 Documents
7. [Manager Features](#7-manager-features)
8. [Admin / Executive Features](#8-admin--executive-features)
9. [Settings & Notifications](#9-settings--notifications)
10. [Tips for Power Users](#10-tips-for-power-users)
11. [Frequently Asked Questions](#11-frequently-asked-questions)

---

## 1. Getting Started

### Signing In

1. Navigate to **https://employee-portal-flame.vercel.app**
2. Click **"Sign in with Google"**
3. Use your **company Google account** (e.g., `yourname@metabuilddynamics.com`)
4. You will be redirected to your Dashboard after successful sign-in

> ⚠️ **Access Restricted:** Only pre-approved email addresses can sign in. If you see "Access Denied", contact your admin to add your email to the allowed list under Admin Hub → Allowed Emails.

### First-Time Setup

After your first sign-in, visit **Settings** (`/settings`) to:
- Upload a profile photo
- Set your job title and department
- Add your phone number
- Update your bio
- Optionally fill in D&I information (gender, pronouns, ethnicity) — this is strictly voluntary and used only for aggregate diversity reporting

### Navigating the Portal

The sidebar on the left is your main navigation. It collapses to icon-only mode — click the **hamburger menu (☰)** in the top-left header to toggle it. On mobile, use the header menu button to open/close the sidebar.

The header bar (top) contains:
- **☰ Menu toggle** — expand/collapse sidebar
- **🌙/☀ Theme toggle** — switch between dark and light mode
- **🔔 Notifications bell** — view recent activity
- **👤 Your avatar** — quick access to settings and sign-out

---

## 2. Access Levels at a Glance

| Feature | Intern | Employee | Manager | Admin/CEO/CMO/CTO |
|---------|:------:|:--------:|:-------:|:-----------------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Attendance (own) | ✅ | ✅ | ✅ | ✅ |
| Tasks (own) | ✅ | ✅ | ✅ | ✅ |
| Work Log (own) | ✅ | ✅ | ✅ | ✅ |
| Leave Requests | ✅ | ✅ | ✅ | ✅ |
| Expenses | ✅ | ✅ | ✅ | ✅ |
| 1:1 Meetings | ✅ | ✅ | ✅ | ✅ |
| Helpdesk | ✅ | ✅ | ✅ | ✅ |
| Onboarding Checklist | ✅ | ✅ | ✅ | ✅ |
| Goals | ✅ | ✅ | ✅ | ✅ |
| OKRs | ✅ | ✅ | ✅ | ✅ |
| Career Path | ✅ | ✅ | ✅ | ✅ |
| Mentorship | ✅ | ✅ | ✅ | ✅ |
| Performance | ✅ | ✅ | ✅ | ✅ |
| Team Calendar | ✅ | ✅ | ✅ | ✅ |
| Projects | ✅ | ✅ | ✅ | ✅ |
| Team Directory | ✅ | ✅ | ✅ | ✅ |
| Kudos | ✅ | ✅ | ✅ | ✅ |
| Announcements | ✅ | ✅ | ✅ | ✅ |
| Documents | ✅ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ✅ | ✅ |
| Team Logs | ❌ | ❌ | ✅ | ✅ |
| Admin Hub | ❌ | ❌ | ❌ | ✅ |
| D&I Dashboard | ❌ | ❌ | ❌ | ✅ |
| Compensation | ❌ | ❌ | ❌ | ✅ |

---

## 3. Dashboard

**URL:** `/dashboard`  
**Access:** Everyone

The Dashboard is your command center. It surfaces the most important information without you having to navigate elsewhere.

### What You'll See

**Stat Cards (top row)**
- **Today's Attendance** — your current clock-in status and today's work hours
- **Open Tasks** — number of tasks assigned to you that are not yet completed
- **Leave Balance** — remaining annual leave days
- **Pending Expenses** — number of expense claims awaiting approval

**Activity Feed**
- Recent portal activity relevant to you — task updates, leave approvals, kudos received, announcements
- Click any item to navigate directly to it

**Quick Actions**
- **Clock In / Clock Out** shortcut
- **New Task** shortcut
- **Submit Expense** shortcut
- **Request Leave** shortcut

### Tips
- The dashboard refreshes automatically when you navigate back to it
- Managers and Admins see team-wide stats in addition to personal stats (e.g., "Team Attendance Today", "Pending Approvals")

---

## 4. Workspace — Daily Use Features

### 4.1 Attendance

**URL:** `/attendance`  
**Access:** Everyone

Track your daily working hours with a simple clock in/out system.

#### Clocking In
1. Go to **Attendance** in the sidebar
2. Click the large **"Clock In"** button
3. Your session starts immediately — the timer runs live on screen
4. Optionally add a **note** (e.g., "Working from home")

#### Clocking Out
1. Return to **/attendance** while clocked in
2. Click **"Clock Out"**
3. Your total hours for the session are calculated and saved automatically

#### Viewing Your History
- Scroll down to see a table of all past attendance records
- Each row shows: date, clock-in time, clock-out time, total hours, and any note
- **Managers** see a "Team" tab showing all team members' attendance records for any date range

#### Rules
- You can only have **one active clock-in** at a time
- Clock-out is required before you can clock in again the next day
- Attendance records cannot be edited after submission — contact your admin if there's a discrepancy

---

### 4.2 Tasks

**URL:** `/tasks`  
**Access:** Everyone

A personal Kanban-style task tracker for managing your work items.

#### Creating a Task
1. Click **"New Task"**
2. Fill in: Title (required), Description, Due Date, Priority (Low / Medium / High / Urgent), Sprint (optional)
3. Click **Save**

#### Managing Tasks
- Tasks are displayed in columns: **To Do → In Progress → Review → Done**
- **Drag and drop** a card to move it between columns, OR click the task to open its detail panel and change the status via dropdown
- Click the **pencil icon** to edit a task
- Click the **trash icon** to delete a task

#### Filtering & Sorting
- Use the **filter bar** at the top to filter by status, priority, or due date
- Use the **sort** dropdown to sort by due date or priority

#### Tips
- Mark tasks **Urgent** for items that appear highlighted in red
- Use the **Sprint** field to group tasks into sprint cycles (created under Projects)
- Completed tasks stay visible under the "Done" column — archive them from the task detail view

---

### 4.3 Work Log

**URL:** `/work-log`  
**Access:** Everyone (Managers see all team logs at `/work-log/admin`)

A daily journal of what you worked on — separate from attendance clock-ins, this is a qualitative record.

#### Logging Work
1. Click **"Add Log"**
2. Select the **date** (defaults to today)
3. Write a summary of what you accomplished
4. Optionally tag a **project** and set **hours spent**
5. Click **Save**

#### Viewing Logs
- Your logs are listed in reverse chronological order
- Each log shows the date, summary, project tag, and hours

#### For Managers — Team Logs (`/work-log/admin`)
- See all team members' work logs in a unified view
- Filter by employee name or date range
- **Export to CSV** using the Export button (top right) — useful for sprint retrospectives or billing reports

---

### 4.4 Leave

**URL:** `/leave`  
**Access:** Everyone

Submit and track time-off requests.

#### Requesting Leave
1. Click **"Request Leave"**
2. Select **Leave Type**: Annual, Sick, Emergency, Unpaid, or Other
3. Pick a **start date** and **end date**
4. Add a **reason** (required for Sick and Emergency leave)
5. Click **Submit**

#### Tracking Your Requests
- Requests appear with status badges: **Pending** (yellow), **Approved** (green), **Rejected** (red)
- You receive a notification when your manager approves or rejects a request
- **Leave Balance** card shows your remaining days by type

#### Leave Balance
- Annual leave balance is set by the admin
- Approved leave automatically deducts from your balance
- Sick leave does not deduct from annual balance

#### Managers Approving Leave
1. Go to **Leave** — you'll see a **"Team Requests"** tab alongside "My Requests"
2. Click a pending request to open it
3. Click **Approve** or **Reject** (add a note when rejecting)
4. The employee is notified immediately

---

### 4.5 Expenses

**URL:** `/expenses`  
**Access:** Everyone

Submit business expense claims for reimbursement.

#### Submitting an Expense
1. Click **"New Expense"**
2. Fill in:
   - **Title** — brief description (e.g., "Client lunch – XYZ Corp")
   - **Amount** and **Currency**
   - **Category**: Travel, Meals, Software, Hardware, Training, Other
   - **Date** of expense
   - **Receipt** — upload a photo or PDF (optional but recommended)
   - **Notes** — any additional context
3. Click **Submit**

#### Tracking Your Claims
- Status flow: **Pending → Approved → Rejected / Paid**
- You can edit or withdraw a claim while it is still **Pending**
- Once approved, the finance/admin team marks it as **Paid**

#### Managers Approving Expenses
1. In **/expenses**, switch to the **"Team"** tab
2. Review pending claims — each shows amount, category, date, and submitted receipt
3. Click **Approve** or **Reject** with a note

---

### 4.6 1:1 Meetings

**URL:** `/one-on-ones`  
**Access:** Everyone

Schedule and track your regular one-on-one meetings with your manager or direct reports.

#### Creating a 1:1
1. Click **"Schedule 1:1"**
2. Select the **other participant** from the team dropdown
3. Choose a **date and time**
4. Add an **agenda** (optional but strongly recommended)
5. Click **Save**

#### Running a 1:1
- Open the meeting from the list
- Use the **Notes** field during the meeting to capture discussion points
- Add **Action Items** — these appear as tasks you can track afterward
- Click **Mark Complete** when done

#### Recurring Meetings
- Set a meeting as **recurring** (weekly or biweekly) when creating it
- All recurring instances appear in your list and on the Team Calendar

#### Viewing History
- Past meetings are preserved with their notes and action items
- Scroll back through your history to review what was discussed

---

### 4.7 Helpdesk

**URL:** `/helpdesk`  
**Access:** Everyone

Raise support tickets for IT, HR, Admin, or General queries.

#### Raising a Ticket
1. Click **"New Ticket"**
2. Enter a **Subject**
3. Select **Category**: IT, HR, Admin, or General
4. Select **Priority**: Low, Medium, High, or Urgent
5. Write a detailed **description** of the issue
6. Click **Submit**

#### Tracking Your Tickets
- Ticket statuses: **Open → In Progress → Resolved → Closed**
- You can **add comments** to an open ticket to provide more information or follow up
- You receive a notification when the status changes or someone replies

#### Resolving Tickets (Admin/Manager)
1. Go to **/helpdesk** — you'll see all tickets if you are an admin/manager
2. Click a ticket to open it
3. Change the **status** and add a **response comment**
4. Click **Resolve** once the issue is fixed — the reporter is notified

---

### 4.8 Onboarding

**URL:** `/onboarding`  
**Access:** Everyone (primarily used by new joiners)

A guided checklist to help new team members get set up quickly.

#### Completing Your Checklist
- Each item on the list has a description of the task and a checkbox
- Tick items as you complete them — progress is saved automatically
- Your progress percentage is visible at the top

#### Common Onboarding Items
- Sign company policies
- Set up your Google Workspace
- Complete your portal profile
- Meet your manager (schedule a 1:1)
- Join relevant Slack channels
- Complete any assigned training

#### Admin — Creating Onboarding Templates
Admins can create templates under **Admin Hub → Onboarding Templates**:
1. Click **"New Template"**
2. Add a title and list of checklist items
3. Assign the template to a user when they join
4. The template populates their `/onboarding` page automatically

---

## 5. Growth — Personal Development

### 5.1 Goals

**URL:** `/goals`  
**Access:** Everyone

Set and track personal professional goals.

#### Creating a Goal
1. Click **"New Goal"**
2. Enter a **title** and **description**
3. Set a **target date**
4. Set a **status**: Not Started, In Progress, Completed, or Abandoned
5. Click **Save**

#### Updating Progress
- Click a goal to open it
- Update the **status** and add **progress notes** as you make progress
- Goals near their target date are highlighted

---

### 5.2 OKRs

**URL:** `/okrs`  
**Access:** Everyone

Objectives and Key Results — link your work to company-wide goals.

#### Structure
- An **Objective** is a qualitative goal ("Improve customer satisfaction")
- **Key Results** are measurable outcomes under each objective ("Achieve NPS score of 8+")

#### Creating an OKR
1. Click **"New OKR"**
2. Enter the **Objective** title and description
3. Add **Key Results** — each with a target value and unit (%, number, etc.)
4. Set the **time period** (quarter or custom)

#### Updating Progress
- Click an OKR to open it
- For each Key Result, update the **current value**
- The system automatically calculates the overall completion percentage
- Use the **Notes** field to add context about progress or blockers

#### Viewing Team OKRs
- Company and team OKRs visible to all employees help align individual work with broader objectives

---

### 5.3 Career Path

**URL:** `/career`  
**Access:** Everyone

Understand your career trajectory and what's needed to advance.

#### Viewing Career Levels
- The page shows all defined career levels for your track (e.g., Engineering, Design, Marketing)
- Each level lists: title, band, required skills, and typical responsibilities

#### Your Career Profile
- Click **"Edit My Profile"** to set your current level and career track
- Add **skills** you have and **skills you're developing**
- Your manager can view your career profile to guide development conversations

#### Requesting a Level Review
- Use the **1:1 Meetings** feature to schedule a career conversation with your manager
- Reference your Career Path level requirements in the agenda

---

### 5.4 Mentorship

**URL:** `/mentorship`  
**Access:** Everyone

Connect mentors and mentees for structured professional growth.

#### Finding a Mentor
1. Go to **/mentorship**
2. Browse available mentors (colleagues who have marked themselves available)
3. Click **"Request Mentorship"** on a mentor's card
4. Add a message explaining what you're looking for

#### Accepting/Declining Requests (Mentors)
1. Check the **"Incoming Requests"** tab
2. Click **Accept** or **Decline**
3. Once accepted, the mentorship pair is created and both parties can schedule sessions

#### Tracking Sessions
- Log mentorship sessions with date, duration, and notes
- Each session adds to your mentorship history

#### Marking Yourself Available as a Mentor
1. Click **"Become a Mentor"** (or toggle your availability in your profile)
2. Set your **focus areas** (e.g., "Frontend development", "Leadership", "Career transitions")
3. Colleagues can now find and request you

---

### 5.5 Performance

**URL:** `/performance`  
**Access:** Everyone

View performance reviews and feedback.

- Past performance reviews are listed here
- Ratings, written feedback, and action items from reviews are preserved
- Managers create and submit reviews via the Admin Hub

---

## 6. Company — Collaboration

### 6.1 Team Calendar

**URL:** `/calendar`  
**Access:** Everyone

A shared calendar showing team events, public holidays, and time-off.

#### Viewing the Calendar
- Defaults to **month view** — click **Week** or **Day** for a more detailed view
- Color coding:
  - 🟣 **Purple** — company events / announcements
  - 🟢 **Green** — public holidays
  - 🟡 **Yellow** — approved leave
  - 🔵 **Blue** — 1:1 meetings
  - ⚪ **Grey** — project milestones

#### Creating a Calendar Event
1. Click on any date (or click **"+ New Event"**)
2. Enter a **title**, **start/end time**, and **description**
3. Add **attendees** from the team
4. Click **Save**

#### Public Holidays
- Admins add public holidays under **Admin Hub → Holidays**
- These appear on everyone's calendar automatically and do not count against leave balances

---

### 6.2 Projects

**URL:** `/projects`  
**Access:** Everyone

Manage team projects and sprint planning.

#### Creating a Project
1. Click **"New Project"**
2. Enter: Name, Description, Start Date, End Date (optional), Status
3. Assign **team members**
4. Click **Create**

#### Project Board
- Click a project to open its detail view
- **Sprints tab** — create sprints with a name and date range
- **Tasks tab** — tasks linked to this project appear here (tasks created in `/tasks` can be assigned a project)
- **Members tab** — manage who has access to this project

#### Sprint Planning
1. Open a project → Sprints tab
2. Click **"New Sprint"**
3. Enter the sprint name and date range
4. Team members assign tasks to the sprint when creating/editing them

---

### 6.3 Team Directory

**URL:** `/team`  
**Access:** Everyone

Browse all active team members.

- Each card shows: photo, name, job title, department, and email
- Click a card to view the full profile: bio, skills, social links, and recent activity
- Use the **search bar** to find a colleague by name or department
- Use the **department filter** to narrow the list

---

### 6.4 Kudos

**URL:** `/kudos`  
**Access:** Everyone

Recognize and celebrate your colleagues' contributions.

#### Giving Kudos
1. Click **"Give Kudos"**
2. Select the **recipient** from your team
3. Choose a **category**: Teamwork, Innovation, Leadership, Helpfulness, Excellence
4. Write a **personal message**
5. Click **Send**

#### Kudos Feed
- All kudos are visible in a public feed (within the company)
- Kudos received appear on the recipient's profile
- The most recognized colleagues appear in the **"Top Contributors"** sidebar

---

### 6.5 Announcements

**URL:** `/announcements`  
**Access:** Everyone (Admins/Managers can post)

Stay informed about company news and updates.

- Announcements are listed newest first
- Important announcements are pinned to the top
- Each announcement can include text, links, and attachments

#### Posting an Announcement (Admin/Manager)
1. Click **"New Announcement"**
2. Enter title and body
3. Toggle **"Pin"** if this is high-priority
4. Click **Publish** — all employees are notified

---

### 6.6 Documents

**URL:** `/documents`  
**Access:** Everyone

Access shared company documents, policies, and resources.

- Documents are organized in folders
- Click a document to view it in the browser or download it
- **Search** by file name or keyword using the search bar

#### Uploading Documents (Admin/Manager)
1. Click **"Upload Document"**
2. Select a file from your computer
3. Choose or create a **folder**
4. Add a description
5. Click **Upload**

---

## 7. Manager Features

Managers have access to everything Employees and Interns do, plus:

### Team Logs

**URL:** `/work-log/admin`

- View all team members' work logs in one place
- Filter by employee or date range
- Export to CSV for reporting

### Analytics

**URL:** `/analytics`

A management dashboard with team-wide metrics.

**Available metrics:**
- **Attendance Rate** — % of team clocked in on any given day, trend over time
- **Leave Overview** — pending requests, upcoming approved leave, balance summaries
- **Task Completion Rate** — tasks closed vs. opened per sprint/week
- **Expense Summary** — team spending by category and month
- **Helpdesk Stats** — open ticket count, average resolution time

**Using Analytics Effectively:**
1. Use the **date range picker** to compare different periods
2. Click **"Export"** on any chart to download the underlying data as CSV
3. Share the URL with other managers (they must have Manager role to view)

### Approvals

As a Manager you have approval authority over:

| Item | Where to approve |
|------|-----------------|
| Leave requests | `/leave` → Team Requests tab |
| Expense claims | `/expenses` → Team tab |
| Helpdesk tickets | `/helpdesk` → open the ticket |
| Onboarding checklist sign-off | `/onboarding` → team view |

**Best Practice:** Review pending approvals every morning. The Dashboard shows a count of items awaiting your action.

### Conducting Performance Reviews
1. Go to **Admin Hub → Performance** (visible to Managers+)
2. Select the employee
3. Fill in the review form: ratings by category, written feedback, development goals
4. Submit — the employee can view the completed review in their `/performance` page

---

## 8. Admin / Executive Features

Admins (including CEO, CMO, CTO roles) have full access to the entire portal plus the Admin-only sections below.

### Admin Hub

**URL:** `/admin`

The central control panel. All admin functions are accessible from here.

---

#### 8.1 User Management

Manage all employees in the system.

- **View all users** with their role, department, and status
- **Change a user's role**: click the user → Edit → change Role dropdown
  - Available roles: INTERN, EMPLOYEE, MANAGER, ADMIN, CEO, CMO, CTO
- **Deactivate a user** — sets their status to INACTIVE, revokes portal access
- **Allowed Emails** — manage which email addresses are permitted to sign in
  - Add new emails before a new hire joins so they can sign in from day one
  - Remove an email to immediately revoke access

---

#### 8.2 Leave Balances

- View and adjust individual leave balances
- Set the annual leave allowance globally or per employee
- Override a specific employee's balance if needed (e.g., carry-forward from previous year)

---

#### 8.3 Holiday Management

- Add, edit, or remove **public holidays**
- Holidays appear on all employees' Team Calendar automatically
- Holidays do not deduct from leave balances

**Adding a Holiday:**
1. Admin Hub → Holidays → New Holiday
2. Enter name and date
3. Optionally mark as "Company-wide" or region-specific
4. Save — it immediately appears on the calendar

---

#### 8.4 Departments

- Create and rename departments
- Assign a department head
- Employees can be assigned to a department from their profile

---

#### 8.5 Company Settings

**URL:** `/admin` → Company Settings tab

Configure portal-wide settings:
- **Company name and logo** (displayed in the sidebar and emails)
- **Default currency** for expenses
- **Work hours** — standard daily hours (used in attendance reporting)
- **Feature toggles** — enable/disable specific features (e.g., disable Kudos or OKRs if not needed)
- **Notification preferences** — which events generate portal notifications

---

#### 8.6 Asset Management

Track company hardware and assets assigned to employees.

**Adding an Asset:**
1. Admin Hub → Assets → New Asset
2. Enter: Asset Name, Type (Laptop, Phone, Monitor, etc.), Serial Number, Purchase Date, Value
3. Click Save

**Assigning an Asset:**
1. Click an asset → "Assign"
2. Select the employee
3. Add any notes
4. Save — this creates an assignment record with the date

**Viewing Assignment History:**
- Each asset has a history tab showing all past and current assignments
- This is useful for audits and when an employee offboards

---

#### 8.7 Onboarding Templates

Create reusable onboarding checklists for new hires.

**Creating a Template:**
1. Admin Hub → Onboarding → New Template
2. Enter template name (e.g., "Engineering New Hire", "Marketing Intern")
3. Add checklist items — each item has: title, description, and optional due-days (e.g., "Complete by day 3")
4. Save

**Assigning to a User:**
1. Admin Hub → Onboarding → Assign
2. Select the user and the template
3. Click Assign — the checklist appears in the user's `/onboarding` page immediately

---

#### 8.8 Bulk Operations

Perform mass actions across multiple users.

**Available bulk actions:**
- **Bulk update roles** — change role for a selected group of users
- **Bulk leave balance reset** — reset annual leave balances at the start of a new year
- **Bulk assign onboarding template** — for hiring cohorts
- **Bulk deactivate** — for offboarding a group

**How to use:**
1. Admin Hub → Bulk Operations
2. Select the operation type
3. Use the checkbox list to select affected users
4. Configure the operation parameters
5. Click **Preview** to see what will change, then **Confirm** to execute

---

#### 8.9 Audit Logs

**URL:** Admin Hub → Audit Logs

A tamper-proof record of all significant actions taken in the portal.

- Every record shows: **timestamp, actor (who), action type, affected entity, and IP address**
- Filter by user, action type, or date range
- Export to CSV for compliance or investigation purposes

**Actions that are logged:**
- Sign-ins and sign-outs
- Role changes
- Leave approvals/rejections
- Expense approvals/rejections
- Compensation record changes
- User deactivations
- Settings changes
- Bulk operations

---

#### 8.10 CSV Exports

Export data from the portal for external reporting or payroll.

Available exports (accessible from their respective pages via the **Export** button, or from Admin Hub):
- Attendance records (by date range, by employee)
- Leave requests and balances
- Expense claims (by status, by category, by employee)
- Work logs
- Team analytics summary
- Compensation history (admin only)

---

### D&I Dashboard

**URL:** `/admin/diversity`  
**Access:** Admin only

Aggregate diversity and inclusion metrics to help track demographic representation.

> **Privacy note:** This page shows **aggregate counts only** — no individual is ever identified by their D&I data. Participation is voluntary; employees who haven't filled in their D&I fields are counted as "Not disclosed."

**Available metrics:**
- Gender distribution (donut chart)
- Ethnicity breakdown
- Pronoun representation
- Location distribution
- Trends over time (as the team grows)

**Improving data quality:**
- Encourage employees to optionally fill in D&I fields in Settings
- The page clearly shows what percentage of the team has provided data
- Communicate that this data is confidential, voluntary, and used only for aggregate reporting

---

### Compensation Management

**URL:** `/admin/compensation`  
**Access:** Admin only — never visible to employees

Manage salary history and compensation records for all employees.

> ⚠️ **Strictly confidential.** Compensation data is never exposed in any other part of the portal. It is only accessible by Admins.

#### Viewing Compensation History
1. Go to **/admin/compensation**
2. Use the **search bar** to find an employee
3. Click their name — the right panel shows their full compensation history, newest first
4. The **"Current"** badge marks the most recent active record

#### Recording a Compensation Change
1. Select the employee
2. Click **"Record Change"**
3. Fill in:
   - **Effective Date** — when the new compensation takes effect
   - **Base Salary (annual)** — in the selected currency
   - **Currency** — BDT, USD, EUR, GBP, or INR
   - **Bonus (annual)** — target annual bonus if applicable
   - **Equity (shares)** — share grant if applicable
   - **Reason** — Initial offer / Annual review / Promotion / Market adjustment / Retention / Other
   - **Notes** — any confidential context
4. Click **Save**

All records are immutable — to correct a mistake, add a new record with the corrected values and note "Correction" in the reason.

---

## 9. Settings & Notifications

### Settings

**URL:** `/settings`  
**Access:** Everyone

Manage your personal profile and preferences.

**Profile tab:**
- Name, job title, department
- Profile photo (upload from your computer)
- Bio (shown on your Team Directory card)
- Phone number and location

**D&I tab (optional):**
- Gender identity
- Pronouns
- Ethnicity
- These fields are entirely voluntary and only used for anonymous aggregate D&I reporting

**Preferences tab:**
- Theme preference (Light / Dark / System)
- Notification settings — choose which events send you portal notifications

### Notifications

**URL:** `/notifications`

All portal notifications in one place. Notifications are generated for:
- Leave request status changes (approved/rejected)
- Expense claim status changes
- New helpdesk ticket replies
- Kudos received
- New announcements (important ones)
- Upcoming 1:1 meetings (day-of reminder)
- Task due-date reminders
- New tasks assigned to you

Click the **🔔 bell** in the header to see the most recent 10 notifications. Click "View all" to go to the full notifications page.

**Marking as read:** Click a notification to mark it read, or click "Mark all read" at the top of the page.

---

## 10. Tips for Power Users

### Daily Workflow (Recommended)

**Morning (start of day):**
1. Open **/dashboard** — check your stat cards for anything urgent
2. Clock in via **/attendance** or the dashboard quick-action
3. Review **Notifications** — action anything pending
4. Check **/tasks** — prioritize your day

**During the day:**
- Add **Work Log** entries as you complete significant pieces of work (don't wait until EOD)
- Update **task statuses** as you progress
- Raise **Helpdesk tickets** immediately for any blockers rather than letting them sit

**End of day:**
1. Clock out via **/attendance**
2. Add final **Work Log** entry
3. Update any outstanding task statuses

---

### For Managers — Weekly Routine

| Day | Action |
|-----|--------|
| Monday | Check Analytics — review last week's team performance |
| Tuesday | Process any pending leave/expense approvals |
| Wednesday | Review Team Logs — spot any blockers in work summaries |
| Thursday | Check in on open Helpdesk tickets — resolve anything stale |
| Friday | Review next week's Team Calendar — confirm 1:1s are scheduled |

---

### Keyboard & Navigation Shortcuts

| Action | How |
|--------|-----|
| Toggle sidebar | Click ☰ in top-left header |
| Switch theme | Click 🌙/☀ in top-right header |
| Jump to notifications | Click 🔔 in header |
| Go to settings | Click your avatar → Settings |
| Sign out | Click your avatar → Sign out |

---

### Getting the Most from Each Feature

- **Attendance + Work Log together** give managers the full picture: hours worked + what was done
- **OKRs + Goals together** create two layers: company-aligned (OKRs) and personal (Goals)
- **1:1 Meetings + Career Path** make performance conversations structured — bring your Career Path page to every 1:1
- **Kudos** are most powerful when specific — mention the exact action ("for staying late to fix the deployment" beats "for being great")
- **Helpdesk** for any IT/HR issue — do NOT use email or Slack for support requests; tickets create accountability and a paper trail

---

## 11. Frequently Asked Questions

**Q: I can't sign in — it says "Access Denied"**  
A: Your email hasn't been added to the allowed list. Contact your admin (or metabuilddynamics@gmail.com) and ask them to add your email under Admin Hub → Allowed Emails.

**Q: I forgot to clock out yesterday. What do I do?**  
A: You cannot edit attendance records yourself. Contact your admin and they can delete the erroneous open session so you can clock in today normally.

**Q: My leave balance looks wrong.**  
A: Go to Settings → check your profile is assigned the correct role and department. If still incorrect, ask your admin to manually adjust your balance under Admin Hub → Leave Balances.

**Q: Can my manager see my Goals and OKRs?**  
A: Yes. Goals and OKRs are visible to your manager. This is intentional — they're meant to be discussed in 1:1s.

**Q: Can my colleagues see my salary?**  
A: No. Compensation data is strictly admin-only. It is not visible anywhere in the portal to employees or managers.

**Q: I submitted an expense but made a mistake. Can I edit it?**  
A: Yes, you can edit or withdraw an expense claim while it is still in **Pending** status. Once it's approved, contact your admin.

**Q: How do I change my role from Intern to Employee?**  
A: Only an Admin can change roles. Ask your admin to update your role in Admin Hub → Users.

**Q: The theme isn't saving — it keeps switching back.**  
A: Make sure you're signed in when you set the theme. Anonymous/incognito sessions don't persist theme preference. Clear your browser cache if the issue continues.

**Q: I can't find a feature — the sidebar doesn't show it.**  
A: Some features are role-restricted. If you believe you should have access (e.g., Analytics as a Manager), contact your admin to verify your role is set correctly.

**Q: How do I report a bug or request a new feature?**  
A: Use the **Helpdesk** (`/helpdesk`) — raise a ticket with category "General" and describe the issue. The admin team will triage it.

---

*MBD Portal — Built by Meta Build Dynamics*  
*For support: raise a Helpdesk ticket or email metabuilddynamics@gmail.com*
