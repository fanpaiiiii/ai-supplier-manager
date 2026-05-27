<template>
  <div class="fade-in">
    <h1 class="page-title" style="margin-bottom:16px;">🤖 AI 供应商管理</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ onlineCount }}</div>
        <div class="stat-label">在线供应商</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ offlineCount }}</div>
        <div class="stat-label">离线供应商</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ avgLatency }}<small style="font-size:12px">ms</small></div>
        <div class="stat-label">平均延迟</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalModels }}</div>
        <div class="stat-label">可用模型</div>
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-bottom:16px;">
      <button class="btn btn-primary btn-sm" style="flex:1" @click="testAll">🔄 批量测试</button>
      <router-link to="/add" class="btn btn-outline btn-sm" style="flex:1;text-decoration:none;">➕ 添加供应商</router-link>
    </div>

    <div class="search-box">
      <span class="search-icon">🔍</span>
      <input class="input" v-model="search" placeholder="搜索供应商..." />
    </div>

    <div v-if="filtered.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <div class="empty-text">{{ suppliers.length ? '没有匹配的供应商' : '还没有添加供应商' }}</div>
      <router-link v-if="!suppliers.length" to="/add" class="btn btn-primary btn-sm" style="margin-top:12px;text-decoration:none;">添加第一个</router-link>
    </div>

    <router-link
      v-for="s in filtered" :key="s.id" :to="`/supplier/${s.id}`"
      class="card supplier-card" style="display:block;text-decoration:none;color:inherit;"
    >
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="supplier-icon">{{ s.icon }}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:16px;font-weight:700;">{{ s.name }}</span>
            <span class="tag" :class="statusClass(s.status)">{{ statusText(s.status) }}</span>
          </div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">
            {{ s.models.length }} 个模型 · {{ s.latency ? s.latency + 'ms' : '未测试' }}
            <span v-if="s.contextLength"> · {{ s.contextLength >= 1000 ? (s.contextLength/1000)+'M' : s.contextLength+'K' }}上下文</span>
          </div>
        </div>
        <span style="color:var(--text-secondary);font-size:18px;">›</span>
      </div>
    </router-link>
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

function statusClass(s: string) { return s === 'online' ? 'tag-success' : s === 'testing' ? 'tag-warning' : 'tag-error' }
function statusText(s: string) { return s === 'online' ? '在线' : s === 'testing' ? '测试中' : '离线' }
</script>

<style scoped>
.supplier-card { transition: transform 0.15s, box-shadow 0.15s; }
.supplier-card:active { transform: scale(0.98); box-shadow: var(--shadow-lg); }
.supplier-icon { font-size: 36px; width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: var(--bg); border-radius: 14px; flex-shrink: 0; }
</style>
