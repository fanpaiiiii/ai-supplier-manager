<template>
  <div class="fade-in">
    <van-nav-bar title="请求日志" :border="false" style="background:transparent;">
      <template #right>
        <van-icon name="delete-o" size="20" @click="confirmClear" v-if="logs.length" />
      </template>
    </van-nav-bar>

    <div class="page-padding">
      <!-- 筛选 -->
      <van-tabs v-model:active="activeFilter" type="card" style="margin-bottom:14px;">
        <van-tab title="全部" name="all" />
        <van-tab :title="`API测试(${countByType('api_test')})`" name="api_test" />
        <van-tab :title="`添加(${countByType('supplier_add')})`" name="supplier_add" />
        <van-tab :title="`删除(${countByType('supplier_delete')})`" name="supplier_delete" />
      </van-tabs>

      <van-empty v-if="filtered.length === 0" description="暂无日志记录" image="search" />

      <van-cell-group v-else inset style="border-radius:12px;overflow:hidden;">
        <van-cell v-for="log in filtered" :key="log.id" :title="log.supplier" :label="log.detail">
          <template #icon>
            <van-tag :type="logTagType(log.type)" style="margin-right:8px;">{{ logTagText(log.type) }}</van-tag>
          </template>
          <template #value>
            <div style="text-align:right;">
              <van-tag v-if="log.type === 'api_test'" :type="log.ok ? 'success' : 'danger'" round size="small" style="margin-bottom:4px;">{{ log.ok ? '成功' : '失败' }}</van-tag>
              <div style="font-size:11px;color:var(--text-secondary);">
                <span v-if="log.status">HTTP{{ log.status }}</span>
                <span v-if="log.latency"> · {{ log.latency }}ms</span>
                <div>{{ formatTime(log.timestamp) }}</div>
              </div>
            </div>
          </template>
        </van-cell>
      </van-cell-group>
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

const filtered = computed(() => {
  if (activeFilter.value === 'all') return logs.value
  return logs.value.filter(l => l.type === activeFilter.value)
})

function logTagType(type: string) {
  switch (type) {
    case 'api_test': return 'primary'
    case 'supplier_add': return 'success'
    case 'supplier_delete': return 'danger'
    case 'supplier_update': return 'warning'
    default: return 'primary'
  }
}

function logTagText(type: string) {
  switch (type) {
    case 'api_test': return '测试'
    case 'supplier_add': return '添加'
    case 'supplier_delete': return '删除'
    case 'supplier_update': return '更新'
    default: return type
  }
}

function formatTime(ts: string) {
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return d.toLocaleDateString()
}

function confirmClear() {
  showDialog({ title: '清空日志', message: '确定清空所有日志？' }).then(() => { clearLogs() })
}
</script>
