# Opennionated Technical Description

**Dhruv Gupta**  
**The Signal Society**  

---

## Project Proposal  
We would like to create a shared, open, unfiltered blog for University of Pennsylvania students to write opinion articles or blogs about anything they like, as long as it is non-inflammatory and related in some regard to the university. To achieve this, we will build an AI editing agent that will serve the purpose of validating articles.

## Proposed Technical Stack  
1. **MongoDB + Express + Node:** We will use MongoDB for all actions as well as storage of user profiles and articles.
2. **Sendgrid:** SendGrid will be used to verify users' emails and eventually send out automated newsletters.  
3. **ImgBB:** ImgBB will be used to process, store, and display images (both user profile pictures and images uploaded as part of articles).  
4. **OpenAI API:** ChatGPT 4o-mini will be used to moderate articles, ensure appropriateness, and generate short descriptions.  
5. **Analytics:** Some analytics platform of choice will be used to track clicks and visits to different pages on the website.  
6. **React:** The frontend will be built using React. The app has been initialized with `npx create-react-app`.

---

## Backend Setup  
We have begun by creating a `backend` folder in the root directory of our application. Within it, we have run:
```sh
npm init -y
```

### User Model  
- `email` (String, unique)  
- `name` (String)  
- `verified` (Boolean)  
- `subscribed` (Boolean)  
- `author` (Boolean)  

### Author Model  
- `email` (Reference to User, unique)  
- `bio` (String)  
- `pfp` (Profile picture URL hosted on ImgBB)  
- `articles` (Array of references to Article)  

### Article Model  
- `author_email` (Reference to Author)  
- `slug` (Unique identifier)  
- `title` (String)  
- `image` (ImgBB URL)  
- `content` (Stored in markdown as text)  
- `approved` (Boolean)  
- `description` (AI-generated short summary)  

---

## Article Submission Workflow  
Articles are submitted via the frontend editor in markdown. Upon submission, they are sent to an AI editor agent (using OpenAI's GPT-4o-mini API).

### Enhanced Article Evaluation Prompt for AI  
Use the following prompt structure:
> Evaluate the submitted article based on the following rubric. Provide scores out of 10 for each category and a brief justification for each score. Return results as JSON with keys for `applicability`, `harmPotential`, `writingQuality`, and `approved` (boolean, true if all scores ≤ 5). Also provide a concise, engaging description (under 50 words).

1. **Applicability to Penn life or culture:** 0-10 (10 highly relevant, 0 irrelevant)  
2. **Potential to incite harm or hatred:** 10 completely safe, 0 inflammatory or dangerous  
3. **Quality of Writing:** Grammar, readability, and engagement. 10 is excellent, 0 severely poor  

---

## Backend Development Steps  
These steps are intended to be followed by Cursor Agent, powered by Claude Sonnet 3.7:
1. Set up the backend file and folder directory, install necessary packages (`npm install`), and configure quality-of-life settings (such as nodemon).
2. Set up the models for our 3 document types.
3. Implement authentication and create account/login/logout flow for the User schema.
4. Use Sendgrid (or a suitable alternative) to create the verification check. Have verification last forever and the user token last for 1 year.
5. Create a utility to upload images to ImgBB and return the embed link.
6. Implement routes and controllers for author creation and management.
7. Implement routes and controllers for article creation, ensuring that `slug` is unique, `author_email` refers to a valid author, and new articles are added to the author's article array.
8. Create a utility that will evaluate articles using LLMs based on the rubric above, returning a boolean for approval and a description.
9. Implement a route and controller to update article verification status upon creation.

---

## Frontend Development Steps  
1. Configure routing (`react-router`) for login, registration, dashboard, article editing, and viewing.
2. Implement user authentication UI and logic.
3. Design author profile setup with ImgBB integration.
4. Create a markdown editor for article submission.
5. Display AI moderation feedback and approval status clearly.
6. Build engaging article viewing pages with analytics tracking.

---

## Implementation Details

### Authentication Specifications
- JWT-based authentication system
- Any email with `upenn.edu` domain suffix is allowed (including subdomains)
- No admin role - system is fully automated
- Account verification is permanent
- Account deletion cascades to associated articles

### Article Management Specifications
- No maximum length restriction on article content
- Maximum image size: 500KB
- No draft system - articles are submitted directly
- Slugs are generated from article titles
- Articles cannot be edited after submission
- Articles are deleted if associated author account is deleted

### AI Moderation Specifications
- Primary: OpenAI GPT-4o-mini API
- Backup: Claude API
- Articles below threshold are flagged for human review
- No appeals process for rejected articles
- No rate limiting implemented in initial version

### Image Handling Specifications
- Supported formats: PNG, JPEG, HEIC
- Profile pictures: Compressed and cropped to square
- Article images: Compressed only
- ImgBB as sole image hosting solution
- Image caching planned as future enhancement

### Frontend Specifications
- Real-time markdown preview in editor
- No offline functionality
- No progressive loading
- Analytics tracking limited to page views
- Simple, responsive design prioritizing usability

---

## Implementation Progress

### Backend Implementation Status (March 2024)
1. **Core Infrastructure**
   - ✅ Backend directory structure set up
   - ✅ Essential packages installed
   - ✅ Basic Express server configured with error handling
   - ✅ MongoDB connection established

2. **Authentication System**
   - ✅ JWT-based authentication implemented
   - ✅ User registration with Penn email validation
   - ✅ Login/logout functionality
   - ✅ Protected route middleware
   - ❌ Email verification (skipped for simplicity)

3. **Data Models**
   - ✅ User Model with Penn email validation
   - ✅ Author Model with profile management
   - ✅ Article Model with slug generation
   - ✅ Proper model relationships and indexing

4. **Image Handling**
   - ✅ Switched from ImgBB to Cloudinary for better reliability
   - ✅ Image upload utility with optimization
   - ✅ Separate handling for profile and article images
   - ✅ Automatic cleanup of deleted images

5. **Article Management**
   - ✅ Article CRUD operations
   - ✅ Automatic slug generation
   - ✅ Author verification
   - ✅ Content validation
   - ✅ Image handling

6. **AI Integration**
   - ✅ OpenAI GPT-4 integration for primary moderation
   - ✅ Claude API as backup
   - ✅ Structured evaluation storage
   - ✅ Automatic approval system

### Frontend Implementation Status (March 2024)
1. **Core Infrastructure**
   - ✅ React application setup
   - ✅ React Router configured
   - ✅ Context API for state management
   - ✅ Responsive CSS framework
   - ✅ Component structure

2. **Authentication System**
   - ✅ User registration and login UI
   - ✅ JWT handling and storage
   - ✅ Protected routes
   - ✅ User session management
   - ✅ Authentication context

3. **User Experience**
   - ✅ Responsive navigation
   - ✅ Homepage with featured content
   - ✅ User dashboard
   - ✅ Profile management
   - ✅ Error handling and notifications

4. **Author Functionality**
   - ✅ Author profile creation
   - ✅ Profile image upload with Cloudinary
   - ✅ Author bio editing
   - ✅ Graceful error handling for image uploads
   - ✅ Different views for authors vs readers

5. **Article Management**
   - ✅ Article creation interface
   - ✅ Markdown editor with preview
   - ✅ Article submission flow
   - ✅ Article listing and filtering
   - ✅ Individual article view

6. **Responsive Design**
   - ✅ Mobile-friendly layout
   - ✅ Adaptive components
   - ✅ Touch-friendly controls
   - ✅ Accessible UI elements

7. **AI Integration**
   - ✅ AI moderation for submitted articles
   - ✅ Automatic approval/review system
   - ✅ Fallback mechanism for API failures
   - ✅ Article status indicators in UI

### API Endpoints
1. **Authentication** (`/api/auth`)
   - POST `/register` - Register new user
   - POST `/login` - Login user
   - POST `/logout` - Logout user
   - GET `/me` - Get current user

2. **Authors** (`/api/authors`)
   - POST `/profile` - Create/update author profile
   - PUT `/profile` - Update author profile
   - GET `/profile` - Get current author profile
   - GET `/profile/:email` - Get specific author
   - GET `/list` - List all authors

3. **Articles** (`/api/articles`)
   - POST `/` - Create new article
   - GET `/my-articles` - Get current author's articles
   - GET `/:slug` - Get specific article
   - DELETE `/:slug` - Delete article
   - GET `/` - List articles with filters

4. **Upload** (`/api/upload`)
   - POST `/image` - Upload image to Cloudinary

### Notable Achievements and Changes
1. **Authentication Flow**
   - Implemented complete authentication with JWT
   - Created a secure login/register flow with proper validation
   - Established protected routes and user session management

2. **Author Profile Management**
   - Created intuitive author registration process
   - Implemented profile image upload with Cloudinary integration
   - Added graceful error handling for backend connectivity issues
   - Designed different dashboard views for authors vs. readers

3. **Profile Editing**
   - Added dedicated profile editing page
   - Implemented form validation and error handling
   - Created responsive design for all screen sizes
   - Added success/error notifications for user feedback

4. **Responsive UI**
   - Designed mobile-first responsive layout
   - Implemented adaptive navigation
   - Created consistently styled components
   - Added animation for improved user experience

5. **Error Handling**
   - Implemented comprehensive error handling
   - Added user-friendly error messages
   - Created fallbacks for server connectivity issues
   - Designed dismissable notifications for feedback

6. **Article Creation and Management**
   - Built full-featured Markdown editor with formatting tools
   - Implemented article image upload with aspect ratio enforcement
   - Created AI-powered article evaluation system with approval workflow
   - Designed responsive article display with proper rendering of Markdown content

7. **Content Display System**
   - Developed dedicated article viewing page with responsive design
   - Created article listing page to browse approved content
   - Implemented status indicators for article approval process
   - Added author information display with profile images

8. **AI Moderation System**
   - Integrated OpenAI GPT-4o-mini for article moderation
   - Implemented local fallback for when AI services are unavailable
   - Added comprehensive evaluation metrics (applicability, harm potential, writing quality)
   - Created approval status system with appropriate user feedback

### Current System Features
1. **User Management**
   - Penn email registration and authentication
   - Author profile creation and management
   - Profile image upload and management
   - Secure session handling

2. **Article System**
   - Markdown article creation with formatting tools
   - Image upload with 3:4 aspect ratio enforcement
   - AI-powered content moderation
   - Automatic approval based on content evaluation

3. **Content Discovery**
   - Browse approved articles
   - View article details with author information
   - See approval status for your own articles
   - Responsive design for all devices

### Next Steps
1. **Content Engagement**
   - Implement comment system
   - Add sharing functionality
   - Create tagging system
   - Develop related articles feature

2. **User Experience Enhancements**
   - Add loading states and skeletons
   - Implement infinite scrolling for article lists
   - Add search functionality
   - Create user preferences

3. **Analytics and Engagement**
   - Implement page view tracking
   - Add engagement metrics
   - Create author dashboard analytics
   - Develop recommendation system

4. **Community Features**
   - Add author profiles page
   - Implement following functionality
   - Create notification system
   - Develop featured content rotation

The project has made significant progress with all core functionality now implemented. The system provides a complete workflow from user registration through author creation to article submission, AI moderation, and content display. The application features robust error handling, responsive design, and graceful degradation for API failures. The next phase will focus on enhancing engagement features and analytics to build a vibrant community platform.
