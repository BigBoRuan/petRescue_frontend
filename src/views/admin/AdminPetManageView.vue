<template>
  <div>
    <a-typography-title :heading="4" style="margin-top: 0">宠物档案</a-typography-title>
    <a-card class="toolbar-card">
      <a-form :model="query" layout="inline" @submit="search">
        <a-form-item label="名称">
          <a-input v-model="query.petName" allow-clear style="width: 160px" />
        </a-form-item>
        <a-form-item label="领养状态">
          <a-select
            v-model="query.adoptStatus"
            allow-clear
            placeholder="全部"
            style="width: 140px"
            :options="adoptOptions"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetQuery">重置</a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <a-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      :row-class="() => 'pet-archive-row'"
      style="margin-top: 16px"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
      @row-click="onRowClick"
    >
      <template #thumb="{ record }">
        <div class="cell-thumb">
          <img
            v-if="record.thumbUrl"
            :src="publicFileUrl(record.thumbUrl)"
            alt=""
            class="cell-thumb-img"
          />
          <span v-else class="cell-thumb-ph">—</span>
        </div>
      </template>
      <template #adoptStatus="{ record }">
        {{ record.adoptStatus === 1 ? '已领养' : '未领养' }}
      </template>
      <template #actions="{ record }">
        <div @click.stop>
          <a-space>
            <a-button type="text" size="small" @click="openEdit(record)">编辑</a-button>
            <a-popconfirm content="确认删除该档案？" @ok="removeRow(record)">
              <a-button type="text" size="small" status="danger">删除</a-button>
            </a-popconfirm>
          </a-space>
        </div>
      </template>
    </a-table>

    <a-modal
      v-model:visible="detailVisible"
      title="档案详情"
      width="640px"
      :footer="false"
      @close="detailPet = null"
    >
      <a-spin :loading="detailLoading" style="width: 100%">
        <div v-if="detailPet" class="detail-body">
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="档案 ID">{{ detailPet.id }}</a-descriptions-item>
            <a-descriptions-item label="上报 ID">{{ detailPet.rescueReportId ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="归属医院">{{ detailPet.hospitalName || '—' }}</a-descriptions-item>
            <a-descriptions-item label="医院 ID">{{ detailPet.hospitalId ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="名称">{{ detailPet.petName || '—' }}</a-descriptions-item>
            <a-descriptions-item label="种类 / 性别">
              {{ detailPet.petType || '—' }} · {{ detailPet.gender || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="年龄">{{ detailPet.age ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="领养状态">
              {{ detailPet.adoptStatus === 1 ? '已领养' : '未领养' }}
            </a-descriptions-item>
            <a-descriptions-item label="健康状况">{{ detailPet.healthStatus || '—' }}</a-descriptions-item>
            <a-descriptions-item label="性格描述">{{ detailPet.characterDesc || '—' }}</a-descriptions-item>
          </a-descriptions>
          <div v-if="detailPet.imageUrls?.length" class="detail-gallery-block">
            <h4 class="detail-gallery-title">档案展示图</h4>
            <p class="detail-gallery-hint">仅建档时上传的宠物档案图，不含救助上报现场照片。</p>
            <div class="detail-gallery">
              <a-image
                v-for="(u, i) in detailPet.imageUrls"
                :key="i"
                :src="publicFileUrl(u)"
                width="120"
                class="detail-gallery-item"
              />
            </div>
          </div>
        </div>
      </a-spin>
    </a-modal>

    <a-modal v-model:visible="editVisible" title="编辑宠物档案" width="560px" @ok="submitEdit">
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="名称">
          <a-input v-model="editForm.petName" allow-clear />
        </a-form-item>
        <a-form-item label="种类">
          <a-input v-model="editForm.petType" allow-clear />
        </a-form-item>
        <a-form-item label="性别">
          <a-select
            v-model="editForm.gender"
            allow-clear
            placeholder="请选择"
            :options="editGenderOptions"
          />
        </a-form-item>
        <a-form-item label="年龄">
          <a-select
            v-model="editForm.age"
            allow-clear
            placeholder="请选择"
            :options="editAgeOptions"
          />
        </a-form-item>
        <a-form-item label="健康状况">
          <a-select
            v-model="editForm.healthStatus"
            allow-clear
            placeholder="请选择"
            :options="editHealthOptions"
          />
        </a-form-item>
        <a-form-item label="性格描述">
          <a-textarea v-model="editForm.characterDesc" :auto-size="{ minRows: 2, maxRows: 8 }" />
        </a-form-item>
        <a-form-item label="领养状态">
          <a-select v-model="editForm.adoptStatus" :options="adoptOptions" />
        </a-form-item>
        <a-form-item v-if="isSuper" label="归属医院 ID">
          <a-input v-model="editForm.hospitalIdStr" allow-clear placeholder="仅超管可调整（长 ID 请完整粘贴）" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import {
  PET_AGE_OPTIONS,
  PET_GENDER_OPTIONS,
  PET_HEALTH_STATUS_OPTIONS,
  mergeLegacyAgeOption,
  mergeLegacyStringOption,
} from '@/constants/petProfileOptions';
import { Message } from '@arco-design/web-vue';
import * as petApi from '@/api/petApi';
import { useUserStore } from '@/stores/user';
import { ROLE } from '@/constants/roles';
import { publicFileUrl } from '@/utils/publicAssetUrl';

const userStore = useUserStore();
const isSuper = computed(() => userStore.user?.role === ROLE.SUPER_ADMIN);

const adoptOptions = [
  { value: 0, label: '未领养' },
  { value: 1, label: '已领养' },
];

const query = reactive({
  petName: '',
  adoptStatus: undefined,
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
  { title: '图片', slotName: 'thumb', width: 76 },
  {
    title: 'ID',
    dataIndex: 'id',
    width: 148,
    ellipsis: true,
    tooltip: true,
    bodyCellStyle: () => ({ whiteSpace: 'nowrap' }),
  },
  { title: '名称', dataIndex: 'petName', ellipsis: true, tooltip: true, minWidth: 100 },
  { title: '种类', dataIndex: 'petType', width: 90 },
  { title: '性别', dataIndex: 'gender', width: 72 },
  { title: '年龄', dataIndex: 'age', width: 72 },
  {
    title: '医院ID',
    dataIndex: 'hospitalId',
    width: 120,
    ellipsis: true,
    tooltip: true,
    bodyCellStyle: () => ({ whiteSpace: 'nowrap' }),
  },
  { title: '领养状态', slotName: 'adoptStatus', width: 100 },
  { title: '操作', slotName: 'actions', width: 160, fixed: 'right' },
];

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailPet = ref(null);

function onRowClick(record) {
  openDetail(record);
}

async function openDetail(record) {
  detailPet.value = null;
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detailPet.value = await petApi.petInfoGet(record.id);
  } catch {
    detailPet.value = null;
    Message.error('加载详情失败');
  } finally {
    detailLoading.value = false;
  }
}

async function fetchList() {
  loading.value = true;
  try {
    const body = {
      current: query.current,
      pageSize: query.pageSize,
      petName: query.petName?.trim() || undefined,
      adoptStatus: query.adoptStatus,
    };
    const page = await petApi.petInfoPage(body);
    tableData.value = page.records || [];
    total.value = page.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  query.current = 1;
  fetchList();
}

function resetQuery() {
  query.petName = '';
  query.adoptStatus = undefined;
  query.current = 1;
  fetchList();
}

function onPageChange(p) {
  query.current = p;
  fetchList();
}

function onPageSizeChange(s) {
  query.pageSize = s;
  query.current = 1;
  fetchList();
}

const editVisible = ref(false);
const editForm = reactive({
  id: undefined,
  petName: '',
  petType: '',
  gender: '',
  age: undefined,
  healthStatus: '',
  characterDesc: '',
  adoptStatus: 0,
  hospitalIdStr: '',
});

const editGenderOptions = computed(() => mergeLegacyStringOption(editForm.gender, PET_GENDER_OPTIONS));
const editAgeOptions = computed(() => mergeLegacyAgeOption(editForm.age));
const editHealthOptions = computed(() =>
  mergeLegacyStringOption(editForm.healthStatus, PET_HEALTH_STATUS_OPTIONS)
);

async function openEdit(row) {
  editVisible.value = true;
  try {
    const vo = await petApi.petInfoGet(row.id);
    editForm.id = vo.id;
    editForm.petName = vo.petName || '';
    editForm.petType = vo.petType || '';
    editForm.gender = vo.gender || '';
    editForm.age = vo.age;
    editForm.healthStatus = vo.healthStatus || '';
    editForm.characterDesc = vo.characterDesc || '';
    editForm.adoptStatus = vo.adoptStatus ?? 0;
    editForm.hospitalIdStr =
      vo.hospitalId != null && vo.hospitalId !== '' ? String(vo.hospitalId) : '';
  } catch {
    editForm.id = row.id;
    editForm.petName = row.petName || '';
    editForm.petType = row.petType || '';
    editForm.gender = row.gender || '';
    editForm.age = row.age;
    editForm.healthStatus = row.healthStatus || '';
    editForm.characterDesc = row.characterDesc || '';
    editForm.adoptStatus = row.adoptStatus ?? 0;
    editForm.hospitalIdStr =
      row.hospitalId != null && row.hospitalId !== '' ? String(row.hospitalId) : '';
  }
}

async function submitEdit() {
  if (editForm.id == null || editForm.id === '') return false;
  try {
    const body = {
      id: editForm.id,
      petName: editForm.petName,
      petType: editForm.petType,
      gender: editForm.gender,
      age: editForm.age,
      healthStatus: editForm.healthStatus,
      characterDesc: editForm.characterDesc,
      adoptStatus: editForm.adoptStatus,
    };
    if (isSuper.value && editForm.hospitalIdStr?.trim()) {
      const hid = editForm.hospitalIdStr.trim();
      if (!/^\d+$/.test(hid)) {
        Message.warning('归属医院 ID 须为数字');
        return false;
      }
      body.hospitalId = hid;
    }
    await petApi.petInfoUpdate(body);
    Message.success('已保存');
    editVisible.value = false;
    fetchList();
    return true;
  } catch {
    return false;
  }
}

async function removeRow(row) {
  await petApi.petInfoDelete({ id: row.id });
  Message.success('已删除');
  fetchList();
}

fetchList();
</script>

<style scoped>
.toolbar-card {
  border-radius: 10px;
}
.cell-thumb {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-neutral-3);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-fill-2);
}
.cell-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cell-thumb-ph {
  font-size: 12px;
  color: var(--color-text-3);
}
.detail-body {
  padding-top: 4px;
}
.detail-gallery-block {
  margin-top: 16px;
}
.detail-gallery-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
}
.detail-gallery-hint {
  margin: -4px 0 10px;
  font-size: 12px;
  color: var(--color-text-3);
}
.detail-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.detail-gallery-item {
  border-radius: 8px;
  overflow: hidden;
}

:deep(tr.pet-archive-row) {
  cursor: pointer;
}
</style>
