<template>
  <div class="slide-up">
    <div class="page-header">
      <div style="flex:1;">
        <div class="page-header-title">供应商</div>
        <div class="page-header-sub">AI Model Suppliers</div>
      </div>
      <div class="icon-btn" @click="$router.push('/add')">
        <van-icon name="plus" size="20" color="var(--primary)" />
      </div>
    </div>

    <div class="page-pad">
      <!-- 统计 -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value stat-value-accent">{{ onlineCount }}</div>
          <div class="stat-label">在线</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--text-3);">{{ offlineCount }}</div>
          <div class="stat-label">离线</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ avgLatency }}<span style="font-size:14px;font-weight:600;color:var(--text-2);">ms</span></div>
          <div class="stat-label">平均延迟</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalModels }}</div>
          <div class="stat-label">模型总数</div>
        </div>
      </div>

      <!-- 搜索+操作 -->
      <van-search v-model="search" placeholder="搜索供应商..." shape="round" :show-action="false" style="padding:0;margin-bottom:14px;" />

      <div style="display:flex;gap:10px;margin-bottom:18px;">
        <button class="btn btn-primary btn-sm" style="flex:1;" @click="testAll">
          <van-icon name="replay" /> 批量测试
        </button>
      </div>

      <!-- 空状态 -->
      <div v-if="filtered.length === 0" class="empty-state">
        <div class="empty-icon">&#128269;</div>
        <div class="empty-text">{{ suppliers.length ? '没有匹配结果' : '还没有添加供应商' }}</div>
        <button v-if="!suppliers.length" class="btn btn-primary btn-sm" style="margin-top:14px;" @click="$router.push('/add')">添加第一个</button>
      </div>

      <!-- 列表 -->
      <div class="card" v-if="filtered.length > 0">
        <div v-for="(s, i) in filtered" :key="s.id" class="list-item" @click="$router.push(`/supplier/${s.id}`)">
          <div class="list-item-icon">{{ s.icon }}</div>
          <div class="list-item-content">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="list-item-title">{{ s.name }}</span>
              <span class="tag" :class="s.status === 'online' ? 'tag-success' : s.status === 'testing' ? 'tag-warning' : 'tag-danger'">
                {{ s.status === 'online' ? '在线' : s.status === 'testing' ? '测试中' : '离线' }}
              </span>
            </div>
            <div class="list-item-desc">
              {{ s.models.length }} 模型 · {{ s.latency ? s.latency + 'ms' : '未测试' }}{{ s.contextLength ? ' · ' + formatCtx(s.contextLength) : '' }}
            </div>
          </div>
          <van-icon name="arrow" color="var(--text-3)" size="16" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '../store'
const { suppliers, onlineCount, offlineCount, avgLatency, totalModels, testAll } = useStore()
const search = ref('')
const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return suppliers.value.filter(s => s.name.toLowerCase().includes(q) || s.baseUrl.toLowerCase().includes(q))
})
function formatCtx(n: number) { return n >= 1000 ? (n / 1000) + 'M上下文' : n + 'K上下文' }
</script>
