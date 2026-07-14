const PERMISSIONS_MAP = {
  'Super Admin': {
    canViewInvoices: true,
    canManageInvoices: true,
    canViewRevenue: true,
    canManageUsers: true,
    canViewAuditLogs: true,
    canViewTeamMetrics: true,
    canManageProjects: true,
  },
  Admin: {
    canViewInvoices: true,
    canManageInvoices: true,
    canViewRevenue: true,
    canManageUsers: true,
    canViewAuditLogs: true,
    canViewTeamMetrics: true,
    canManageProjects: true,
  },
  'Project Manager': {
    canViewInvoices: false,
    canManageInvoices: false,
    canViewRevenue: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewTeamMetrics: true,
    canManageProjects: true,
  },
  Engineer: {
    canViewInvoices: false,
    canManageInvoices: false,
    canViewRevenue: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewTeamMetrics: false,
    canManageProjects: false,
  },
  Finance: {
    canViewInvoices: true,
    canManageInvoices: true,
    canViewRevenue: true,
    canManageUsers: false,
    canViewAuditLogs: true,
    canViewTeamMetrics: false,
    canManageProjects: false,
  },
  Viewer: {
    canViewInvoices: false,
    canManageInvoices: false,
    canViewRevenue: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewTeamMetrics: false,
    canManageProjects: false,
  },
  Employee: {
    canViewInvoices: false,
    canManageInvoices: false,
    canViewRevenue: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewTeamMetrics: false,
    canManageProjects: false,
  }
};

export function hasPermission(role, permission) {
  // Normalize default role to Employee if missing
  const normalizedRole = role || 'Employee';
  
  if (PERMISSIONS_MAP[normalizedRole]) {
    return !!PERMISSIONS_MAP[normalizedRole][permission];
  }

  const legacyRole = normalizedRole === 'SuperAdmin' ? 'Super Admin' : normalizedRole === 'Manager' ? 'Project Manager' : normalizedRole;
  if (!PERMISSIONS_MAP[legacyRole]) {
    return false;
  }
  
  return !!PERMISSIONS_MAP[legacyRole][permission];
}
