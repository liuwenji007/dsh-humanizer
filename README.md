# dsh-humanizer

生成前注入「人味」风格约束 + AI 味检测报告。

> 判断交给代码（可复现、不烧 token），风格交给 system prompt（生成前约束，不做事后改写）。

## 它做什么

1. **生成前约束**：往 system prompt 里挂一段正向写作规则——要具体、要有观点、句子长短错落，不写空转词、不做结论升华、不用 emoji 装饰。
2. **三条事实铁律（不可违反）**：不编造、不改事实、冲突时保事实。数字、日期、人名、引语、观点一律保留；去掉腔调会歪曲原意时，宁可留腔调也不动事实。
3. **检测工具 `detect_ai_flavor`**：纯代码扫描一段文本的 AI 味，返回 0–100 分数、判定（human / mild / ai）和命中模式清单（含原文样本）。判断完全由代码完成，结果可复现、不消耗 token。

## 安装

它是 DSH 的 **bundle 插件**（声明了 `dsh.bundle.patch`），装进某个 profile 会自动进入 `dsh.profile.bundles` 层叠：

```bash
# 从 registry 安装
dsh plugin --profile <profile名> add dsh-humanizer

# 本地 / 源码安装（相对路径会锚定到你执行命令的目录）
dsh plugin --profile <profile名> add link:/abs/path/to/dsh-humanizer
```

`dsh plugin` 转发给 pnpm 并「对账」：只要依赖解析到声明了 `dsh.bundle` 的包，就自动追加进 `dsh.profile.bundles`。

## 配置

三个字段，写进 profile 的 `cordis.patch.yml`，按 `id: dsh-humanizer` 覆盖：

```yaml
- id: dsh-humanizer
  config:
    enabled: true        # 是否注入人味风格 system prompt（默认 true）
    domain: copywriting  # 写作域：copywriting / general（默认 copywriting）
    voice: ''            # 可选：你 2~3 段写作样本，做「声音校准」，模仿你的节奏用词
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `enabled` | boolean | `true` | 是否注入风格约束。设为 `false` 只关掉风格注入，`detect_ai_flavor` 工具照常可用。 |
| `domain` | string | `copywriting` | 写作域，决定风格段开头那句定位语（`copywriting` / `general`）。 |
| `voice` | string | `''` | 非空时，以「声音校准」的形式把样本挂进 prompt，让输出更像你本人。 |

## 使用

1. **自动生效**：`enabled` 为真时，每次生成都会带上人味风格约束，生成前生效，不做事后改写。
2. **手动检测**：会话里对模型说「帮我测测这段文字有没有 AI 味」，工具会返回：

```text
AI 味分数: 100/100 — 明显 AI 味（高密度模式命中）
命中模式: 6 条
  · 空转词汇 ×3 "赋能" "闭环"
  · Emoji 装饰 ×2 "🚀" "💡"
  · 总结腔 ×2 "总的来说" "未来可期"
```

3. **直接复用检测逻辑**（不烧 token、结果可复现）：

```js
import { detectAiFlavor } from 'dsh-humanizer/lib/patterns.js';

const r = detectAiFlavor('你的文本');
// => { score, verdict: 'human'|'mild'|'ai', hits: [{ name, count, samples, ... }] }
```

## 检测规则

22 条可枚举规则（10 条中文 + 12 条英文）：空转词汇（赋能/闭环/抓手）、空洞套话（值得注意的是/综上所述）、拔高措辞（意义深远/testament/pivotal）、时代背景腔、否定平行结构（不仅…更是/not only…but also）、导览腔（让我们/Let's dive in）、总结腔、排比三连、Emoji 装饰、公文腔等。

### 分数怎么算

- 每条规则有 `weight`（1–3），文本命中后累加 `count × weight` 得到原始分。
- 再按文本长度做密度归一化到 0–100：`score / (长度/200) × 10`。
- **少于 80 字的输入按 80 字计密度**，避免单个命中在超短文本里直接顶到 100。
- 判定：`≥40` 或（命中≥4 条且 ≥25）→ `ai`；`≥15` 或命中≥2 条 → `mild`；其余 → `human`。

## 边界与局限

它做**字面匹配**，是「尺子」不是「裁判」：

- 分不清你在「用」这些词，还是在「引用 / 举例」它们。
- 列举与排比、引用与套话，正则无法完全区分，存在误报（如英文三连形容词）。
- 分数是密度导向的，超短文本天然更敏感（已加 80 字下限缓解）。

拿它量自己、心里有数即可；需要下笔方向的，看它生成前注入的风格约束，而不是拿它改稿。

## License

MIT
