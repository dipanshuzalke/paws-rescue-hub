# Paws Rescue Hub

Act as a Senior Product Designer, UI/UX Designer, and Senior React Frontend Engineer.

I am building a college final-year project called:

"Stray Animal Rescue Coordination and Management System"

The goal is to build a centralized web platform that connects citizens, rescuers/volunteers, NGOs, and administrators to report, coordinate, track, and manage stray animal rescue cases.

IMPORTANT:
This is PHASE 1 of the project.

PHASE 1 IS ONLY FOR COMPLETE FRONTEND/UI/UX DEVELOPMENT.

Do NOT implement the backend, database, real authentication, real APIs, Socket.IO, real-time communication, real GPS tracking, email services, or external API integrations.

Use realistic MOCK DATA and local frontend state wherever necessary so the entire application can be demonstrated and navigated.

The frontend must be designed so that Phase 2 can later connect a Node.js + Express + MongoDB backend without redesigning the UI.

==================================================
1. TECHNOLOGY REQUIREMENTS
==================================================

Use:

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React icons
- React Router or the routing system supported by Lovable
- Recharts for analytics
- Leaflet/OpenStreetMap or a realistic map placeholder for the Phase 1 map UI

Follow modern React component architecture.

Create reusable components instead of duplicating UI.

Use clean, maintainable, production-quality frontend code.

Do NOT create unnecessary backend functionality.

Do NOT connect Supabase or any database in this phase.

All data should come from well-structured mock data files or local state.

==================================================
2. PROJECT PURPOSE
==================================================

The problem:

Stray animals frequently face:

- injuries
- road accidents
- starvation
- abandonment
- illness
- unsafe environmental conditions

Current rescue processes are often fragmented across:

- phone calls
- WhatsApp
- social media
- personal contacts
- different NGO systems

This causes:

- delayed responses
- missed rescue cases
- duplicate reports
- poor communication
- limited tracking
- poor record management

The proposed platform centralizes the entire process:

Citizen reports animal
        ↓
Rescue request created
        ↓
NGO/Rescue team receives request
        ↓
Rescuer is assigned
        ↓
Rescuer accepts
        ↓
Rescue is in progress
        ↓
Animal is rescued
        ↓
Case is closed
        ↓
Rescue history is stored

The final UI should clearly communicate this workflow.

==================================================
3. DESIGN DIRECTION
==================================================

Create a modern, trustworthy, professional animal welfare platform.

The design should feel like a combination of:

- modern SaaS dashboard
- NGO management platform
- emergency response system
- animal welfare application

Avoid making it look like a generic college project.

The UI should be polished enough to look like a real startup product.

Visual personality:

- trustworthy
- compassionate
- modern
- clean
- professional
- accessible
- calm but capable of highlighting emergency situations

Use a clean light theme as the primary theme.

Suggested color system:

Primary:
Deep purple / indigo

Secondary:
Green

Success:
Green

Warning:
Orange

Critical:
Red

Information:
Blue

Background:
Very light gray / off-white

Cards:
White

Text:
Dark slate

Do not overuse gradients.

Use subtle shadows, rounded cards, clean borders, and good spacing.

Use icons consistently.

Emergency colors should be visually distinct:

CRITICAL → red
HIGH → orange
MEDIUM → yellow
LOW → blue/green

==================================================
4. RESPONSIVE DESIGN
==================================================

The entire application must be responsive.

Support:

- Desktop
- Laptop
- Tablet
- Mobile

Desktop:

- sidebar dashboard navigation
- top navigation/header
- multi-column layouts
- tables

Tablet:

- responsive grids
- collapsible sidebar

Mobile:

- hamburger menu
- stacked cards
- responsive tables
- bottom/compact navigation where appropriate
- forms optimized for touch
- map should remain usable
- dashboards should not overflow horizontally

Do not simply shrink desktop UI.

Create proper responsive layouts.

==================================================
5. GLOBAL DESIGN SYSTEM
==================================================

Create reusable components for:

- Button
- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Dialog
- Modal
- Dropdown
- Tooltip
- Badge
- Card
- Table
- Tabs
- Pagination
- Avatar
- Breadcrumb
- Alert
- Toast
- Skeleton loader
- Empty state
- Error state
- Confirmation dialog
- Status badge
- Status timeline
- Search bar
- Filter bar
- Image uploader
- Map container
- Stat card
- Chart card
- Notification item
- User menu
- Sidebar
- Navbar

Keep styling consistent across the entire application.

==================================================
6. GLOBAL NAVIGATION
==================================================

Create a public website navigation:

Logo:
"ResQ Paws"

Tagline:
"Report. Rescue. Recover."

Navigation:

Home
How It Works
About
Rescue Cases
Contact

Right side:

Login
Report an Animal

After entering a dashboard, use a dashboard layout with:

- Sidebar
- Top header
- Notification icon
- Search where appropriate
- User profile menu
- Breadcrumbs
- Main content area

==================================================
7. LANDING PAGE
==================================================

Create a highly polished landing page.

Sections:

--------------------------------
A. NAVBAR
--------------------------------

Logo:

🐾 ResQ Paws

Navigation:

Home
How It Works
Rescue Cases
About
Contact

Buttons:

Login
Report an Animal

Sticky navbar on scroll.

On mobile:

hamburger menu.

--------------------------------
B. HERO SECTION
--------------------------------

Main headline:

"Help Save a Life. Report. Rescue. Recover."

Supporting text:

"One centralized platform connecting citizens, rescuers, volunteers and NGOs to respond faster to animals in need."

Primary CTA:

"Report an Animal"

Secondary CTA:

"How It Works"

Hero visual:

Use a high-quality animal rescue visual or appropriate placeholder imagery.

Include subtle rescue/location UI elements around the hero image such as:

"Critical Rescue"
"2.1 km away"
"Rescue in Progress"

Do not make the design gimmicky.

--------------------------------
C. LIVE STATISTICS
--------------------------------

Show realistic mock statistics:

1,250+
Animals Reported

980+
Successful Rescues

120+
Active Rescuers

35+
Partner NGOs

Use animated counters if appropriate, but keep animations subtle.

--------------------------------
D. HOW IT WORKS
--------------------------------

Create a 5-step process:

01 Report
Citizen reports an animal with location, image and condition.

02 Review
Rescue organizations review the request.

03 Assign
A rescuer is assigned to the case.

04 Rescue
Rescuer responds and updates the status.

05 Recover
Case is completed and rescue history is stored.

Use icons and connecting lines.

--------------------------------
E. WHY RESQ PAWS
--------------------------------

Show cards:

Faster Reporting
Location-Based Requests
Rescue Coordination
Real-Time Status
Centralized Records
Transparent Operations

--------------------------------
F. EMERGENCY SECTION
--------------------------------

Create a visually strong emergency CTA:

"See an animal in danger?"

"Report the situation and help connect it with the nearest rescue team."

Button:

"Report Emergency"

--------------------------------
G. RECENT RESCUE CASES
--------------------------------

Display mock rescue cards.

Each card:

Animal image
Animal type
Location
Emergency level
Status
Date
View Case

Example:

Injured Dog
Nagpur
Critical
Rescued

--------------------------------
H. PARTNER/COMMUNITY SECTION
--------------------------------

Show:

Citizens
Volunteers
Rescuers
NGOs

Explain how each contributes.

--------------------------------
I. FOOTER
--------------------------------

Logo
About
How It Works
Contact
Privacy
Terms

Social icons.

==================================================
8. AUTHENTICATION UI
==================================================

Create:

Login
Register
Forgot Password
Reset Password

These are UI-only in Phase 1.

Use mock authentication behavior.

Login form:

Email
Password
Remember me
Forgot password
Login

Register form:

Full Name
Email
Phone
Password
Confirm Password
Role

Roles available during registration:

Citizen
Rescuer
NGO

Do not allow Admin registration from the public UI.

After mock login, provide a demo role selector or demo accounts so all four dashboards can be explored.

Create demo accounts such as:

citizen@demo.com
rescuer@demo.com
ngo@demo.com
admin@demo.com

Use mock frontend state only.

==================================================
9. DEMO ROLE SWITCHING
==================================================

Because this is Phase 1 without a real backend, provide a convenient development/demo mechanism.

Create either:

A "Demo Login" screen

OR

a role switcher in the development/demo environment.

Allow switching between:

Citizen
Rescuer
NGO
Admin

This is ONLY for demonstrating the four dashboards.

Clearly label it as Demo Mode.

Do not pretend this is real authentication.

==================================================
10. CITIZEN DASHBOARD
==================================================

Create a complete citizen dashboard.

Sidebar:

Dashboard
Report Animal
My Reports
Active Rescues
Rescue History
Notifications
Profile
Settings

Top header:

Search
Notifications
User profile

Dashboard main area:

Greeting:

"Good morning, Rahul"

Subtitle:

"Thank you for helping animals in need."

Stats:

Total Reports
Pending
Active Rescues
Rescued

Example:

8 Total Reports
2 Active
1 Pending
6 Rescued

--------------------------------
RECENT REPORTS
--------------------------------

Create a professional table/card layout.

Columns:

Report ID
Animal
Location
Priority
Status
Date
Action

Example:

#R1023
Dog
Nagpur
Critical
In Progress
10 Aug 2026

Actions:

View
Track

--------------------------------
QUICK ACTIONS
--------------------------------

Large cards:

Report an Animal
Track a Rescue
View Rescue History

--------------------------------
ACTIVE RESCUE
--------------------------------

Show currently active rescue with:

Animal
Location
Rescuer
Status
Timeline
Track Rescue button

==================================================
11. CITIZEN - REPORT ANIMAL PAGE
==================================================

Create a beautiful multi-section form.

Page title:

"Report a Stray Animal"

Subtitle:

"Provide accurate information so rescue teams can respond quickly."

SECTION 1:

Animal Information

Animal Type:

Dog
Cat
Cow
Bird
Other

Animal Count

Condition:

Injured
Sick
Abandoned
Trapped
Accident
Other

Emergency Level:

Critical
High
Medium
Low

SECTION 2:

Description

Large textarea.

Placeholder:

"Describe the animal's condition, surroundings and any immediate danger..."

SECTION 3:

Images

Drag-and-drop upload UI.

Show image previews.

Allow multiple images.

Use mock upload behavior only.

SECTION 4:

Location

Show:

Use Current Location button

Address input

Interactive map UI with mock marker.

Show coordinates in a subtle information panel.

SECTION 5:

Emergency Information

Show a warning card for critical cases.

SECTION 6:

SUBMIT

Button:

"Submit Rescue Request"

After submission, show a mock success confirmation:

"Rescue request submitted successfully."

Generate mock report ID such as:

#R1048

==================================================
12. CITIZEN - REPORT DETAILS
==================================================

Create a detailed rescue case page.

Header:

Rescue #R1023

Animal:
Injured Dog

Status:
Rescue In Progress

Priority:
Critical

Show:

Animal image gallery
Description
Location
Reporter information
Assigned rescuer
Emergency level

--------------------------------
STATUS TIMELINE
--------------------------------

Reported
Assigned
Accepted
Rescue In Progress
Rescued
Closed

Use checkmarks and active indicators.

--------------------------------
MAP
--------------------------------

Show animal location.

For Phase 1 use mock map data.

--------------------------------
RESCUE INFORMATION
--------------------------------

Rescuer:
Rahul Sharma

Organization:
Helping Paws NGO

--------------------------------
RESCUE NOTES
--------------------------------

Show mock notes.

==================================================
13. RESCUER DASHBOARD
==================================================

Create a completely different dashboard optimized for rescue operations.

Sidebar:

Dashboard
Available Requests
Active Rescues
Rescue History
Map
Notifications
Profile
Settings

Stats:

Available Requests
Active Rescues
Completed
Critical

Example:

12 Available
2 Active
48 Completed
3 Critical

--------------------------------
NEARBY RESCUE REQUESTS
--------------------------------

Create cards showing:

Animal image
Animal type
Condition
Emergency level
Distance
Location
Reported time

Example:

🐕 Injured Dog

Critical
1.2 km away
Near Dharampeth

Buttons:

View Details
Accept Rescue

Allow sorting:

Nearest
Priority
Newest

Filters:

Animal type
Emergency
Distance
Status

--------------------------------
MAP VIEW
--------------------------------

Show multiple mock rescue markers.

Different marker colors for priority.

==================================================
14. RESCUER - REQUEST DETAILS
==================================================

Create detailed request screen.

Show:

Animal image
Animal type
Condition
Description
Emergency
Location
Reported time
Distance

Map

Reporter information

Buttons:

Accept Rescue
Reject

If accepted, change mock state to:

"Rescue Accepted"

Then show:

Start Rescue

Once clicked:

"Rescue In Progress"

Then:

"Mark as Rescued"

Use frontend state only.

==================================================
15. RESCUER - ACTIVE RESCUE
==================================================

Show:

Rescue ID
Animal
Location
Current status
Assigned time

Timeline.

Buttons:

Start Rescue
Update Status
Add Rescue Note
Upload Rescue Image
Mark Rescued

Create a rescue update modal.

==================================================
16. RESCUER - RESCUE HISTORY
==================================================

Create table:

ID
Animal
Location
Date
Duration
Status
Action

Include filters.

Show empty state if appropriate.

==================================================
17. NGO DASHBOARD
==================================================

NGO dashboard is an operational management dashboard.

Sidebar:

Dashboard
Rescue Requests
Assignments
Rescuers
Active Rescues
Completed Cases
Analytics
Notifications
Organization Profile
Settings

Stats:

Total Cases
Pending
Assigned
In Progress
Rescued
Critical

Example:

125 Total
18 Pending
12 Assigned
9 In Progress
86 Rescued
5 Critical

--------------------------------
PENDING RESCUE REQUESTS
--------------------------------

Table:

ID
Animal
Location
Priority
Reported
Suggested Rescuer
Action

Actions:

View
Assign

--------------------------------
ACTIVE RESCUES
--------------------------------

Show live-looking operational cards:

R1023
Dog
Critical
Rescue In Progress

Rescuer:
Rahul

Location:
Nagpur

==================================================
18. NGO - ASSIGN RESCUER PAGE
==================================================

Create a professional assignment interface.

Left side:

Rescue Request details.

Right side:

Available Rescuers.

Each rescuer:

Profile image
Name
Availability
Distance
Active cases
Completed cases

Example:

Rahul Sharma
Available
1.2 km
2 Active
48 Completed

Priya Patil
Available
2.7 km
1 Active
35 Completed

Show:

"Recommended Rescuer"

for the nearest available rescuer.

This is mock recommendation logic in Phase 1.

Button:

Assign Rescuer

After assignment show:

"Rescuer Assigned Successfully"

==================================================
19. NGO - RESCUER MANAGEMENT
==================================================

Create a management table:

Rescuer
Status
Active Cases
Completed
Response Time
Rating
Action

Status:

Available
Busy
Offline

Actions:

View Profile
View Cases

==================================================
20. NGO - ANALYTICS
==================================================

Create a beautiful analytics dashboard.

Charts:

1. Rescue cases by month
2. Reports by animal type
3. Cases by emergency level
4. Rescue status distribution
5. Average response time
6. Rescue completion rate

Use Recharts.

Use realistic mock data.

Add date filters:

7 Days
30 Days
3 Months
6 Months
1 Year

==================================================
21. ADMIN DASHBOARD
==================================================

Admin should have the highest-level system management UI.

Sidebar:

Dashboard
Users
Citizens
Rescuers
NGOs
Rescue Reports
Active Rescues
Analytics
System Activity
Settings

Top statistics:

Total Users
Citizens
Rescuers
NGOs
Total Reports
Active Rescues
Completed Rescues
Critical Cases

--------------------------------
SYSTEM OVERVIEW
--------------------------------

Charts:

Reports over time
Rescues over time
Users by role
Cases by status
Emergency distribution

--------------------------------
RECENT ACTIVITY
--------------------------------

Show activity feed:

"New rescue report created"
"Rescuer accepted case"
"NGO assigned rescuer"
"Case marked rescued"
"New NGO registered"

==================================================
22. ADMIN - USER MANAGEMENT
==================================================

Create professional user management.

Tabs:

All
Citizens
Rescuers
NGOs
Admins

Table:

Name
Email
Role
Status
Joined
Cases
Actions

Actions:

View
Edit
Activate
Deactivate

Use confirmation dialogs.

==================================================
23. ADMIN - NGO MANAGEMENT
==================================================

Table:

NGO Name
Location
Contact
Rescuers
Cases
Verification
Status

Verification badges:

Verified
Pending
Rejected

Actions:

View
Verify
Reject

==================================================
24. ADMIN - RESCUE REPORT MANAGEMENT
==================================================

Show all reports.

Filters:

Status
Priority
Animal
Location
Date
Assigned/Unassigned

Table with:

Report ID
Animal
Reporter
Location
Priority
Status
Assigned Rescuer
Date
Action

==================================================
25. ADMIN - SYSTEM ACTIVITY
==================================================

Create an audit-style activity feed.

Example:

10:42 AM
Rahul Sharma accepted Rescue #R1023

10:35 AM
NGO assigned Rescue #R1023

10:22 AM
Citizen created Rescue #R1023

Use icons and timestamps.

==================================================
26. NOTIFICATIONS UI
==================================================

Build a complete notification center.

Notification examples:

"New critical rescue request"
"Your rescue request has been accepted"
"Rescuer has started the rescue"
"Animal marked as rescued"
"New assignment from Helping Paws NGO"

Tabs:

All
Unread
Rescue Updates
System

Use unread badges.

For Phase 1, notifications are mock data only.

==================================================
27. PROFILE PAGE
==================================================

Create reusable profile page for all roles.

Show:

Profile image
Full name
Email
Phone
Location
Role
Joined date

Buttons:

Edit Profile
Change Password
Save Changes

UI only.

==================================================
28. SETTINGS PAGE
==================================================

Include:

Notification Preferences
Email Notifications
Push Notifications
Language
Theme
Privacy
Account

Use switches and dropdowns.

These can be frontend-only in Phase 1.

==================================================
29. RESCUE CASES PUBLIC PAGE
==================================================

Create a public rescue case explorer.

Users can browse:

Recent Rescue Cases
Successful Rescues
Active Cases

Filters:

Animal Type
Location
Status
Emergency

Each case card:

Image
Animal
Location
Status
Date

Clicking opens case details.

Do not expose private citizen information.

==================================================
30. MAP EXPERIENCE
==================================================

Create a reusable map component.

For Phase 1:

Use mock locations.

Show:

Animal location markers
Rescue request markers
Mock rescuer markers

Marker styles should visually represent:

Critical
High
Medium
Low

Create:

List View
Map View

toggle.

The map UI must be designed so real location and live GPS can be integrated in Phase 3.

==================================================
31. STATUS SYSTEM
==================================================

Use a consistent status system everywhere.

Statuses:

REPORTED
ASSIGNED
ACCEPTED
IN_PROGRESS
RESCUED
CLOSED
CANCELLED

Emergency:

CRITICAL
HIGH
MEDIUM
LOW

User status:

ACTIVE
INACTIVE
PENDING
VERIFIED

Create reusable badge components.

==================================================
32. MOCK DATA
==================================================

Create realistic mock data for:

Users
Citizens
Rescuers
NGOs
Rescue Reports
Assignments
Notifications
Rescue History
Analytics

Use at least:

20 rescue reports
10 rescuers
5 NGOs
15 users
20 notifications
Multiple completed rescue cases

Do not use placeholder text such as:

"Lorem ipsum"

Use realistic names, locations, animal types, descriptions and statuses.

Use Indian context.

Example locations:

Nagpur
Dharampeth
Sadar
Manish Nagar
Wardha Road
Sitabuldi
Bajaj Nagar

Keep mock data clearly separated from UI components so Phase 2 can replace it with API calls.

==================================================
33. UI STATES
==================================================

Every major page should support:

Loading state
Empty state
Error state
Success state

Example empty state:

"No rescue requests found."

Example loading:

Skeleton cards/table rows.

Example error:

"Unable to load rescue requests."

Provide retry button.

==================================================
34. MODALS & INTERACTIONS
==================================================

Implement realistic frontend interactions.

Examples:

Accept Rescue
→ Confirmation modal

Assign Rescuer
→ Assignment modal

Mark Rescued
→ Completion modal

Delete Report
→ Confirmation modal

Deactivate User
→ Confirmation modal

Notifications
→ Mark as read

Filters
→ Update visible mock data

Search
→ Filter mock data

These should actually work in frontend state.

==================================================
35. RESPONSIVE MOBILE EXPERIENCE
==================================================

Pay special attention to mobile.

Citizen mobile experience:

Bottom/compact navigation

Large:

"Report Animal"

button.

Report form should be easy to complete using a phone.

Rescuer mobile experience:

Prioritize:

Nearby Requests
Map
Emergency Cases
Active Rescue

The rescuer should be able to quickly:

View → Accept → Start Rescue → Mark Rescued

==================================================
36. ACCESSIBILITY
==================================================

Follow good accessibility practices.

Use:

- semantic HTML
- accessible labels
- keyboard navigation
- sufficient contrast
- focus states
- ARIA labels where needed
- accessible dialogs
- accessible forms

Do not depend only on color to communicate status.

For example:

Critical
[red icon] Critical

not just a red badge.

==================================================
37. ANIMATIONS
==================================================

Use subtle professional animations.

Examples:

- page transitions
- card hover
- button feedback
- modal transitions
- sidebar transitions
- notification animations
- statistics count-up
- timeline transitions

Avoid excessive animations.

Do not use distracting animations that reduce usability.

==================================================
38. COMPONENT ARCHITECTURE
==================================================

Use reusable components.

Suggested structure:

src/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── dashboard/
│   ├── rescue/
│   ├── maps/
│   ├── notifications/
│   ├── charts/
│   └── forms/
│
├── pages/
│   ├── public/
│   ├── auth/
│   ├── citizen/
│   ├── rescuer/
│   ├── ngo/
│   └── admin/
│
├── data/
│   ├── mockUsers.ts
│   ├── mockReports.ts
│   ├── mockRescuers.ts
│   ├── mockNGOs.ts
│   ├── mockNotifications.ts
│   └── mockAnalytics.ts
│
├── types/
│   ├── user.ts
│   ├── rescue.ts
│   └── notification.ts
│
├── hooks/
│
├── utils/
│
└── routes/

Keep business-independent UI components reusable.

==================================================
39. FUTURE BACKEND COMPATIBILITY
==================================================

IMPORTANT:

Even though Phase 1 uses mock data, structure the frontend as if APIs will be added in Phase 2.

Do not directly scatter mock data throughout components.

Instead use service-like functions such as:

getReports()
getReportById()
getMyReports()
getAvailableRescues()
getRescueHistory()
getNotifications()
getUsers()
getAnalytics()

Initially these return mock data.

In Phase 2 these functions will be replaced with Axios API calls.

This will make backend integration easier.

==================================================
40. PHASE 1 EXCLUSIONS
==================================================

DO NOT implement:

- MongoDB
- Node.js backend
- Express backend
- Mongoose
- JWT authentication
- Real OAuth
- Supabase
- Socket.IO
- Real-time backend
- WebSockets
- Real GPS tracking
- Email service
- SMS service
- Push notification backend
- Real NGO verification
- Real payment
- AI features
- Production API integrations

These belong to Phase 2 or Phase 3.

The UI may simulate these features using mock state.

==================================================
41. ROUTES
==================================================

Create complete routing.

Public:

/
 /how-it-works
 /about
 /rescue-cases
 /contact

Auth:

/login
/register
/forgot-password
/reset-password

Citizen:

/citizen/dashboard
/citizen/report
/citizen/reports
/citizen/reports/:id
/citizen/rescues
/citizen/history
/citizen/notifications
/citizen/profile
/citizen/settings

Rescuer:

/rescuer/dashboard
/rescuer/requests
/rescuer/requests/:id
/rescuer/active
/rescuer/history
/rescuer/map
/rescuer/notifications
/rescuer/profile
/rescuer/settings

NGO:

/ngo/dashboard
/ngo/requests
/ngo/requests/:id
/ngo/assignments
/ngo/rescuers
/ngo/active
/ngo/history
/ngo/analytics
/ngo/notifications
/ngo/profile
/ngo/settings

Admin:

/admin/dashboard
/admin/users
/admin/citizens
/admin/rescuers
/admin/ngos
/admin/reports
/admin/active-rescues
/admin/analytics
/admin/activity
/admin/settings

==================================================
42. DEMO FLOW
==================================================

The application must support this complete frontend demo flow:

1. Open landing page.

2. Click "Report an Animal".

3. Login as Citizen.

4. Open Citizen Dashboard.

5. Create a mock animal report.

6. Show success message with report ID.

7. Open My Reports.

8. View report details.

9. Switch to Rescuer Demo.

10. Open Available Requests.

11. See the newly created mock report.

12. Open request.

13. Accept rescue.

14. Start rescue.

15. Update status.

16. Switch to NGO Demo.

17. See active rescue.

18. View rescuer assignment.

19. Open analytics.

20. Switch to Admin Demo.

21. See the overall system statistics.

22. View users.

23. View rescue reports.

24. View system activity.

The demo should feel like one connected application even though it is using frontend mock state.

==================================================
43. FINAL QUALITY REQUIREMENTS
==================================================

The final result should NOT look like:

- a basic CRUD dashboard
- a template copied from somewhere
- a generic admin panel
- an unfinished college project

It should look like a real product.

Prioritize:

1. Visual hierarchy
2. Consistent spacing
3. Professional typography
4. Strong dashboard layouts
5. Excellent responsive design
6. Clear emergency indicators
7. Good UX
8. Reusable components
9. Realistic mock data
10. Smooth navigation

Do not create excessive cards everywhere.

Use tables when tables are appropriate.

Use charts when charts are appropriate.

Use timelines for rescue progress.

Use maps for location-related information.

Use dialogs for confirmations.

Use cards for summary information.

==================================================
44. REFERENCE ARCHITECTURE
==================================================

The final frontend should conceptually represent:

Users
   ↓
React Frontend
   ↓
Future REST API
   ↓
Future Node.js + Express Backend
   ↓
Future MongoDB Database

For Phase 1, only build:

Users
   ↓
React Frontend
   ↓
Mock Data / Local State

The attached architecture image is provided as a conceptual reference for the project. Improve the architecture and UI according to the requirements above rather than copying the image exactly.

==================================================
45. FINAL PHASE 1 DELIVERABLE
==================================================

At the end of this task, I want a complete, polished, responsive frontend prototype containing:

✓ Professional landing page
✓ Authentication screens
✓ Citizen dashboard
✓ Rescuer dashboard
✓ NGO dashboard
✓ Admin dashboard
✓ Animal reporting workflow
✓ Rescue details
✓ Rescue tracking timeline
✓ Rescue assignment UI
✓ Rescuer management
✓ User management
✓ NGO management
✓ Notifications center
✓ Profile pages
✓ Settings
✓ Public rescue cases
✓ Maps
✓ Analytics
✓ Charts
✓ Search
✓ Filters
✓ Tables
✓ Modals
✓ Loading states
✓ Empty states
✓ Error states
✓ Responsive mobile UI
✓ Mock data
✓ Demo role switching
✓ Fully navigable routes
✓ Reusable component architecture

The result should be a complete Phase 1 frontend that can later be connected to a Node.js + Express + MongoDB backend in Phase 2 and Socket.IO/live GPS/advanced services in Phase 3.

Do not stop after creating only the landing page or one dashboard.

Build the COMPLETE Phase 1 frontend experience.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/90f33a0f-118f-4c5b-8e91-b8ab396a208c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
