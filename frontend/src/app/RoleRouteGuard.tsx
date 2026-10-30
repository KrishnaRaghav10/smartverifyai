import React from 'react';
import { useAegisStore } from '../store';
import { Role } from '../types';
import { AccessDenied } from '../shared/AccessDenied';

interface RoleRouteGuardProps {
  requiredRole: Role;
  children: React.ReactNode;
}

export const RoleRouteGuard: React.FC<RoleRouteGuardProps> = ({ requiredRole, children }) => {
  const { currentUser } = useAegisStore();

  if (currentUser.role !== requiredRole) {
    return <AccessDenied requiredRole={requiredRole} />;
  }

  return <>{children}</>;
};
