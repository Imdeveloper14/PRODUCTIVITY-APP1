const PERMISSIONS_MAP = {
  SuperAdmin: {
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
  Manager: {
    canViewInvoices: false,
    canManageInvoices: false,
    canViewRevenue: false,
    canManageUsers: false,
    canViewAuditLogs: false,
    canViewTeamMetrics: true,
    canManageProjects: true,
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
  
  if (!PERMISSIONS_MAP[normalizedRole]) {
    return false;
  }
  
  return !!PERMISSIONS_MAP[normalizedRole][permission];
}
