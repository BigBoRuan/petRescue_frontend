<template>
  <div class="adoption-admin">
    <a-tabs v-model:active-key="tab" type="rounded">
      <a-tab-pane key="apply" title="领养申请审核">
        <a-table
          :columns="applyCols"
          :data="applyRows"
          :loading="applyLoading"
          :pagination="applyPagination"
          row-key="id"
          @page-change="onApplyPage"
          @page-size-change="onApplyPageSize"
        >
          <template #applyId="{ record }">
            <a-tooltip :content="String(record.id ?? '')">
              <span class="table-id-cell">{{ record.id }}</span>
            </a-tooltip>
          </template>
          <template #applyStatus="{ record }">
            <a-tag v-if="record.applyStatus === 'PENDING'" color="orange">待审核</a-tag>
            <a-tag v-else-if="record.applyStatus === 'APPROVED'" color="green">已通过</a-tag>
            <a-tag v-else-if="record.applyStatus === 'REJECTED'" color="red">已拒绝</a-tag>
            <a-tag v-else-if="record.applyStatus === 'CANCELLED'" color="gray">已撤销</a-tag>
            <a-tag v-else>{{ record.applyStatus }}</a-tag>
          </template>
          <template #actions="{ record }">
            <a-space v-if="record.applyStatus === 'PENDING'">
              <a-button type="primary" size="mini" class="bili-primary" @click="onApprove(record)">
                通过
              </a-button>
              <a-button size="mini" status="danger" @click="openReject(record)">拒绝</a-button>
            </a-space>
            <span v-else class="muted">—</span>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="record" title="领养记录与回访">
        <a-table
          :columns="recordCols"
          :data="recordRows"
          :loading="recordLoading"
          :pagination="recordPagination"
          row-key="recordId"
          @page-change="onRecordPage"
          @page-size-change="onRecordPageSize"
        >
          <template #recordIdCell="{ record }">
            <a-tooltip :content="String(record.recordId ?? '')">
              <span class="table-id-cell">{{ record.recordId }}</span>
            </a-tooltip>
          </template>
          <template #flow="{ record }">
            <a-tag v-if="record.adoptionFlowFinished" color="green">流程已结束</a-tag>
            <a-tag v-else class="bili-tag">回访进行中</a-tag>
          </template>
          <template #adoptTime="{ record }">
            {{ formatDateTime(record.adoptTime) }}
          </template>
          <template #visits="{ record }">
            <div class="visit-list">
              <div v-for="v in record.visits || []" :key="v.id" class="visit-row">
                <span>第 {{ v.visitCount }} 次</span>
                <span class="muted">{{ formatDateTime(v.visitTime) }}</span>
                <span :class="{ pending: v.pending }">{{ v.pending ? '待回访' : v.visitResult }}</span>
                <a-button
                  v-if="v.pending"
                  type="outline"
                  size="mini"
                  @click="openVisitModal(record, v)"
                >
                  填写回访
                </a-button>
              </div>
            </div>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="visit" title="回访记录查询">
        <a-card class="visit-toolbar" :bordered="false">
          <a-form :model="visitQuery" layout="inline" @submit="onVisitSearch">
            <a-form-item field="keyword" label="关键字">
              <a-input
                v-model="visitQuery.keyword"
                allow-clear
                placeholder="用户/宠物/医院"
                style="width: 220px"
              />
            </a-form-item>
            <a-form-item field="visitCount" label="次数">
              <a-select
                v-model="visitQuery.visitCount"
                allow-clear
                placeholder="全部"
                style="width: 120px"
                :options="visitCountOptions"
              />
            </a-form-item>
            <a-form-item field="pending" label="状态">
              <a-select
                v-model="visitQuery.pending"
                allow-clear
                placeholder="全部"
                style="width: 140px"
                :options="visitStatusOptions"
              />
            </a-form-item>
            <a-form-item field="range" label="回访时间">
              <a-range-picker v-model="visitQuery.range" show-time style="width: 320px" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" class="bili-primary" html-type="submit">查询</a-button>
              <a-button style="margin-left: 8px" @click="resetVisitQuery">重置</a-button>
            </a-form-item>
          </a-form>
        </a-card>

        <a-table
          :columns="visitCols"
          :data="visitRows"
          :loading="visitLoading"
          :pagination="visitPagination"
          row-key="visitId"
          style="margin-top: 12px"
          @page-change="onVisitPage"
          @page-size-change="onVisitPageSize"
        >
          <template #visitIdCell="{ record }">
            <a-tooltip :content="String(record.visitId ?? '')">
              <span class="table-id-cell">{{ record.visitId }}</span>
            </a-tooltip>
          </template>
          <template #recordIdCell2="{ record }">
            <a-tooltip :content="String(record.adoptionRecordId ?? '')">
              <span class="table-id-cell">{{ record.adoptionRecordId }}</span>
            </a-tooltip>
          </template>
          <template #visitStatus="{ record }">
            <a-tag v-if="record.pending" color="orange">待回访</a-tag>
            <a-tag v-else color="green">已完成</a-tag>
          </template>
          <template #visitTime="{ record }">
            {{ formatDateTime(record.visitTime) }}
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <a-modal v-model:visible="rejectVisible" title="拒绝原因" @ok="confirmReject">
      <a-textarea v-model="rejectReason" placeholder="请说明拒绝理由" allow-clear :max-length="500" show-word-limit />
    </a-modal>

    <a-modal v-model:visible="visitVisible" title="填写回访结果" @ok="confirmVisit">
      <a-form layout="vertical">
        <a-form-item label="回访时间">
          <a-date-picker v-model="visitForm.time" style="width: 100%" show-time />
        </a-form-item>
        <a-form-item label="回访结果">
          <a-textarea
            v-model="visitForm.result"
            placeholder="请填写本次回访情况"
            :max-length="2000"
            show-word-limit
            :auto-size="{ minRows: 4 }"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import * as adoptionApi from '@/api/adoptionApi';
import { formatDateTime as formatDateTimeUtil } from '@/utils/dateFormat';

function formatDateTime(value) {
  return formatDateTimeUtil(value);
}

const tab = ref('apply');

const applyLoading = ref(false);
const applyRows = ref([]);
const applyPagination = reactive({ current: 1, pageSize: 10, total: 0 });

const recordLoading = ref(false);
const recordRows = ref([]);
const recordPagination = reactive({ current: 1, pageSize: 10, total: 0 });

const visitLoading = ref(false);
const visitRows = ref([]);
const visitPagination = reactive({ current: 1, pageSize: 10, total: 0 });
const visitQuery = reactive({
  keyword: '',
  visitCount: undefined,
  pending: undefined,
  range: [],
});
const visitCountOptions = [
  { label: '第1次', value: 1 },
  { label: '第2次', value: 2 },
  { label: '第3次', value: 3 },
];
const visitStatusOptions = [
  { label: '待回访', value: true },
  { label: '已完成', value: false },
];

const applyCols = [
  { title: '申请ID', slotName: 'applyId', width: 148, minWidth: 148 },
  { title: '用户', dataIndex: 'username', width: 120 },
  { title: '宠物', dataIndex: 'petName', width: 120 },
  { title: '医院', dataIndex: 'hospitalName', ellipsis: true, tooltip: true },
  {
    title: '申请人地区',
    dataIndex: 'applicantRegion',
    width: 160,
    ellipsis: true,
    tooltip: true,
  },
  { title: '状态', slotName: 'applyStatus', width: 100 },
  { title: '申请说明', dataIndex: 'description', ellipsis: true, tooltip: true },
  { title: '操作', slotName: 'actions', width: 160, fixed: 'right' },
];

const recordCols = [
  { title: '记录ID', slotName: 'recordIdCell', width: 148, minWidth: 148 },
  { title: '领养人', dataIndex: 'username', width: 120 },
  { title: '宠物', dataIndex: 'petName', width: 120 },
  { title: '医院', dataIndex: 'hospitalName', ellipsis: true },
  { title: '领养时间', slotName: 'adoptTime', width: 178 },
  { title: '流程', slotName: 'flow', width: 120 },
  { title: '回访', slotName: 'visits', minWidth: 320 },
];

const visitCols = [
  { title: '回访ID', slotName: 'visitIdCell', width: 148, minWidth: 148 },
  { title: '记录ID', slotName: 'recordIdCell2', width: 148, minWidth: 148 },
  { title: '医院', dataIndex: 'hospitalName', ellipsis: true, tooltip: true },
  { title: '用户', dataIndex: 'username', width: 120 },
  { title: '宠物', dataIndex: 'petName', width: 120 },
  { title: '次数', dataIndex: 'visitCount', width: 80 },
  { title: '状态', slotName: 'visitStatus', width: 100 },
  { title: '回访时间', slotName: 'visitTime', width: 178 },
  { title: '回访结果', dataIndex: 'visitResult', ellipsis: true, tooltip: true, minWidth: 220 },
];

let rejectTarget = null;
const rejectVisible = ref(false);
const rejectReason = ref('');

const visitVisible = ref(false);
const visitForm = reactive({ time: null, result: '' });
let visitTarget = null;

async function loadApplies(page = 1) {
  applyLoading.value = true;
  try {
    const res = await adoptionApi.adoptionApplyAdminPage({
      current: page,
      pageSize: applyPagination.pageSize,
    });
    applyRows.value = res.records || [];
    applyPagination.total = Number(res.total) || 0;
    applyPagination.current = page;
  } catch (e) {
    Message.error(e?.message || '加载申请失败');
  } finally {
    applyLoading.value = false;
  }
}

async function loadRecords(page = 1) {
  recordLoading.value = true;
  try {
    const res = await adoptionApi.adoptionRecordAdminPage({
      current: page,
      pageSize: recordPagination.pageSize,
    });
    recordRows.value = res.records || [];
    recordPagination.total = Number(res.total) || 0;
    recordPagination.current = page;
  } catch (e) {
    Message.error(e?.message || '加载领养记录失败');
  } finally {
    recordLoading.value = false;
  }
}

async function loadVisits(page = 1) {
  visitLoading.value = true;
  try {
    const [begin, end] = Array.isArray(visitQuery.range) ? visitQuery.range : [];
    const body = {
      current: page,
      pageSize: visitPagination.pageSize,
      keyword: visitQuery.keyword?.trim() || undefined,
      visitCount: visitQuery.visitCount ?? undefined,
      pending: visitQuery.pending ?? undefined,
      beginTime: begin ? formatBackendDateTime(begin) : undefined,
      endTime: end ? formatBackendDateTime(end) : undefined,
    };
    const res = await adoptionApi.adoptionVisitAdminPage(body);
    visitRows.value = res.records || [];
    visitPagination.total = Number(res.total) || 0;
    visitPagination.current = page;
  } catch (e) {
    Message.error(e?.message || '加载回访记录失败');
  } finally {
    visitLoading.value = false;
  }
}

function onApplyPage(page) {
  loadApplies(page);
}

function onApplyPageSize(size) {
  applyPagination.pageSize = size;
  loadApplies(1);
}

function onRecordPage(page) {
  loadRecords(page);
}

function onRecordPageSize(size) {
  recordPagination.pageSize = size;
  loadRecords(1);
}

function onVisitPage(page) {
  loadVisits(page);
}

function onVisitPageSize(size) {
  visitPagination.pageSize = size;
  loadVisits(1);
}

function onVisitSearch(e) {
  e?.preventDefault?.();
  loadVisits(1);
}

function resetVisitQuery() {
  visitQuery.keyword = '';
  visitQuery.visitCount = undefined;
  visitQuery.pending = undefined;
  visitQuery.range = [];
  loadVisits(1);
}

function formatBackendDateTime(d) {
  const x = d instanceof Date ? d : new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())} ${p(x.getHours())}:${p(x.getMinutes())}:${p(x.getSeconds())}`;
}

async function onApprove(record) {
  try {
    await adoptionApi.adoptionApplyAudit({ applyId: record.id, approve: true });
    Message.success('已通过，已生成领养记录与回访计划');
    loadApplies(applyPagination.current);
    loadRecords(recordPagination.current);
  } catch (e) {
    Message.error(e?.message || '操作失败');
  }
}

function openReject(record) {
  rejectTarget = record;
  rejectReason.value = '';
  rejectVisible.value = true;
}

async function confirmReject() {
  if (!rejectReason.value?.trim()) {
    Message.warning('请填写拒绝原因');
    return;
  }
  try {
    await adoptionApi.adoptionApplyAudit({
      applyId: rejectTarget.id,
      approve: false,
      rejectReason: rejectReason.value.trim(),
    });
    Message.success('已拒绝该申请');
    rejectVisible.value = false;
    loadApplies(applyPagination.current);
  } catch (e) {
    Message.error(e?.message || '操作失败');
  }
}

function openVisitModal(record, v) {
  visitTarget = { record, visit: v };
  visitForm.time = new Date();
  visitForm.result = '';
  visitVisible.value = true;
}

async function confirmVisit() {
  if (!visitForm.result?.trim()) {
    Message.warning('请填写回访结果');
    return;
  }
  if (!visitForm.time) {
    Message.warning('请选择回访时间');
    return;
  }
  try {
    await adoptionApi.adoptionVisitComplete({
      visitId: visitTarget.visit.id,
      visitTime: formatBackendDateTime(visitForm.time),
      visitResult: visitForm.result.trim(),
    });
    Message.success('回访已保存');
    visitVisible.value = false;
    loadRecords(recordPagination.current);
  } catch (e) {
    Message.error(e?.message || '保存失败');
  }
}

onMounted(() => {
  loadApplies(1);
  loadRecords(1);
  loadVisits(1);
});
</script>

<style scoped>
.adoption-admin {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--bili-line, #e8e8ef);
}
.visit-toolbar {
  background: linear-gradient(180deg, rgba(251, 114, 153, 0.06), rgba(255, 255, 255, 0));
  border-radius: 12px;
  border: 1px solid var(--bili-line, #e8e8ef);
}
.muted {
  color: var(--bili-muted, #9499a0);
  font-size: 12px;
}
.visit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.visit-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  font-size: 13px;
}
.visit-row .pending {
  color: #ff7a45;
}
.bili-primary {
  background: var(--bili-pink, #fb7299) !important;
  border-color: var(--bili-pink, #fb7299) !important;
}
/* 长数字 ID（雪花等）单行省略，悬停看全量，避免换行撑高行高 */
.table-id-cell {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}
</style>
