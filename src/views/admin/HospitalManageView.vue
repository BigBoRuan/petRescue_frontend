<template>
  <div>
    <a-typography-title :heading="4" style="margin-top: 0">医院管理</a-typography-title>
    <a-typography-paragraph type="secondary">
      在此查看医院入驻信息、审核申请或关闭医院。
    </a-typography-paragraph>

    <a-card class="toolbar-card">
      <a-form :model="query" layout="inline" @submit="search">
        <a-form-item label="医院名称">
          <a-input v-model="query.hospitalName" allow-clear style="width: 160px" />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model="query.status"
            allow-clear
            placeholder="全部"
            style="width: 140px"
            :options="statusOptions"
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
      :row-class="() => 'hospital-manage-row'"
      style="margin-top: 16px"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
      @row-click="onTableRowClick"
    >
      <template #status="{ record }">
        {{ HOSPITAL_STATUS_LABEL[record.status] ?? record.status }}
      </template>
      <template #actions="{ record }">
        <div @click.stop>
          <a-space>
            <a-button type="text" size="small" @click="openDetail(record)">详情</a-button>
            <a-button
              v-if="record.status === HOSPITAL_STATUS.WAIT"
              type="text"
              size="small"
              @click="openAudit(record)"
            >
              审核
            </a-button>
            <a-popconfirm
              v-if="record.status === HOSPITAL_STATUS.PASS"
              content="关闭将删除该医院及其关联登录账号，确认？"
              @ok="closeRow(record)"
            >
              <a-button type="text" size="small" status="danger">关闭</a-button>
            </a-popconfirm>
            <a-button type="text" size="small" @click="goEdit(record)">维护资料</a-button>
          </a-space>
        </div>
      </template>
    </a-table>

    <a-modal v-model:visible="detailVisible" title="医院详情" :footer="false" width="720px">
      <a-descriptions v-if="detail" :column="1" bordered size="small">
        <a-descriptions-item label="ID">{{ detail.id }}</a-descriptions-item>
        <a-descriptions-item label="名称">{{ detail.hospitalName }}</a-descriptions-item>
        <a-descriptions-item label="地址">{{ detail.address }}</a-descriptions-item>
        <a-descriptions-item label="电话">{{ detail.phone }}</a-descriptions-item>
        <a-descriptions-item label="营业执照编号">{{ detail.licenseNo }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ HOSPITAL_STATUS_LABEL[detail.status] }}</a-descriptions-item>
        <a-descriptions-item label="简介">{{ detail.description }}</a-descriptions-item>
        <a-descriptions-item label="医院展示图">
          <div v-if="detailShowcaseUrls.length" class="detail-showcase-grid">
            <a-image
              v-for="(url, i) in detailShowcaseUrls"
              :key="i"
              class="detail-showcase-img"
              :src="publicFileUrl(url)"
              width="120"
            />
          </div>
          <span v-else class="detail-showcase-empty">暂无（可在「医院资料」中上传）</span>
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>

    <a-modal v-model:visible="auditVisible" title="审核医院入驻" @ok="submitAudit" @cancel="auditVisible = false">
      <p>医院：{{ auditTarget?.hospitalName }}</p>
      <a-radio-group v-model="auditPass">
        <a-radio :value="1">通过</a-radio>
        <a-radio :value="2">拒绝</a-radio>
      </a-radio-group>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import * as userApi from '@/api/userApi';
import { HOSPITAL_STATUS, HOSPITAL_STATUS_LABEL } from '@/constants/roles';
import { publicFileUrl } from '@/utils/publicAssetUrl';

const router = useRouter();

const statusOptions = Object.entries(HOSPITAL_STATUS_LABEL).map(([value, label]) => ({
  value: Number(value),
  label,
}));

const query = reactive({
  hospitalName: '',
  status: undefined,
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
  { title: 'ID', dataIndex: 'id', width: 72 },
  { title: '医院名称', dataIndex: 'hospitalName' },
  { title: '电话', dataIndex: 'phone', width: 120 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  { title: '操作', slotName: 'actions', width: 220, fixed: 'right' },
];

async function loadList() {
  loading.value = true;
  try {
    const page = await userApi.listHospitalPage({
      current: query.current,
      pageSize: query.pageSize,
      hospitalName: query.hospitalName || undefined,
      status: query.status,
    });
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
  query.hospitalName = '';
  query.status = undefined;
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

const detailVisible = ref(false);
const detail = ref(null);

const detailShowcaseUrls = computed(() => {
  const u = detail.value?.showcaseImageUrls;
  if (!Array.isArray(u)) return [];
  return u.map((x) => String(x).trim()).filter(Boolean);
});

function onTableRowClick(record) {
  openDetail(record);
}

async function openDetail(record) {
  detail.value = await userApi.getHospitalById(record.id);
  detailVisible.value = true;
}

const auditVisible = ref(false);
const auditTarget = ref(null);
const auditPass = ref(1);

function openAudit(record) {
  auditTarget.value = record;
  auditPass.value = 1;
  auditVisible.value = true;
}

async function submitAudit() {
  await userApi.auditHospital({
    id: auditTarget.value.id,
    pass: auditPass.value,
  });
  Message.success('审核已提交');
  auditVisible.value = false;
  loadList();
}

async function closeRow(record) {
  await userApi.closeHospital(record.id);
  Message.success('已关闭');
  loadList();
}

function goEdit(record) {
  router.push({ path: '/admin/hospital-setting', query: { id: String(record.id) } });
}

loadList();
</script>

<style scoped>
.toolbar-card {
  border-radius: 10px;
}
:deep(tr.hospital-manage-row) {
  cursor: pointer;
}
.detail-showcase-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 100%;
}
.detail-showcase-img {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-neutral-3);
}
.detail-showcase-img :deep(.arco-image-img) {
  height: 120px;
  object-fit: cover;
}
.detail-showcase-empty {
  color: var(--color-text-3);
  font-size: 13px;
}
</style>
