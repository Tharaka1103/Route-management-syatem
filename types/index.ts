import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

export interface User {
    _id: string;
    email: string;
    fullName: string;
    department?: Department;
    role: UserRole;
    contact?: string;
    address?: string;
    image?: string;
    isActive?: boolean;
    password?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Driver {
    _id: string;
    fullName: string;
    contact: string;
    email?: string;
    nic: string;
    password: string;
    address?: string;
    rating?: number;
    totalDistance?: number;
    isActive?: boolean;
    currentLocation?: {
        latitude: number;
        longitude: number;
        updatedAt: Date;
    };
    status: 'available' | 'busy' | 'offline';
    createdAt: Date;
    updatedAt: Date;
}

export interface Vehicle {
    _id: string;
    vehicleNumber: string;
    model: string;
    make?: string;
    year?: number;
    capacity: number;
    status: 'available' | 'busy' | 'maintenance';
    currentDriver?: Driver | string;
    totalDistance?: number;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Route {
    _id: string;
    name: string;
    startLocation: Location;
    endLocation: Location;
    distance: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Ride {
    _id: string;
    user: User | string;
    driver?: Driver | string;
    vehicle?: Vehicle | string;
    startLocation: Location;
    endLocation: Location;
    status: RideStatus;
    approvalStatus: ApprovalStatus;
    departmentHead?: User | string;
    projectManager?: User | string;
    rejectionReason?: string;
    distance?: number;
    rating?: number;
    startTime?: Date;
    endTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface DailyRoute {
    _id: string;
    driver: string;
    vehicle: string;
    route: string;
    distance: number;
    startTime: Date;
    endTime?: Date;
    status: 'ongoing' | 'completed';
    createdAt: Date;
}

export interface Location {
    latitude: number;
    longitude: number;
    address: string;
}
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      department?: Department;
      userType: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    userType: UserRole;
    department?: Department;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    userType: UserRole;
    department?: Department;
  }
}

export type Department = 'mechanical' | 'civil' | 'electrical' | 'HSEQ' | 'HR';
export type UserRole = 'user' | 'driver' | 'department_head' | 'project_manager' | 'admin';
export type RideStatus = 'pending' | 'approved' | 'assigned' | 'ongoing' | 'completed' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';