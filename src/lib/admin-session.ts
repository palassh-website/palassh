/**
 * Name of the admin session cookie.
 *
 * Kept in its own tiny module (no imports) so the proxy, the login route and the
 * admin auth helper can all share one value without importing from a route file.
 */
export const ADMIN_SESSION_COOKIE = "palassh_admin_session";
