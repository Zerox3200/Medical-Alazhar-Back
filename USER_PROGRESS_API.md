# User Progress Management System API

## Overview

This API provides comprehensive course progress tracking for users with video completion, quiz attempts, final assessment, and certificate generation.

## Features

- ✅ Video completion tracking with sequential unlocking
- ✅ Quiz attempts management (3 attempts max)
- ✅ 10-minute lock after 3 failed attempts
- ✅ 70% pass rate requirement
- ✅ Final comprehensive assessment
- ✅ Certificate generation upon completion

## Models

### UserProgress Model

```javascript
{
  userId: ObjectId (ref: User),
  courseId: ObjectId (ref: Course),
  isCompleted: Boolean,
  completedAt: Date,
  videos: [{
    videoId: ObjectId (ref: Video),
    isCompleted: Boolean,
    completedAt: Date,
    isUnlocked: Boolean
  }],
  quizzes: {
    passed: [{
      quizId: ObjectId (ref: Quiz),
      isCompleted: Boolean,
      score: Number,
      completedAt: Date,
      attempts: Number
    }],
    failed: [{
      quizId: ObjectId (ref: Quiz),
      attempts: Number (0-3),
      isLocked: Boolean,
      lockedUntil: Date,
      lastAttemptAt: Date
    }]
  },
  finalAssessment: {
    isUnlocked: Boolean,
    isCompleted: Boolean,
    score: Number,
    completedAt: Date,
    attempts: Number,
    isLocked: Boolean,
    lockedUntil: Date
  },
  certificate: {
    isEarned: Boolean,
    earnedAt: Date,
    certificateUrl: String
  }
}
```

## API Endpoints

### 1. Get Course Progress

**GET** `/api/users/progress/:courseId/progress`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "SUCCESS",
  "code": 200,
  "message": "Course progress retrieved successfully",
  "success": true,
  "data": {
    "course": {
      "title": "Course Title",
      "description": "Course Description",
      "courseBanner": "banner_url",
      "mentor": "Mentor Name"
    },
    "progress": {
      "isCompleted": false,
      "videos": [...],
      "quizzes": {...},
      "finalAssessment": {...},
      "certificate": {...}
    }
  }
}
```

### 2. Submit Video Completion

**POST** `/api/users/progress/:courseId/videos/:videoId/complete`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "SUCCESS",
  "code": 200,
  "message": "Video completed successfully. Quiz is now available",
  "success": true,
  "data": {
    "videoCompleted": true,
    "quizUnlocked": true,
    "quizId": "quiz_id"
  }
}
```

### 3. Submit Quiz

**POST** `/api/users/progress/:courseId/quizzes/:quizId/submit`

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "answers": {
    "0": "option_a",
    "1": "option_b",
    "2": "option_c"
  }
}
```

**Response (Passed):**

```json
{
  "status": "SUCCESS",
  "code": 200,
  "message": "Quiz passed successfully! Next video unlocked",
  "success": true,
  "data": {
    "passed": true,
    "score": 85,
    "nextVideoUnlocked": true,
    "finalAssessmentUnlocked": false
  }
}
```

**Response (Failed):**

```json
{
  "status": "SUCCESS",
  "code": 200,
  "message": "Quiz failed. Score: 60%. Attempts remaining: 2",
  "success": true,
  "data": {
    "passed": false,
    "score": 60,
    "attempts": 1,
    "attemptsRemaining": 2,
    "isLocked": false,
    "unlockTime": null
  }
}
```

**Response (Locked):**

```json
{
  "status": "ERROR",
  "code": 403,
  "message": "Quiz is locked due to multiple failed attempts. Try again after 2024-01-15 14:30:00",
  "success": false,
  "unlockTime": "2024-01-15T14:30:00.000Z"
}
```

### 4. Submit Final Assessment

**POST** `/api/users/progress/:courseId/final-assessment/submit`

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "answers": {
    "0": "option_a",
    "1": "option_b",
    "2": "option_c",
    "3": "option_d",
    "4": "option_e"
  }
}
```

**Response (Passed):**

```json
{
  "status": "SUCCESS",
  "code": 200,
  "message": "Congratulations! You have completed the course and earned your certificate",
  "success": true,
  "data": {
    "passed": true,
    "score": 85,
    "courseCompleted": true,
    "certificateEarned": true,
    "certificateUrl": "/certificates/user_id_course_id_timestamp.pdf"
  }
}
```

### 5. Get Certificate

**GET** `/api/users/progress/:courseId/certificate`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "SUCCESS",
  "code": 200,
  "message": "Certificate retrieved successfully",
  "success": true,
  "data": {
    "certificate": {
      "courseTitle": "Course Title",
      "earnedAt": "2024-01-15T14:30:00.000Z",
      "certificateUrl": "/certificates/user_id_course_id_timestamp.pdf",
      "finalScore": 85
    }
  }
}
```

### 6. Reset Quiz Attempts (Admin)

**POST** `/api/users/progress/:courseId/quizzes/:quizId/reset`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": "SUCCESS",
  "code": 200,
  "message": "Quiz attempts reset successfully",
  "success": true
}
```

## Business Logic Flow

### 1. Course Enrollment

- User subscribes to course via existing subscription endpoint
- Initial progress record is created with first video unlocked

### 2. Video Completion

- User watches video and marks it as complete
- If video has associated quiz, quiz becomes available
- If no quiz, next video is unlocked

### 3. Quiz Attempts

- User has 3 attempts per quiz
- Must score 70% or higher to pass
- After 3 failed attempts, quiz is locked for 10 minutes
- Lock automatically expires after 10 minutes
- Passing quiz unlocks next video

### 4. Final Assessment

- Available only after all videos and quizzes are completed
- Contains all questions from all course quizzes
- Same 3-attempt rule with 10-minute lock
- Must score 70% or higher to pass

### 5. Certificate Generation

- Generated automatically upon passing final assessment
- Course marked as completed
- Certificate URL provided for download

## Error Handling

### Common Error Responses

**404 - Not Found:**

```json
{
  "status": "ERROR",
  "code": 404,
  "message": "Course not found",
  "success": false
}
```

**403 - Forbidden (Locked):**

```json
{
  "status": "ERROR",
  "code": 403,
  "message": "This video is locked. Complete the previous video and its quiz first",
  "success": false
}
```

**422 - Validation Error:**

```json
{
  "status": "ERROR",
  "code": 422,
  "message": "You must answer all questions",
  "success": false
}
```

## Implementation Notes

1. **Progress Tracking**: Each user has a separate progress record per course
2. **Video Unlocking**: Sequential unlocking based on completion of previous video + quiz
3. **Quiz Locking**: Automatic 10-minute lock after 3 failed attempts
4. **Score Calculation**: Percentage-based scoring with 70% pass threshold
5. **Certificate Generation**: Automatic upon final assessment completion
6. **Data Integrity**: Unique constraints prevent duplicate progress records

## Security Considerations

1. All endpoints require authentication
2. Users can only access their own progress
3. Quiz attempts are tracked per user per quiz
4. Lock times are enforced server-side
5. Certificate URLs are generated securely

## Usage Examples

### Complete Course Flow

1. User subscribes to course
2. User completes first video
3. User takes and passes first quiz
4. Second video unlocks
5. Process repeats for all videos/quizzes
6. Final assessment unlocks
7. User passes final assessment
8. Certificate is generated
9. Course marked as completed
