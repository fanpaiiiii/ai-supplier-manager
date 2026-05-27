<template>
  <div class="fade-in">
    <div style="padding:16px 16px 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div>
          <div style="font-size:24px;font-weight:800;letter-spacing:-0.5px;">供应商管理</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">AI Model Supplier Hub</div>
        </div>
        <div class="neu-flat" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:14px;" @click="testAll">
          <van-icon name="replay" size="22" color="var(--primary)" />
        </div>
      </div>

      <!-- 统计 -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ onlineCount }}</div>
          <div class="stat-label">在线</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ offlineCount }}</div>
          <div class="stat-label">离线</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ avgLatency }}<small style="font-size:14px">ms</small></div>
          <div class="stat-label">延迟</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalModels }}</div>
          <div class="stat-label">模型</div>
        </div>
      </div>

      <!-- 搜索 -->
      <div class="neu-inset" style="border-radius:14px;padding:4px;margin-bottom:16px;">
        <van-search v-model="search" placeholder="搜索供应商..." shape="round" :show-action="false" />
      </div>
    </div>

    <div class="page-padding">
      <!-- 操作 -->
      <div style="display:flex;gap:12px;margin-bottom:18px;">
        <button class="neu-btn neu-btn-primary" style="flex:1;" @click="testAll">
          <van-icon name="replay" style="margin-right:4px;" /> 批量测试
        </button>
        <button class="neu-btn" style="flex:1;" @click="$router.push('/add')">
          <van-icon name="plus" style="margin-right:4px;" /> 添加供应商
        </button>
      </div>

      <!-- 空状态 -->
      <div v-if="filtered.length === 0" class="neu-inset" style="text-align:center;padding:40px 20px;border-radius:20px;">
        <van-icon name="warning-o" size="48" color="var(--text-muted)" />
        <div style="font-size:15px;color:var(--text-secondary);margin-top:12px;">{{ suppliers.length ? '没有匹配结果' : '还没有供应商' }}</div>
        <button v-if="!suppliers.length" class="neu-btn neu-btn-primary" style="margin-top:16px;" @click="$router.push('/add')">添加第一个</button>
      </div>

      <!-- 列表 -->
      <div v-for="s in filtered" :key="s.id" class="neu-list-item" @click="$router.push(`/supplier/${s.id}`)">
        <div style="width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px;" class="neu-flat">
          {{ s.icon }}
        </div>
        <div style="flex:1;margin-left:14px;min-width:0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:16px;font-weight:700;">{{ s.name }}</span>
            <span class="neu-tag" :class="'neu-tag-' + (s.status === 'online' ? 'success' : s.status === 'testing' ? 'warning' : 'danger')">
              {{ s.status === 'online' ? '在线' : s.status === 'testing' ? '测试中' : '离线' }}
            </span>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
            {{ s.models.length }} 模型 · {{ s.latency ? s.latency + 'ms' : '未测试' }}{{ s.contextLength ? ' · ' + formatCtx(s.contextLength) + ' 上下文' : '' }}
          </div>
        </div>
        <van-icon name="arrow" color="var(--text-muted)" size="18" />
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

function formatCtx(n: number) { return n >= 1000 ? (n / 1000) + 'M' : n + 'K' }
</script>
