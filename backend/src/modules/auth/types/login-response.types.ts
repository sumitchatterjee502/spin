export type LoginPermissionDto = {
  id: number;
  name: string;
  module: string;
  action: string;
};

export type LoginRoleDto = {
  id: number;
  name: string;
};

export type LoginAdminDto = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  roles: LoginRoleDto[];
  permissions: LoginPermissionDto[];
  permissionsGroupedByModule: {
    module: string;
    permissions: LoginPermissionDto[];
  }[];
};

export type LoginResponseData = {
  accessToken: string;
  admin: LoginAdminDto;
};

export type LoginApiResponse = {
  error: boolean;
  message: string;
  statusCode: number;
  responseData: LoginResponseData;
};

export type RegisterApiResponse = {
  error: false;
  message: string;
  statusCode: number;
  responseData: { id: number; email: string };
};
