## Author

Rahul Thakur
Course: ICSI 418Y Software Engineering
University at Albany

# ICSI 418Y - Programming Assignment 2

Full-stack Login and Signup application built with React, Node.js, Express, and MongoDB.

## Features

- Signup with first name, last name, username, and password
- Login with username and password
- Unique username enforcement
- Client-side and server-side validation
- Success and error messages in the UI
- Welcome page after successful login
- 404 page for unknown routes

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
git clone https://github.com/<your-username>/ICSI418Y-PA2.git
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
