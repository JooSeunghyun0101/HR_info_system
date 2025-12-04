# Product Requirements Document (PRD)

**Version:** 2.0 - Refined Requirements
**Last Updated:** 2024-11-10
**Status:** Requirements Finalized - Ready for Development

---

## 1. Product Overview

- **Product Name:** HR Insight Platform
- **Objective:**
    - Build a knowledge-sharing platform that enables HR staff to efficiently manage and access internal knowledge
    - Provide quick access to HR information through Q&A database and structured manuals
    - Enable collaborative knowledge building across HR team
- **Target Users:** All HR department staff (50-200 users)
- **Development Approach:** Phased implementation
    - **Phase 1 (MVP):** Core knowledge management without AI (8-10 weeks)
    - **Phase 2:** AI-powered features (chatbot, semantic search, auto-generation)

---

## 2. Core Problems

1. **Knowledge Fragmentation**
   - HR teams manage diverse topics (payroll, benefits, leave, recruitment)
   - Single staff members cannot answer questions outside their expertise
   - Information scattered across emails, documents, and tribal knowledge

2. **Inefficiency**
   - Redundant inquiries to subject-matter experts
   - Time wasted searching for information
   - Inconsistent answers to similar questions

3. **Manual Management**
   - Existing manuals not easily searchable
   - Manual updates not tracked with version history
   - No systematic way to convert Q&As into structured documentation

---

## 3. Phase 1 (MVP) vs Phase 2 (AI Features)

### Phase 1 - Core MVP (8-10 weeks)
| Feature | Description | Status |
|---------|-------------|--------|
| ✅ Q&A Management | Create, edit, search Q&A entries with categories and tags | **MVP** |
| ✅ Manual Management | Markdown-based manuals with semantic versioning | **MVP** |
| ✅ Q&A → Manual Conversion | Template-based conversion with manual editing | **MVP** |
| ✅ Advanced Search | Full-text search with filters (category, tags, date, author) | **MVP** |
| ✅ User Management | Role-based access control (Viewer/HR Staff/Admin) | **MVP** |
| ✅ File Attachments | Image and document uploads | **MVP** |
| ✅ Version History | Complete audit trail for all manuals | **MVP** |

### Phase 2 - AI Features (Future)
| Feature | Description | Status |
|---------|-------------|--------|
| 🤖 AI Chatbot | Conversational Q&A with RAG-based responses | **Phase 2** |
| 🤖 Semantic Search | Vector-based similarity search | **Phase 2** |
| 🤖 Auto-generation | AI-powered manual draft generation | **Phase 2** |
| 🤖 Tag Suggestions | Automatic tag recommendations | **Phase 2** |
| 🔔 Notifications | Activity notifications for updates | **Phase 2** |
| 🔐 SSO Integration | Azure AD / Okta integration | **Phase 2** |

---

## 4. User Scenarios (Phase 1)

### Scenario 1: HR Staff Searches for Information
1. Staff member opens the platform and uses the search-centric homepage
2. Enters keyword (e.g., "급여 계산") in search bar
3. System returns relevant Q&As and manuals with snippets
4. Staff applies filters (category: 급여, date range: last 6 months)
5. Opens relevant Q&A, views answer and attached documents
6. View count increments, activity logged

### Scenario 2: HR Staff Creates New Q&A
1. Staff clicks "New Q&A" button
2. Fills in form:
   - Question title: "연차 계산 방법"
   - Question details: (detailed explanation)
   - Answer: (comprehensive answer)
   - Categories: Select multiple (급여, 복리후생)
   - Tags: Auto-complete suggestions (연차, 휴가, 계산)
3. Uploads supporting documents (Excel template)
4. Saves → New Q&A immediately visible to all users
5. Activity logged in audit trail

### Scenario 3: Creating a Process Manual
1. Staff searches and selects 5 related Q&As about "급여 처리"
2. Clicks "Generate Manual from Q&A" button
3. System generates markdown template with:
   - Grouped by categories
   - Each Q&A formatted as section
   - Source Q&A links preserved
4. Staff opens in markdown editor, reorganizes and edits content
5. Selects version type (Minor update → v1.1)
6. Adds change log: "급여 계산 프로세스 추가"
7. Saves → New manual version created and published

### Scenario 4: Viewing Manual Version History
1. Staff opens "급여 처리 매뉴얼" currently at v2.3
2. Clicks "Version History" tab
3. Views timeline of all versions with change logs
4. Compares v2.3 with v2.0 using diff view
5. Decides to revert to v2.0
6. Confirms revert → System creates new v2.4 with v2.0 content

### Scenario 5: Admin Invites New User
1. Admin navigates to "User Management" (Admin only)
2. Clicks "Invite User" button
3. Enters:
   - Email: newuser@company.com
   - Name: 홍길동
   - Role: HR Staff
4. System sends invitation email with secure token
5. New user receives email, clicks link
6. Sets password (meeting policy requirements)
7. Account activated → User can log in

---

## 5. Detailed Feature Requirements

### 5.1 Q&A Management

#### Required Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Question Title | String (500 chars) | Yes | Searchable |
| Question Details | Text | Yes | Full-text searchable |
| Answer | Text | Yes | Full-text searchable |
| Categories | Array (UUID) | Yes | Multiple selection allowed |
| Tags | Array (String) | No | Unlimited, auto-complete |
| Created By | UUID | Auto | User who created |
| Created Date | Timestamp | Auto | ISO 8601 |
| Updated Date | Timestamp | Auto | ISO 8601 |
| View Count | Integer | Auto | Increments on view |
| Attachments | Array (UUID) | No | Images, PDFs, Office docs |

#### Permissions
| Role | Create | View | Edit | Delete |
|------|--------|------|------|--------|
| Viewer | ❌ | ✅ | ❌ | ❌ |
| HR Staff | ✅ | ✅ | ✅ (All) | ✅ (Soft delete) |
| Admin | ✅ | ✅ | ✅ (All) | ✅ (Can restore) |

#### Business Rules
- **Deletion:** Soft delete (is_deleted flag), data retained for audit
- **View Tracking:** View count increments once per user per day
- **Search Scope:** User-selectable (Title only / Title+Content / All fields)
- **Sort Options:** Relevance (default), Latest, Most Viewed, Recently Updated

#### Category Management
- **System:** Pre-defined by Admin
- **Examples:** 급여, 휴가, 복리후생, 채용, 교육, 근태
- **Properties:** Name, Description, Color (for UI), Display Order
- **Assignment:** Multiple categories per Q&A allowed

#### Tag Management
- **System:** Auto-created on first use, auto-complete suggestions
- **Usage Tracking:** usage_count field for popularity ranking
- **Admin Tools:** Tag merge, unused tag cleanup (30 days)

### 5.2 Process Manual Management

#### Required Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | String (500 chars) | Yes | Searchable |
| Content | Text (Markdown) | Yes | Full-text searchable |
| Version Major | Integer | Auto | Semantic versioning |
| Version Minor | Integer | Auto | Semantic versioning |
| Created By | UUID | Auto | Original author |
| Updated By | UUID | Auto | Last editor |
| Created Date | Timestamp | Auto | ISO 8601 |
| Updated Date | Timestamp | Auto | ISO 8601 |
| Change Type | Enum | Required on save | 'major' or 'minor' |
| Change Log | Text | Required on save | What changed |
| Attachments | Array (UUID) | No | Images, PDFs, Office docs |

#### Versioning System
**Semantic Versioning (Major.Minor):**
- **Minor Update (1.0 → 1.1):** Content additions, corrections, examples
- **Major Update (1.3 → 2.0):** Structural changes, policy updates, complete rewrites
- **Auto-increment:** System automatically increments based on user selection
- **Version History:** All versions permanently stored
- **Revert:** Creates new version with old content (preserves history)

#### Collaborative Editing
- **Approach:** Simple collaboration (Last Write Wins)
- **Conflict Detection:** Optimistic locking with version check
- **Edit Tracking:** Shows who is currently editing
- **Warning:** Alert if someone edited recently
- **Conflict Resolution:** User prompted to view latest or overwrite

#### Markdown Editor Features
- **Split View:** Side-by-side edit and preview
- **Syntax Highlighting:** CodeMirror or Monaco Editor
- **Real-time Preview:** Instant markdown rendering
- **Table of Contents:** Auto-generated from headers
- **Image Upload:** Drag-and-drop support
- **File Attachments:** PDF, Excel, Word documents
- **Toolbar:** Bold, Italic, Headers, Lists, Links, Images, Files

#### Permissions
| Role | Create | View | Edit | Delete |
|------|--------|------|------|--------|
| Viewer | ❌ | ✅ | ❌ | ❌ |
| HR Staff | ✅ | ✅ | ✅ (All) | ✅ (Soft delete) |
| Admin | ✅ | ✅ | ✅ (All) | ✅ (Can restore) |

### 5.3 Q&A → Manual Conversion

#### Process Flow
1. **Selection:** User selects multiple Q&As from list (checkboxes)
2. **Trigger:** Click "Generate Manual from Q&A" button
3. **Configuration:** Enter manual title (optional, auto-suggested)
4. **Generation:** System creates markdown template:
   - Groups Q&As by category
   - Formats each Q&A as section (H2 title, question, answer)
   - Adds source attribution links
   - Creates table of contents
5. **Editing:** Opens in markdown editor for user refinement
6. **Linking:** Stores source Q&A IDs in `manual_qna_sources` table
7. **Saving:** Creates new manual at version 1.0

#### Template Structure
```markdown
# [Manual Title]

> 📝 This manual was generated from [N] Q&A entries.
> Created: [Date]

---

## 📂 [Category Name]

### Q1. [Question Title]

**Question:**
[Question details]

**Answer:**
[Answer content]

*Source: [Q&A #123](link) | Author: [Name] | Date: [Date]*

---

## 📌 References

**Source Q&As:**
- [Q&A #123: Title](link)
- [Q&A #156: Title](link)
```

#### Source Tracking
- **Link Preservation:** Each generated section links back to source Q&A
- **Bidirectional:** Manual shows sources, Q&A shows derived manuals
- **Updates:** If source Q&A updated, manual shows notification badge
- **Admin View:** Can see which manuals were generated from which Q&As

### 5.4 Search & Discovery

#### Unified Search
- **Scope:** Searches both Q&As and Manuals simultaneously
- **Input:** Single search bar on homepage and nav bar
- **Results:** Tabbed view (All / Q&As / Manuals)
- **Snippets:** Highlighted excerpts showing match context
- **Relevance Scoring:** PostgreSQL full-text search ranking

#### Search Options
| Option | Values | Default |
|--------|--------|---------|
| Search Scope | Title / Title+Content / All | Title+Content |
| Sort By | Relevance / Latest / Views / Updated | Relevance |
| Result Type | All / Q&A / Manual | All |

#### Advanced Filters
| Filter | Type | UI Component |
|--------|------|--------------|
| Categories | Multi-select | Checkboxes |
| Tags | Multi-select | Tag chips with autocomplete |
| Date Range | Date picker | From/To dates |
| Author | Dropdown | User list |
| Min Views | Number | Checkbox "Popular Q&As (100+)" |
| Has Attachments | Boolean | Checkbox |

#### Filter UI (Desktop)
- **Collapsible Panel:** "Advanced Filters" toggle
- **Active Filters:** Chips showing applied filters with X to remove
- **Clear All:** Button to reset all filters
- **Apply:** Submit filters and refresh results

#### Filter UI (Mobile)
- **Bottom Sheet:** Slides up from bottom
- **Tabs:** Organize filters into groups
- **Done Button:** Apply and close
- **Count Badge:** Shows number of active filters

#### Performance Requirements
- **Search Response:** < 200ms
- **Index Strategy:** PostgreSQL GIN indexes on tsvector
- **Pagination:** 20 results per page
- **Infinite Scroll:** Mobile only

### 5.5 User Management & Authentication

#### User Roles

**Role Hierarchy:**
1. **Viewer** - Read-only access
2. **HR Staff** - Full content management
3. **Admin** - System administration

**Permission Matrix:**

| Feature | Viewer | HR Staff | Admin |
|---------|--------|----------|-------|
| **Q&A** |
| View Q&A | ✅ | ✅ | ✅ |
| Create Q&A | ❌ | ✅ | ✅ |
| Edit Q&A | ❌ | ✅ (All) | ✅ |
| Delete Q&A | ❌ | ✅ (Soft) | ✅ (Restore) |
| **Manuals** |
| View Manual | ✅ | ✅ | ✅ |
| Create Manual | ❌ | ✅ | ✅ |
| Edit Manual | ❌ | ✅ (All) | ✅ |
| Delete Manual | ❌ | ✅ (Soft) | ✅ (Restore) |
| View Versions | ✅ | ✅ | ✅ |
| Revert Version | ❌ | ✅ | ✅ |
| **Files** |
| View/Download | ✅ | ✅ | ✅ |
| Upload | ❌ | ✅ | ✅ |
| Delete | ❌ | ✅ (Own) | ✅ (All) |
| **System** |
| View Stats | ❌ | Limited | ✅ (Full) |
| Manage Users | ❌ | ❌ | ✅ |
| Manage Categories | ❌ | ❌ | ✅ |
| Manage Tags | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ✅ |
| Restore Deleted | ❌ | ❌ | ✅ |

#### Authentication (Phase 1)

**Login Method:** Email + Password
- **Registration:** Admin invitation only (secure token via email)
- **Token Validity:** 7 days
- **Session:** JWT tokens (Access: 1 hour, Refresh: 7 days)

**Password Policy:**
- Minimum 8 characters
- Must contain: Letters + Numbers + Special characters (@$!%*#?&)
- Cannot match email address
- No repeated/sequential characters (aaa, 123)

**Security Features:**
- Bcrypt hashing (cost factor: 12)
- Rate limiting: 5 login attempts per 15 minutes
- Password reset via email token (1 hour expiry)
- HTTPS required (production)
- Session invalidation on logout

#### User Invitation Flow
1. Admin enters: Email, Full Name, Role
2. System generates secure invite token
3. Email sent with activation link
4. User clicks link (token validation)
5. User sets password (policy enforced)
6. Account activated → User can log in

#### Future (Phase 2)
- SSO Integration (Azure AD, Okta, Google Workspace)
- Multi-factor Authentication (MFA)
- SAML 2.0 / OAuth 2.0

### 5.6 File Management

#### Supported File Types

**Images:**
- Formats: JPG, JPEG, PNG, GIF, SVG, WebP
- Max Size: 5 MB per file
- Use Case: Screenshots, diagrams, charts

**Documents:**
- Formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Max Size: 10 MB per file
- Use Case: Templates, forms, guidelines

**Archives:**
- Formats: ZIP
- Max Size: 10 MB
- Use Case: Multiple file bundles

**Other:**
- Formats: TXT, CSV
- Max Size: 5 MB

#### Storage Strategy

**Phase 1 (MVP):** Local File System
```
uploads/
├── manuals/
│   └── {manual-id}/
│       ├── images/
│       │   └── {uuid}_filename.png
│       └── files/
│           └── {uuid}_document.pdf
└── qna/
    └── {qna-id}/
        └── ...
```

**Future (Production):** Cloud Storage (AWS S3 / Azure Blob / GCS)

#### File Upload Features
- **Drag & Drop:** Browser-based file dropping
- **Progress Bar:** Upload progress indicator
- **Validation:** MIME type and size checks
- **Sanitization:** Filename special character removal
- **Preview:** Image thumbnails in editor

#### File Security
- **Access Control:** Same permissions as parent entity (Q&A/Manual)
- **Virus Scanning:** Optional (ClamAV) for production
- **URL Obfuscation:** UUIDs prevent enumeration
- **Rate Limiting:** 10 uploads per minute per user

#### File Management UI
- **Attachment List:** Shows files with name, size, uploader, date
- **Actions:** Download, Delete (with confirmation)
- **Markdown Insertion:** Auto-inserts markdown syntax for images
- **Preview Modal:** Click image for lightbox view

---

## 6. Data Model

### Core Tables

#### users
```sql
id: UUID PRIMARY KEY
email: VARCHAR(255) UNIQUE NOT NULL
password_hash: VARCHAR(255) NOT NULL
full_name: VARCHAR(255) NOT NULL
role: VARCHAR(20) NOT NULL DEFAULT 'viewer'
  CHECK (role IN ('viewer', 'hr_staff', 'admin'))
is_active: BOOLEAN DEFAULT TRUE
email_verified: BOOLEAN DEFAULT FALSE
invite_token: VARCHAR(255) UNIQUE
invite_expires_at: TIMESTAMP
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
last_login: TIMESTAMP
password_changed_at: TIMESTAMP
```

#### categories
```sql
id: UUID PRIMARY KEY
name: VARCHAR(100) UNIQUE NOT NULL
description: TEXT
color: VARCHAR(7)  -- Hex color code
display_order: INTEGER
is_active: BOOLEAN DEFAULT TRUE
created_at: TIMESTAMP DEFAULT NOW()
```

#### tags
```sql
id: UUID PRIMARY KEY
name: VARCHAR(100) UNIQUE NOT NULL
usage_count: INTEGER DEFAULT 0
created_at: TIMESTAMP DEFAULT NOW()
```

#### qna_entries
```sql
id: UUID PRIMARY KEY
question_title: VARCHAR(500) NOT NULL
question_details: TEXT NOT NULL
answer: TEXT NOT NULL
created_by: UUID REFERENCES users(id)
created_at: TIMESTAMP DEFAULT NOW()
updated_at: TIMESTAMP DEFAULT NOW()
view_count: INTEGER DEFAULT 0
last_viewed_at: TIMESTAMP
is_deleted: BOOLEAN DEFAULT FALSE
deleted_at: TIMESTAMP
deleted_by: UUID REFERENCES users(id)
```

#### qna_categories
```sql
qna_id: UUID REFERENCES qna_entries(id) ON DELETE CASCADE
category_id: UUID REFERENCES categories(id) ON DELETE CASCADE
PRIMARY KEY (qna_id, category_id)
```

#### qna_tags
```sql
qna_id: UUID REFERENCES qna_entries(id) ON DELETE CASCADE
tag_id: UUID REFERENCES tags(id) ON DELETE CASCADE
PRIMARY KEY (qna_id, tag_id)
```

#### manuals
```sql
id: UUID PRIMARY KEY
title: VARCHAR(500) NOT NULL
content: TEXT NOT NULL  -- Markdown
version_major: INTEGER DEFAULT 1
version_minor: INTEGER DEFAULT 0
created_by: UUID REFERENCES users(id)
created_at: TIMESTAMP DEFAULT NOW()
updated_by: UUID REFERENCES users(id)
updated_at: TIMESTAMP DEFAULT NOW()
is_deleted: BOOLEAN DEFAULT FALSE
deleted_at: TIMESTAMP
deleted_by: UUID REFERENCES users(id)
```

#### manual_versions
```sql
id: UUID PRIMARY KEY
manual_id: UUID REFERENCES manuals(id) ON DELETE CASCADE
version_major: INTEGER NOT NULL
version_minor: INTEGER NOT NULL
content: TEXT NOT NULL
change_type: VARCHAR(20) NOT NULL  -- 'major' or 'minor'
change_log: TEXT NOT NULL
created_by: UUID REFERENCES users(id)
created_at: TIMESTAMP DEFAULT NOW()
UNIQUE(manual_id, version_major, version_minor)
```

#### manual_qna_sources
```sql
manual_id: UUID REFERENCES manuals(id) ON DELETE CASCADE
qna_id: UUID REFERENCES qna_entries(id) ON DELETE CASCADE
created_at: TIMESTAMP DEFAULT NOW()
PRIMARY KEY (manual_id, qna_id)
```

#### attachments
```sql
id: UUID PRIMARY KEY
entity_type: VARCHAR(50) NOT NULL  -- 'manual' or 'qna'
entity_id: UUID NOT NULL
file_name: VARCHAR(255) NOT NULL
file_type: VARCHAR(50) NOT NULL  -- 'image', 'pdf', 'excel', etc.
file_size: INTEGER NOT NULL  -- bytes
storage_path: TEXT NOT NULL
mime_type: VARCHAR(100) NOT NULL
uploaded_by: UUID REFERENCES users(id)
created_at: TIMESTAMP DEFAULT NOW()
```

#### audit_logs
```sql
id: UUID PRIMARY KEY
user_id: UUID REFERENCES users(id)
action: VARCHAR(100) NOT NULL  -- 'created', 'updated', 'deleted', 'viewed'
entity_type: VARCHAR(50) NOT NULL  -- 'qna', 'manual', 'user'
entity_id: UUID NOT NULL
metadata: JSONB  -- Additional context
ip_address: VARCHAR(45)
user_agent: TEXT
created_at: TIMESTAMP DEFAULT NOW()
```

### Indexes
```sql
-- Full-text search indexes
CREATE INDEX idx_qna_fts ON qna_entries
  USING GIN(to_tsvector('english',
    question_title || ' ' || question_details || ' ' || answer));

CREATE INDEX idx_manuals_fts ON manuals
  USING GIN(to_tsvector('english', title || ' ' || content));

-- Performance indexes
CREATE INDEX idx_qna_created_at ON qna_entries(created_at DESC);
CREATE INDEX idx_qna_view_count ON qna_entries(view_count DESC);
CREATE INDEX idx_qna_is_deleted ON qna_entries(is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX idx_manuals_updated_at ON manuals(updated_at DESC);
CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
```

---

## 7. UI/UX Requirements

### Design Principles
- **Search-First:** Homepage centered on search functionality
- **Mobile-Responsive:** Full functionality on all devices
- **Intuitive Navigation:** Maximum 3 clicks to any feature
- **Accessibility:** WCAG 2.1 AA compliance (Phase 2 goal)

### Navigation Structure
```
Desktop Navigation Bar:
┌─────────────────────────────────────────────────┐
│ 🏢 HR Insight | 🏠 홈 | 💬 Q&A | 📚 매뉴얼 | 🔍 검색 | ⚙️ 관리 | 👤 프로필 │
└─────────────────────────────────────────────────┘

Mobile Navigation (Hamburger Menu):
≡ Menu
├── 🏠 홈
├── 💬 Q&A 관리
├── 📚 매뉴얼 관리
├── 🔍 통합 검색
├── ⚙️ 관리 (Admin only)
├── 👤 프로필
└── 🚪 로그아웃
```

### Key Screens

#### Homepage (Search-Centric)
- **Hero:** Large search bar with placeholder text
- **Quick Access:** Buttons to Q&A and Manual sections
- **Popular Q&As:** Top 10 by view count
- **Recent Manuals:** Last 5 updated manuals
- **Popular Tags:** Tag cloud with click-to-search

#### Q&A List
- **Layout:** Card or table view (user toggle)
- **Filtering:** Sidebar with category/tag filters
- **Sorting:** Dropdown (relevance, date, views)
- **Actions:** Create, Edit, Delete buttons (role-based)
- **Pagination:** 20 items per page

#### Q&A Detail
- **Header:** Title, categories, tags, view count, date
- **Body:** Question details and answer
- **Metadata:** Author, dates, edit history
- **Actions:** Edit, Delete, Generate Manual (if selected with others)
- **Attachments:** List with download links

#### Manual List
- **Layout:** Grid or list view
- **Display:** Title, version, last updated, author
- **Sorting:** Latest, Most viewed, Alphabetical
- **Actions:** Create, View, Edit buttons

#### Manual Editor
- **Layout:** Split-pane (Edit | Preview)
- **Toolbar:** Markdown formatting buttons, image/file upload
- **Auto-save:** Draft saved to localStorage every 30s
- **Version Save:** Modal to select major/minor and enter change log

#### Manual Detail/Viewer
- **Header:** Title, version, metadata
- **Navigation:** Table of contents (auto-generated)
- **Body:** Rendered markdown
- **Tabs:** Content | Version History | Source Q&As
- **Actions:** Edit, Download, Print

#### Admin Panel
- **Users:** List, invite, edit roles, deactivate
- **Categories:** CRUD operations, reorder
- **Tags:** Merge duplicates, delete unused
- **Statistics:** Charts for Q&A trends, popular topics, user activity
- **Audit Logs:** Searchable activity log with filters
- **Deleted Items:** Restore Q&As and manuals

### Responsive Breakpoints
```css
Mobile: 0-640px
Tablet: 641px-1024px
Desktop: 1025px+
```

### Touch Optimization (Mobile)
- **Minimum Touch Target:** 44x44px (Apple HIG)
- **Gestures:** Swipe back, pull-to-refresh
- **Button Placement:** Primary actions at bottom (thumb zone)
- **Input Fields:** Minimum 16px font size (prevent auto-zoom)
- **Keyboard Types:** Appropriate for field (email, number, etc.)

### UI Component Library
- **Framework:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Components:** Shadcn/ui (pre-built, customizable)
- **Icons:** Lucide React or Heroicons
- **Markdown:** react-markdown + syntax highlighting

---

## 8. Technical Requirements

### Technology Stack (Recommended)

#### Backend
- **Framework:** Python + FastAPI (or Node.js + Express)
- **Database:** PostgreSQL 14+ (ACID compliance, full-text search)
- **Cache:** Redis (session management, search caching)
- **File Storage:** Local filesystem (MVP) → S3/Azure Blob (Production)
- **Authentication:** JWT tokens (access + refresh)

#### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **State Management:** Zustand (client state) + React Query (server state)
- **Styling:** Tailwind CSS + Shadcn/ui
- **Markdown Editor:** CodeMirror or Monaco Editor
- **Forms:** React Hook Form + Zod validation
- **HTTP Client:** Axios or Fetch API

#### Infrastructure
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions / GitLab CI / Azure DevOps
- **Monitoring:** Prometheus + Grafana (or DataDog)
- **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Backup:** Daily automated backups with 30-day retention

### Non-Functional Requirements

#### Security
- ✅ HTTPS only (production)
- ✅ Password hashing: Bcrypt (cost 12)
- ✅ JWT token security: Short expiry, refresh rotation
- ✅ Rate limiting: Login attempts, API calls, file uploads
- ✅ Input sanitization: SQL injection prevention, XSS protection
- ✅ CORS policy: Whitelist only
- ✅ Content Security Policy (CSP)
- ✅ Markdown sanitization: Prevent XSS in user content
- ✅ File upload validation: MIME type, size, virus scan (optional)

#### Performance
- **Page Load:** < 2 seconds (initial)
- **Search Response:** < 200ms
- **API Response:** < 500ms (p95)
- **Database Queries:** < 100ms (p95)
- **Concurrent Users:** Support 50 simultaneous users
- **File Upload:** Progress indication for files > 1MB

#### Reliability
- **Uptime Target:** 99.5% (43 hours downtime/year acceptable for internal tool)
- **Data Durability:** Daily backups with 30-day retention
- **Error Recovery:** Graceful degradation, user-friendly error messages
- **Transaction Safety:** ACID compliance for all data operations

#### Scalability
- **Initial Load:** 50-200 users
- **Data Growth:** 500 Q&As, 50 manuals in year 1
- **Storage:** 10GB estimated (year 1)
- **Database:** Vertical scaling sufficient (no sharding needed)

#### Usability
- **Browser Support:** Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile Support:** iOS Safari, Android Chrome
- **Accessibility:** Basic keyboard navigation, semantic HTML
- **Internationalization:** Korean only (MVP), English-ready structure

#### Maintainability
- **Code Quality:** TypeScript strict mode, ESLint, Prettier
- **Testing:** Unit tests (>70% coverage goal), integration tests for critical paths
- **Documentation:** API docs (OpenAPI/Swagger), architecture docs
- **Logging:** Structured logging with correlation IDs
- **Monitoring:** Error tracking (Sentry), performance metrics

---

## 9. Performance & Scalability Targets

### User Scale
- **Current:** 50-200 HR staff members
- **Year 1 Growth:** +20% estimated
- **Concurrent Users:** 50 simultaneous users expected

### Data Scale (Year 1 Projections)
- **Q&As:** 100-500 entries
- **Manuals:** 10-50 manuals (avg 10 versions each)
- **Categories:** 10-20 categories
- **Tags:** 50-200 unique tags
- **Attachments:** 500-1000 files (~10GB storage)
- **Users:** 50-200 active users

### Response Time Targets
| Operation | Target | Measurement |
|-----------|--------|-------------|
| Page Load | < 2s | First Contentful Paint |
| Search | < 200ms | Time to results |
| API GET | < 200ms | p95 response time |
| API POST/PUT | < 500ms | p95 response time |
| File Upload | < 5s | 5MB file |
| Database Query | < 100ms | p95 query time |

### Database Performance
- **Indexes:** Strategic GIN indexes for full-text search
- **Connection Pool:** 20 connections (sufficient for 50 concurrent users)
- **Query Optimization:** Explain analyze for slow queries (>100ms)
- **Caching Strategy:** Redis for frequent queries, 5-minute TTL

### Backup & Recovery
- **Backup Schedule:** Daily at 2:00 AM
- **Backup Method:** PostgreSQL pg_dump + file system sync
- **Retention:** 30 days
- **Recovery Time Objective (RTO):** < 4 hours
- **Recovery Point Objective (RPO):** < 24 hours (daily backups)

---

## 10. Development Phases

### Phase 1: Core MVP (8-10 weeks) ✅ PRIMARY FOCUS

#### Week 1-2: Foundation & Architecture
- [ ] Project setup (repos, Docker, CI/CD)
- [ ] Database schema implementation
- [ ] Authentication system (JWT, password policy)
- [ ] Basic backend API scaffolding
- [ ] Frontend project setup (React + Tailwind)

#### Week 3-5: Backend Development
- [ ] Q&A CRUD APIs with permissions
- [ ] Category and tag management
- [ ] Full-text search implementation
- [ ] Manual CRUD APIs
- [ ] Version control system
- [ ] File upload/download APIs
- [ ] Audit logging

#### Week 6-8: Frontend Development
- [ ] Authentication UI (login, invite acceptance)
- [ ] Homepage with search
- [ ] Q&A list, detail, create/edit forms
- [ ] Manual list, detail, markdown editor
- [ ] Version history and diff viewer
- [ ] Q&A to manual conversion UI
- [ ] Admin panel (user, category, tag management)

#### Week 9-10: Testing, Polish & Deployment
- [ ] Integration testing (critical paths)
- [ ] Performance testing and optimization
- [ ] Security audit (basic penetration testing)
- [ ] User acceptance testing (UAT)
- [ ] Bug fixes and refinements
- [ ] Production deployment
- [ ] User training and documentation

**Deliverables:**
- ✅ Fully functional knowledge management platform
- ✅ All core features (Q&A, Manuals, Search, User Management)
- ✅ Mobile-responsive UI
- ✅ Admin tools for content management
- ✅ User documentation and training materials

### Phase 2: AI Features (Future - 4-6 weeks)

**Note:** To be scheduled after Phase 1 successful deployment and user feedback

#### Planned AI Features
- 🤖 **RAG-based Chatbot:** Conversational interface using Q&A and manual knowledge base
- 🤖 **Semantic Search:** Vector embeddings for improved search relevance
- 🤖 **AI Manual Generation:** GPT-powered draft generation from selected Q&As
- 🤖 **Tag Auto-suggestion:** ML-based tag recommendations
- 🔔 **Smart Notifications:** User activity feeds and update notifications
- 🔐 **SSO Integration:** Azure AD / Okta / Google Workspace

#### AI Technology Stack (Proposed)
- **LLM:** OpenAI GPT-4 or Anthropic Claude
- **Embeddings:** OpenAI text-embedding-ada-002
- **Vector DB:** Pinecone (managed) or pgvector (self-hosted)
- **RAG Framework:** LangChain or LlamaIndex
- **Cost Estimate:** $200-500/month for API usage

---

## 11. Success Metrics (Phase 1)

### Adoption Metrics
- **User Onboarding:** 80% of invited users activate within 7 days
- **Active Users:** 70% of users log in at least once per week
- **Feature Usage:** 60% of users create or edit content monthly

### Content Metrics
- **Q&A Growth:** 100+ Q&As within 3 months
- **Manual Creation:** 10+ manuals within 6 months
- **Search Usage:** Average 5+ searches per user per week

### Quality Metrics
- **Search Relevance:** 80% of searches yield clicked results
- **Manual Versions:** Average 3+ versions per manual (indicating active maintenance)
- **View Patterns:** 70% of content viewed within 6 months of creation

### Technical Metrics
- **Uptime:** 99.5% availability
- **Performance:** 95% of page loads under 2 seconds
- **Error Rate:** < 0.1% of API requests result in errors
- **Search Speed:** 95% of searches complete in < 200ms

### User Satisfaction (Post-Launch Survey)
- **Overall Satisfaction:** 4/5 stars average
- **Ease of Use:** 80% find it "easy" or "very easy"
- **Time Saved:** 60% report saving time vs. previous methods

---

## 12. Future Enhancements (Beyond Phase 2)

### Content Management
- **Approval Workflow:** Optional review/approval before publishing manuals
- **Content Templates:** Pre-defined manual templates for common topics
- **Related Content:** "See Also" suggestions based on content similarity
- **Bookmarks/Favorites:** Users can save frequently accessed items

### Collaboration
- **Comments:** Discussion threads on Q&As and manuals
- **@Mentions:** Notify specific users in comments
- **Real-time Editing:** Google Docs-style collaborative editing

### Analytics
- **Content Analytics:** Most viewed, trending topics, search patterns
- **User Analytics:** Most active contributors, expertise areas
- **Dashboard:** Executive summary dashboard for HR leadership

### Integration
- **Email Integration:** Create Q&A from email inquiries
- **Slack/Teams Bot:** Search knowledge base from chat
- **Calendar Integration:** Link manuals to onboarding schedules

### Extensibility
- **Multi-Department:** Extend to Finance, IT, Operations
- **External FAQ:** Public-facing FAQ for employees
- **API Access:** RESTful API for third-party integrations
- **Webhooks:** Event notifications for external systems

---

## Appendix A: Glossary

- **MVP:** Minimum Viable Product - Phase 1 without AI features
- **RAG:** Retrieval-Augmented Generation - AI technique combining search with language model
- **Semantic Versioning:** Version numbering scheme (Major.Minor.Patch)
- **Soft Delete:** Marking data as deleted without physical removal
- **JWT:** JSON Web Token - Authentication token standard
- **SSO:** Single Sign-On - Unified authentication across systems
- **RBAC:** Role-Based Access Control - Permission system
- **FTS:** Full-Text Search - Database text search capability

---

## Appendix B: Open Questions & Decisions

| Question | Decision | Date | Decided By |
|----------|----------|------|------------|
| AI features in MVP? | No - Phase 2 | 2024-11-10 | Product Team |
| User registration method? | Admin invitation only | 2024-11-10 | Product Team |
| Version numbering? | Semantic (Major.Minor) | 2024-11-10 | Product Team |
| Mobile support level? | Full responsive (all features) | 2024-11-10 | Product Team |
| Backend framework? | Python/FastAPI or Node/Express | TBD | Tech Team |
| Cloud provider? | Depends on enterprise policy | TBD | IT Team |
| SSO provider? | Phase 2 - Azure AD preferred | TBD | IT Team |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-10-XX | Product Team | Initial PRD |
| 2.0 | 2024-11-10 | Product Team + Claude | Requirements refinement, Phase 1/2 split, detailed specifications |

---

**End of Document**
