<template>
  <div class="fade-in">
    <div class="page-header">
      <router-link to="/" class="back-btn">‹</router-link>
      <h1 class="page-title">添加供应商</h1>
    </div>

    <div class="section-title">快速添加预设</div>
    <div class="preset-grid">
      <div v-for="p in presets" :key="p.name" class="preset-card" :class="{ selected: selected === p.name }" @click="applyPreset(p)">
        <div class="preset-icon">{{ p.icon }}</div>
        <div class="preset-name">{{ p.name }}</div>
      </div>
    </div>

    <div class="section-title">供应商信息</div>
    <div class="card card-lg">
      <div class="input-group">
        <label class="input-label">名称</label>
        <input class="input" v-model="form.name" placeholder="例: DeepSeek" />
      </div>
      <div class="input-group">
        <label class="input-label">图标 (emoji)</label>
        <input class="input" v-model="form.icon" placeholder="🤖" style="width:80px;" />
      </div>
      <div class="input-group">
        <label class="input-label">API Base URL</label>
        <input class="input" v-model="form.baseUrl" placeholder="https://api.deepseek.com" />
      </div>
      <div class="input-group">
        <label class="input-label">API Key</label>
        <div style="position:relative;">
          <input class="input" v-model="form.apiKey" placeholder="sk-..." style="padding-right:40px;" />
          <button v-if="form.apiKey" @click="copyKey" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;opacity:0.6;" title="复制">{{ copied ? '✅' : '📋' }}</button>
        </div>
      </div>
      <div class="input-group">
        <label class="input-label">模型 (逗号分隔，连接成功后自动获取)</label>
        <input class="input" v-model="modelsStr" placeholder="留空，测试连接后自动填充" readonly style="background:var(--bg);opacity:0.8;" />
      </div>
      <div class="input-group">
        <label class="input-label">上下文长度 (自动获取，可手动修改)</label>
        <input class="input" v-model.number="form.contextLength" type="number" :placeholder="form.contextLength || '测试连接后自动填充'" />
      </div>

      <button class="btn btn-primary btn-full" @click="testConnection" :disabled="!canTest">
        {{ testing ? '⏳ 测试中...' : '🔗 测试连接' }}
      </button>

      <div v-if="testResult" style="margin-top:12px;">
        <div class="tag" :class="testResult.ok ? 'tag-success' : 'tag-error'" style="font-size:14px;">
          {{ testResult.ok ? '✅ 连接成功' : '❌ ' + testResult.error }}
        </div>
        <div v-if="testResult.ok" style="font-size:13px;color:var(--text-secondary);margin-top:6px;">
          延迟: {{ testResult.latency }}ms · 发现 {{ testResult.models }} 个模型
          <span v-if="testResult.maxContext"> · 最大上下文: {{ testResult.maxContext }}K</span>
        </div>
      </div>

      <button class="btn btn-primary btn-full" style="margin-top:16px;" @click="save" :disabled="!canSave">
        💾 保存供应商
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '../store'

const router = useRouter()
const { addSupplier } = useStore()

const presets = [
  { name: 'DeepSeek', icon: '🔮', baseUrl: 'https://api.deepseek.com', contextLength: 64 },
  { name: 'OpenRouter', icon: '🌐', baseUrl: 'https://openrouter.ai/api', contextLength: 128 },
  { name: 'Together', icon: '🤝', baseUrl: 'https://api.together.xyz', contextLength: 32 },
  { name: 'Groq', icon: '⚡', baseUrl: 'https://api.groq.com/openai', contextLength: 128 },
  { name: 'SiliconFlow', icon: '🌊', baseUrl: 'https://api.siliconflow.cn', contextLength: 32 },
  { name: 'Ollama', icon: '🦙', baseUrl: 'http://localhost:11434', contextLength: 32 },
]

const selected = ref('')
const copied = ref(false)
const form = ref({ name: '', icon: '🤖', baseUrl: '', apiKey: '', contextLength: 0 })
const modelsStr = ref('')
const testing = ref(false)
const testResult = ref<{ ok: boolean; latency?: number; models?: number; maxContext?: number; error?: string } | null>(null)

const canTest = computed(() => form.value.name && form.value.baseUrl && form.value.apiKey && !testing.value)
const canSave = computed(() => form.value.name && form.value.baseUrl && form.value.apiKey)

function copyKey() {
  navigator.clipboard.writeText(form.value.apiKey)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

function applyPreset(p: typeof presets[0]) {
  selected.value = p.name
  form.value.name = p.name
  form.value.icon = p.icon
  form.value.baseUrl = p.baseUrl
  form.value.contextLength = p.contextLength
  testResult.value = null
}

async function testConnection() {
  testing.value = true
  testResult.value = null
  try {
    const resp = await fetch(`/api/test?url=${encodeURIComponent(form.value.baseUrl)}&key=${encodeURIComponent(form.value.apiKey)}`)
    const data = await resp.json()
    if (data.ok) {
      if (data.models?.length) modelsStr.value = data.models.join(', ')
      if (data.maxContext && !form.value.contextLength) form.value.contextLength = data.maxContext
      testResult.value = { ok: true, latency: data.latency, models: data.models?.length || 0, maxContext: data.maxContext }
    } else {
      testResult.value = { ok: false, error: data.error || `HTTP ${data.status}` }
    }
  } catch (e: any) {
    testResult.value = { ok: false, error: e.message }
  }
  testing.value = false
}

function save() {
  const models = modelsStr.value ? modelsStr.value.split(',').map(m => m.trim()).filter(Boolean) : []
  addSupplier({
    name: form.value.name,
    icon: form.value.icon,
    baseUrl: form.value.baseUrl.replace(/\/+$/, ''),
    apiKey: form.value.apiKey,
    models,
    contextLength: form.value.contextLength,
  })
  router.push('/')
}
</script>
