# Project TODO

- [x] Create database schema for projects from FY2025 quarterly report
- [x] Seed database with project data from Excel file
- [x] Create API endpoints for projects (list, filter, sort)
- [x] Update Projects page to display projects from database
- [x] Add sorting by category, name, and amount
- [ ] Add project status management (Not yet started, Ongoing, Completed)
- [x] Update main dashboard KPIs to show real-time stats from database
- [x] Remove all mock/sample data from Home.tsx (sampleProjects, docs arrays)
- [x] Create database schema for documents
- [x] Create database schema for tasks
- [ ] Implement project creation form with database insert
- [x] Implement document creation and management
- [x] Implement task creation and management
- [x] Update dashboard to show real documents and tasks from database
- [x] Make New Item dialog functional with database operations
- [x] Create Documents page with CRUD operations
- [x] Create Tasks page with CRUD operations
- [x] Update sidebar navigation to link to all pages

## User Authentication System
- [x] Update user schema with division assignment field
- [x] Add division-based role enum (Admin, Planning, Construction, Quality, Maintenance)
- [x] Create login page with Manus OAuth integration
- [x] Add user profile display in sidebar/header
- [ ] Implement protected routes for authenticated users
- [ ] Add role-based access controls to API endpoints
- [ ] Show/hide UI features based on user division and role
- [ ] Create user management page for admins

## Bug Fixes
- [x] Fix Projects page design to match main dashboard sidebar layout
- [x] Fix error when clicking on specific project

## Bug Fixes (Continued)
- [ ] Fix construction cost not displaying on dashboard

## Task Assignment Feature
- [x] Create personnel table in database schema
- [x] Add assignee field to tasks table
- [x] Create API endpoints for personnel management
- [x] Update Tasks page with personnel assignment dropdown
- [x] Add date picker for target completion date
- [x] Allow division heads to assign tasks to their personnel

## Bug Fix - Project Cost Display
- [x] Fix project cost not appearing in project details dialog

## 20% Development Fund Budget Management
- [x] Create database schema for annual budget allocations
- [x] Create Program of Works (POW) table for project planning
- [x] Create bidding/procurement tracking table
- [x] Implement budget allocation API endpoints
- [x] Implement POW management API endpoints
- [x] Implement bidding workflow API endpoints
- [x] Create Budget Management page with annual allocation tracking
- [x] Create Program of Works page with project planning workflow
- [x] Create Bidding Management page with procurement status tracking
- [x] Link budget → POW → bidding → construction workflow
- [x] Update sidebar navigation to include Budget, POW, and Bidding links

## Contractor Management
- [x] Create database schema for contractors table
- [x] Create contract history table linked to contractors and biddings
- [x] Create performance ratings table for contractor evaluations
- [x] Implement contractor CRUD API endpoints
- [x] Implement contract history API endpoints
- [x] Implement performance rating API endpoints
- [x] Create Contractor Management page with bidder information
- [x] Add performance ratings display and management
- [x] Add contract history view for each contractor
- [x] Update sidebar navigation to include Contractors link

## Organizational Structure Notes
- [x] POW (Program of Works) should be under Planning Division responsibility
- [x] Update POW page to reflect Planning Division ownership

## Division Organization Updates
- [x] Update dashboard to display all 5 divisions with their responsibilities
- [x] Assign Budget creation to Planning Division
- [x] Assign POW (Program of Works) to Planning Division
- [x] Update Budget page header to show Planning Division ownership
- [x] Update POW page header to show Planning Division ownership
- [x] Link POW creation to budget allocations (POW must reference a budget)
- [x] Update POW form to require budget selection
- [x] Show available budget balance when creating POW

## Remove Bidding Functionality
- [x] Remove Bidding page file
- [x] Remove Bidding route from App.tsx
- [x] Remove Bidding link from sidebar navigation in all pages

## Division Dashboard Enhancement
- [x] Update Planning Division card to show Budget and POW data when clicked
- [x] Display budget allocation summary in Planning Division dialog
- [x] Display POW list/summary in Planning Division dialog
- [x] Update Admin Division card to show Documents when clicked
- [x] Display documents list/summary in Admin Division dialog
- [x] Verify POW creation requires budget selection and shows budget reference

## Sidebar Navigation Reorganization
- [ ] Add Planning section to sidebar below Projects
- [ ] Move Budget and POW under Planning section
- [ ] Create Planning page with Budget and POW tabs
- [ ] Update all pages with new sidebar structure
- [ ] POW budget selection shows only created budgets with remaining balance
- [ ] Display remaining budget amount (total - allocated to POWs) in selection

## Contractor Data Import from Projects
- [x] Analyze project data to extract unique contractors
- [x] Create script to populate contractors table from projects
- [x] Link contractors to their project history (134 contractors imported with contract stats)

## User Authentication & Authorization
- [x] Add approval status field to user schema (pending, approved, rejected)
- [x] Create protected routes that require login
- [x] Create login page for unauthenticated users
- [x] Create pending approval page for users awaiting admin approval
- [x] Create user management page for admins to approve/reject users
- [x] Implement admin-only API endpoints for user management
- [x] Add user list with status filtering for admins
- [x] Add approve/reject actions for pending users
- [x] Redirect unapproved users to pending page after login

## Maintenance Division Dashboard
- [x] Import provincial roads data from Excel file (roads imported from LISTOFPROVINCIALROAD.xlsx)
- [x] Create database schema for provincial roads
- [x] Create database schema for maintenance schedules
- [x] Create database schema for equipment assignment
- [x] Create API endpoints for roads, schedules, and equipment
- [x] Create Maintenance Division dashboard page
- [x] Add road listing with search and filters
- [x] Add maintenance scheduling interface
- [x] Add equipment assignment for monitoring

## User Management Sidebar
- [x] Add User Management link to sidebar navigation (admin only)

## Contractor Contracts Display
- [x] Add API to fetch contractor's projects/contracts
- [x] Display list of contracts for each contractor
- [x] Show total cost of all projects per contractor
- [x] Add contract details (project name, location, cost, status)

## Admin-Only User Management
- [x] Secure User Management page for admin-only access
- [x] Only admin can approve/reject users
- [x] Only admin can delete users
- [x] Only admin can assign roles to users

## Maintenance Road Grouping and Sorting
- [x] Update API to group roads by municipality
- [x] Update API to sort roads by road ID within each municipality
- [x] Update Maintenance page to display roads grouped by municipality
- [x] Add municipality headers in the road list display

## User-Controlled Road Sorting
- [x] Update API to support sorting by road ID, municipality, length, condition
- [x] Add sorting dropdown/controls to Maintenance page
- [x] Support ascending and descending sort order
- [x] Preserve sort selection when filtering or paginating

## Admin Division Dashboard
- [x] Create Admin Division page with Documents tab
- [x] Move Documents page content into Admin Division tab
- [x] Add Admin Division link to sidebar navigation
- [x] Update sidebar navigation across all pages

## Document Routing and Billing Fields
- [x] Add routing date fields to documents schema (dateReceivedByPEO, dateReleasedToAdmin, dateReceivedFromAdmin, dateReleasedToAccounting)
- [x] Add billing fields to documents schema (billingType, percentage, contractorId, projectId, contractAmount, revisedContractAmount, periodCovered, dateStarted, completionDate)
- [x] Update documents API to support new routing and billing fields
- [x] Update Admin Division page to display and edit routing/billing fields
- [x] Add routing workflow visualization showing document flow through PEO → Admin → Accounting

## Division-Based User Filtering
- [ ] Add division field to user schema (Construction, Planning, Admin, Quality, Maintenance)
- [ ] Update user management API to filter users by division
- [ ] Construction users can only see Construction division users
- [ ] Planning users can only see Planning division users
- [ ] Admin users can see all users across all divisions
- [ ] Update User Management page to show filtered users based on current user's division
