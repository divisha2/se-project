# Course File Management System

A sophisticated academic document consolidation system with AI-assisted validation and workflow management for course file generation.

## System Overview

This system manages the end-to-end process of collecting, validating, consolidating, and generating final course files from faculty submissions. It features role-based workflows for Admin, Faculty, Course Coordinators, and integrates AI-powered document analysis.

## Key Features

### 🔐 **Multi-Role Authentication**
- **Admin** - Manages users, assigns coordinators and faculty to courses
- **Faculty** - Uploads course documents (syllabus, lectures, assignments, grades)
- **Course Coordinator** - Monitors submissions, reviews completeness, generates final course files

### 📄 **Document Management Workflow**
- Faculty document submission with section tracking
- AI-powered document validation (format, completeness, structure)
- Multi-version support (edit/replace documents)
- Submission status tracking (Not Submitted → Under Validation → Valid/Invalid → Locked)
- Deadline-based automatic locking

### 🤖 **AI-Assisted Processing**
- Automatic document validation
- Content completeness checking
- Missing section detection
- Intelligent document consolidation
- Final course file generation

### 📊 **Course File Lifecycle**
1. **Created** - Course and coordinator assigned
2. **Collecting Submissions** - Faculty upload documents
3. **Locked for Review** - Deadline reached, submissions locked
4. **Under Review** - Coordinator checks completeness
5. **Processing** - AI consolidates content
6. **Draft Ready** - Coordinator can edit/accept
7. **Finalized** - Final course file generated

### 🔔 **Notifications & Monitoring**
- Real-time submission status updates
- Missing section notifications
- Deadline reminders
- Validation result alerts

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)

### Frontend
- React 18 + Vite
- TailwindCSS
- React Router
- Axios
- Lucide Icons

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd course-file-management
```

2. Install server dependencies
```bash
npm install
```

3. Install client dependencies
```bash
cd client
npm install
cd ..
```

4. Create environment file
```bash
cp .env.example .env
```

5. Update `.env` with your configuration
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/course_file_management
JWT_SECRET=your_secure_secret_key
NODE_ENV=development
```

### Running the Application

Development mode (runs both server and client):
```bash
npm run dev
```

Or run separately:

Server only:
```bash
npm run server
```

Client only:
```bash
npm run client
```

### Build for Production

```bash
npm run build
```

## Project Structure

```
├── server/
│   ├── models/
│   │   ├── User.js           # User accounts with roles
│   │   ├── Course.js         # Course with status workflow
│   │   ├── File.js           # Documents with validation states
│   │   ├── Submission.js     # Faculty submission tracking
│   │   └── CourseFile.js     # Final course file metadata
│   ├── routes/
│   │   ├── auth.js           # Authentication
│   │   ├── courses.js        # Course management
│   │   ├── files.js          # Document upload/validation
│   │   ├── submissions.js    # Submission tracking
│   │   ├── courseFile.js     # Course file generation
│   │   └── users.js          # User management
│   ├── middleware/
│   │   └── auth.js           # JWT auth & role authorization
│   └── index.js              # Server entry
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx    # Main app layout with nav
│   │   ├── pages/
│   │   │   ├── Login.jsx     # Auth with role selection
│   │   │   ├── Dashboard.jsx # Role-specific dashboard
│   │   │   ├── Courses.jsx   # Course listing
│   │   │   └── CourseDetail.jsx # Document management
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── index.html
├── uploads/                  # Document storage (gitignored)
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (creates pending account)
- `POST /api/auth/login` - Login user

### Courses
- `GET /api/courses` - Get courses (filtered by role)
- `POST /api/courses` - Create course (admin only)
- `PUT /api/courses/:id/assign-coordinator` - Assign coordinator (admin)
- `PUT /api/courses/:id/assign-faculty` - Assign faculty to section (admin)
- `GET /api/courses/:id` - Get course details

### Files
- `POST /api/files/upload` - Upload document (triggers AI validation)
- `GET /api/files/course/:courseId` - Get course files
- `DELETE /api/files/:id` - Delete document (only if not locked)

### Submissions
- `GET /api/submissions/course/:courseId` - Get all submissions
- `POST /api/submissions/lock/:courseId` - Lock submissions (coordinator)

### Course File Generation
- `POST /api/course-file/check-completeness/:courseId` - Check mandatory sections
- `POST /api/course-file/consolidate/:courseId` - AI consolidation
- `POST /api/course-file/generate-final/:courseId` - Generate final PDF

## Workflow States

### User Account States
- **Pending Activation** → **Active** → **Deactivated**

### Course States
- **Unassigned** → **Assigned** (coordinator assigned) → **Collecting** → **Locked** → **Under Review** → **Processing** → **Finalized** → **Archived**

### Document/Submission States
- **Not Submitted** → **Under Validation** → **Valid/Invalid** → **Locked** → **Included in Final**

### Faculty Assignment States
- **Unassigned** → **Assigned to Course/Section** → **Actively Submitting** → **Submission Complete (Locked)**

## Next Steps for Enhancement

Now that the core workflow foundation is built, you can add:

1. **UI for document upload** - File upload modal with drag-drop
2. **AI validation service** - Integrate actual document analysis (PDF parsing, OCR)
3. **Completeness checker** - Check mandatory sections against requirements
4. **Content consolidation** - Merge validated documents into single file
5. **Notifications system** - Real-time alerts using WebSockets
6. **Email notifications** - Deadline reminders, validation results
7. **Document preview** - In-browser PDF viewer
8. **Version history UI** - View and restore previous versions
9. **Analytics dashboard** - Track submission rates, validation success
10. **Export functionality** - Download final course files in multiple formats

## License

MIT
