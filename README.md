# CareerMate – AI-Assisted Placement Management System

CareerMate is a full-stack placement management platform designed to help students organize and track their campus placement activities in one centralized application.

The system allows students to manage job applications, maintain resume versions, track interviews, and monitor their placement progress. It also includes resume upload and AI-assisted resume analysis functionality.

## 🚀 Features

### 🔐 Authentication
- User registration and login
- JWT-based authentication
- Protected routes and APIs
- Secure access to user-specific placement data

### 📋 Job Application Tracking
- Add and manage job applications
- Track application status
- Store company and job-related information
- Maintain application history

### 📄 Resume Management
- Upload resumes
- Manage resume versions
- Associate resume versions with job applications
- Extract resume information for analysis

### 🤖 AI-Assisted Resume Analysis
- Extract skills from uploaded resumes
- Identify missing or relevant technologies
- Generate suggestions for improving the resume
- Provide personalized recommendations based on extracted information

### 🎯 Interview Tracking
- Add interview details
- Track interview schedules
- Maintain interview status and information
- Organize upcoming placement activities

### 📊 Placement Dashboard
- Centralized view of placement activities
- Quick access to applications, resumes and interviews
- Simple and user-friendly interface

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend
- Python
- Flask
- Flask-JWT-Extended
- Flask-CORS
- REST APIs

### Database
- MongoDB

### Tools
- Git
- GitHub
- VS Code

## 🏗️ Project Architecture

```text
CareerMate/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── ...
│   └── package.json
│
├── backend/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── app.py
│   └── ...
│
├── README.md
└── .gitignore
