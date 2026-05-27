<template>
  <div class="fade-in" v-if="supplier">
    <van-nav-bar :title="supplier.icon + ' ' + supplier.name" left-arrow @click-left="$router.back()" :border="false" style="background:transparent;">
      <template #right>
        <van-icon name="delete-o" size="20" color="#EE0A24" @click="remove" />
      </template>
    </van-nav-bar>

    <div class="page-padding">
      <!-- 状态卡片 -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">{{ supplier.latency }}<small style="font-size:12px">ms</small></div>
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

      <van-button type="primary" block round size="small" :loading="testing" loading-text="测试中..." @click="test" style="margin-bottom:14px;">🔄 测试连接</van-button>

      <!-- 延迟指示 -->
      <van-cell-group inset style="border-radius:12px;overflow:hidden;margin-bottom:14px;">
        <van-cell title="延迟状态">
          <template #value>
            <van-tag :type="supplier.latency < 100 ? 'success' : supplier.latency < 300 ? 'warning' : 'danger'" round>
              {{ supplier.latency < 100 ? '优秀' : supplier.latency < 300 ? '良好' : '较慢' }}
            </van-tag>
          </template>
        </van-cell>
        <van-cell title="连接状态">
          <template #value>
            <van-tag :type="supplier.status === 'online' ? 'success' : supplier.status === 'testing' ? 'warning' : 'danger'" round>
              {{ supplier.status === 'online' ? '✅ 在线' : supplier.status === 'testing' ? '⏳ 测试中' : '❌ 离线' }}
            </van-tag>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 连接信息 -->
      <van-cell-group inset style="border-radius:12px;overflow:hidden;margin-bottom:14px;">
        <van-cell title="Base URL" :label="supplier.baseUrl" />
        <van-cell title="API Key">
          <template #value>
            <span style="font-size:13px;">{{ showKey ? supplier.apiKey : maskedKey }}</span>
            <van-icon :name="showKey ? 'eye-o' : 'closed-eye'" size="16" style="margin-left:8px;" @click="showKey = !showKey" />
            <van-icon name="description" size="16" style="margin-left:8px;" @click="copyKey" />
          </template>
        </van-cell>
        <van-cell title="创建时间" :value="new Date(supplier.createdAt).toLocaleString()" />
      </van-cell-group>

      <!-- 模型列表 -->
      <van-cell-group inset style="border-radius:12px;overflow:hidden;margin-bottom:14px;">
        <van-cell :title="`可用模型 (${supplier.models.length})`" />
        <van-cell v-if="supplier.models.length === 0" title="暂无模型" label="点击测试连接获取" />
        <van-cell v-for="model in supplier.models" :key="model" :title="model" style="padding:8px 16px;" />
      </van-cell-group>

      <!-- 编辑 -->
      <van-button plain type="primary" block round size="small" @click="editMode = !editMode" style="margin-bottom:10px;">✏️ {{ editMode ? '取消编辑' : '编辑' }}</van-button>

      <van-cell-group v-if="editMode" inset style="border-radius:12px;overflow:hidden;">
        <van-field v-model="editForm.name" label="名称" />
        <van-field v-model="editForm.baseUrl" label="Base URL" />
        <van-field v-model="editForm.apiKey" label="API Key" />
        <van-button type="primary" block round size="small" @click="saveEdit" style="margin:10px;">保存修改</van-button>
      </van-cell-group>
    </div>
  </div>

  <van-empty v-else description="供应商不存在">
    <van-button round type="primary" size="small" to="/">返回首页</van-button>
  </van-empty>
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

onMounted(() => { if (supplier.value) { Object.assign(editForm, { name: supplier.value.name, baseUrl: supplier.value.baseUrl, apiKey: supplier.value.apiKey }) } })

const maskedKey = computed(() => { const k = supplier.value?.apiKey || ''; return k.length > 8 ? k.slice(0, 4) + '••••' + k.slice(-4) : '••••' })
const uptime = computed(() => { if (!supplier.value) return '-'; const h = Math.floor((Date.now() - supplier.value.createdAt) / 3600000); return h < 24 ? h + 'h' : Math.floor(h / 24) + 'd' })

function formatCtx(n: number) { return n >= 1000 ? (n / 1000) + 'M' : (n || 0) + 'K' }
function copyKey() { if (supplier.value) { navigator.clipboard.writeText(supplier.value.apiKey); showToast('已复制') } }
function test() { testing.value = true; testSupplier(id); setTimeout(() => { testing.value = false }, 3000) }
function remove() { showDialog({ title: '确认删除', message: '确定删除该供应商？' }).then(() => { removeSupplier(id); router.push('/') }) }
function saveEdit() { updateSupplier(id, { name: editForm.name, baseUrl: editForm.baseUrl, apiKey: editForm.apiKey }); editMode.value = false; showToast({ message: '已保存', type: 'success' }) }
</script>
