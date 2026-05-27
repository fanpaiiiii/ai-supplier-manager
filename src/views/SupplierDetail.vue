<template>
  <div class="fade-in" v-if="supplier">
    <div class="page-header">
      <router-link to="/" class="back-btn">‹</router-link>
      <h1 class="page-title">{{ supplier.icon }} {{ supplier.name }}</h1>
    </div>

    <div class="card card-lg">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <span class="tag" :class="statusClass">{{ statusText }}</span>
        <button class="btn btn-sm btn-outline" @click="test" :disabled="testing">{{ testing ? '测试中...' : '🔄 测试' }}</button>
      </div>
      <div class="stats-grid" style="margin-bottom:0;">
        <div class="stat-card">
          <div class="stat-value">{{ supplier.latency }}<small style="font-size:11px">ms</small></div>
          <div class="stat-label">延迟</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ supplier.models.length }}</div>
          <div class="stat-label">模型数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatCtx(supplier.contextLength) }}</div>
          <div class="stat-label">上下文</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ uptime }}</div>
          <div class="stat-label">运行时间</div>
        </div>
      </div>
    </div>

    <div class="section-title">延迟趋势</div>
    <div class="card">
      <div class="chart-placeholder">
        <div style="text-align:center;">
          <div style="font-size:32px;margin-bottom:4px;">📈</div>
          <div>当前: {{ supplier.latency }}ms</div>
          <div class="progress-bar" style="width:200px;margin:8px auto 0;">
            <div class="progress-fill" :style="{ width: Math.min(supplier.latency / 50, 100) + '%', background: latencyColor }"></div>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);">{{ supplier.latency < 100 ? '优秀' : supplier.latency < 300 ? '良好' : '较慢' }}</div>
        </div>
      </div>
    </div>

    <div class="section-title">可用模型 ({{ supplier.models.length }})</div>
    <div class="card">
      <div v-if="supplier.models.length === 0" style="text-align:center;padding:20px;color:var(--text-secondary);">暂无模型信息，点击测试获取</div>
      <div v-for="model in supplier.models" :key="model" class="list-item">
        <div class="list-item-left">
          <div class="list-item-title" style="font-size:14px;font-weight:500;">{{ model }}</div>
        </div>
      </div>
    </div>

    <div class="section-title">连接信息</div>
    <div class="card">
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-sub">Base URL</div>
          <div class="list-item-title" style="font-size:14px;word-break:break-all;">{{ supplier.baseUrl }}</div>
        </div>
      </div>
      <div class="list-item">
        <div class="list-item-left" style="flex:1;">
          <div class="list-item-sub">API Key</div>
          <div class="list-item-title" style="font-size:14px;word-break:break-all;">{{ showKey ? supplier.apiKey : maskedKey }}</div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-outline" @click="showKey = !showKey" style="padding:6px 10px;">{{ showKey ? '🙈' : '👁️' }}</button>
          <button class="btn btn-sm btn-outline" @click="copyKey" style="padding:6px 10px;">{{ copied ? '✅' : '📋' }}</button>
        </div>
      </div>
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-sub">创建时间</div>
          <div class="list-item-title" style="font-size:14px;">{{ new Date(supplier.createdAt).toLocaleString() }}</div>
        </div>
      </div>
    </div>

    <div style="margin-top:16px;display:flex;gap:10px;">
      <button class="btn btn-outline btn-sm" style="flex:1" @click="editMode = !editMode">✏️ 编辑</button>
      <button class="btn btn-danger btn-sm" style="flex:1" @click="remove">🗑️ 删除</button>
    </div>

    <div v-if="editMode" class="card card-lg" style="margin-top:12px;">
      <div class="input-group">
        <label class="input-label">名称</label>
        <input class="input" v-model="editForm.name" />
      </div>
      <div class="input-group">
        <label class="input-label">Base URL</label>
        <input class="input" v-model="editForm.baseUrl" />
      </div>
      <div class="input-group">
        <label class="input-label">API Key</label>
        <input class="input" v-model="editForm.apiKey" />
      </div>
      <button class="btn btn-primary btn-full" @click="saveEdit">保存修改</button>
    </div>
  </div>

  <div v-else class="empty-state">
    <div class="empty-icon">❌</div>
    <div class="empty-text">供应商不存在</div>
    <router-link to="/" class="btn btn-primary btn-sm" style="margin-top:12px;text-decoration:none;">返回首页</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '../store'

const route = useRoute()
const router = useRouter()
const { getSupplier, testSupplier, removeSupplier, updateSupplier } = useStore()

const id = route.params.id as string
const supplier = computed(() => getSupplier(id))
const testing = ref(false)
const editMode = ref(false)
const showKey = ref(false)
const copied = ref(false)
const editForm = reactive({ name: '', baseUrl: '', apiKey: '' })

onMounted(() => {
  if (supplier.value) {
    editForm.name = supplier.value.name
    editForm.baseUrl = supplier.value.baseUrl
    editForm.apiKey = supplier.value.apiKey
  }
})

const statusClass = computed(() => supplier.value?.status === 'online' ? 'tag-success' : supplier.value?.status === 'testing' ? 'tag-warning' : 'tag-error')
const statusText = computed(() => supplier.value?.status === 'online' ? '✅ 在线' : supplier.value?.status === 'testing' ? '⏳ 测试中' : '❌ 离线')
const maskedKey = computed(() => { const k = supplier.value?.apiKey || ''; return k.length > 8 ? k.slice(0, 4) + '••••' + k.slice(-4) : '••••' })
const uptime = computed(() => { if (!supplier.value) return '-'; const h = Math.floor((Date.now() - supplier.value.createdAt) / 3600000); return h < 24 ? h + 'h' : Math.floor(h / 24) + 'd' })
const latencyColor = computed(() => { const l = supplier.value?.latency || 0; return l < 100 ? 'var(--success)' : l < 300 ? 'var(--warning)' : 'var(--error)' })

function formatCtx(n: number) { return n >= 1000 ? (n / 1000) + 'K' : n.toString() }
function copyKey() { if (supplier.value) { navigator.clipboard.writeText(supplier.value.apiKey); copied.value = true; setTimeout(() => { copied.value = false }, 1500) } }
function test() { testing.value = true; testSupplier(id); setTimeout(() => { testing.value = false }, 3000) }
function remove() { if (confirm('确定删除该供应商？')) { removeSupplier(id); router.push('/') } }
function saveEdit() { updateSupplier(id, { name: editForm.name, baseUrl: editForm.baseUrl, apiKey: editForm.apiKey }); editMode.value = false }
</script>
