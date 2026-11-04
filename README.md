## Author

Rahul Thakur
Course: ICSI 418Y Software Engineering
University at Albany

# ICSI 418Y - Programming Assignment 2

A Full-stack web app that extends PA3's project management system with **user stories** and **project backlogs**. Users create projects, manage members, and track stories through `To Do` → `In Progress` → `Done`.

## Features

- Signup with first name, last name, username, and password
- Projects: create, edit, delete (Lead only); statuses: Planning, Active, Completed
- Members: add/remove; Lead cannot be removed; member with assigned stories cannot be removed
- Stories: create with title, description, priority, assignee; new stories start as To Do
- Priority: High, Medium, Low
- Backlog: view all stories per project, switch projects, empty-state message
- Edit / Delete: full editing with Cancel; delete with confirmation



## Tech Stack

- Frontend: React, React Router, Axios
- Backend: Node.js, Express
- Database: MongoDB with Mongoose

## Requirements
- Node.js
- MongoDB running locally, or MongoDB Atlas

## Setup

1. Clone the repository:

```
git clone https://github.com/r-thakur2221/ICSI418Y-PA2.git
cd ICSI418Y-PA2
```

2. Install backend dependencies:

```
cd server
npm install
```

3. Install frontend dependencies:

```
cd ../client
npm install
```

## Environment Variables

Create `server/.env`:

```
MONGO_URL=mongodb://localhost:27017/icsi418y
PORT=8080
```

Create `client/.env`:

```
REACT_APP_BASEURL=http://localhost:8080
```

## Running the App

Open two terminals.

Backend:

```
cd server
npm start
```

Frontend:

```
cd client
npm start
```

Open http://localhost:3000 in the browser.


## Error Handling

- Empty signup or login fields show an error message
- Duplicate username is rejected
- Non-existent username shows an error
- Incorrect password shows an error
- Correct credentials redirect to the Welcome page
- Database or server errors show a fallback message

## MongoDB Schema

Collection: users

```
{
  _id:      ObjectId,
  f_name:   String,
  l_name:   String,
  username: String (unique),
  password: String
}
```

Note: Passwords are stored as plain text for this assignment. In production they should be hashed with bcrypt.
