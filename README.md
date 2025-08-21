# Route Management System - RouteBook

Advanced route management and booking system for RouteBook organization with comprehensive user dashboard functionality.

## Features

### User Dashboard (`/dashboard`)
- **Ongoing rides section** with real-time status tracking
- **Recent rides history** with ratings and reviews
- **Ride booking form** with Google Maps integration for location selection
- **Profile settings** with edit functionality
- **Statistics and metrics** showing total/completed/ongoing rides
- **Map component** for selecting start and end locations with directions
- **Ride status tracking** with color-coded badges
- **Profile editing modal** with contact and address updates
- **Recent rides list** with interactive rating system
- **Navigation header** with logout functionality

### API Routes
- `/api/rides/create` - Create new ride bookings
- `/api/rides/user` - Get user's rides and update ratings
- `/api/users/profile` - Manage user profile information

### Technologies Used
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Google Maps API** for location selection and directions
- **MongoDB** with Mongoose for data persistence
- **NextAuth.js** for authentication and session management
- **Shadcn/UI** components with Tailwind CSS
- **Sonner** for toast notifications
- **React Hook Form** for form handling

## Environment Variables

Create a `.env.local` file in the root directory with:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Google Maps API (required for dashboard)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Getting Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Distance Matrix API
4. Create credentials (API Key)
5. Restrict the API key to your domain for production use

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see above)
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── dashboard/
│   └── page.tsx          # Main user dashboard
├── api/
│   ├── rides/
│   │   ├── create/       # Create ride bookings
│   │   └── user/         # Get user rides, update ratings
│   └── users/
│       └── profile/      # User profile management
components/
├── ui/                   # Shadcn UI components
└── providers/            # Session and other providers
lib/
├── mongodb.ts           # Database connection
├── utils.ts             # Utility functions
└── auth.ts              # Authentication configuration
types/
└── index.ts             # TypeScript type definitions
```

## Dashboard Features

### 1. Statistics Cards
- Total rides count
- Completed rides
- Ongoing rides 
- Average rating

### 2. Ride Booking
- Interactive Google Maps integration
- Click-to-select start/end locations
- Real-time directions display
- Optional requested time selection

### 3. Ongoing Rides Tracking
- Real-time status updates
- Driver and vehicle information
- Route display with markers

### 4. Recent Rides History
- Scrollable list of past rides
- Interactive star rating system
- Driver and vehicle details
- Distance tracking

### 5. Profile Management
- Edit personal information
- Update contact details
- Change profile image
- View department and role info

## Usage

1. **Login** to the system with your credentials
2. **Access Dashboard** at `/dashboard` after authentication
3. **Book Rides** using the interactive map interface:
   - Click "New Booking" button
   - Select start location by clicking on map
   - Select end location by clicking on map
   - Set optional requested time
   - Submit booking request
4. **Track Rides** in the ongoing rides section
5. **Rate Completed Rides** in the recent rides section
6. **Update Profile** using the profile dialog

## Security Features

- Session-based authentication
- Role-based access control
- Input validation and sanitization
- API route protection
- Environment variable security

## Responsive Design

The dashboard is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Performance Optimizations

- Code splitting with Next.js App Router
- Lazy loading of components
- Optimized Google Maps integration
- Efficient API calls with proper caching
- TypeScript for better development experience

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary and confidential to RouteBook organization.
