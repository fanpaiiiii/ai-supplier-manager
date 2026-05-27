<template>
  <div class="fade-in">
    <van-nav-bar title="添加供应商" left-arrow @click-left="$router.back()" :border="false" style="background:transparent;" />

    <div class="page-padding">
      <!-- 预设 -->
      <div style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:10px;">快速添加预设</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
        <div v-for="p in presets" :key="p.name" class="preset-card" :class="{ selected: selected === p.name }" @click="applyPreset(p)">
          <div style="font-size:28px;">{{ p.icon }}</div>
          <div style="font-size:13px;font-weight:600;margin-top:4px;">{{ p.name }}</div>
        </div>
      </div>

      <!-- 表单 -->
      <van-cell-group inset style="border-radius:12px;overflow:hidden;">
        <van-field v-model="form.name" label="名称" placeholder="例: DeepSeek" />
        <van-field v-model="form.icon" label="图标" placeholder="🤖" style="max-width:160px;" />
        <van-field v-model="form.baseUrl" label="Base URL" placeholder="https://api.deepseek.com" />
        <van-field v-model="form.apiKey" label="API Key" placeholder="sk-...">
          <template #button>
            <van-button v-if="form.apiKey" size="small" plain type="primary" @click="copyKey">{{ copied ? '✅' : '📋' }}</van-button>
          </template>
        </van-field>
        <van-field v-model="modelsStr" label="模型" placeholder="测试后自动获取" readonly />
        <van-field v-model.number="form.contextLength" label="上下文(K)" type="number" placeholder="测试后自动获取" />
      </van-cell-group>

      <!-- 测试结果 -->
      <div v-if="testResult" style="margin:14px 0;">
        <van-notice-bar v-if="testResult.ok" :text="`✅ 连接成功 · ${testResult.latency}ms · ${testResult.models} 个模型${testResult.maxContext ? ' · ' + testResult.maxContext + 'K上下文' : ''}`" color="#2D8B4E" background="#E8F5E9" left-icon="success" />
        <van-notice-bar v-else :text="`❌ ${testResult.error}`" color="#EE0A24" background="#FDEDED" left-icon="warning-o" />
      </div>

      <!-- 按钮 -->
      <div style="display:flex;gap:10px;margin-top:16px;">
        <van-button type="primary" block round :loading="testing" loading-text="测试中..." @click="testConnection" :disabled="!canTest">🔗 测试连接</van-button>
        <van-button type="success" block round @click="save" :disabled="!canSave">💾 保存</van-button>
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

function copyKey() { navigator.clipboard.writeText(form.value.apiKey); copied.value = true; setTimeout(() => { copied.value = false }, 1500) }

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
    const resp = await fetch(`/api/test?url=${encodeURIComponent(form.value.baseUrl)}&key=${encodeURIComponent(form.value.apiKey)}&name=${encodeURIComponent(form.value.name)}`)
    const data = await resp.json()
    if (data.ok) {
      if (data.models?.length) modelsStr.value = data.models.join(', ')
      if (data.maxContext && !form.value.contextLength) form.value.contextLength = data.maxContext
      testResult.value = { ok: true, latency: data.latency, models: data.models?.length || 0, maxContext: data.maxContext }
    } else {
      testResult.value = { ok: false, error: data.error || `HTTP ${data.status}` }
    }
  } catch (e: any) { testResult.value = { ok: false, error: e.message } }
  testing.value = false
}

function save() {
  const models = modelsStr.value ? modelsStr.value.split(',').map(m => m.trim()).filter(Boolean) : []
  addSupplier({ name: form.value.name, icon: form.value.icon, baseUrl: form.value.baseUrl.replace(/\/+$/, ''), apiKey: form.value.apiKey, models, contextLength: form.value.contextLength })
  showToast({ message: '添加成功', type: 'success' })
  router.push('/')
}
</script>

<style scoped>
.preset-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}
.preset-card:active { transform: scale(0.96); }
.preset-card.selected { border-color: var(--primary); background: rgba(45,139,78,0.06); }
</style>
