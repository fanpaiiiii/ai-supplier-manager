<template>
  <div class="slide-up">
    <div class="page-header">
      <div class="icon-btn" @click="$router.back()">
        <van-icon name="arrow-left" size="20" />
      </div>
      <div>
        <div class="page-header-title">添加供应商</div>
        <div class="page-header-sub">Add Supplier</div>
      </div>
    </div>

    <div class="page-pad">
      <div class="section-title" style="margin-bottom:10px;">配置信息</div>
      <div class="card">
        <div class="card-body">
          <div class="input-wrap">
            <label class="input-label">名称</label>
            <input class="input" v-model="form.name" placeholder="例: DeepSeek" />
          </div>
          <div class="input-wrap">
            <label class="input-label">图标 (Emoji)</label>
            <input class="input" v-model="form.icon" placeholder="输入emoji" style="width:100px;" />
          </div>
          <div class="input-wrap">
            <label class="input-label">API Base URL</label>
            <input class="input" v-model="form.baseUrl" placeholder="https://api.deepseek.com" />
          </div>
          <div class="input-wrap">
            <label class="input-label">API Key</label>
            <div style="position:relative;">
              <input class="input" v-model="form.apiKey" placeholder="sk-..." style="padding-right:80px;" />
              <button v-if="form.apiKey" class="btn btn-ghost btn-sm" style="position:absolute;right:4px;top:50%;transform:translateY(-50%);border:none;" @click="copyKey">{{ copied ? '已复制' : '复制' }}</button>
            </div>
          </div>
          <div class="input-wrap">
            <label class="input-label">模型列表 (测试后自动获取)</label>
            <input class="input" v-model="modelsStr" placeholder="留空，测试后自动填充" readonly style="background:var(--surface-2);" />
          </div>
          <div class="input-wrap" style="margin-bottom:0;">
            <label class="input-label">上下文长度 (K)</label>
            <input class="input" v-model.number="form.contextLength" type="number" placeholder="测试后自动获取" />
          </div>
        </div>
      </div>

      <!-- 结果 -->
      <div v-if="testResult" style="margin-top:14px;" class="fade-in">
        <div v-if="testResult.ok" class="card" style="border-left:3px solid var(--success);">
          <div class="card-body" style="padding:12px 14px;">
            <div style="font-size:13px;font-weight:600;color:var(--success);">连接成功</div>
            <div style="font-size:12px;color:var(--text-2);margin-top:2px;">{{ testResult.latency }}ms · {{ testResult.models }} 个模型{{ testResult.maxContext ? ' · ' + testResult.maxContext + 'K上下文' : '' }}</div>
          </div>
        </div>
        <div v-else class="card" style="border-left:3px solid var(--danger);">
          <div class="card-body" style="padding:12px 14px;">
            <div style="font-size:13px;font-weight:600;color:var(--danger);">连接失败</div>
            <div style="font-size:12px;color:var(--text-2);margin-top:2px;">{{ testResult.error }}</div>
          </div>
        </div>
      </div>

      <!-- 按钮 -->
      <div style="display:flex;gap:10px;margin-top:18px;">
        <button class="btn btn-sm" style="flex:1;" @click="testConnection" :disabled="!canTest">
          {{ testing ? '测试中...' : '测试连接' }}
        </button>
        <button class="btn btn-success btn-sm" style="flex:1;" @click="save" :disabled="!canSave">
          保存供应商
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../store'
import { showToast } from 'vant'

const router = useRouter()
const { addSupplier } = useStore()

const presets = [
  { name: 'DeepSeek', icon: '&#128302;', baseUrl: 'https://api.deepseek.com', contextLength: 64 },
  { name: 'OpenRouter', icon: '&#127760;', baseUrl: 'https://openrouter.ai/api', contextLength: 128 },
  { name: 'Together', icon: '&#129309;', baseUrl: 'https://api.together.xyz', contextLength: 32 },
  { name: 'Groq', icon: '&#9889;', baseUrl: 'https://api.groq.com/openai', contextLength: 128 },
  { name: 'SiliconFlow', icon: '&#127754;', baseUrl: 'https://api.siliconflow.cn', contextLength: 32 },
  { name: 'Ollama', icon: '&#129433;', baseUrl: 'http://localhost:11434', contextLength: 32 },
]

const selected = ref('')
const copied = ref(false)
const form = ref({ name: '', icon: '', baseUrl: '', apiKey: '', contextLength: 0 })
const modelsStr = ref('')
const testing = ref(false)
const testResult = ref<any>(null)

const canTest = computed(() => form.value.name && form.value.baseUrl && form.value.apiKey && !testing.value)
const canSave = computed(() => form.value.name && form.value.baseUrl && form.value.apiKey)

function copyKey() { navigator.clipboard.writeText(form.value.apiKey); copied.value = true; setTimeout(() => { copied.value = false }, 1500) }
function applyPreset(p: any) { selected.value = p.name; Object.assign(form.value, { name: p.name, icon: p.icon, baseUrl: p.baseUrl, contextLength: p.contextLength }); testResult.value = null }

async function testConnection() {
  testing.value = true; testResult.value = null
  try {
    const resp = await fetch(`/api/test?url=${encodeURIComponent(form.value.baseUrl)}&key=${encodeURIComponent(form.value.apiKey)}&name=${encodeURIComponent(form.value.name)}`)
    const data = await resp.json()
    if (data.ok) {
      if (data.models?.length) modelsStr.value = data.models.join(', ')
      if (data.maxContext && !form.value.contextLength) form.value.contextLength = data.maxContext
      testResult.value = { ok: true, latency: data.latency, models: data.models?.length || 0, maxContext: data.maxContext }
    } else { testResult.value = { ok: false, error: data.error || `HTTP ${data.status}` } }
  } catch (e: any) { testResult.value = { ok: false, error: e.message } }
  testing.value = false
}

function save() {
  const models = modelsStr.value ? modelsStr.value.split(',').map(m => m.trim()).filter(Boolean) : []
  addSupplier({ name: form.value.name, icon: form.value.icon || '&#129302;', baseUrl: form.value.baseUrl.replace(/\/+$/, ''), apiKey: form.value.apiKey, models, contextLength: form.value.contextLength })
  showToast({ message: '添加成功', type: 'success' }); router.push('/')
}
</script>
