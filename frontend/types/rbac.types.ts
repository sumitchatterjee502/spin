export type RbacRole = {
  id: number;
  name: string;
  description: string;
  permissions: string[];
};

export type RbacPermission = {
  id: number;
  key: string;
  description: string;
};
