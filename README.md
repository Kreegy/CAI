# Competency Based Assessment Web Application

A simple web application for teachers to manage student competency-based assessment scores. This application provides an intuitive interface for entering and managing student assessment data with Firebase backend integration.

## Features

- Clean table view for student assessment data
- School information display
- Student search functionality
- 5-level competency assessment
- Auto-save functionality
- Print view support
- Responsive design
- Firebase real-time database integration

## Prerequisites

- A Firebase account (free tier is sufficient)
- Basic knowledge of web deployment
- A modern web browser

## Setup Instructions

1. **Firebase Setup**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - In Project Settings, find your web app configuration
   - Copy the Firebase configuration object
   - Replace the placeholder configuration in `app.js` with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-auth-domain",
    databaseURL: "your-database-url",
    projectId: "your-project-id",
    storageBucket: "your-storage-bucket",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id"
};
```

2. **Firebase Database Rules**
   - In Firebase Console, go to Realtime Database
   - Set up your database rules (for development, you can start with test mode)
   - For production, implement proper security rules

## Deployment Options

### Option 1: Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase project:
```bash
firebase init
```

4. Deploy to Firebase:
```bash
firebase deploy
```

### Option 2: Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

## Local Development

1. Clone the repository
2. Set up your Firebase configuration in `app.js`
3. Serve the files using a local server (e.g., Live Server in VS Code)
4. Open `index.html` in your browser

## Customization

- Modify the student data in `app.js` to match your school's data
- Adjust the styling in `styles.css` to match your school's branding
- Add additional competency levels or assessment criteria as needed

## Security Considerations

- Implement proper Firebase security rules for production
- Consider adding user authentication for data protection
- Regularly backup your database
- Never expose Firebase API keys in public repositories

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Feel free to submit issues and enhancement requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.