import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { ROLE, STAFF_ENTRY_PATH } from '@/constants/roles';

function isPublicAdoptPetPath(path) {
  if (path === '/pets') return true;
  if (path.startsWith('/pets/')) {
    const parts = path.split('/').filter(Boolean);
    return parts.length === 2 && parts[0] === 'pets';
  }
  return false;
}

const routes = [
  { path: '/home', redirect: '/pets' },
  {
    path: '/login',
    redirect: (to) => ({ path: '/pets', query: { ...to.query, auth: 'login' } }),
  },
  {
    path: '/register',
    redirect: (to) => ({ path: '/pets', query: { ...to.query, auth: 'register' } }),
  },
  {
    path: '/',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      { path: '', redirect: '/pets' },
      {
        path: 'pets',
        name: 'PetAdoptList',
        component: () => import('@/views/pets/PetAdoptListView.vue'),
        meta: { title: '领养中心' },
      },
      {
        path: 'pets/:id',
        name: 'PetDetail',
        component: () => import('@/views/pets/PetDetailView.vue'),
        meta: { title: '宠物详情' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/user/ProfileView.vue'),
        meta: { title: '个人资料' },
      },
      {
        path: 'hospital/apply',
        name: 'HospitalApply',
        component: () => import('@/views/public/HospitalApplyView.vue'),
        meta: { title: '医院入驻申请' },
      },
      {
        path: 'hospital/status',
        name: 'HospitalApplyStatus',
        component: () => import('@/views/public/HospitalApplyStatusView.vue'),
        meta: { title: '查询入驻进度' },
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'AdminHome', component: () => import('@/views/admin/AdminDashboardView.vue'), meta: { title: '管理工作台' } },
      {
        path: 'rescue',
        name: 'AdminRescue',
        component: () => import('@/views/admin/AdminRescueView.vue'),
        meta: { title: '救助与建档', roles: [ROLE.STAFF, ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN] },
      },
      {
        path: 'pets',
        name: 'AdminPets',
        component: () => import('@/views/admin/AdminPetManageView.vue'),
        meta: { title: '宠物档案', roles: [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN] },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UserManageView.vue'),
        meta: { title: '用户管理', roles: [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN] },
      },
      {
        path: 'hospitals',
        name: 'AdminHospitals',
        component: () => import('@/views/admin/HospitalManageView.vue'),
        meta: { title: '医院管理', roles: [ROLE.SUPER_ADMIN] },
      },
      {
        path: 'hospital-setting',
        name: 'AdminHospitalSetting',
        component: () => import('@/views/hospital/HospitalSettingView.vue'),
        meta: { title: '医院资料维护', roles: [ROLE.HOSPITAL_ADMIN, ROLE.SUPER_ADMIN] },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/pets' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function lastRouteMeta(to, key) {
  const hit = [...to.matched].reverse().find((r) => r.meta[key] != null);
  return hit?.meta[key];
}

router.beforeEach(async (to) => {
  const userStore = useUserStore();
  document.title = to.meta.title ? `${to.meta.title} · 宠物救助领养` : '宠物救助领养';

  /** 已登录员工：禁止进入领养列表/详情与 /home */
  if (!to.path.startsWith('/admin')) {
    const blockStaff =
      isPublicAdoptPetPath(to.path) || to.path === '/home';
    if (blockStaff) {
      if (!userStore.hydrated) {
        await userStore.fetchLoginUser();
      }
      if (userStore.user?.role === ROLE.STAFF) {
        return { path: STAFF_ENTRY_PATH };
      }
    }
  }

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);
  if (requiresAuth) {
    if (!userStore.hydrated) {
      await userStore.fetchLoginUser();
    }
    if (!userStore.user) {
      return { path: '/pets', query: { auth: 'login', redirect: to.fullPath } };
    }
    if (to.path.startsWith('/admin') && userStore.user.role === ROLE.USER) {
      return { path: '/pets' };
    }
    /** 员工进入 /admin 根路径时直达救助登记，不展示管理工作台 */
    if (userStore.user.role === ROLE.STAFF && to.path === '/admin') {
      return { path: STAFF_ENTRY_PATH };
    }
    const needRoles = lastRouteMeta(to, 'roles');
    if (needRoles?.length && !needRoles.includes(userStore.user.role)) {
      return { path: '/admin' };
    }
  }

  return true;
});

export default router;
