# BusinessCustomers 模块实现讲解

面向 React 新手，讲解 `smartHeating/ts/src/views/BusinessCustomers` 这个"客户与合同档案"页面的实现思路。目标不是让你复制代码，而是理解每一层在做什么、为什么这么拆，然后你能照着思路自己敲出来。

## 一、这个页面是什么

一个客户档案管理页面，长这样：

```
[顶部：标题 + 搜索框 + 添加用户/刷新按钮]
[统计卡片：总用户数 / 正常用热 / 总供暖面积 / 总欠费金额]
[筛选栏：热力站 / 建筑类型 / 用热状态 / 缴费状态 + 卡片/表格切换]
[主体：客户卡片网格 或 客户表格，每条可编辑/删除]
[添加/编辑用户的弹窗]
[删除确认弹窗]
```

数据来自后端（通过 Axon 表达式调用 Fantom 里定义的函数），不是写死的假数据。

## 二、文件结构与职责划分

```
BusinessCustomers/
├── types.ts            —— 所有 TypeScript 类型定义（数据形状）
├── customerExpr.ts      —— 拼装要发给后端的 Axon 表达式字符串
├── gridUtils.ts          —— 把后端返回的 HGrid 数据取出来转成普通 JS 值
├── index.tsx             —— 主组件：管理所有状态、调用接口、拼装页面
├── components.tsx        —— 纯展示型子组件（TopBar/StatsCards/FilterBar/CustomerGrid/CustomerTable）
├── AddUserModal.tsx       —— 添加/编辑用户的表单弹窗
├── DeleteConfirmModal.tsx —— 删除确认弹窗
└── styles.css             —— 样式
```

**核心思路：状态和业务逻辑集中在 `index.tsx`，把"怎么画出来"拆到 `components.tsx` 和两个 Modal 里。** 这是 React 里非常常见的"容器组件 + 展示组件"模式：

- 容器组件（index.tsx）：有状态（useState）、发请求、算派生数据，不太关心具体长什么样
- 展示组件（components.tsx 里那些）：不发请求、不管理业务状态，只接收 props 然后渲染，长得好不好看全在这里

新手建议先按这个顺序写：**types → gridUtils → customerExpr → components(纯展示) → index(把状态和逻辑串起来) → 两个 Modal**。

## 三、第一步：设计数据类型（types.ts）

写业务组件前先想清楚"数据长什么样"，这样后面写代码时 TypeScript 能一直帮你检查。

需要几类类型：

1. **枚举型字符串**（用联合类型表示"只能是这几个值之一"）：
   ```ts
   export type BuildingType = '住宅' | '商业' | '办公' | '工业' | '公共建筑'
   export type HeatUsageStatus = '正常' | '暂停' | '欠费' | '申请开通' | '申请停用'
   export type PaymentStatus = '正常' | '欠费' | '预缴' | '补缴中'
   export type CustomerViewMode = 'card' | 'table'
   ```

2. **一条客户记录长什么样**（对应后端一行数据）：
   ```ts
   export interface CustomerRecord {
     id: string
     dis: string        // 客户姓名（显示名）
     phone: string
     siteRef: string     // 关联的热力站 id
     siteDis: string      // 热力站显示名（冗余存一份，省得再查一次）
     heatArea: number
     buildingType: BuildingType
     heatStatus: HeatUsageStatus
     paymentStatus: PaymentStatus
     overdueAmount: number
     // ...其余字段同理，参考现有 types.ts
   }
   ```

3. **实时数据**（阀门、温度这些会变的值，和档案信息分开存）：
   ```ts
   export interface CustomerLiveData {
     valvePos: number | null
     roomTemp: number | null
     targetTemp: number | null
     // ...
   }
   ```
   为什么要单独拆一个类型？因为档案信息（姓名、地址）几乎不变，但阀门开度、室温这些要定时轮询刷新——**拆开之后，刷新实时数据不用重新拉一遍全部档案**。

4. **表单用的类型**（弹窗提交时用，字段基本和 CustomerRecord 对应，但 site/dwelling/thermostat 用的是 id 而不是显示名，因为提交给后端要用 id）。

**小结：先写类型，是为了让自己在写业务逻辑前，先想清楚"页面上到底有哪些数据、它们分别属于'档案'还是'实时状态'"。**

## 四、和后端通信的思路（customerExpr.ts + client）

这个项目的前端不是调 REST API，而是通过 `client.ext.eval(axonExprString)` 把一段 **Axon 表达式**（后端 Fantom 里注册的函数调用）发给服务器执行，拿到结果是一个 `HGrid`（Haystack 的表格数据结构）。

所以这一层要解决两个问题：

### 1. 怎么拼表达式字符串

每个后端函数对应一个"构造表达式"的函数，返回值就是要发送的字符串：

```ts
export const buildListCustomersExpr = (): string => 'shListCustomers()'

export const buildDeleteCustomerExpr = (id: string): string => `shDeleteCustomer({id: @${id}})`
```

带参数、尤其是**用户输入的字符串**时要小心转义，不然用户名里如果有引号会把表达式拼坏，甚至有注入风险：

```ts
const axonStr = (s: string): string => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
```

思路：写一个统一的转义函数，所有拼字符串字面量的地方都过一遍这个函数，不要每处手写转义。

### 2. 每个操作对应一个"构造表达式"的纯函数

- `buildListCustomersExpr()` —— 查列表
- `buildGetCustomerLiveDataExpr(ids)` —— 批量查实时数据
- `buildCreateCustomerExpr(values)` / `buildUpdateCustomerExpr(values)` —— 新增/编辑
- `buildDeleteCustomerExpr(id)` —— 删除

**为什么要把"拼表达式"单独抽成一个文件、一堆纯函数？**
- 好测试：给定输入，检查输出字符串对不对，不用真的连后端
- 组件里调用的时候一行搞定：`client.ext.eval(buildDeleteCustomerExpr(id))`，可读性好
- 以后要改表达式格式，只改这一个文件

**你动手写的时候**：先看清楚后端 `funcs.trio` 里对应的函数签名要哪些参数，再对应写一个 `buildXxxExpr` 函数。

## 五、解析后端返回的数据（gridUtils.ts）

`client.ext.eval()` 返回的是 haystack-core 的 `HGrid`，取值不能直接当 JS 对象用，每个值是 `HStr`/`HNum`/`HRef` 这种包装类型,需要转换：

```ts
export const hvalToStr = (v: OptionalHVal | undefined): string => {
  if (v == null) return ''
  if (v instanceof HStr) return v.value
  return v.toString?.() ?? ''
}

export const hvalToRefId = (v: OptionalHVal | undefined): string =>
  v instanceof HRef ? v.value : hvalToStr(v)

export const hvalToNum = (v: OptionalHVal | undefined): number =>
  v instanceof HNum ? v.value : 0
```

**思路：把"从 HVal 转成 JS 原始值"这件事封装成几个小工具函数，别在业务代码里到处写 `instanceof` 判断。** 之后解析一整个 grid 就是遍历行、每个字段调对应的 `hvalTo*`：

```ts
const parseCustomerGrid = (grid: HGrid): CustomerRecord[] => {
  const records: CustomerRecord[] = []
  for (let i = 0; ; i++) {
    const row = grid.get(i)
    if (!row) break
    records.push({
      id: hvalToRefId(row.get('id')),
      dis: hvalToStr(row.get('dis')),
      heatArea: hvalToNum(row.get('heatArea')),
      // ...其余字段
    })
  }
  return records
}
```

这个 `parseCustomerGrid` 函数放在 `index.tsx` 顶部（组件外面，因为它不依赖组件状态）。

## 六、主组件 index.tsx：状态管理是核心

这是整个模块最关键、也最值得花时间理解的部分。新手常见的困惑就在这里，所以拆细讲。

### 1. 先列清楚需要哪些状态

打开页面要想："这个页面上，哪些东西会变，会因为什么变？" 对应到 `useState`：

| 状态 | 类型 | 作用 |
|---|---|---|
| `records` | `CustomerRecord[]` | 从后端拉到的客户档案全量列表 |
| `liveDataMap` | `Map<string, CustomerLiveData>` | 按客户 id 存实时数据，方便按 id 查 |
| `loading` / `loadError` | `boolean` / `string \| null` | 加载中 / 加载失败提示 |
| `site` / `buildingType` / `heatStatus` / `paymentStatus` / `keyword` | 筛选条件 | 用户在筛选栏上选的值 |
| `viewMode` | `'card' \| 'table'` | 卡片视图还是表格视图 |
| `modalOpen` / `editingRecord` | 弹窗开关 + 正在编辑哪条 | 控制添加/编辑弹窗 |
| `deletingRecord` | `CustomerRecord \| null` | 控制删除确认弹窗，`null` 表示不显示 |

**技巧：弹窗是否打开，可以用"当前操作对象是否为 null"来表示，不用单独一个 boolean。** 比如 `deletingRecord`：
- 点删除按钮 → `setDeletingRecord(record)`
- 弹窗内部：`if (!open || !record) return null`
- 关闭/删除成功 → `setDeletingRecord(null)`

这样避免了"弹窗开了但不知道对哪条记录操作"的状态不同步问题。

### 2. 加载数据：useCallback + useEffect

```ts
const load = useCallback(async () => {
  setLoading(true)
  setLoadError(null)
  try {
    const grid = await client.ext.eval(buildListCustomersExpr())
    const list = parseCustomerGrid(grid)
    setRecords(list)
    loadLiveData(list)          // 拿到档案后接着拉一次实时数据
  } catch (e) {
    setLoadError(`加载失败：${(e as Error).message ?? '未知错误'}`)
  } finally {
    setLoading(false)
  }
}, [loadLiveData])

useEffect(() => {
  load()
}, [load])          // 页面首次挂载时加载一次
```

思路分三步：**发请求前先把 loading 打开、清掉旧的错误 → try 里请求+解析+存状态 → catch 记错误 → finally 关掉 loading。** 这个"三段式"是异步加载数据的标准写法，之后写其它页面的数据加载也是这个模板。

为什么用 `useCallback` 包一层？因为 `load` 要放进 `useEffect` 的依赖数组，如果每次渲染都重新生成一个新的 `load` 函数,`useEffect` 会被误判成"依赖变了"而反复执行。`useCallback` 让这个函数在依赖不变时保持同一个引用。

### 3. 定时轮询实时数据 + useRef 的作用

阀门/温度这类数据要每 30 秒自动刷新一次：

```ts
const recordsRef = useRef<CustomerRecord[]>([])
// 每次 load() 成功后同步一下: recordsRef.current = list

useEffect(() => {
  const timer = setInterval(() => {
    if (recordsRef.current.length > 0) {
      loadLiveData(recordsRef.current)
    }
  }, 30000)
  return () => clearInterval(timer)   // 组件卸载时清掉定时器，避免内存泄漏
}, [loadLiveData])
```

**这里为什么要多存一份 `recordsRef`，不能直接用 `records`？**
这是新手最容易踩的坑：`setInterval` 里的回调函数是在 `useEffect` 执行的那一刻"捕获"住外部变量的（闭包）。如果直接写 `records`，拿到的永远是定时器创建那一刻的 `records`（可能是空数组），后面 `records` 更新了，定时器里的函数感知不到。

`useRef` 创建的对象不会因为重新渲染而变化，`.current` 永远指向最新值，只要在每次 `records` 更新时同步写一份到 `recordsRef.current`，定时器里读到的就总是最新的列表。

**记住这个模式：只要是"要在定时器/事件监听器里访问最新状态，但又不想把这个状态放进 useEffect 依赖数组导致频繁重建定时器"，就用 useRef 存一份镜像。**

### 4. 派生数据用 useMemo，不要用 useState

`sites`（下拉选项）、`filtered`（筛选后的列表）、`totals`（统计数字）都不是"独立状态"，而是**根据已有状态算出来的**：

```ts
const filtered = useMemo(
  () => records.filter((r) =>
    (site === '全部' || r.siteDis === site) &&
    (buildingType === '全部' || r.buildingType === buildingType) &&
    (!keyword.trim() || r.dis.includes(keyword.trim()))
  ),
  [records, site, buildingType, keyword],
)
```

**原则：能从已有状态算出来的东西，就不要单独开一个 `useState` 去存它，用 `useMemo` 算，写在依赖数组里的状态一变它自动重算。** 如果单独存成 state，你就要自己操心"什么时候手动更新它"，容易和原始数据不同步。`useMemo` 的第二个参数（依赖数组）就是告诉 React："只有这些值变了才需要重新算，其它渲染直接用上次算好的结果"，避免每次渲染都重新 `filter` 一遍全量列表。

### 5. 事件处理函数：只做"改状态"这一件事

```ts
const openAdd = () => {
  setEditingRecord(undefined)
  setModalOpen(true)
}
const openEdit = (r: CustomerRecord) => {
  setEditingRecord(r)
  setModalOpen(true)
}
const openDelete = (r: CustomerRecord) => setDeletingRecord(r)
```

这些函数不发请求、不做校验，只是"用户点了某个按钮之后，该把哪些状态改成什么样"。真正发请求的逻辑放在 Modal 组件内部（提交表单/确认删除时）。

### 6. render 部分：把状态和展示组件接起来

```tsx
return (
  <div className="business-customers">
    <div className="shell">
      <TopBar keyword={keyword} onKeywordChange={setKeyword} onAddUser={openAdd} onRefresh={load} refreshing={loading} />
      <StatsCards {...totals} />
      <FilterBar sites={sites} site={site} onSiteChange={setSite} /* ... */ />
      {loading ? <div>加载中…</div>
        : loadError ? <ErrorBlock onRetry={load} />
        : records.length === 0 ? <EmptyHint />
        : viewMode === 'card'
          ? <CustomerGrid records={filtered} liveDataMap={liveDataMap} onEdit={openEdit} onDelete={openDelete} />
          : <CustomerTable records={filtered} liveDataMap={liveDataMap} onEdit={openEdit} onDelete={openDelete} />}
      <AddUserModal open={modalOpen} record={editingRecord} onClose={closeModal} onSuccess={() => { closeModal(); load() }} />
      <DeleteConfirmModal open={deletingRecord != null} record={deletingRecord} onClose={() => setDeletingRecord(null)} onSuccess={() => { setDeletingRecord(null); load() }} />
    </div>
  </div>
)
```

注意几个套路：

- **多层条件渲染用链式三元表达式**：加载中 → 出错 → 空列表 → 有数据，四选一，从上到下依次判断。这是"某个状态决定显示 A/B/C/D 中的一种"的标准写法。
- **弹窗操作成功后的回调里再调一次 `load()`**：增删改成功后，最简单可靠的做法是重新拉一遍列表，而不是自己在前端"手动更新那一条记录"——逻辑简单、不容易出现前后端数据不一致。数据量不大的管理页面，这样做完全够用。

## 七、展示组件怎么拆（components.tsx）

这个文件里的组件都遵守同一个规则：**只接收 props，不用 useState 存业务数据，不发请求**。判断一个组件该不该拆出来看这两点：

1. 这块 UI 是否在页面里明显独立成一块（顶部栏、统计卡片行、筛选栏、卡片列表、表格）
2. 这块 UI 的展示逻辑是否可以只靠 props 决定，不需要自己的状态

例如 `FilterBar` 完全靠 props 决定选中态：

```tsx
export const FilterBar: React.FC<{
  heatStatus: HeatUsageStatus | '全部'
  onHeatStatusChange: (s: HeatUsageStatus | '全部') => void
  // ...
}> = ({ heatStatus, onHeatStatusChange /* ... */ }) => (
  <div className="filter-group">
    {HEAT_STATUSES.map((s) => (
      <button
        key={s}
        className={`filter-chip${s === heatStatus ? ' active' : ''}`}
        onClick={() => onHeatStatusChange(s)}>
        {s}
      </button>
    ))}
  </div>
)
```

要点：

- **列表渲染用 `.map()`，每一项一定要给 `key`**（用能唯一标识这一项的值，比如状态字符串本身、或者记录的 `id`，不要用数组下标）
- **选中态样式用模板字符串拼 className**：`` `filter-chip${s === heatStatus ? ' active' : ''}` ``，这是 React 里判断"是否加某个 class"的常见写法（没有像 Vue 那样的 `:class` 对象语法，靠自己拼字符串或者用 `classnames` 之类的库）
- **卡片/表格这种"同一份数据，两种展示"**，把公共的单条渲染逻辑抽成一个内部小组件（`CustomerCard`），`CustomerGrid`/`CustomerTable` 各自负责外层布局，内部循环调用

**动手建议**：先写死 props 传一两条假数据，把每个展示组件的 UI 单独调好看，再接到 index.tsx 里传真实数据，这样调试范围小，好定位问题。

## 八、AddUserModal：表单类弹窗的思路

这是最复杂的一块，涉及"级联加载"和"表单校验"，拆开看：

### 1. 弹窗自己的状态

```ts
const [form, setForm] = useState<CreateCustomerPayload>(emptyForm)
const [errors, setErrors] = useState<FormErrors>({})
const [submitting, setSubmitting] = useState(false)
```

**表单数据永远用一个对象存**（而不是每个输入框一个 useState），更新某个字段用一个通用函数：

```ts
const updateField = <K extends keyof CreateCustomerPayload>(field: K, value: CreateCustomerPayload[K]) => {
  setForm((prev) => ({ ...prev, [field]: value }))
  if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
}
```

每个输入框都是**受控组件**：`value={form.xxx}` + `onChange={(e) => updateField('xxx', e.target.value)}`。这是 React 表单的标准写法——输入框显示的内容完全由 state 决定，用户打字触发 onChange 去更新 state，界面再根据新 state 重新渲染出来,不是输入框自己"记住"了内容。

### 2. 弹窗打开时初始化 + 级联加载下拉选项

```ts
useEffect(() => {
  if (!open) return
  setForm(record ? recordToForm(record) : emptyForm)  // 编辑用旧数据回填，新增用空表单
  // 拉热力站列表...
}, [open, record])

useEffect(() => {
  if (!open || !form.siteId) { setDwellings([]); setThermostats([]); return }
  // 根据选中的热力站，去拉这个站下面的设备列表...
}, [open, form.siteId])
```

**两个 useEffect 分工明确**：一个只在"弹窗打开"这个时机触发一次初始化；另一个专门监听"热力站选择变化"，重新拉对应的设备下拉选项。**级联下拉（选了 A 才能选 B）的通用套路就是：B 的加载逻辑放进依赖 A 的 useEffect 里。**

还有个细节：切换热力站时要把之前选的设备清空（`onSiteChange` 里把 `dwellingId`/`thermostatId` 一起重置成空字符串），否则会出现"选了 A 站，却还留着 B 站下面的设备 id"这种脏数据。

### 3. 前端校验

```ts
const validate = (): boolean => {
  const next: FormErrors = {}
  if (!form.name.trim()) next.name = '请输入用户姓名'
  if (!/^\d{11}$/.test(form.phone.trim())) next.phone = '联系电话应为 11 位数字'
  setErrors(next)
  return Object.keys(next).length === 0
}
```

思路：校验函数把所有错误一次性收集到一个对象里、`setErrors` 一次性更新，`return` 是否有错误。提交时先 `if (!validate()) return`，UI 上 `errors.name` 有值就显示红框+错误文案。

### 4. 提交

```ts
const handleSubmit = async () => {
  if (!validate()) return
  setSubmitting(true)
  try {
    if (isEdit) await client.ext.eval(buildUpdateCustomerExpr(form))
    else await client.ext.eval(buildCreateCustomerExpr(form))
    message.success(...)
    onSuccess()   // 交给父组件：关弹窗 + 重新加载列表
  } catch (e) {
    message.error(...)
  } finally {
    setSubmitting(false)
  }
}
```

新增和编辑共用同一个表单/同一个弹窗，靠 `isEdit = Boolean(record)` 这一个布尔值来决定标题文案、调用哪个接口——**没有必要为"新增"和"编辑"写两个组件**，绝大部分 UI 和逻辑是重复的。

## 九、DeleteConfirmModal：最简单的确认弹窗模板

```tsx
if (!open || !record) return null   // 不显示就直接不渲染，逻辑简单粗暴但很实用

const handleDelete = async () => {
  setSubmitting(true)
  try {
    await client.ext.eval(buildDeleteCustomerExpr(record.id))
    message.success('删除成功')
    onSuccess()
  } catch (e) {
    message.error(`删除失败：${(e as Error).message}`)
  } finally {
    setSubmitting(false)
  }
}
```

这是"二次确认操作"的通用模板，以后遇到别的"删除/停用/作废"这类需要二次确认的按钮，照这个结构写就行：父组件用"当前操作对象 `| null`"控制显隐 → 子组件内部一个 `submitting` 状态防止重复点击 → 确认后调接口、成功后回调父组件关闭+刷新。

## 十、建议的手写顺序（复盘一遍）

1. **types.ts**：把 `CustomerRecord`、`CustomerLiveData`、各种枚举类型、表单类型先写好
2. **gridUtils.ts**：写 `hvalToStr`/`hvalToNum`/`hvalToRefId` 三个转换函数（可以先抄现有的,这是纯工具函数,不涉及本模块业务逻辑）
3. **customerExpr.ts**：对照后端 `funcs.trio` 里的函数，一个个写 `buildXxxExpr`
4. **components.tsx**：先写 `TopBar`、`StatsCards`，用假数据在页面里看效果；再写 `FilterBar`；最后写 `CustomerCard` + `CustomerGrid`/`CustomerTable`
5. **index.tsx**：
   - 先搭好 state 列表和 `load()` 函数，确认列表能拉出来、能显示
   - 加 `filtered`/`totals`/`sites` 的 `useMemo`
   - 接筛选栏的 onChange
   - 加 `viewMode` 切换
   - 最后接两个弹窗和它们的开关状态
6. **DeleteConfirmModal.tsx**：最简单，先写这个练手
7. **AddUserModal.tsx**：最后写，涉及表单 + 级联加载 + 校验,最复杂

## 十一、贯穿全文的 React 核心概念小结

| 概念 | 用在哪 | 一句话记忆 |
|---|---|---|
| `useState` | 几乎每个组件 | 会变化、变化后要重新渲染的数据 |
| `useEffect` | 数据加载、定时器、级联加载 | "在某些值变化之后,顺带做一件事"（副作用） |
| `useMemo` | filtered/totals/sites | 能算出来的就别单独存,依赖不变就不重算 |
| `useCallback` | load/loadLiveData | 让函数在依赖不变时保持同一个引用,配合 useEffect 依赖数组用 |
| `useRef` | recordsRef | 存一个"不触发渲染、但能读到最新值"的镜像,专治闭包陷阱 |
| 受控组件 | 所有 input/select | value 由 state 决定,onChange 里更新 state |
| props 传递 | index.tsx → components.tsx | 状态在上层管,展示交给下层,靠 props 通信 |
| 条件渲染 | loading/error/empty/data 四态 | 链式三元表达式,从上到下依次判断 |
| 列表渲染 | .map() + key | key 用稳定唯一值,不用数组下标 |

把这张表吃透,这个模块（以及项目里绝大多数管理类页面）的写法都是同一套模板的变体。
