/**
 * Splits `resource:action` permission keys into module + action.
 * If there is no `:`, the whole key is the module and action is empty.
 */
export function splitPermissionKey(permissionKey: string): {
  module: string;
  action: string;
} {
  const idx = permissionKey.indexOf(':');
  if (idx === -1) {
    return { module: permissionKey, action: '' };
  }
  return {
    module: permissionKey.slice(0, idx),
    action: permissionKey.slice(idx + 1),
  };
}
