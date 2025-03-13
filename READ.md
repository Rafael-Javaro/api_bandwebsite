# Band Website API

A Node.js REST API backend for managing a band's website, including concerts, photos, comments, and contact form functionality.

## Features

- 🔐 Authentication with Firebase
- 📸 Photo upload and management with Google Cloud Storage
- 🎵 Concert management
- 💬 Comments and likes system
- 📧 Contact form with email notifications
- 🔒 Role-based access control (Admin/User)

## Tech Stack

- Node.js & Express
- Firebase Authentication & Firestore
- Google Cloud Storage
- Nodemailer for emails
- Winston for logging
- Docker support

## Prerequisites

- Node.js >= 16.0.0
- Firebase project
- Google Cloud Storage bucket
- SMTP server for emails

## Installation

1. Clone the repository
```bash
git clone [repository-url]
cd band-website-api
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables by creating a .env file:
```env
NODE_ENV=development
PORT=8080

# Firebase
FIREBASE_SERVICE_ACCOUNT=your-firebase-service-account-json

# Google Cloud Storage
GCP_KEY_FILE=path-to-your-gcp-key-file.json
STORAGE_BUCKET=your-storage-bucket-name

# Email
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@yourband.com

# Admin Email
ADMIN_EMAIL=admin@example.com
```

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
```bash
docker build -t band-website-api .
docker run -p 8080:8080 --env-file .env band-website-api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/make-admin` - Make user an admin

### Concerts
- `GET /api/concerts` - Get all concerts
- `GET /api/concerts/:concertId` - Get concert by ID
- `POST /api/concerts` - Create concert (admin)
- `PUT /api/concerts/:concertId` - Update concert (admin)
- `DELETE /api/concerts/:concertId` - Delete concert (admin)

### Photos
- `GET /api/photos/concert/:concertId` - Get concert photos
- `POST /api/photos/concert/:concertId` - Upload photo (admin)
- `DELETE /api/photos/:photoId` - Delete photo (admin)

### Comments & Likes
- `GET /api/comments/photo/:photoId` - Get photo comments
- `POST /api/comments/photo/:photoId` - Add comment
- `PUT /api/comments/:commentId` - Update comment
- `DELETE /api/comments/:commentId` - Delete comment
- `POST /api/comments/like/photo/:photoId` - Like photo
- `DELETE /api/comments/like/photo/:photoId` - Unlike photo

### Contact Form
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get submissions (admin)
- `PUT /api/contact/:contactId` - Update submission status (admin)

## Security Features

- JWT authentication with Firebase
- Role-based access control
- Request validation
- Security headers with Helmet
- CORS enabled
- File upload restrictions
- Rate limiting

## Error Handling

The API uses a centralized error handling mechanism with detailed logging through Winston:
- Development: Full error stack traces
- Production: User-friendly error messages

## Documentation

For detailed API documentation and examples, please refer to:
- routes - API route definitions
- controllers - Business logic implementation
- middleware - Custom middleware functions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.