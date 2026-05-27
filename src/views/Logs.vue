<template>
  <div class="slide-up">
    <div class="page-header">
      <div style="flex:1;">
        <div class="page-header-title">请求日志</div>
        <div class="page-header-sub">API Request Logs</div>
      </div>
      <div v-if="logs.length" class="icon-btn" @click="confirmClear">
        <van-icon name="delete-o" size="18" color="var(--danger)" />
      </div>
    </div>

    <div class="page-pad">
      <div style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;">
        <button v-for="f in filterOptions" :key="f.value" class="btn btn-sm" :class="activeFilter === f.value ? 'btn-primary' : ''" @click="activeFilter = f.value" style="white-space:nowrap;">
          {{ f.label }} <span v-if="f.count" style="opacity:0.6;">({{ f.count }})</span>
        </button>
      </div>

      <div v-if="filtered.length === 0" class="empty-state">
        <div class="empty-icon">&#128203;</div>
        <div class="empty-text">暂无日志记录</div>
      </div>

      <div class="card" v-if="filtered.length > 0">
        <div v-for="log in filtered" :key="log.id" class="list-item" style="cursor:default;align-items:flex-start;">
          <div style="padding-top:2px;">
            <span class="tag" :class="'tag-' + logTagColor(log.type)">{{ logTagText(log.type) }}</span>
          </div>
          <div class="list-item-content">
            <div style="display:flex;align-items:center;gap:6px;">
              <span class="list-item-title" style="font-size:14px;">{{ log.supplier }}</span>
              <span v-if="log.type === 'api_test'" class="tag" :class="log.ok ? 'tag-success' : 'tag-danger'">{{ log.ok ? '&#10003;' : '&#10007;' }}</span>
            </div>
            <div class="list-item-desc" style="font-size:12px;">{{ log.detail }}</div>
            <div style="display:flex;gap:12px;margin-top:4px;font-size:11px;color:var(--text-3);">
              <span v-if="log.status">HTTP {{ log.status }}</span>
              <span v-if="log.latency">{{ log.latency }}ms</span>
              <span style="margin-left:auto;">{{ formatTime(log.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStore } from '../store'
import { showDialog } from 'vant'

const { logs, loadLogs, clearLogs } = useStore()
const activeFilter = ref('all')
onMounted(() => { loadLogs(200) })
function countByType(t: string) { return logs.value.filter(l => l.type === t).length }
const filterOptions = computed(() => [
  { value: 'all', label: '全部', count: logs.value.length },
  { value: 'api_test', label: 'API测试', count: countByType('api_test') },
  { value: 'supplier_add', label: '添加', count: countByType('supplier_add') },
  { value: 'supplier_delete', label: '删除', count: countByType('supplier_delete') },
])
const filtered = computed(() => activeFilter.value === 'all' ? logs.value : logs.value.filter(l => l.type === activeFilter.value))
function logTagColor(t: string) { return t === 'api_test' ? 'primary' : t === 'supplier_add' ? 'success' : t === 'supplier_delete' ? 'danger' : 'warning' }
function logTagText(t: string) { return t === 'api_test' ? '测试' : t === 'supplier_add' ? '添加' : t === 'supplier_delete' ? '删除' : '更新' }
function formatTime(ts: string) { const d = new Date(ts); const diff = Date.now() - d.getTime(); if (diff < 60000) return '刚刚'; if (diff < 3600000) return Math.floor(diff/60000) + '分钟前'; if (diff < 86400000) return Math.floor(diff/3600000) + '小时前'; return d.toLocaleDateString() }
function confirmClear() { showDialog({ title: '清空日志', message: '确定清空所有日志？' }).then(() => clearLogs()) }
</script>
