/** 与后端 UserConstant / UserServiceImpl 登录校验一致 */

export const USERNAME_MIN_LEN = 4;
export const USERNAME_MAX_LEN = 16;
export const PASSWORD_MIN_LEN = 8;
export const PASSWORD_MAX_LEN = 16;

export function validateUsernameForLogin(username) {
  const s = (username ?? '').trim();
  if (!s) return '请填写登录账号';
  if (s.length < USERNAME_MIN_LEN || s.length > USERNAME_MAX_LEN) {
    return `登录账号长度须为 ${USERNAME_MIN_LEN}～${USERNAME_MAX_LEN} 个字符，否则无法登录`;
  }
  return '';
}

export function validatePasswordForLogin(password) {
  const s = password ?? '';
  if (!s) return '请填写密码';
  if (s.length < PASSWORD_MIN_LEN || s.length > PASSWORD_MAX_LEN) {
    return `密码长度须为 ${PASSWORD_MIN_LEN}～${PASSWORD_MAX_LEN} 个字符`;
  }
  return '';
}
