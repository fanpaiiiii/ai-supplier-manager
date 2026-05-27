<template>
  <div class="fade-in" v-if="supplier">
    <div style="padding:16px 16px 0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
        <div class="neu-flat" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:12px;cursor:pointer;" @click="$router.back()">
          <van-icon name="arrow-left" size="20" />
        </div>
        <div style="flex:1;">
          <div style="font-size:22px;font-weight:800;">{{ supplier.icon }} {{ supplier.name }}</div>
          <div class="neu-tag" :class="'neu-tag-' + (supplier.status === 'online' ? 'success' : supplier.status === 'testing' ? 'warning' : 'danger')" style="margin-top:4px;">
            {{ supplier.status === 'online' ? '在线' : supplier.status === 'testing' ? '测试中' : '离线' }}
          </div>
        </div>
        <div class="neu-flat" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:12px;cursor:pointer;" @click="remove">
          <van-icon name="delete-o" size="20" color="var(--danger)" />
        </div>
      </div>
    </div>

    <div class="page-padding">
      <!-- 统计 -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ supplier.latency }}<small style="font-size:14px">ms</small></div>
          <div class="stat-label">延迟</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ supplier.models.length }}</div>
          <div class="stat-label">模型</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatCtx(supplier.contextLength) }}</div>
          <div class="stat-label">上下文</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ uptime }}</div>
          <div class="stat-label">运行</div>
        </div>
      </div>

      <button class="neu-btn neu-btn-primary" style="width:100%;padding:14px;margin-bottom:18px;" @click="test" :disabled="testing">
        {{ testing ? '测试中...' : '&#128260; 测试连接' }}
      </button>

      <!-- 连接信息 -->
      <div class="section-label">连接信息</div>
      <div class="neu" style="padding:18px;border-radius:20px;margin-bottom:18px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">Base URL</div>
          <div style="font-size:14px;margin-top:4px;word-break:break-all;">{{ supplier.baseUrl }}</div>
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">API Key</div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
            <div style="font-size:14px;flex:1;word-break:break-all;">{{ showKey ? supplier.apiKey : maskedKey }}</div>
            <div class="neu-flat" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:10px;cursor:pointer;" @click="showKey = !showKey">
              <van-icon :name="showKey ? 'eye-o' : 'closed-eye'" size="16" />
            </div>
            <div class="neu-flat" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:10px;cursor:pointer;" @click="copyKey">
              <van-icon name="description" size="16" />
            </div>
          </div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">创建时间</div>
          <div style="font-size:14px;margin-top:4px;">{{ new Date(supplier.createdAt).toLocaleString() }}</div>
        </div>
      </div>

      <!-- 模型列表 -->
      <div class="section-label">可用模型 ({{ supplier.models.length }})</div>
      <div class="neu-inset" style="padding:16px;border-radius:20px;margin-bottom:18px;max-height:300px;overflow-y:auto;">
        <div v-if="supplier.models.length === 0" style="text-align:center;padding:20px;color:var(--text-muted);">暂无模型，点击测试获取</div>
        <div v-for="model in supplier.models" :key="model" style="padding:10px 0;border-bottom:1px solid var(--shadow-dark);">
          <div style="font-size:14px;font-weight:500;">{{ model }}</div>
        </div>
      </div>

      <!-- 编辑 -->
      <button class="neu-btn" style="width:100%;padding:12px;margin-bottom:12px;" @click="editMode = !editMode">
        {{ editMode ? '取消' : '&#9998; 编辑' }}
      </button>

      <div v-if="editMode" class="neu" style="padding:18px;border-radius:20px;">
        <div style="margin-bottom:12px;" v-for="f in editFields" :key="f.key">
          <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">{{ f.label }}</div>
          <input class="neu-input" v-model="editForm[f.key]" />
        </div>
        <button class="neu-btn neu-btn-primary" style="width:100%;padding:12px;margin-top:8px;" @click="saveEdit">保存修改</button>
      </div>
    </div>
  </div>

  <div v-else style="text-align:center;padding:60px 20px;">
    <van-icon name="warning-o" size="64" color="var(--text-muted)" />
    <div style="font-size:16px;color:var(--text-secondary);margin-top:12px;">供应商不存在</div>
    <button class="neu-btn neu-btn-primary" style="margin-top:16px;" @click="$router.push('/')">返回首页</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from '../store'
import { showDialog, showToast } from 'vant'

const route = useRoute()
const router = useRouter()
const { getSupplier, testSupplier, removeSupplier, updateSupplier } = useStore()

const id = route.params.id as string
const supplier = computed(() => getSupplier(id))
const testing = ref(false)
const editMode = ref(false)
const showKey = ref(false)
const editForm = reactive({ name: '', baseUrl: '', apiKey: '' })
const editFields = [
  { key: 'name', label: '名称' },
  { key: 'baseUrl', label: 'Base URL' },
  { key: 'apiKey', label: 'API Key' },
]

onMounted(() => { if (supplier.value) Object.assign(editForm, { name: supplier.value.name, baseUrl: supplier.value.baseUrl, apiKey: supplier.value.apiKey }) })

const maskedKey = computed(() => { const k = supplier.value?.apiKey || ''; return k.length > 8 ? k.slice(0, 4) + '····' + k.slice(-4) : '····' })
const uptime = computed(() => { if (!supplier.value) return '-'; const h = Math.floor((Date.now() - supplier.value.createdAt) / 3600000); return h < 24 ? h + 'h' : Math.floor(h / 24) + 'd' })

function formatCtx(n: number) { return n >= 1000 ? (n / 1000) + 'M' : (n || 0) + 'K' }
function copyKey() { if (supplier.value) { navigator.clipboard.writeText(supplier.value.apiKey); showToast('已复制') } }
function test() { testing.value = true; testSupplier(id); setTimeout(() => { testing.value = false }, 3000) }
function remove() { showDialog({ title: '确认删除', message: '确定删除该供应商？' }).then(() => { removeSupplier(id); router.push('/') }) }
function saveEdit() { updateSupplier(id, { name: editForm.name, baseUrl: editForm.baseUrl, apiKey: editForm.apiKey }); editMode.value = false; showToast({ message: '已保存', type: 'success' }) }
</script>
