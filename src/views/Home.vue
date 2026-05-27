<template>
  <div class="fade-in">
    <van-nav-bar title="AI 供应商管理" :border="false" style="background:transparent;">
      <template #right>
        <van-icon name="replay" size="20" @click="testAll" />
      </template>
    </van-nav-bar>

    <div class="page-padding">
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
          <div class="stat-value">{{ avgLatency }}<small style="font-size:12px">ms</small></div>
          <div class="stat-label">平均延迟</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalModels }}</div>
          <div class="stat-label">模型数</div>
        </div>
      </div>

      <!-- 搜索 -->
      <van-search v-model="search" placeholder="搜索供应商..." shape="round" style="padding:0;margin-bottom:14px;" />

      <!-- 操作按钮 -->
      <div style="display:flex;gap:10px;margin-bottom:16px;">
        <van-button type="primary" block round size="small" @click="testAll">🔄 批量测试</van-button>
        <van-button plain type="primary" block round size="small" to="/add">➕ 添加</van-button>
      </div>

      <!-- 空状态 -->
      <van-empty v-if="filtered.length === 0" :description="suppliers.length ? '没有匹配结果' : '还没有供应商'" image="search">
        <van-button v-if="!suppliers.length" round type="primary" size="small" to="/add">添加第一个</van-button>
      </van-empty>

      <!-- 供应商列表 -->
      <van-cell-group v-else inset style="margin:0;border-radius:12px;overflow:hidden;">
        <van-cell
          v-for="s in filtered" :key="s.id"
          :title="s.name"
          :label="`${s.models.length} 模型 · ${s.latency ? s.latency + 'ms' : '未测试'}${s.contextLength ? ' · ' + formatCtx(s.contextLength) + '上下文' : ''}`"
          is-link
          :to="`/supplier/${s.id}`"
        >
          <template #icon>
            <div style="font-size:28px;margin-right:10px;display:flex;align-items:center;">{{ s.icon }}</div>
          </template>
          <template #value>
            <van-tag :type="tagType(s.status)" round size="small">{{ statusText(s.status) }}</van-tag>
          </template>
        </van-cell>
      </van-cell-group>
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

function tagType(s: string) { return s === 'online' ? 'success' : s === 'testing' ? 'warning' : 'danger' }
function statusText(s: string) { return s === 'online' ? '在线' : s === 'testing' ? '测试中' : '离线' }
function formatCtx(n: number) { return n >= 1000 ? (n / 1000) + 'M' : n + 'K' }
</script>
