export const Roles = {
  OWNER: 'owner',
  SUPER: 'super',
  SUPERVISOR: 'supervisor',
  EMPLOYEE: 'employee',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
