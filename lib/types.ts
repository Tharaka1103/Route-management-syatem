export interface User {
  _id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'driver' | 'project_manager' | 'admin';
  createdAt: Date;
}

export interface Ride {
  _id?: string;
  userId: string;
  driverId?: string;
  status: 'pending' | 'awaiting_pm' | 'awaiting_admin' | 'approved' | 'in_progress' | 'completed';
  distanceKm: number;
  startLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  endLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  approval: {
    projectManager?: {
      approved: boolean;
      approvedAt?: Date;
    };
    admin?: {
      approved: boolean;
      approvedAt?: Date;
    };
  };
  createdAt: Date;
}

export interface Device {
  _id?: string;
  terminalId: string;
  vehicle: string;
  vehicleType: string;
  status: string;
  latitude: string;
  longitude: string;
  speed: number;
  lastMessage: string;
  expire: string;
}

export interface DeviceApiResponse {
  id: number;
  terminal_id: string;
  vehicle: string;
  vehicle_type: string;
  protocol: string;
  phone: string;
  status: string;
  speed_limit: number;
  stop_time: string;
  latitude: string;
  longitude: string;
  speed: number;
  last_message: string;
  rotation: number;
  acc: number;
  expire: string;
}