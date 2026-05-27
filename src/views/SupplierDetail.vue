<template>
  <div class="slide-up" v-if="supplier">
    <div class="page-header">
      <div class="icon-btn" @click="$router.back()">
        <van-icon name="arrow-left" size="20" />
      </div>
      <div style="flex:1;">
        <div class="page-header-title">{{ supplier.icon }} {{ supplier.name }}</div>
        <span class="tag" :class="supplier.status === 'online' ? 'tag-success' : supplier.status === 'testing' ? 'tag-warning' : 'tag-danger'" style="margin-top:4px;">
          {{ supplier.status === 'online' ? '在线' : supplier.status === 'testing' ? '测试中' : '离线' }}
        </span>
      </div>
      <div class="icon-btn" @click="remove">
        <van-icon name="delete-o" size="18" color="var(--danger)" />
      </div>
    </div>

    <div class="page-pad">
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value stat-value-accent">{{ supplier.latency }}<span style="font-size:14px;font-weight:600;color:var(--text-2);">ms</span></div>
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

      <button class="btn btn-primary btn-full btn-sm" style="margin-bottom:18px;" @click="test" :disabled="testing">
        {{ testing ? '测试中...' : '测试连接' }}
      </button>

      <!-- 连接信息 -->
      <div class="section-title" style="margin-bottom:10px;">连接信息</div>
      <div class="card" style="margin-bottom:18px;">
        <div class="card-body">
          <div style="margin-bottom:14px;">
            <div class="input-label">Base URL</div>
            <div style="font-size:14px;word-break:break-all;">{{ supplier.baseUrl }}</div>
          </div>
          <div style="margin-bottom:14px;">
            <div class="input-label">API Key</div>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="font-size:14px;flex:1;font-family:monospace;word-break:break-all;">{{ showKey ? supplier.apiKey : maskedKey }}</div>
              <div class="icon-btn" style="width:32px;height:32px;" @click="showKey = !showKey">
                <van-icon :name="showKey ? 'eye-o' : 'closed-eye'" size="16" />
              </div>
              <div class="icon-btn" style="width:32px;height:32px;" @click="copyKey">
                <van-icon name="description" size="16" />
              </div>
            </div>
          </div>
          <div>
            <div class="input-label">创建时间</div>
            <div style="font-size:14px;">{{ new Date(supplier.createdAt).toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <!-- 模型列表 -->
      <div class="section-header">
        <span class="section-title">可用模型</span>
        <span class="tag tag-primary">{{ supplier.models.length }}</span>
      </div>
      <div class="card" style="margin-bottom:18px;">
        <div v-if="supplier.models.length === 0" class="card-body" style="text-align:center;padding:24px;color:var(--text-3);">暂无模型，点击测试获取</div>
        <div v-for="model in supplier.models" :key="model" class="list-item" style="cursor:default;">
          <van-icon name="coupon-o" size="16" color="var(--primary)" style="margin-right:10px;" />
          <span style="font-size:14px;">{{ model }}</span>
        </div>
      </div>

      <!-- 编辑 -->
      <button class="btn btn-sm btn-full" style="margin-bottom:12px;" @click="editMode = !editMode">
        {{ editMode ? '取消编辑' : '编辑供应商' }}
      </button>

      <div v-if="editMode" class="card fade-in">
        <div class="card-body">
          <div class="input-wrap"><label class="input-label">名称</label><input class="input" v-model="editForm.name" /></div>
          <div class="input-wrap"><label class="input-label">Base URL</label><input class="input" v-model="editForm.baseUrl" /></div>
          <div class="input-wrap"><label class="input-label">API Key</label><input class="input" v-model="editForm.apiKey" /></div>
          <button class="btn btn-primary btn-full btn-sm" @click="saveEdit">保存修改</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty-state">
    <div class="empty-icon">&#10060;</div>
    <div class="empty-text">供应商不存在</div>
    <button class="btn btn-primary btn-sm" style="margin-top:14px;" @click="$router.push('/')">返回首页</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '../store'
import { showDialog, showToast } from 'vant'

const route = useRoute(); const router = useRouter()
const { getSupplier, testSupplier, removeSupplier, updateSupplier } = useStore()
const id = route.params.id as string
const supplier = computed(() => getSupplier(id))
const testing = ref(false); const editMode = ref(false); const showKey = ref(false)
const editForm = reactive({ name: '', baseUrl: '', apiKey: '' })

onMounted(() => { if (supplier.value) Object.assign(editForm, { name: supplier.value.name, baseUrl: supplier.value.baseUrl, apiKey: supplier.value.apiKey }) })

const maskedKey = computed(() => { const k = supplier.value?.apiKey || ''; return k.length > 8 ? k.slice(0,4) + '····' + k.slice(-4) : '····' })
const uptime = computed(() => { if (!supplier.value) return '-'; const h = Math.floor((Date.now() - supplier.value.createdAt) / 3600000); return h < 24 ? h + 'h' : Math.floor(h/24) + 'd' })
function formatCtx(n: number) { return n >= 1000 ? (n/1000) + 'M' : (n||0) + 'K' }
function copyKey() { if (supplier.value) { navigator.clipboard.writeText(supplier.value.apiKey); showToast('已复制') } }
function test() { testing.value = true; testSupplier(id); setTimeout(() => { testing.value = false }, 3000) }
function remove() { showDialog({ title: '确认删除', message: '确定删除该供应商？' }).then(() => { removeSupplier(id); router.push('/') }) }
function saveEdit() { updateSupplier(id, { name: editForm.name, baseUrl: editForm.baseUrl, apiKey: editForm.apiKey }); editMode.value = false; showToast({ message: '已保存', type: 'success' }) }
</script>
