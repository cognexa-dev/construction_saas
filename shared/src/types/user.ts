export enum UserRole {
  ADMIN = 'admin',
  OWNER = 'owner',
  SUPERVISOR = 'supervisor',
  CUSTOMER = 'customer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface IUserPublic extends Omit<IUser, 'createdBy'> {
  fullName: string;
}
