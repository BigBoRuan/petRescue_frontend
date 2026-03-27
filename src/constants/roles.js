/**
 * 与后端 UserConstant / 数据库约定一致的角色枚举（用于菜单与路由守卫）
 */
export const ROLE = {
  USER: 1,
  STAFF: 2,
  HOSPITAL_ADMIN: 3,
  SUPER_ADMIN: 4,
};

/** 员工登录后默认进入：救助上报与建档（不进入领养前台） */
export const STAFF_ENTRY_PATH = '/admin/rescue';

/** 下拉框、表格展示用 */
export const ROLE_LABEL = {
  [ROLE.USER]: '普通用户',
  [ROLE.STAFF]: '工作人员',
  [ROLE.HOSPITAL_ADMIN]: '医院管理员',
  [ROLE.SUPER_ADMIN]: '超级管理员',
};

export const HOSPITAL_STATUS = {
  WAIT: 0,
  PASS: 1,
  REFUSE: 2,
  CLOSE: 3,
};

export const HOSPITAL_STATUS_LABEL = {
  [HOSPITAL_STATUS.WAIT]: '待审核',
  [HOSPITAL_STATUS.PASS]: '已通过',
  [HOSPITAL_STATUS.REFUSE]: '已拒绝',
  [HOSPITAL_STATUS.CLOSE]: '已关闭',
};

export const USER_STATUS_LABEL = {
  0: '禁用',
  1: '正常',
};
