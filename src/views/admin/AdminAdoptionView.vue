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
          <template #visits="{ record }">
            <div class="visit-list">
              <div v-for="v in record.visits || []" :key="v.id" class="visit-row">
                <span>第 {{ v.visitCount }} 次</span>
                <span class="muted">{{ formatDate(v.visitTime) }}</span>
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

const tab = ref('apply');

const applyLoading = ref(false);
const applyRows = ref([]);
const applyPagination = reactive({ current: 1, pageSize: 10, total: 0 });

const recordLoading = ref(false);
const recordRows = ref([]);
const recordPagination = reactive({ current: 1, pageSize: 10, total: 0 });

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
  { title: '领养时间', dataIndex: 'adoptTime', width: 170 },
  { title: '流程', slotName: 'flow', width: 120 },
  { title: '回访', slotName: 'visits', minWidth: 320 },
];

let rejectTarget = null;
const rejectVisible = ref(false);
const rejectReason = ref('');

const visitVisible = ref(false);
const visitForm = reactive({ time: null, result: '' });
let visitTarget = null;

function formatDate(d) {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return String(d);
  return x.toLocaleString();
}

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
});
</script>

<style scoped>
.adoption-admin {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
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
