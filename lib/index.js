// dsh-humanizer — 生成前注入「人味」风格约束，检测器退化为透明报告。
// 判断交给代码（可复现、不烧 token），风格交给 system prompt（生成前约束，不做事后改写）。
import { defineTool } from '@deepseek-ai/dsh-tools';
import z from '@deepseek-ai/schemastery';
import { detectAiFlavor } from './patterns.js';

export const name = 'dsh-humanizer';
export const inject = ['tools', 'systemPrompt'];

const VERDICT_LABEL = {
    human: '人味（无明显 AI 痕迹）',
    mild: '轻度 AI 味（有少量模式命中）',
    ai: '明显 AI 味（高密度模式命中）',
};

/** 插件配置：是否注入风格、写作域、可选的声音样本。 */
export const Config = z.object({
    enabled: z.boolean().default(true).description('是否注入人味风格系统提示'),
    domain: z.string().default('copywriting').description('写作域，决定通用风格规则（copywriting / general）'),
    voice: z.string().default('').description('可选：用户自己的 2-3 段写作样本，用于声音校准'),
});

// 正向风格约束：说「要什么」，而不是「别用什么词」。
// 判断「活人感」的最终标准是人，所以这里给的是可执行的方向，不是关键词黑名单。
const STYLE_RULES = [
    '你的文字要像人写的，而不是像 AI 生成的。核心是「具体、有观点、有取舍」，而不是「全面、工整、无信息」。',
    '',
    '风格要求：',
    '1. 要具体：写具体的事实、数字、名字、场景、个人感受；不写空泛的抽象名词和万能形容词。',
    '2. 要有观点：明确表达你的判断和取舍，不骑墙、不面面俱到。',
    '3. 句子长短错落：像人说话一样有长有短，不写工整的排比三连。',
    '4. 删空转词与套话：赋能、抓手、闭环、底层逻辑、值得注意的是、综上所述、总的来说 这类不承载信息的词，直接用具体内容替代。',
    '5. 不做结论升华：结尾不写「未来可期」「意义深远」「前景广阔」这类无信息量的拔高。',
    '6. 不用 emoji 装饰标题或列表开头。',
    '',
    '事实铁律（不可违反）：',
    '1. 不编造：具体细节只能来自原文或作者提供的信息，禁止为了「像人」而虚构数字、例子、感受。',
    '2. 不改事实：数字、日期、人名、专有名词、引语、观点、结论一律保留。',
    '3. 冲突时保事实：如果去掉某种腔调会歪曲原意，宁可保留腔调，也不动事实。',
].join('\n');

const DOMAIN_INTRO = {
    copywriting: '当前是文案写作任务：让读者感觉这是一个具体的人在说话——有立场、有细节、有取舍，而不是官方通稿。',
    general: '当前是写作任务：目标自然、具体、有个人判断。',
};

function buildStyleSection(config) {
    const voice = String(config?.voice ?? '').trim();
    const domain = config?.domain || 'copywriting';
    const intro = DOMAIN_INTRO[domain] ?? DOMAIN_INTRO.general;
    const parts = [intro, '', STYLE_RULES];
    if (voice) {
        parts.push(
            '',
            '声音校准：先学习下面这段文字作者的节奏、用词、句式习惯和语气，再用同样的声音来写：',
            '"""',
            voice,
            '"""',
        );
    }
    return parts.join('\n');
}

export function apply(ctx, config = {}) {
    if (config.enabled !== false) {
        ctx.systemPrompt.section({
            name: 'dsh-humanizer:style',
            order: 5, // persona=0、工具指南=100–199，紧跟 persona 之后
            text: () => buildStyleSection(config),
        });
    }

    ctx.tools.register(defineTool({
        name: 'detect_ai_flavor',
        description: '检测一段文本的 AI 味（AI-flavored writing）。基于 20+ 条可枚举规则（中英文）扫描 AI 腔模式：空转词汇（赋能/闭环/抓手）、空洞套话（值得注意的是/综上所述）、否定平行结构（不仅…更是）、导览腔（让我们/Let\'s dive in）、Emoji 装饰、拔高措辞（testament/pivotal）等。返回 0-100 的 AI 味分数、判定（human/mild/ai）和命中模式清单（含原文样本）。适用于：在发布前检查自己的文章/文案是否像 AI 写的，或检查一段外部文本是否疑似 AI 生成。判断完全由代码完成，不消耗 token、结果可复现。',
        parameters: {
            text: { type: 'string', required: true, description: '要检测的文本，支持中英文混排。' },
        },
        output: {
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    score: { type: 'number', required: true, description: 'AI 味分数 0-100，越高越像 AI 写的' },
                    verdict: { type: 'string', required: true, enum: ['human', 'mild', 'ai'], description: '判定结果' },
                    verdictLabel: { type: 'string', required: true, description: '判定结果的中文说明' },
                    hitCount: { type: 'number', required: true, description: '命中的模式总数' },
                    hits: {
                        type: 'array',
                        required: true,
                        description: '命中的 AI 味模式清单，按严重程度排序',
                        items: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                patternId: { type: 'string', required: true },
                                name: { type: 'string', required: true },
                                category: { type: 'string', required: true },
                                description: { type: 'string', required: true },
                                count: { type: 'number', required: true },
                                samples: { type: 'array', required: true, items: { type: 'string' } },
                            },
                        },
                    },
                    suggestion: { type: 'string', required: true, description: '针对最严重模式的改写建议' },
                },
            },
            render: (_args, value) => {
                const lines = [
                    `AI 味分数: ${value.score}/100 — ${value.verdictLabel}`,
                    `命中模式: ${value.hitCount} 条`,
                ];
                for (const h of value.hits.slice(0, 6)) {
                    const samples = h.samples.slice(0, 2).map((s) => `"${s}"`).join(' ');
                    lines.push(`  · ${h.name} ×${h.count} ${samples}`);
                }
                return [{ type: 'text', text: lines.join('\n') }];
            },
        },
        async execute(args) {
            const result = detectAiFlavor(args.text);
            let suggestion = '未检测到明显 AI 味，保持原样即可。';
            if (result.hits.length > 0) {
                const top = result.hits[0];
                const examples = top.samples.slice(0, 2).join('、');
                suggestion = `最需要处理的是「${top.name}」（${top.category}）：${top.description} 原文中出现 ${examples ? `「${examples}」等 ${top.count} 处` : `${top.count} 处`}。建议：删掉或换成具体的事实/数字/个人感受，让句子回到"人话"。`;
            }
            return {
                score: result.score,
                verdict: result.verdict,
                verdictLabel: VERDICT_LABEL[result.verdict],
                hitCount: result.hits.length,
                hits: result.hits,
                suggestion,
            };
        },
    }));
}
