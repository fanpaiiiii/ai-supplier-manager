<template>
  <div class="fade-in">
    <div style="padding:16px 16px 0;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
        <div class="neu-flat" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:12px;cursor:pointer;" @click="$router.back()">
          <van-icon name="arrow-left" size="20" />
        </div>
        <div style="font-size:22px;font-weight:800;">添加供应商</div>
      </div>
    </div>

    <div class="page-padding">
      <!-- 预设 -->
      <div class="section-label">快速添加</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
        <div v-for="p in presets" :key="p.name"
          class="neu-flat"
          :class="{ 'neu-pressed': selected === p.name }"
          style="padding:16px 8px;text-align:center;cursor:pointer;transition:all 0.15s;"
          @click="applyPreset(p)">
          <div style="font-size:32px;">{{ p.icon }}</div>
          <div style="font-size:12px;font-weight:600;margin-top:6px;color:var(--text-secondary);">{{ p.name }}</div>
        </div>
      </div>

      <!-- 表单 -->
      <div class="section-label">供应商信息</div>
      <div class="neu" style="padding:20px;border-radius:20px;">
        <div style="margin-bottom:14px;" v-for="field in fields" :key="field.key">
          <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">{{ field.label }}</div>
          <div style="position:relative;">
            <input class="neu-input" v-model="form[field.key]" :placeholder="field.placeholder" :type="field.type || 'text'" :readonly="field.readonly" />
            <button v-if="field.key === 'apiKey' && form.apiKey" class="neu-btn" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);padding:6px 10px;font-size:14px;border-radius:10px;" @click="copyKey">{{ copied ? '&#10003;' : '&#128203;' }}</button>
          </div>
        </div>
      </div>

      <!-- 测试结果 -->
      <div v-if="testResult" style="margin-top:14px;">
        <div v-if="testResult.ok" class="neu" style="padding:14px 18px;border-radius:14px;border-left:4px solid var(--success);">
          <div style="font-size:14px;font-weight:600;color:var(--success);">&#10003; 连接成功</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">{{ testResult.latency }}ms · {{ testResult.models }} 个模型{{ testResult.maxContext ? ' · ' + testResult.maxContext + 'K上下文' : '' }}</div>
        </div>
        <div v-else class="neu" style="padding:14px 18px;border-radius:14px;border-left:4px solid var(--danger);">
          <div style="font-size:14px;font-weight:600;color:var(--danger);">&#10007; 连接失败</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">{{ testResult.error }}</div>
        </div>
      </div>

      <!-- 按钮 -->
      <div style="display:flex;gap:12px;margin-top:20px;">
        <button class="neu-btn" style="flex:1;padding:14px;" @click="testConnection" :disabled="!canTest">
          {{ testing ? '测试中...' : '&#128279; 测试连接' }}
        </button>
        <button class="neu-btn neu-btn-success" style="flex:1;padding:14px;" @click="save" :disabled="!canSave">
          &#128190; 保存
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

const fields = [
  { key: 'name', label: '名称', placeholder: '例: DeepSeek' },
  { key: 'icon', label: '图标', placeholder: '输入emoji', type: 'text' },
  { key: 'baseUrl', label: 'API Base URL', placeholder: 'https://api.deepseek.com' },
  { key: 'apiKey', label: 'API Key', placeholder: 'sk-...', type: 'text' },
  { key: 'models', label: '模型 (测试后自动获取)', placeholder: '留空', readonly: true },
  { key: 'contextLength', label: '上下文长度 (K)', placeholder: '测试后自动获取', type: 'number' },
]

const selected = ref('')
const copied = ref(false)
const form = ref({ name: '', icon: '', baseUrl: '', apiKey: '', models: '', contextLength: '' })
const testing = ref(false)
const testResult = ref<any>(null)

const canTest = computed(() => form.value.name && form.value.baseUrl && form.value.apiKey && !testing.value)
const canSave = computed(() => form.value.name && form.value.baseUrl && form.value.apiKey)

function copyKey() { navigator.clipboard.writeText(form.value.apiKey); copied.value = true; setTimeout(() => { copied.value = false }, 1500) }

function applyPreset(p: any) {
  selected.value = p.name
  form.value.name = p.name
  form.value.icon = p.icon
  form.value.baseUrl = p.baseUrl
  form.value.contextLength = String(p.contextLength)
  testResult.value = null
}

async function testConnection() {
  testing.value = true
  testResult.value = null
  try {
    const resp = await fetch(`/api/test?url=${encodeURIComponent(form.value.baseUrl)}&key=${encodeURIComponent(form.value.apiKey)}&name=${encodeURIComponent(form.value.name)}`)
    const data = await resp.json()
    if (data.ok) {
      if (data.models?.length) form.value.models = data.models.join(', ')
      if (data.maxContext && !form.value.contextLength) form.value.contextLength = String(data.maxContext)
      testResult.value = { ok: true, latency: data.latency, models: data.models?.length || 0, maxContext: data.maxContext }
    } else {
      testResult.value = { ok: false, error: data.error || `HTTP ${data.status}` }
    }
  } catch (e: any) { testResult.value = { ok: false, error: e.message } }
  testing.value = false
}

function save() {
  const models = form.value.models ? form.value.models.split(',').map(m => m.trim()).filter(Boolean) : []
  addSupplier({ name: form.value.name, icon: form.value.icon || '🤖', baseUrl: form.value.baseUrl.replace(/\/+$/, ''), apiKey: form.value.apiKey, models, contextLength: Number(form.value.contextLength) || 0 })
  showToast({ message: '添加成功', type: 'success' })
  router.push('/')
}
</script>
