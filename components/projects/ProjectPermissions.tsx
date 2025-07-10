import React from 'react'
import { type ProjectPermissions as ProjectPermissionsType } from '@/lib/types/projects'

interface ProjectPermissionsProps {
  userRole: string
  projectStatus: string
  isProjectManager: boolean
  isClient: boolean
}

// Define permissions based on user role and context
export const useProjectPermissions = ({
  userRole,
  projectStatus,
  isProjectManager,
  isClient
}: ProjectPermissionsProps): ProjectPermissionsType => {
  // Admin has all permissions
  if (userRole === 'admin') {
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      canManageMembers: true,
      canManageTasks: true,
      canManageFiles: true,
      canViewFinancials: true,
      canApprove: true
    }
  }

  // Project manager permissions
  if (isProjectManager) {
    return {
      canView: true,
      canEdit: true,
      canDelete: projectStatus !== 'completed',
      canManageMembers: true,
      canManageTasks: true,
      canManageFiles: true,
      canViewFinancials: true,
      canApprove: false // Usually can't approve their own work
    }
  }

  // Client permissions
  if (isClient) {
    return {
      canView: true,
      canEdit: false,
      canDelete: false,
      canManageMembers: false,
      canManageTasks: false,
      canManageFiles: false, // Can only view client-visible files
      canViewFinancials: false,
      canApprove: true // Can approve deliverables
    }
  }

  // Team member permissions
  if (userRole === 'agency' || userRole === 'coach') {
    return {
      canView: true,
      canEdit: projectStatus === 'active',
      canDelete: false,
      canManageMembers: false,
      canManageTasks: projectStatus === 'active',
      canManageFiles: true,
      canViewFinancials: false,
      canApprove: false
    }
  }

  // Default (minimal permissions)
  return {
    canView: false,
    canEdit: false,
    canDelete: false,
    canManageMembers: false,
    canManageTasks: false,
    canManageFiles: false,
    canViewFinancials: false,
    canApprove: false
  }
}

// Higher-order component for permission-based rendering
interface WithPermissionsProps {
  children: React.ReactNode
  permission: keyof ProjectPermissionsType
  permissions: ProjectPermissionsType
  fallback?: React.ReactNode
}

export const WithPermissions: React.FC<WithPermissionsProps> = ({
  children,
  permission,
  permissions,
  fallback = null
}) => {
  if (permissions[permission]) {
    return <>{children}</>
  }
  return <>{fallback}</>
}

// Permission guard hook
export const usePermissionGuard = (
  permission: keyof ProjectPermissionsType,
  permissions: ProjectPermissionsType
): boolean => {
  return permissions[permission]
}

export default useProjectPermissions