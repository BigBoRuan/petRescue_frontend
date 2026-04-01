<template>
  <div>
    <a-typography-title :heading="4" style="margin-top: 0">救助与建档</a-typography-title>
    <a-typography-paragraph type="secondary">
      工作人员可上报发现信息；待处理记录可在此完成救助并建立宠物档案。
    </a-typography-paragraph>

    <a-space style="margin-bottom: 16px">
      <a-button type="primary" @click="openAdd">新增上报</a-button>
      <a-select
        v-model="listStatus"
        allow-clear
        placeholder="处理状态"
        style="width: 140px"
        :options="statusFilterOptions"
        @change="reload"
      />
    </a-space>

    <a-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      row-key="id"
      :row-class="() => 'rescue-report-row'"
      @page-change="onPageChange"
      @page-size-change="onPageSizeChange"
      @row-click="onTableRowClick"
    >
      <template #petStatus="{ record }">
        {{ record.petStatus === 1 ? '受伤' : record.petStatus === 2 ? '流浪' : record.petStatus }}
      </template>
      <template #status="{ record }">
        {{
          Number(record.status) === 0
            ? '待处理'
            : Number(record.status) === 1
              ? '已救助'
              : Number(record.status) === 2
                ? '已取消'
                : record.status
        }}
      </template>
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
      <template #discoverTime="{ record }">
        {{ formatTime(record.discoverTime) }}
      </template>
      <template #actions="{ record }">
        <div @click.stop>
          <a-space wrap>
            <a-button type="outline" size="small" @click="openDetail(record)">查看详情</a-button>
            <a-button
              v-if="Number(record.status) === 0"
              type="primary"
              class="bili-primary"
              size="small"
              @click="openComplete(record)"
            >
              完成救助并建档
            </a-button>
            <a-button
              v-if="Number(record.status) === 0"
              status="danger"
              type="outline"
              class="bili-outline-danger"
              size="small"
              @click="openCancel(record)"
            >
              取消救助/无需建档
            </a-button>
          </a-space>
        </div>
      </template>
    </a-table>

    <a-modal
      v-model:visible="cancelVisible"
      title="取消救助上报"
      width="520px"
      :ok-loading="cancelLoading"
      @ok="submitCancel"
      @cancel="cancelVisible = false"
    >
      <a-alert type="warning" style="margin-bottom: 12px">
        适用于：宠物已死亡 / 已被他人救助 / 误报等情况。取消后将不再建档。
      </a-alert>
      <a-form :model="cancelForm" layout="vertical">
        <a-form-item label="取消原因（选填）">
          <a-textarea
            v-model="cancelForm.reason"
            :max-length="2000"
            show-word-limit
            placeholder="例如：已死亡 / 已被他人救助 / 误报…"
            :auto-size="{ minRows: 3, maxRows: 8 }"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="addVisible" title="新增救助上报" width="600px" @ok="submitAdd">
      <a-form :model="addForm" layout="vertical">
        <a-form-item label="发现时间" required>
          <a-date-picker v-model="addForm.discoverTime" show-time style="width: 100%" />
        </a-form-item>
        <a-form-item field="discoverAddress" label="发现地点（省市区）" :rules="addressRules" required>
          <HospitalRegionAddress v-model="addForm.discoverAddress" />
        </a-form-item>
        <a-form-item label="详细位置" field="discoverDetail">
          <a-input
            v-model="addForm.discoverDetail"
            allow-clear
            placeholder="街道、门牌、地标等（选填，建议填写）"
          />
        </a-form-item>
        <a-form-item label="宠物状态" required>
          <a-select v-model="addForm.petStatus" :options="petStatusOptions" />
        </a-form-item>
        <a-form-item label="情况描述" required>
          <a-textarea v-model="addForm.description" :auto-size="{ minRows: 3, maxRows: 8 }" />
        </a-form-item>
        <a-form-item label="现场照片">
          <ImageUploaderMixed ref="addImagesUploader" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="completeVisible"
      title="完成救助并建立档案"
      width="640px"
      :ok-loading="completeLoading"
      @ok="submitComplete"
    >
      <a-form :model="completeForm" layout="vertical">
        <a-alert v-if="isSuper" type="warning" style="margin-bottom: 12px">
          超级管理员请选择归属医院
        </a-alert>
        <a-form-item v-if="isSuper" label="归属医院" required>
          <a-select
            v-model="completeForm.hospitalId"
            allow-search
            allow-clear
            placeholder="选择已通过审核的医院"
            :loading="hospitalLoading"
            :options="hospitalOptions"
          />
        </a-form-item>
        <a-form-item label="救助时间" required>
          <a-date-picker v-model="completeForm.rescueTime" show-time style="width: 100%" />
        </a-form-item>
        <a-form-item label="处理结果" required>
          <a-input v-model="completeForm.handleResult" allow-clear />
        </a-form-item>
        <a-form-item label="处理说明" required>
          <a-textarea v-model="completeForm.handleDescription" :auto-size="{ minRows: 2, maxRows: 6 }" />
        </a-form-item>
        <a-divider orientation="left">宠物档案</a-divider>
        <a-form-item label="宠物名称" required>
          <a-input v-model="completeForm.petName" allow-clear />
        </a-form-item>
        <a-form-item label="种类" required>
          <a-input v-model="completeForm.petType" allow-clear placeholder="如：猫、狗" />
        </a-form-item>
        <a-form-item label="性别" required>
          <a-select
            v-model="completeForm.gender"
            allow-clear
            placeholder="请选择"
            :options="PET_GENDER_OPTIONS"
          />
        </a-form-item>
        <a-form-item label="年龄" required>
          <a-select
            v-model="completeForm.age"
            allow-clear
            placeholder="请选择"
            :options="PET_AGE_OPTIONS"
          />
        </a-form-item>
        <a-form-item label="健康状况" required>
          <a-select
            v-model="completeForm.healthStatus"
            allow-clear
            placeholder="请选择"
            :options="PET_HEALTH_STATUS_OPTIONS"
          />
        </a-form-item>
        <a-form-item label="性格描述" required>
          <a-textarea v-model="completeForm.characterDesc" :auto-size="{ minRows: 2, maxRows: 6 }" />
        </a-form-item>
        <a-form-item label="展示图片">
          <ImageUploaderMixed
            ref="completeImagesUploader"
            hint="用于宠物档案展示：可本地上传或粘贴图片链接（每行一个），可留空。"
            :max-textarea-rows="5"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:visible="detailVisible"
      title="救助上报详情"
      width="760px"
      :footer="false"
      @close="detail = null"
    >
      <a-spin :loading="detailLoading">
        <div v-if="detail?.report" class="detail-body">
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="上报 ID">{{ detail.report.id }}</a-descriptions-item>
            <a-descriptions-item label="发现时间">{{ formatTime(detail.report.discoverTime) }}</a-descriptions-item>
            <a-descriptions-item label="发现地点">{{ detail.report.discoverLocation || '—' }}</a-descriptions-item>
            <a-descriptions-item label="宠物状态">
              {{ detail.report.petStatus === 1 ? '受伤' : detail.report.petStatus === 2 ? '流浪' : detail.report.petStatus }}
            </a-descriptions-item>
            <a-descriptions-item label="处理状态">
              {{
                Number(detail.report.status) === 0
                  ? '待处理'
                  : Number(detail.report.status) === 1
                    ? '已救助'
                    : Number(detail.report.status) === 2
                      ? '已取消'
                      : detail.report.status
              }}
            </a-descriptions-item>
            <a-descriptions-item v-if="Number(detail.report.status) === 2" label="取消原因">
              {{ detail.report.cancelReason || '—' }}
            </a-descriptions-item>
            <a-descriptions-item label="情况描述">{{ detail.report.description || '—' }}</a-descriptions-item>
          </a-descriptions>

          <div v-if="detail.reportImageUrls?.length" class="detail-gallery-block">
            <h4 class="detail-gallery-title">现场照片</h4>
            <div class="detail-gallery">
              <a-image
                v-for="(u, i) in detail.reportImageUrls"
                :key="'r' + i"
                :src="publicFileUrl(u)"
                width="120"
                class="detail-gallery-item"
              />
            </div>
          </div>

          <template v-if="detail.petProfile">
            <a-divider />
            <h4 class="detail-gallery-title">建档宠物</h4>
            <a-descriptions :column="1" bordered size="small">
              <a-descriptions-item label="宠物 ID">{{ detail.petProfile.id }}</a-descriptions-item>
              <a-descriptions-item label="名称">{{ detail.petProfile.petName }}</a-descriptions-item>
              <a-descriptions-item label="种类 / 性别">{{ detail.petProfile.petType }} · {{ detail.petProfile.gender }}</a-descriptions-item>
              <a-descriptions-item label="年龄">{{ detail.petProfile.age ?? '—' }}</a-descriptions-item>
              <a-descriptions-item label="健康">{{ detail.petProfile.healthStatus || '—' }}</a-descriptions-item>
              <a-descriptions-item label="性格">{{ detail.petProfile.characterDesc || '—' }}</a-descriptions-item>
            </a-descriptions>
            <div v-if="detail.petProfile.imageUrls?.length" class="detail-gallery-block">
              <h4 class="detail-gallery-title">档案展示图</h4>
              <p class="detail-gallery-hint">仅建档时绑定的宠物档案图，不含上方「现场照片」。</p>
              <div class="detail-gallery">
                <a-image
                  v-for="(u, i) in detail.petProfile.imageUrls"
                  :key="'p' + i"
                  :src="publicFileUrl(u)"
                  width="120"
                  class="detail-gallery-item"
                />
              </div>
            </div>
          </template>
        </div>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref } from 'vue';
import { Message } from '@arco-design/web-vue';
import * as petApi from '@/api/petApi';
import * as userApi from '@/api/userApi';
import HospitalRegionAddress from '@/components/HospitalRegionAddress.vue';
import ImageUploaderMixed from '@/components/ImageUploaderMixed.vue';
import { useUserStore } from '@/stores/user';
import { ROLE, HOSPITAL_STATUS } from '@/constants/roles';
import {
  PET_AGE_OPTIONS,
  PET_GENDER_OPTIONS,
  PET_HEALTH_STATUS_OPTIONS,
} from '@/constants/petProfileOptions';
import { publicFileUrl } from '@/utils/publicAssetUrl';

const userStore = useUserStore();
const isSuper = computed(() => userStore.user?.role === ROLE.SUPER_ADMIN);

const addressRules = [
  { required: true, message: '请选择省 / 市 / 区（县）' },
  {
    validator: (value, cb) => {
      if (!value || String(value).trim().length < 5) {
        cb('请完整选择地区');
      } else {
        cb();
      }
    },
  },
];

/** 后端 Jackson 对 java.util.Date 支持毫秒时间戳，避免 ISO 字符串与全局 date-format 冲突 */
function toEpochMs(d) {
  if (d == null) return null;
  const t = d instanceof Date ? d : new Date(d);
  const n = t.getTime();
  return Number.isNaN(n) ? null : n;
}

const statusFilterOptions = [
  { value: 0, label: '待处理' },
  { value: 1, label: '已救助' },
];

const petStatusOptions = [
  { value: 1, label: '受伤' },
  { value: 2, label: '流浪' },
];

const listStatus = ref(undefined);
const query = reactive({ current: 1, pageSize: 10 });
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
  { title: '发现时间', slotName: 'discoverTime', width: 168 },
  { title: '地点', dataIndex: 'discoverLocation', ellipsis: true, tooltip: true, minWidth: 160 },
  { title: '宠物状态', slotName: 'petStatus', width: 88 },
  { title: '处理状态', slotName: 'status', width: 96 },
  { title: '操作', slotName: 'actions', width: 340, fixed: 'right' },
];

const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref(null);

function onTableRowClick(record) {
  openDetail(record);
}

async function openDetail(record) {
  detail.value = null;
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await petApi.rescueReportDetail(record.id);
  } catch {
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

function formatTime(d) {
  if (!d) return '—';
  try {
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleString();
  } catch {
    return String(d);
  }
}

async function reload() {
  loading.value = true;
  try {
    const page = await petApi.rescueReportPage({
      current: query.current,
      pageSize: query.pageSize,
      status: listStatus.value,
    });
    tableData.value = page.records || [];
    total.value = page.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onPageChange(p) {
  query.current = p;
  reload();
}

function onPageSizeChange(s) {
  query.pageSize = s;
  query.current = 1;
  reload();
}

const addVisible = ref(false);
const addForm = reactive({
  discoverTime: undefined,
  discoverAddress: '',
  discoverDetail: '',
  petStatus: 2,
  description: '',
});

const addImagesUploader = ref(null);
const completeImagesUploader = ref(null);

const cancelVisible = ref(false);
const cancelLoading = ref(false);
let cancelTarget = null;
const cancelForm = reactive({ reason: '' });

async function openAdd() {
  addForm.discoverTime = new Date();
  addForm.discoverAddress = '';
  addForm.discoverDetail = '';
  addForm.petStatus = 2;
  addForm.description = '';
  addVisible.value = true;
  await nextTick();
  addImagesUploader.value?.reset();
}

async function submitAdd() {
  const region = (addForm.discoverAddress || '').trim();
  const detail = (addForm.discoverDetail || '').trim();
  const discoverLocation = [region, detail].filter(Boolean).join(' ').trim();
  if (!addForm.discoverTime || !region || region.length < 5 || !addForm.description?.trim()) {
    Message.warning('请填写完整上报信息（含省市区）');
    return false;
  }
  if (!discoverLocation) {
    Message.warning('请填写发现地点');
    return false;
  }
  try {
    await petApi.rescueReportAdd({
      discoverTime: toEpochMs(addForm.discoverTime),
      discoverLocation,
      petStatus: addForm.petStatus,
      description: addForm.description.trim(),
      imageUrls: addImagesUploader.value?.getMerged() ?? [],
    });
    Message.success('已提交上报');
    addVisible.value = false;
    reload();
    return true;
  } catch {
    return false;
  }
}

const completeVisible = ref(false);
const completeLoading = ref(false);
const completeTarget = ref(null);
const completeForm = reactive({
  reportId: undefined,
  hospitalId: undefined,
  rescueTime: undefined,
  handleResult: '',
  handleDescription: '',
  petName: '',
  petType: '',
  gender: undefined,
  age: undefined,
  healthStatus: undefined,
  characterDesc: '',
});
const hospitalLoading = ref(false);
const hospitalOptions = ref([]);

async function loadHospitals() {
  if (!isSuper.value) return;
  hospitalLoading.value = true;
  try {
    const page = await userApi.listHospitalPage({
      current: 1,
      pageSize: 200,
      status: HOSPITAL_STATUS.PASS,
    });
    const records = page.records || [];
    hospitalOptions.value = records.map((h) => ({
      value: h.id,
      label: h.hospitalName || `医院 #${h.id}`,
    }));
  } finally {
    hospitalLoading.value = false;
  }
}

async function openComplete(record) {
  completeTarget.value = record;
  completeForm.reportId = record.id;
  completeForm.hospitalId = isSuper.value ? undefined : userStore.user?.hospitalId;
  completeForm.rescueTime = new Date();
  completeForm.handleResult = '';
  completeForm.handleDescription = '';
  completeForm.petName = '';
  completeForm.petType = '';
  completeForm.gender = undefined;
  completeForm.age = undefined;
  completeForm.healthStatus = undefined;
  completeForm.characterDesc = '';
  completeVisible.value = true;
  if (isSuper.value) loadHospitals();
  await nextTick();
  completeImagesUploader.value?.reset();
}

function openCancel(record) {
  cancelTarget = record;
  cancelForm.reason = '';
  cancelVisible.value = true;
}

async function submitComplete() {
  if (
    !completeForm.rescueTime ||
    !completeForm.handleResult?.trim() ||
    !completeForm.handleDescription?.trim() ||
    !completeForm.petName?.trim() ||
    !completeForm.petType?.trim() ||
    !completeForm.gender?.trim() ||
    completeForm.age == null ||
    !completeForm.healthStatus?.trim() ||
    !completeForm.characterDesc?.trim()
  ) {
    Message.warning('请填写完整建档信息');
    return false;
  }
  if (isSuper.value && (!completeForm.hospitalId || completeForm.hospitalId <= 0)) {
    Message.warning('请选择归属医院');
    return false;
  }
  completeLoading.value = true;
  try {
    const body = {
      reportId: completeForm.reportId,
      rescueTime: toEpochMs(completeForm.rescueTime),
      handleResult: completeForm.handleResult.trim(),
      handleDescription: completeForm.handleDescription.trim(),
      petName: completeForm.petName.trim(),
      petType: completeForm.petType.trim(),
      gender: completeForm.gender.trim(),
      age: completeForm.age,
      healthStatus: completeForm.healthStatus.trim(),
      characterDesc: completeForm.characterDesc.trim(),
      imageUrls: completeImagesUploader.value?.getMerged() ?? [],
    };
    if (isSuper.value) {
      body.hospitalId = completeForm.hospitalId;
    }
    await petApi.rescueComplete(body);
    Message.success('已完成救助并建档');
    completeVisible.value = false;
    reload();
    return true;
  } catch {
    return false;
  } finally {
    completeLoading.value = false;
  }
}

async function submitCancel() {
  if (!cancelTarget?.id) return;
  cancelLoading.value = true;
  try {
    await petApi.rescueReportCancel({
      reportId: cancelTarget.id,
      cancelReason: (cancelForm.reason || '').trim() || undefined,
    });
    cancelVisible.value = false;
    Message.success('已取消该上报');
    reload();
  } catch (e) {
    Message.error(e?.message || '取消失败');
  } finally {
    cancelLoading.value = false;
  }
}

reload();
</script>

<style scoped>
.bili-primary {
  background: var(--bili-pink, #fb7299) !important;
  border-color: var(--bili-pink, #fb7299) !important;
  color: #fff !important;
}
.bili-primary:hover {
  background: #ff8fb3 !important;
  border-color: #ff8fb3 !important;
  color: #fff !important;
}
.bili-outline-danger {
  border-color: rgba(251, 114, 153, 0.55) !important;
  color: var(--bili-pink, #fb7299) !important;
  background: #fff !important;
}
.bili-outline-danger:hover {
  border-color: var(--bili-pink, #fb7299) !important;
  color: var(--bili-pink, #fb7299) !important;
  background: rgba(251, 114, 153, 0.08) !important;
}
.muted {
  color: var(--bili-muted, #999);
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
:deep(tr.rescue-report-row) {
  cursor: pointer;
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
</style>
