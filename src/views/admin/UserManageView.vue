<template>
  <div>
    <a-typography-title :heading="4" style="margin-top: 0">用户管理</a-typography-title>
    <a-typography-paragraph type="secondary">
      超级管理员可管理全站用户并重置任意账号密码；医院管理员可管理本院员工并为其重置密码。本人密码请在「个人资料」修改。
    </a-typography-paragraph>

    <a-card class="toolbar-card">
      <a-form :model="query" layout="inline" @submit="search">
        <a-form-item field="username" label="账号">
          <a-input v-model="query.username" allow-clear placeholder="模糊查询" style="width: 160px" />
        </a-form-item>
        <a-form-item v-if="isSuper" field="role" label="角色">
          <a-select
            v-model="query.role"
            allow-clear
            placeholder="全部"
            style="width: 140px"
            :options="roleOptions"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetQuery">重置</a-button>
          <a-button type="outline" style="margin-left: 8px" @click="openAdd">新增用户</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      :row-class="() => 'user-manage-row'"
      style="margin-top: 16px"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
      @row-click="onTableRowClick"
    >
      <template #role="{ record }">
        {{ ROLE_LABEL[record.role] || record.role }}
      </template>
      <template #status="{ record }">
        {{ USER_STATUS_LABEL[record.status] ?? record.status }}
      </template>
      <template #actions="{ record }">
        <div @click.stop>
          <a-space>
            <a-button type="text" size="small" @click="openEdit(record)">编辑</a-button>
            <a-popconfirm content="确认删除该用户？" @ok="removeRow(record)">
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </a-space>
        </div>
      </template>
    </a-table>

    <!-- 新增用户 -->
    <a-modal v-model:visible="addVisible" title="新增用户" @ok="submitAdd" @cancel="addVisible = false">
      <a-form :model="addForm" layout="vertical">
        <a-form-item
          label="登录账号"
          required
          :extra="`长度 ${USERNAME_MIN_LEN}～${USERNAME_MAX_LEN} 个字符，与前台登录规则一致`"
        >
          <a-input
            v-model="addForm.username"
            :max-length="USERNAME_MAX_LEN"
            allow-clear
            placeholder="至少 4 个字符"
          />
        </a-form-item>
        <a-form-item label="真实姓名">
          <a-input v-model="addForm.realName" />
        </a-form-item>
        <a-form-item label="手机">
          <a-input v-model="addForm.phone" />
        </a-form-item>
        <template v-if="isSuper">
          <a-form-item label="角色">
            <a-select v-model="addForm.role" :options="roleOptions" />
          </a-form-item>
          <a-form-item
            v-if="addForm.role === ROLE.STAFF || addForm.role === ROLE.HOSPITAL_ADMIN"
            label="所属医院 ID"
            required
          >
            <a-input-number
              v-model="addForm.hospitalId"
              :min="1"
              placeholder="工作人员 / 医院管理员必填"
              style="width: 100%"
            />
          </a-form-item>
        </template>
        <a-alert type="info">
          默认初始密码为 12345678。医院管理员新增的用户固定为本院工作人员。
        </a-alert>
      </a-form>
    </a-modal>

    <!-- 编辑用户 -->
    <a-modal v-model:visible="editVisible" title="编辑用户" width="520px" @ok="submitEdit" @cancel="editVisible = false">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="用户 ID">
          <a-input :model-value="String(editForm.id)" disabled />
        </a-form-item>
        <a-form-item
          label="登录账号"
          :extra="`长度 ${USERNAME_MIN_LEN}～${USERNAME_MAX_LEN} 个字符`"
        >
          <a-input v-model="editForm.username" :max-length="USERNAME_MAX_LEN" allow-clear />
        </a-form-item>
        <a-form-item label="新密码（留空则不修改）" :extra="passwordResetExtra">
          <a-input-password
            v-model="editForm.password"
            :max-length="PASSWORD_MAX_LEN"
            placeholder="可选"
          />
        </a-form-item>
        <a-form-item v-if="isSuper" label="角色">
          <a-select v-model="editForm.role" :options="roleOptions" />
        </a-form-item>
        <a-form-item v-if="isSuper" label="所属医院 ID">
          <a-input-number v-model="editForm.hospitalId" :min="0" placeholder="工作人员/医院管理员填写" />
        </a-form-item>
        <a-form-item label="弃养记录">
          <a-switch v-model="editForm.hasAbandonRecord" />
        </a-form-item>
        <a-form-item label="已领养数">
          <a-input-number v-model="editForm.adoptCount" :min="0" />
        </a-form-item>
        <a-form-item label="状态">
          <a-radio-group v-model="editForm.status">
            <a-radio :value="0">禁用</a-radio>
            <a-radio :value="1">正常</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import { useUserStore } from '@/stores/user';
import * as userApi from '@/api/userApi';
import { ROLE, ROLE_LABEL, USER_STATUS_LABEL } from '@/constants/roles';
import {
  USERNAME_MIN_LEN,
  USERNAME_MAX_LEN,
  PASSWORD_MIN_LEN,
  PASSWORD_MAX_LEN,
  validateUsernameForLogin,
  validatePasswordForLogin,
} from '@/constants/userValidation';

const userStore = useUserStore();
const isSuper = computed(() => userStore.user?.role === ROLE.SUPER_ADMIN);

const passwordResetExtra = computed(() => {
  const base = `若填写，长度 ${PASSWORD_MIN_LEN}～${PASSWORD_MAX_LEN} 个字符。`;
  if (isSuper.value) {
    return `${base}超级管理员可为任意用户重置登录密码。`;
  }
  return `${base}医院管理员可为本院员工重置密码。`;
});

const roleOptions = [
  { label: '普通用户', value: ROLE.USER },
  { label: '工作人员', value: ROLE.STAFF },
  { label: '医院管理员', value: ROLE.HOSPITAL_ADMIN },
  { label: '超级管理员', value: ROLE.SUPER_ADMIN },
];

const query = reactive({
  username: '',
  role: undefined,
  current: 1,
  pageSize: 10,
});

const loading = ref(false);
const tableData = ref([]);
const total = ref(0);

const pagination = computed(() => ({
  current: query.current,
  pageSize: query.pageSize,
  total: total.value,
  showTotal: true,
  showPageSize: true,
}));

const columns = [
  { title: 'ID', dataIndex: 'id', width: 88 },
  { title: '账号', dataIndex: 'username', width: 120 },
  { title: '姓名', dataIndex: 'realName', width: 100 },
  { title: '手机', dataIndex: 'phone', width: 120 },
  { title: '角色', slotName: 'role', width: 120 },
  { title: '医院ID', dataIndex: 'hospitalId', width: 88 },
  { title: '状态', slotName: 'status', width: 80 },
  { title: '操作', slotName: 'actions', width: 140, fixed: 'right' },
];

async function loadList() {
  loading.value = true;
  try {
    const body = {
      current: query.current,
      pageSize: query.pageSize,
      username: query.username || undefined,
      role: query.role,
    };
    const page = await userApi.listUserPage(body);
    tableData.value = page.records || [];
    total.value = page.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function search(e) {
  e?.preventDefault?.();
  query.current = 1;
  loadList();
}

function resetQuery() {
  query.username = '';
  query.role = undefined;
  query.current = 1;
  loadList();
}

function onPageChange(p) {
  query.current = p;
  loadList();
}

function onPageSizeChange(s) {
  query.pageSize = s;
  query.current = 1;
  loadList();
}

const addVisible = ref(false);
const addForm = reactive({
  username: '',
  realName: '',
  phone: '',
  role: ROLE.USER,
  hospitalId: undefined,
});

function openAdd() {
  Object.assign(addForm, {
    username: '',
    realName: '',
    phone: '',
    role: ROLE.USER,
    hospitalId: undefined,
  });
  addVisible.value = true;
}

async function submitAdd() {
  const nameErr = validateUsernameForLogin(addForm.username);
  if (nameErr) {
    Message.warning(nameErr);
    return;
  }
  if (
    isSuper.value &&
    (addForm.role === ROLE.STAFF || addForm.role === ROLE.HOSPITAL_ADMIN) &&
    (!addForm.hospitalId || addForm.hospitalId < 1)
  ) {
    Message.warning('工作人员或医院管理员需要填写所属医院 ID');
    return;
  }
  const payload = {
    username: addForm.username.trim(),
    realName: addForm.realName,
    phone: addForm.phone,
  };
  if (isSuper.value) {
    payload.role = addForm.role;
    if (addForm.role === ROLE.STAFF || addForm.role === ROLE.HOSPITAL_ADMIN) {
      payload.hospitalId = addForm.hospitalId;
    }
  }
  try {
    await userApi.addUser(payload);
    Message.success('已创建');
    addVisible.value = false;
    loadList();
  } catch (e) {
    Message.error(e?.message || '创建失败');
  }
}

const editVisible = ref(false);
const editForm = reactive({
  id: 0,
  username: '',
  password: '',
  role: ROLE.USER,
  hospitalId: undefined,
  hasAbandonRecord: false,
  adoptCount: 0,
  status: 1,
});

function onTableRowClick(record) {
  openEdit(record);
}

async function openEdit(record) {
  const full = await userApi.getUserById(record.id);
  editForm.id = full.id;
  editForm.username = full.username || '';
  editForm.password = '';
  editForm.role = full.role;
  editForm.hospitalId = full.hospitalId ?? undefined;
  editForm.hasAbandonRecord = !!full.hasAbandonRecord;
  editForm.adoptCount = full.adoptCount ?? 0;
  editForm.status = full.status ?? 1;
  editVisible.value = true;
}

async function submitEdit() {
  const nameErr = validateUsernameForLogin(editForm.username);
  if (nameErr) {
    Message.warning(nameErr);
    return;
  }
  if (editForm.password?.trim()) {
    const pwdErr = validatePasswordForLogin(editForm.password);
    if (pwdErr) {
      Message.warning(pwdErr);
      return;
    }
  }
  const payload = {
    id: editForm.id,
    username: editForm.username.trim(),
    role: editForm.role,
    hospitalId: editForm.hospitalId,
    hasAbandonRecord: editForm.hasAbandonRecord,
    adoptCount: editForm.adoptCount,
    status: editForm.status,
  };
  if (editForm.password?.trim()) {
    payload.password = editForm.password;
  }
  try {
    await userApi.updateUser(payload);
    Message.success('已更新');
    editVisible.value = false;
    loadList();
  } catch (e) {
    Message.error(e?.message || '更新失败');
  }
}

async function removeRow(record) {
  await userApi.deleteUser({ id: record.id });
  Message.success('已删除');
  loadList();
}

loadList();
</script>

<style scoped>
.toolbar-card {
  border-radius: 10px;
}
:deep(tr.user-manage-row) {
  cursor: pointer;
}
</style>
