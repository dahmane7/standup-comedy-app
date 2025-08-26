import { Types } from 'mongoose';

export interface ILocation {
  city: string;
  postalCode: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Performance {
  eventId: Types.ObjectId;
  date: Date;
  duration: number;
  videoLink?: string;
  feedback?: string;
}

export interface UserProfile {
  bio?: string;
  experience?: number;
  speciality?: string;
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    twitter?: string;
  };
  performances?: Performance[];
}

export interface IOrganisateurProfile {
  companyName?: string;
  location?: ILocation;
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

export interface User {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  city?: string;
  role: 'COMEDIAN' | 'ORGANIZER' | 'ADMIN' | 'SUPER_ADMIN';
  profile?: UserProfile;
  organizerProfile?: IOrganisateurProfile;
  stats?: any;
  onboardingCompleted?: boolean;
  emailVerified?: boolean;
  avatarUrl?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
  phone?: string;
  address?: string;
}

// Interface for a user document after being populated
export interface IPopulatedUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  role: 'COMEDIAN' | 'ORGANIZER' | 'ADMIN' | 'SUPER_ADMIN';
  // Add other fields that might be populated and needed, e.g., companyName, city
  companyName?: string;
  city?: string;
  organizerProfile?: IOrganisateurProfile;
  profile?: UserProfile;
} 