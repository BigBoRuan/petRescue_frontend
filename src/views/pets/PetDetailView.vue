<template>
  <div class="detail-page">
    <a-spin v-if="!hydrated" :loading="true" style="min-height: 200px; width: 100%" />
    <a-spin v-else-if="loggedIn && loading" :loading="true" style="min-height: 200px; width: 100%" />

    <template v-else-if="loggedIn && pet">
      <a-button type="text" class="back-link" @click="$router.push('/pets')">
        ← 返回列表
      </a-button>
      <div class="detail-layout">
        <div class="gallery">
          <div v-if="images.length" class="gallery-main">
            <img :src="images[activeImageIndex]" :alt="pet.petName" />
          </div>
          <div v-else class="gallery-placeholder">暂无图片</div>
          <div v-if="images.length > 1" class="gallery-thumbs" role="tablist" aria-label="宠物照片">
            <button
              v-for="(u, i) in images"
              :key="i"
              type="button"
              class="thumb-btn"
              :class="{ 'thumb-btn--active': i === activeImageIndex }"
              :aria-selected="i === activeImageIndex"
              :aria-label="`查看第 ${i + 1} 张`"
              @click="activeImageIndex = i"
            >
              <img :src="u" alt="" />
            </button>
          </div>
        </div>
        <div class="detail-panel">
          <h1 class="title">{{ pet.petName }}</h1>
          <p class="sub">{{ pet.petType }} · {{ pet.gender }} · {{ ageText(pet.age) }}</p>
          <a-tag class="bili-tag" size="small">{{ pet.hospitalName || '合作医院' }}</a-tag>
          <p v-if="petLocationLine" class="hospital-address">{{ petLocationLine }}</p>
          <section class="block">
            <h2>健康状况</h2>
            <p>{{ pet.healthStatus || '—' }}</p>
          </section>
          <section class="block">
            <h2>性格与故事</h2>
            <p>{{ pet.characterDesc || '—' }}</p>
          </section>

          <section v-if="showAdoptSection" class="block adopt-section">
            <h2>领养申请</h2>
            <p v-if="adoptTip" class="adopt-tip">{{ adoptTip }}</p>
            <a-button
              v-else
              type="primary"
              size="large"
              class="bili-primary adopt-btn"
              :loading="applySubmitting"
              @click="openApplyModal"
            >
              申请领养
            </a-button>
          </section>
        </div>
      </div>
    </template>

    <div v-else-if="loggedIn && !loading && !pet" class="empty-state">
      <p>未找到该宠物或已不可展示。</p>
      <a-button type="primary" class="bili-primary" @click="$router.push('/pets')">回列表</a-button>
    </div>

    <div v-else-if="hydrated" class="login-gate">
      <div class="gate-card">
        <div class="gate-illu">🐱</div>
        <h2>登录后查看完整档案</h2>
        <p>健康说明、性格描述与更多照片，登录账号后即可浏览。</p>
        <a-space>
          <a-button type="primary" class="bili-primary" @click="openLogin">立即登录</a-button>
          <a-button @click="$router.push('/pets')">先逛逛</a-button>
        </a-space>
      </div>
    </div>

    <!-- 独立于 v-if 链，避免打断 v-else-if；显示由 applyVisible 控制 -->
    <a-modal
      v-model:visible="applyVisible"
      title="填写领养申请"
      :ok-loading="applySubmitting"
      @ok="submitApply"
      @cancel="applyVisible = false"
    >
      <a-form :model="applyForm" layout="vertical" class="apply-form">
        <a-form-item label="您所在的地区" required>
          <HospitalRegionAddress v-model="applyForm.applicantRegion" :show-preview="true" />
        </a-form-item>
        <a-form-item label="是否有养宠经验">
          <a-radio-group v-model="applyForm.hasPetExperience">
            <a-radio :value="true">有</a-radio>
            <a-radio :value="false">无</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="居住类型" required>
          <a-input v-model="applyForm.housingType" placeholder="如：自有住房 / 租房" allow-clear />
        </a-form-item>
        <a-form-item label="家庭是否支持领养" required>
          <a-radio-group v-model="applyForm.familySupport">
            <a-radio :value="true">支持</a-radio>
            <a-radio :value="false">暂不支持</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="收入水平" required>
          <a-select
            v-model="applyForm.incomeLevel"
            placeholder="请选择"
            allow-clear
            :options="incomeOptions"
          />
        </a-form-item>
        <a-form-item label="申请说明" required>
          <a-textarea
            v-model="applyForm.description"
            placeholder="请简述领养动机与饲养计划"
            :max-length="800"
            show-word-limit
            :auto-size="{ minRows: 4 }"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { Message } from '@arco-design/web-vue';
import * as petApi from '@/api/petApi';
import * as adoptionApi from '@/api/adoptionApi';
import { publicFileUrl } from '@/utils/publicAssetUrl';
import { useUserStore } from '@/stores/user';
import { useUiStore } from '@/stores/ui';
import { ROLE } from '@/constants/roles';
import HospitalRegionAddress from '@/components/HospitalRegionAddress.vue';

const route = useRoute();
const userStore = useUserStore();
const uiStore = useUiStore();
const { user, hydrated } = storeToRefs(userStore);

const pet = ref(null);
const loading = ref(false);
/** 当前主图对应 images 下标，点击缩略图切换 */
const activeImageIndex = ref(0);

const loggedIn = computed(() => !!user.value);

const incomeOptions = [
  { label: '较低', value: '较低' },
  { label: '中等', value: '中等' },
  { label: '较高', value: '较高' },
];

/** 备注1：仅普通用户且宠物仍为「未领养」时展示申请入口（与后端角色校验一致） */
const showAdoptSection = computed(
  () =>
    loggedIn.value &&
    user.value?.role === ROLE.USER &&
    pet.value &&
    Number(pet.value.adoptStatus) === 0
);

const adoptTip = computed(() => {
  if (!loggedIn.value || user.value?.role !== ROLE.USER) return '';
  if (user.value?.hasAbandonRecord) return '您存在弃养记录，系统暂不允许提交领养申请。';
  const n = Number(user.value?.adoptCount) || 0;
  if (n >= 2) return '您已达到最多领养 2 只宠物的上限。';
  return '';
});

/** 优先展示救助上报的发现地点，否则展示医院地址 */
const petLocationLine = computed(() => {
  const p = pet.value;
  if (!p) return '';
  const d = (p.discoverLocation || '').trim();
  if (d) return `发现地点：${d}`;
  const h = (p.hospitalAddress || '').trim();
  if (h) return `收治地址：${h}`;
  return '';
});

const applyVisible = ref(false);
const applySubmitting = ref(false);
const applyForm = reactive({
  applicantRegion: '',
  hasPetExperience: false,
  housingType: '',
  familySupport: undefined,
  incomeLevel: '',
  description: '',
});

function openApplyModal() {
  if (adoptTip.value) {
    Message.warning(adoptTip.value);
    return;
  }
  applyForm.applicantRegion = '';
  applyForm.hasPetExperience = false;
  applyForm.housingType = '';
  applyForm.familySupport = undefined;
  applyForm.incomeLevel = '';
  applyForm.description = '';
  applyVisible.value = true;
}

async function submitApply() {
  if (!pet.value?.id) return;
  if (!applyForm.applicantRegion?.trim()) {
    Message.warning('请选择您所在的地区');
    return;
  }
  if (applyForm.familySupport === undefined) {
    Message.warning('请选择家庭是否支持领养');
    return;
  }
  if (!applyForm.housingType?.trim() || !applyForm.incomeLevel || !applyForm.description?.trim()) {
    Message.warning('请完整填写表单');
    return;
  }
  applySubmitting.value = true;
  try {
    await adoptionApi.adoptionApplySubmit({
      petId: pet.value.id,
      applicantRegion: applyForm.applicantRegion.trim(),
      hasPetExperience: applyForm.hasPetExperience,
      housingType: applyForm.housingType.trim(),
      familySupport: applyForm.familySupport,
      incomeLevel: applyForm.incomeLevel,
      description: applyForm.description.trim(),
    });
    Message.success('申请已提交，请等待医院管理员审核');
    applyVisible.value = false;
    await userStore.fetchLoginUser();
  } catch (e) {
    Message.error(e?.message || '提交失败');
  } finally {
    applySubmitting.value = false;
  }
}

const images = computed(() =>
  (pet.value?.imageUrls || [])
    .filter(Boolean)
    .map((u) => publicFileUrl(String(u).trim()))
);

watch(images, (arr) => {
  if (activeImageIndex.value >= arr.length) {
    activeImageIndex.value = Math.max(0, arr.length - 1);
  }
});

function ageText(age) {
  if (age == null || age === '') return '年龄未知';
  return `${age} 岁`;
}

function openLogin() {
  uiStore.openAuthModal({
    tab: 'login',
    onSuccess: () => loadPet(),
    onCancel: () => {
      if (!user.value) {
        // 保持在本页仅展示门槛；用户也可自行返回列表
      }
    },
  });
}

async function loadPet() {
  const idStr = route.params.id != null ? String(route.params.id).trim() : '';
  if (!/^\d+$/.test(idStr)) return;
  loading.value = true;
  pet.value = null;
  try {
    pet.value = await petApi.adoptGet(idStr);
    activeImageIndex.value = 0;
  } catch {
    pet.value = null;
  } finally {
    loading.value = false;
  }
}

async function tryEnter() {
  if (!hydrated.value) {
    await userStore.fetchLoginUser();
  }
  if (!user.value) {
    openLogin();
    return;
  }
  await loadPet();
}

onMounted(tryEnter);
watch(
  () => route.params.id,
  () => {
    if (user.value) loadPet();
  }
);
watch(user, (u) => {
  if (u && route.name === 'PetDetail') loadPet();
});
</script>

<style scoped>
.detail-page {
  min-height: 40vh;
}
.back-link {
  margin-bottom: 16px;
  color: var(--bili-muted);
  padding-left: 0;
}
.detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  align-items: start;
}
@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
.gallery-main {
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--bili-line);
  background: #f7f8fc;
}
.gallery-main img {
  width: 100%;
  display: block;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}
.gallery-placeholder {
  border-radius: 14px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #f0f3ff, #fff5f8);
  color: var(--bili-muted);
}
.gallery-thumbs {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.thumb-btn {
  padding: 0;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  background: none;
  line-height: 0;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}
.thumb-btn:hover {
  transform: translateY(-1px);
}
.thumb-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bili-pink-soft), 0 0 0 4px var(--bili-pink);
}
.thumb-btn--active {
  border-color: var(--bili-pink, #fb7299);
  box-shadow: 0 2px 8px rgba(251, 114, 153, 0.35);
}
.thumb-btn img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}
.detail-panel .title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 800;
}
.detail-panel .sub {
  margin: 0 0 12px;
  color: var(--bili-muted);
  font-size: 14px;
}
.hospital-address {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #5c6478;
}
.block {
  margin-top: 20px;
}
.block h2 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--bili-text);
}
.block p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
}
.empty-state {
  text-align: center;
  padding: 48px 16px;
  color: var(--bili-muted);
}
.login-gate {
  display: flex;
  justify-content: center;
  padding: 40px 16px;
}
.gate-card {
  max-width: 400px;
  text-align: center;
  padding: 36px 28px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid var(--bili-line);
  box-shadow: 0 8px 32px rgba(251, 114, 153, 0.1);
}
.gate-illu {
  font-size: 48px;
  margin-bottom: 12px;
}
.gate-card h2 {
  margin: 0 0 10px;
  font-size: 18px;
}
.gate-card p {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--bili-muted);
  line-height: 1.5;
}
.bili-primary {
  background: var(--bili-pink) !important;
  border-color: var(--bili-pink) !important;
}
.adopt-section .adopt-tip {
  margin: 0;
  font-size: 14px;
  color: #d4380d;
  line-height: 1.5;
}
.adopt-btn {
  margin-top: 4px;
}
.apply-form {
  max-height: 60vh;
  overflow: auto;
}
</style>
