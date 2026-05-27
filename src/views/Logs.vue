<template>
  <div class="fade-in">
    <div style="padding:16px 16px 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
        <div style="font-size:24px;font-weight:800;">请求日志</div>
        <div v-if="logs.length" class="neu-flat" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:12px;cursor:pointer;" @click="confirmClear">
          <van-icon name="delete-o" size="20" color="var(--danger)" />
        </div>
      </div>
    </div>

    <div class="page-padding">
      <!-- 筛选 -->
      <div style="display:flex;gap:8px;margin-bottom:16px;overflow-x:auto;">
        <button v-for="f in filterOptions" :key="f.value" class="neu-btn" :class="{ 'neu-pressed': activeFilter === f.value }" style="padding:8px 14px;font-size:12px;white-space:nowrap;" @click="activeFilter = f.value">
          {{ f.label }} <span v-if="f.count" style="opacity:0.6;">({{ f.count }})</span>
        </button>
      </div>

      <div v-if="filtered.length === 0" class="neu-inset" style="text-align:center;padding:40px;border-radius:20px;">
        <van-icon name="notes-o" size="48" color="var(--text-muted)" />
        <div style="font-size:14px;color:var(--text-secondary);margin-top:10px;">暂无日志</div>
      </div>

      <div v-for="log in filtered" :key="log.id" class="neu-flat" style="padding:14px 16px;border-radius:14px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span class="neu-tag" :class="'neu-tag-' + logTagColor(log.type)">{{ logTagText(log.type) }}</span>
          <span style="font-size:14px;font-weight:600;">{{ log.supplier }}</span>
          <span style="flex:1;"></span>
          <span v-if="log.type === 'api_test'" class="neu-tag" :class="'neu-tag-' + (log.ok ? 'success' : 'danger')">{{ log.ok ? '&#10003;' : '&#10007;' }}</span>
        </div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">
          <div v-if="log.url" style="word-break:break-all;opacity:0.7;">{{ log.url }}</div>
          <div>{{ log.detail }}</div>
          <div style="display:flex;gap:14px;margin-top:4px;opacity:0.6;">
            <span v-if="log.status">HTTP {{ log.status }}</span>
            <span v-if="log.latency">{{ log.latency }}ms</span>
            <span style="margin-left:auto;">{{ formatTime(log.timestamp) }}</span>
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

function countByType(type: string) { return logs.value.filter(l => l.type === type).length }

const filterOptions = computed(() => [
  { value: 'all', label: '全部', count: logs.value.length },
  { value: 'api_test', label: 'API测试', count: countByType('api_test') },
  { value: 'supplier_add', label: '添加', count: countByType('supplier_add') },
  { value: 'supplier_delete', label: '删除', count: countByType('supplier_delete') },
])

const filtered = computed(() => activeFilter.value === 'all' ? logs.value : logs.value.filter(l => l.type === activeFilter.value))

function logTagColor(type: string) { return type === 'api_test' ? 'primary' : type === 'supplier_add' ? 'success' : type === 'supplier_delete' ? 'danger' : 'warning' }
function logTagText(type: string) { return type === 'api_test' ? '测试' : type === 'supplier_add' ? '添加' : type === 'supplier_delete' ? '删除' : '更新' }
function formatTime(ts: string) { const d = new Date(ts); const diff = Date.now() - d.getTime(); if (diff < 60000) return '刚刚'; if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'; if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'; return d.toLocaleDateString() }
function confirmClear() { showDialog({ title: '清空日志', message: '确定清空所有日志？' }).then(() => clearLogs()) }
</script>
