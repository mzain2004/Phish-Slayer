export type UserRole = 'super_admin' | 'manager' | 'analyst' | 'viewer';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 4,
  manager: 3,
  analyst: 2,
  viewer: 1,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  manager: 'SOC Manager',
  analyst: 'SOC Analyst', 
  viewer: 'Executive Viewer',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-red-100 text-red-700 border-red-200',
  manager: 'bg-purple-100 text-purple-700 border-purple-200',
  analyst: 'bg-teal-100 text-teal-700 border-teal-200',
  viewer: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canViewAllScans(role: UserRole): boolean {
  return hasPermission(role, 'manager');
}

export function canManageIntelVault(role: UserRole): boolean {
  return hasPermission(role, 'manager');
}

export function canAssignIncidents(role: UserRole): boolean {
  return hasPermission(role, 'manager');
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'super_admin';
}

export function canLaunchScans(role: UserRole): boolean {
  return hasPermission(role, 'analyst');
}

export function isReadOnly(role: UserRole): boolean {
  return role === 'viewer';
}
