<template>
  <router-link
    :to="{ name: 'PetDetail', params: { id: String(pet.id) } }"
    class="pet-card"
  >
    <div class="pet-cover">
      <img v-if="cover" :src="cover" :alt="pet.petName" />
      <div v-else class="pet-cover-placeholder">暂无图片</div>
      <div class="pet-cover-meta">
        <span>{{ ageText(pet.age) }}</span>
        <span class="dot">·</span>
        <span>{{ pet.gender || '—' }}</span>
      </div>
      <span class="pet-chip">{{ pet.petType || '宠物' }}</span>
    </div>
    <div class="pet-body">
      <h3 class="pet-name">{{ pet.petName }}</h3>
      <p v-if="locLine" class="pet-location">{{ locLine }}</p>
      <p class="pet-sub">{{ pet.hospitalName || '合作医院' }}</p>
      <p class="pet-desc">{{ shortDesc(pet.characterDesc || pet.healthStatus) }}</p>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue';
import { petCoverUrl, ageText, petLocationLine, shortDesc } from '@/utils/petAdoptDisplay';

const props = defineProps({
  pet: { type: Object, required: true },
});

const cover = computed(() => petCoverUrl(props.pet));
const locLine = computed(() => petLocationLine(props.pet));
</script>

<style scoped>
.pet-card {
  text-decoration: none;
  color: inherit;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--bili-line);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: block;
}
.pet-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(251, 114, 153, 0.14);
}
.pet-cover {
  position: relative;
  aspect-ratio: 16 / 10;
  background: linear-gradient(160deg, #f5f7ff, #fff5f8);
}
.pet-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.pet-cover-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #aab;
}
.pet-cover-meta {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 28px 10px 8px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.65));
  display: flex;
  align-items: center;
  gap: 4px;
}
.pet-cover-meta .dot {
  opacity: 0.85;
}
.pet-chip {
  position: absolute;
  left: 8px;
  top: 8px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(251, 114, 153, 0.92);
  color: #fff;
  font-weight: 600;
}
.pet-body {
  padding: 12px 12px 14px;
}
.pet-name {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 700;
  color: var(--bili-text);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pet-location {
  margin: 0 0 4px;
  font-size: 12px;
  color: #5c6478;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pet-sub {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--bili-muted);
}
.pet-desc {
  margin: 0;
  font-size: 12px;
  color: #7a8194;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
