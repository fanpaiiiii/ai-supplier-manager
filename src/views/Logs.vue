<template>
  <div class="fade-in">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h1 class="page-title">📋 请求日志</h1>
      <button class="btn btn-sm btn-outline" @click="clearLogs" v-if="logs.length">🗑️ 清空</button>
    </div>

    <!-- 筛选 -->
    <div style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;">
      <button v-for="f in filters" :key="f.value" class="btn btn-sm" :class="activeFilter === f.value ? 'btn-primary' : 'btn-outline'" @click="activeFilter = f.value">
        {{ f.label }} <span v-if="f.count" style="opacity:0.7;">({{ f.count }})</span>
      </button>
    </div>

    <div v-if="filtered.length === 0" class="empty-state">
      <div class="empty-icon">📭</div>
      <div class="empty-text">暂无日志记录</div>
    </div>

    <div v-for="log in filtered" :key="log.id" class="card" style="padding:12px 14px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span class="tag" :class="logTypeClass(log.type)">{{ logTypeText(log.type) }}</span>
        <span style="font-size:13px;font-weight:600;">{{ log.supplier }}</span>
        <span style="flex:1;"></span>
        <span class="tag" :class="log.ok ? 'tag-success' : 'tag-error'" v-if="log.type === 'api_test'">
          {{ log.ok ? '成功' : '失败' }}
        </span>
      </div>
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">
        <div v-if="log.url" style="word-break:break-all;">URL: {{ log.url }}</div>
        <div>{{ log.detail }}</div>
        <div style="display:flex;gap:16px;margin-top:4px;">
          <span v-if="log.status">HTTP {{ log.status }}</span>
          <span v-if="log.latency">{{ log.latency }}ms</span>
          <span v-if="log.models">{{ log.models }} 模型</span>
          <span style="margin-left:auto;opacity:0.6;">{{ formatTime(log.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStore } from '../store'

const { logs, loadLogs, clearLogs: clearLogsApi } = useStore()
const activeFilter = ref('all')

onMounted(() => { loadLogs(200) })

const filters = computed(() => [
  { value: 'all', label: '全部', count: logs.value.length },
  { value: 'api_test', label: 'API测试', count: logs.value.filter(l => l.type === 'api_test').length },
  { value: 'supplier_add', label: '添加', count: logs.value.filter(l => l.type === 'supplier_add').length },
  { value: 'supplier_delete', label: '删除', count: logs.value.filter(l => l.type === 'supplier_delete').length },
])

const filtered = computed(() => {
  if (activeFilter.value === 'all') return logs.value
  return logs.value.filter(l => l.type === activeFilter.value)
})

function logTypeClass(type: string) {
  switch (type) {
    case 'api_test': return 'tag-info'
    case 'supplier_add': return 'tag-success'
    case 'supplier_delete': return 'tag-error'
    case 'supplier_update': return 'tag-warning'
    default: return 'tag-info'
  }
}

function logTypeText(type: string) {
  switch (type) {
    case 'api_test': return '🔗 测试'
    case 'supplier_add': return '➕ 添加'
    case 'supplier_delete': return '🗑️ 删除'
    case 'supplier_update': return '✏️ 更新'
    default: return type
  }
}

function formatTime(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString()
}

function clearLogs() {
  if (confirm('确定清空所有日志？')) clearLogsApi()
}
</script>
