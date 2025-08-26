export interface ILocation {
  city: string;
  postalCode: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  country?: string; // Add country based on event form
}

export interface IOrganizerProfile {
  companyName?: string;
  location?: ILocation; // Make optional as it might be nested under profile
  description?: string;
  website?: string;
  venueTypes?: string[];
  averageBudget?: {
    min?: number;
    max?: number;
  };
  eventFrequency?: 'weekly' | 'monthly' | 'occasional';
  phone?: string;
}

export interface IUserData {
  _id: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'COMEDIAN' | 'ORGANIZER' | 'ADMIN' | 'SUPER_ADMIN';
  // Fields from User model that might be directly on the user object
  companyName?: string; // If companyName is directly on User for Organizers
  city?: string; // If city is directly on User for Organizers
  phone?: string;
  address?: string;
  // Nested profiles
  profile?: {
    bio?: string;
    experience?: number;
    speciality?: string;
    // Add other user profile fields here if needed
  };
  organizerProfile?: IOrganizerProfile; // Specific profile for organizer
  // Add other common user fields like stats, onboardingCompleted, etc.
  stats?: {
    totalEvents?: number;
    totalRevenue?: number;
    averageRating?: number;
    viralScore?: number;
    profileViews?: number;
    lastActivity?: string; // Use string for Date objects from JSON
    applicationsSent?: number;
    applicationsAccepted?: number;
    netPromoterScore?: number;
    absences?: number;
  };
  onboardingCompleted?: boolean;
  emailVerified?: boolean;
  avatarUrl?: string;
  createdAt?: string;
  lastLoginAt?: string;
} 