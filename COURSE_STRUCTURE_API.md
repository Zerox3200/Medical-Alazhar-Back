# Course Structure API Documentation

This document describes the new hierarchical course structure with sections and chapters.

## Overview

The course structure now follows this hierarchy:

```
Course
├── Sections (ordered)
│   ├── Chapters (ordered)
│   │   └── Videos
│   └── Chapters (ordered)
│       └── Videos
└── Sections (ordered)
    └── Chapters (ordered)
        └── Videos
```

## Models

### Course Model

- `title`: String (required)
- `description`: String (required)
- `courseBanner`: String (optional)
- `mentor`: String (required)
- `tags`: Array of Strings (required)
- `sections`: Array of Section ObjectIds
- `videos`: Array of Video ObjectIds (for backward compatibility)
- `quizzes`: Array of Quiz ObjectIds
- `certificateTemplate`: String
- `published`: Boolean (default: false)

### Section Model

- `title`: String (required)
- `description`: String (required)
- `order`: Number (required, unique within course)
- `courseId`: ObjectId (required, reference to Course)
- `chapters`: Array of Chapter ObjectIds
- `isPublished`: Boolean (default: false)

### Chapter Model

- `title`: String (required)
- `description`: String (required)
- `order`: Number (required, unique within section)
- `sectionId`: ObjectId (required, reference to Section)
- `courseId`: ObjectId (required, reference to Course)
- `videos`: Array of Video ObjectIds
- `isPublished`: Boolean (default: false)

### Video Model (Updated)

- `title`: String (required)
- `description`: String (required)
- `level`: String (enum: "advanced", "intermediate", "entry")
- `url`: String (required, unique)
- `duration`: String (required)
- `courseId`: ObjectId (reference to Course)
- `chapterId`: ObjectId (reference to Chapter) - NEW
- `quizId`: ObjectId (reference to Quiz)

## API Endpoints

### Course Management (Admin)

#### Get All Courses

```
GET /api/admin/courses
```

#### Get Course Data (with sections and chapters)

```
GET /api/admin/courses/:courseId
```

#### Create Course

```
POST /api/admin/courses/create
```

#### Update Course

```
PATCH /api/admin/courses/:courseId
```

#### Update Course Status

```
PATCH /api/admin/courses/:courseId/status
```

#### Delete Course

```
DELETE /api/admin/courses/:courseId
```

### Section Management (Admin)

#### Get All Sections for a Course

```
GET /api/admin/courses/:courseId/sections
```

#### Get Single Section

```
GET /api/admin/courses/:courseId/sections/:sectionId
```

#### Create Section

```
POST /api/admin/courses/:courseId/sections
Body: {
  "title": "Section Title",
  "description": "Section Description",
  "order": 1
}
```

#### Update Section

```
PATCH /api/admin/courses/:courseId/sections/:sectionId
Body: {
  "title": "Updated Title",
  "description": "Updated Description",
  "order": 2,
  "isPublished": true
}
```

#### Update Section Status

```
PATCH /api/admin/courses/:courseId/sections/:sectionId/status
Body: {
  "isPublished": true
}
```

#### Delete Section

```
DELETE /api/admin/courses/:courseId/sections/:sectionId
```

### Chapter Management (Admin)

#### Get All Chapters for a Section

```
GET /api/admin/courses/:courseId/sections/:sectionId/chapters
```

#### Get Single Chapter

```
GET /api/admin/courses/:courseId/sections/:sectionId/chapters/:chapterId
```

#### Create Chapter

```
POST /api/admin/courses/:courseId/sections/:sectionId/chapters
Body: {
  "title": "Chapter Title",
  "description": "Chapter Description",
  "order": 1
}
```

#### Update Chapter

```
PATCH /api/admin/courses/:courseId/sections/:sectionId/chapters/:chapterId
Body: {
  "title": "Updated Title",
  "description": "Updated Description",
  "order": 2,
  "isPublished": true
}
```

#### Update Chapter Status

```
PATCH /api/admin/courses/:courseId/sections/:sectionId/chapters/:chapterId/status
Body: {
  "isPublished": true
}
```

#### Delete Chapter

```
DELETE /api/admin/courses/:courseId/sections/:sectionId/chapters/:chapterId
```

### Video Management (Admin)

#### Add Video to Chapter

```
POST /api/admin/courses/:courseId/videos/add
Body: {
  "title": "Video Title",
  "description": "Video Description",
  "level": "intermediate",
  "duration": "10:30",
  "chapterId": "chapterId"
}
```

#### Update Video

```
PATCH /api/admin/courses/update-video/:videoId
```

#### Delete Video

```
DELETE /api/admin/courses/delete-video/:videoId
```

### Course Access (Interns)

#### Get All Courses

```
GET /api/courses
```

#### Get Course Data (with sections and chapters)

```
GET /api/courses/:courseId
```

#### Get Video

```
GET /api/courses/:courseId/videos?videoId=:videoId
```

#### Submit Video Completion

```
POST /api/courses/:courseId/videos/submit?videoId=:videoId
Body: {
  "isCompleted": true
}
```

#### Get Quiz

```
GET /api/courses/:courseId/quizzes?quizId=:quizId
```

#### Submit Quiz

```
POST /api/courses/:courseId/quizzes/submit?quizId=:quizId
Body: {
  "answers": {
    "0": "answer1",
    "1": "answer2"
  }
}
```

## Validation Rules

### Section Validation

- Title: 3-100 characters
- Description: 10-500 characters
- Order: Integer >= 1, unique within course

### Chapter Validation

- Title: 3-100 characters
- Description: 10-500 characters
- Order: Integer >= 1, unique within section
- SectionId: Required

## Important Notes

1. **Ordering**: Sections and chapters are ordered by their `order` field
2. **Publishing**: Both sections and chapters have individual publish status
3. **Cascading Deletes**: Deleting a section deletes all its chapters and videos
4. **Backward Compatibility**: Videos are still linked to courses for existing functionality
5. **Video Assignment**: Videos must be assigned to a chapter when created
6. **Course Publishing**: A course can only be published if it has at least one section
7. **Flexible Structure**: Sections can be created and published without requiring chapters immediately

## Example Course Structure

```json
{
  "title": "Medical Internship Course",
  "description": "Comprehensive medical training course",
  "sections": [
    {
      "title": "Introduction to Medicine",
      "description": "Basic medical concepts",
      "order": 1,
      "chapters": [
        {
          "title": "Medical Ethics",
          "description": "Understanding medical ethics",
          "order": 1,
          "videos": [
            {
              "title": "Introduction to Medical Ethics",
              "duration": "15:30",
              "level": "entry"
            }
          ]
        }
      ]
    }
  ]
}
```
