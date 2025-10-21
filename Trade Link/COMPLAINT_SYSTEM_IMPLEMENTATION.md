# TradeLink Complaint System - Complete Implementation Guide

## Overview
This document provides a comprehensive guide to the complaint system implementation for the TradeLink platform. The system allows users to submit complaints about workers and their work, while admins can view, respond to, and manage these complaints.

---

## Features Implemented

### User Features:
1. **Submit Complaints**: Users can file complaints about workers they've worked with
2. **View Complaints**: Users can see all their submitted complaints with status tracking
3. **Worker Selection**: Complaints can only be filed against workers from user's work history
4. **Status Tracking**: Real-time status updates (Pending, In Progress, Resolved)
5. **Admin Responses**: Users can view admin responses to their complaints

### Admin Features:
1. **View All Complaints**: Comprehensive list of all user complaints
2. **Update Status**: Change complaint status (Pending → In Progress → Resolved)
3. **Respond to Complaints**: Add/update admin responses
4. **Delete Complaints**: Remove complaints from the system
5. **User & Worker Details**: View complete information about complainant and worker

---

## Files Modified/Created

### 1. Database Layer

#### `connection/constants.js` (Modified)
- Added: `complaint_base: "Complaint_Base"`
- Purpose: MongoDB collection constant for complaints

#### `database/userbase.js` (Modified)
- **Added Function**: `Submit_Complaint_About_Worker(complaintData)`
  - Creates new complaint with userId, workerId, subject, complaint text
  - Auto-sets status to 'pending', timestamps, and null values for adminResponse
  
- **Added Function**: `Get_User_Complaints(userId)`
  - Retrieves user's complaints using MongoDB aggregation
  - Joins worker details from Workers_Base collection
  - Sorts by creation date (newest first)

#### `database/adminbase.js` (Modified)
- **Added Function**: `Get_All_Complaints()`
  - Fetches all complaints with dual $lookup aggregation
  - Joins both user and worker details
  - Sorted by creation date
  
- **Added Function**: `Update_Complaint_Status(complaintId, status, adminResponse)`
  - Updates complaint status and admin response
  - Auto-sets resolvedAt timestamp when status is 'resolved'
  
- **Added Function**: `Delete_Complaint(complaintId)`
  - Removes complaint from database

---

### 2. Routing Layer

#### `routes/users.js` (Modified)
Added three routes:

1. **GET `/complaints`**
   - Displays user's complaint list
   - Protected by `verifyLogin` middleware
   
2. **GET `/submit-complaint`**
   - Shows complaint submission form
   - Populates worker dropdown from user's work history
   - Protected by `verifyLogin` middleware
   
3. **POST `/submit-complaint`**
   - Handles complaint submission
   - Validates required fields
   - Redirects to complaints list on success

#### `routes/admin.js` (Modified)
Added three routes:

1. **GET `/admin/complaints`**
   - Displays all complaints for admin management
   - Protected by `verifyAdminLogin` middleware
   
2. **POST `/admin/update-complaint`**
   - Handles status updates and admin responses
   - Protected by `verifyAdminLogin` middleware
   
3. **GET `/admin/delete-complaint`**
   - Handles complaint deletion via query parameter
   - Protected by `verifyAdminLogin` middleware

---

### 3. View Layer

#### `views/user/submit-complaint.hbs` (Created)
**Features:**
- Worker dropdown (populated from work history)
- Subject input field
- Detailed complaint textarea
- Form validation
- Responsive design
- Cancel button to return to complaints list

**Styling:**
- Poppins font family
- #4d74ea blue primary color
- Card-based layout with rounded corners
- Background image consistency
- Mobile-responsive breakpoints

#### `views/user/complaints.hbs` (Created)
**Features:**
- Card-based complaint display
- Color-coded status badges:
  - Pending: Yellow (#fff3cd)
  - In Progress: Blue (#cfe2ff)
  - Resolved: Green (#d1e7dd)
- Worker information display
- Admin response section (when available)
- Timestamps for submission and resolution
- "New Complaint" button
- Empty state with call-to-action

**Layout:**
- Grid layout for multiple complaints
- Hover effects on cards
- Gradient header for each card
- Responsive grid (1 column on mobile)

#### `views/admin/complaints-list.hbs` (Created)
**Features:**
- Comprehensive complaint list
- User and worker information display
- Inline response forms (toggle visibility)
- Status dropdown with current selection
- Admin response textarea
- Delete button with confirmation dialog
- Total complaints counter
- Empty state message

**Functionality:**
- `toggleResponse(complaintId)`: Shows/hides response form
- `deleteComplaint(complaintId)`: Confirms and deletes complaint
- Form submission for status updates

**Styling:**
- List-based layout (not grid)
- Expandable response forms
- Color-coded status badges
- Action buttons (Respond, Delete)
- Two-column user/worker info display

#### `views/partials/user-header.hbs` (Modified)
- Added "Complaints" navigation link
- Positioned after "History" link

#### `views/partials/admin-header.hbs` (Modified)
- Added "Complaints" navigation link
- Positioned after "Active" link

---

### 4. Application Configuration

#### `app.js` (Modified)
- Registered Handlebars helper function `eq` for equality comparison
- Used in admin template for status dropdown selection
- Syntax: `{{#if (eq this.status 'pending')}}selected{{/if}}`

---

## Database Schema

### Complaint Collection Structure:
```javascript
{
  _id: ObjectId,
  userId: ObjectId,              // Reference to userbase._id
  workerId: ObjectId,            // Reference to Workers_Base.wkid
  subject: String,               // Brief description
  complaint: String,             // Detailed complaint text
  status: String,                // 'pending' | 'in-progress' | 'resolved'
  createdAt: Date,               // Submission timestamp
  resolvedAt: Date | null,       // Resolution timestamp (null until resolved)
  adminResponse: String | null   // Admin's response (null until admin responds)
}
```

---

## User Flow

1. **User logs in** → Sees "Complaints" in navigation
2. **Clicks "Complaints"** → Views list of their complaints (or empty state)
3. **Clicks "New Complaint"** → Redirected to submission form
4. **Selects worker** from dropdown (only workers they've worked with)
5. **Fills subject and complaint** → Submits form
6. **Redirected to complaints list** → Sees new complaint with "pending" status
7. **Waits for admin response** → Status updates appear automatically
8. **Views admin response** → Sees resolution details when complaint is resolved

---

## Admin Flow

1. **Admin logs in** → Sees "Complaints" in navigation
2. **Clicks "Complaints"** → Views all complaints from all users
3. **Reviews complaint details** → Sees user info, worker info, complaint text
4. **Clicks "Respond"** → Response form expands inline
5. **Updates status** → Selects from dropdown (Pending/In Progress/Resolved)
6. **Writes response** → Provides feedback or resolution details
7. **Clicks "Save Response"** → Updates saved, form collapses
8. **Optional: Delete complaint** → Confirmation dialog → Complaint removed

---

## Testing Checklist

### User Side:
- [ ] Navigate to /complaints (should show empty state if no complaints)
- [ ] Click "New Complaint" button
- [ ] Verify worker dropdown shows only workers from work history
- [ ] Submit complaint without filling fields (should show validation errors)
- [ ] Submit valid complaint (should redirect to complaints list)
- [ ] Verify new complaint appears with "pending" status
- [ ] Check complaint card displays all information correctly
- [ ] Test responsive design on mobile devices

### Admin Side:
- [ ] Navigate to /admin/complaints
- [ ] Verify all complaints are displayed
- [ ] Check user and worker details are correct
- [ ] Click "Respond" button (form should expand)
- [ ] Update status dropdown (verify current status is selected)
- [ ] Write admin response and save
- [ ] Verify response appears in complaint card
- [ ] Test "Delete" button with confirmation dialog
- [ ] Verify complaint is removed after deletion
- [ ] Test responsive design on mobile devices

### Database:
- [ ] Check MongoDB for Complaint_Base collection
- [ ] Verify complaint documents have correct structure
- [ ] Test that resolvedAt is set when status changes to 'resolved'
- [ ] Verify ObjectId references are correct for userId and workerId

---

## API Endpoints Summary

### User Endpoints:
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/complaints` | View user's complaints | Yes (User) |
| GET | `/submit-complaint` | Show complaint form | Yes (User) |
| POST | `/submit-complaint` | Submit new complaint | Yes (User) |

### Admin Endpoints:
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/complaints` | View all complaints | Yes (Admin) |
| POST | `/admin/update-complaint` | Update complaint status/response | Yes (Admin) |
| GET | `/admin/delete-complaint?id={id}` | Delete complaint | Yes (Admin) |

---

## Styling Guidelines

### Colors:
- Primary Blue: `#4d74ea`
- Hover Blue: `#3d5fd1`
- Pending Yellow: `#fff3cd` (text: `#856404`)
- In Progress Blue: `#cfe2ff` (text: `#084298`)
- Resolved Green: `#d1e7dd` (text: `#0f5132`)
- Background Gray: `#f8f9fa`
- Text Dark: `#333`
- Text Light: `#666`

### Typography:
- Font Family: 'Poppins', sans-serif
- Headings: 600-700 weight
- Body: 400 weight
- Small Text: 12-14px
- Regular Text: 14-15px
- Headings: 18-28px

### Layout:
- Border Radius: 8-12px
- Box Shadow: `rgba(0, 0, 0, 0.1) 0px 4px 12px`
- Padding: 15-40px (context-dependent)
- Gap: 10-25px (context-dependent)
- Mobile Breakpoint: 768px

---

## Future Enhancements (Optional)

1. **Email Notifications**: Send emails when complaints are submitted/responded to
2. **File Attachments**: Allow users to upload images/documents with complaints
3. **Search & Filter**: Add search functionality and status filters for admin
4. **Priority Levels**: Add urgency levels (Low, Medium, High, Critical)
5. **Complaint Categories**: Categorize complaints (Quality, Behavior, Pricing, etc.)
6. **Analytics Dashboard**: Show complaint statistics and trends
7. **Bulk Actions**: Allow admin to update multiple complaints at once
8. **Comment Thread**: Enable back-and-forth conversation instead of single response
9. **Worker Notifications**: Notify workers when complaints are filed against them
10. **Resolution Ratings**: Allow users to rate admin's resolution

---

## Troubleshooting

### Common Issues:

**Issue**: Worker dropdown is empty
- **Solution**: Ensure user has work history in User&worker collection

**Issue**: Complaint not saving
- **Solution**: Check MongoDB connection and Complaint_Base collection exists

**Issue**: Admin response not showing
- **Solution**: Verify adminResponse field is not null in database

**Issue**: Status badge not showing correct color
- **Solution**: Check status value matches exactly ('pending', 'in-progress', 'resolved')

**Issue**: Delete confirmation not appearing
- **Solution**: Check browser console for JavaScript errors

---

## Security Considerations

1. **Authentication**: All routes protected by middleware (verifyLogin/verifyAdminLogin)
2. **Authorization**: Users can only view their own complaints
3. **Input Validation**: Required fields enforced on both client and server
4. **ObjectId Conversion**: Proper conversion prevents injection attacks
5. **Session Management**: Uses express-session for secure authentication

---

## Maintenance Notes

- MongoDB collection: `Complaint_Base`
- Indexes recommended: `userId`, `workerId`, `status`, `createdAt`
- Regular cleanup: Consider archiving resolved complaints older than 1 year
- Backup strategy: Include Complaint_Base in regular database backups

---

## Support

For issues or questions about the complaint system:
1. Check this documentation first
2. Review MongoDB logs for database errors
3. Check browser console for frontend errors
4. Verify all files are in correct locations
5. Ensure all dependencies are installed

---

**Implementation Date**: 2024
**Version**: 1.0
**Status**: Production Ready ✅