// AI 味检测规则集：判断交给代码。
// 中文模式来自对中文 LLM 输出高频 AI 腔的归纳；
// 英文模式基于 humanizer (blader/humanizer, MIT) 的 29 类 Signs of AI writing。
export const PATTERNS = [
    // ── 中文：空转词汇（高频 AI 腔）──
    { id: 'zh-empty-word', name: '空转词汇', category: '词汇', weight: 3,
        description: '赋能/助力/抓手/闭环/颗粒度/对齐/底层逻辑/破局/洞察 这类词本身不承载信息，是 AI 腔的典型标志。',
        regex: /(赋能|助力|抓手|闭环|颗粒度|对齐|底层逻辑|破局|深度洞察|方法论|链路|心智模型)/g },
    { id: 'zh-hedge', name: '空洞套话', category: '词汇', weight: 2,
        description: '值得注意的是/不难发现/综上所述/毋庸置疑/众所周知 是 AI 用来显得严谨的填充语，删掉不影响任何意思。',
        regex: /(值得注意的是|不难发现|综上所述|总而言之|毋庸置疑|众所周知|不可否认|一定程度上|某种意义上)/g },
    { id: 'zh-inflate', name: '拔高措辞', category: '词汇', weight: 2,
        description: '至关重要/意义深远/里程碑/划时代/颠覆性 这类词把普通事实拔高成重大事件，AI 爱用，人少用。',
        regex: /(至关重要|意义深远|里程碑|划时代|颠覆性|革命性|前所未有的|历史性)/g },
    { id: 'zh-era', name: '时代背景腔', category: '句式', weight: 2,
        description: '"在这个…的时代/在…(的)浪潮下" 是 AI 开场的万能模板，实际内容通常与时代无关。',
        regex: /(在这个[^，。]{2,12}的时代|在[^，。]{2,12}的?浪潮下|在[^，。]{2,12}的(?:背景|大环境)下|随着[^，。]{2,15}的(?:发展|到来|普及))/g },
    { id: 'zh-not-only', name: '否定平行结构', category: '句式', weight: 2,
        description: '"不仅…更是…/不是…而是…" 过度使用会让句子显得刻意对仗，是中文 AI 腔的高频句式。',
        regex: /(不仅(?:仅仅)?[^。；]{2,25}更是|不只是[^。；]{2,25}而是|不是[^。；]{2,25}而是|并非[^。；]{2,25}而是)/g },
    { id: 'zh-signpost', name: '导览腔', category: '句式', weight: 2,
        description: '"让我们/接下来/首先我们来" 这类预告语是 AI 的 tutorial 脚本感来源，人说话不先报菜单。',
        regex: /(让我们(一起|深入|来看|来聊|回顾|走进)|接下来(我们|让我)|首先我们来|最后我想(说|强调|总结))/g },
    { id: 'zh-conclusion', name: '总结腔', category: '句式', weight: 2,
        description: '"总而言之/总的来说/说到底" 收尾 + 空洞升华（如 未来可期/前景广阔）是 AI 结尾模板。',
        regex: /(总的来说|总而言之|说到底|归根结底|未来可期|前景广阔|大有可为|指日可待)/g },
    { id: 'zh-rule-of-three', name: '排比三连', category: '结构', weight: 1,
        description: '"X、Y、Z 三个并列短语" 是 AI 让内容显得全面的手段；普通列举也常如此，信号弱、权重最低，靠「空转词汇」等主信号兜底。',
        regex: /[^，。；、]{2,6}[，、][^，。；、]{2,6}[，、][^，。；、]{2,6}/g },
    { id: 'emoji', name: 'Emoji 装饰', category: '结构', weight: 3,
        description: '标题/列表前挂 emoji（🚀💡✅）是 AI 生成内容的标志性装饰，与语言无关。',
        regex: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu },
    { id: 'zh-bureaucracy', name: '公文腔', category: '词汇', weight: 2,
        description: '建立健全/积极推动/稳步推进/全面落实 这类公文套话出现在个人写作里，几乎可以断定是 AI 或 AI 润色。',
        regex: /(建立健全|积极推动|稳步推进|全面落实|切实增强|着力打造|持续深化|不断优化)/g },
    // ── 英文：humanizer 高频模式 ──
    { id: 'en-copula-avoid', name: '系动词回避', category: '词汇', weight: 2,
        description: 'serves as / stands as / boasts 代替 is/has，是 AI 让句子显"高级"的典型手法。',
        regex: /\b(serves as|stands as|boasts|features|offers|marks a|represents a)\b/g },
    { id: 'en-inflate', name: '拔高词汇', category: '词汇', weight: 2,
        description: 'testament/pivotal/landscape/tapestry/underscore 这类词在 AI 文本里严重过载。',
        regex: /\b(testament|pivotal|landscape|tapestry|underscore|delve|intricate|showcase|foster|garner|vibrant|groundbreaking|renowned|breathtaking)\b/g },
    { id: 'en-signpost', name: '导览腔', category: '句式', weight: 2,
        description: '"Let\'s dive in / Let\'s explore / Here\'s what you need to know" 是 AI 的 tutorial 脚本感来源。',
        regex: /\b(let's dive in|let's explore|let's break down|here's what you need to know|without further ado|in this article)\b/gi },
    { id: 'en-not-only', name: '否定平行结构', category: '句式', weight: 2,
        description: '"not only...but also / it\'s not just...it\'s" 是 AI 制造对仗感的惯用句式。',
        regex: /\b(not only[^.]{0,60}but also|it's not just[^.]{0,60}it's|not merely[^.]{0,60}but)\b/gi },
    { id: 'en-emdash', name: '破折号滥用', category: '标点', weight: 1,
        description: '一句话里多个 — 是 AI 模仿"有力写作"的痕迹，人也用但远没这么频繁。',
        regex: /—[^—]{0,40}—/g },
    { id: 'en-hedge', name: '过度含糊', category: '词汇', weight: 2,
        description: 'It could potentially possibly be argued... 这类双重甚至三重限定是 AI 免责式写作。',
        regex: /\b(it (could|may|might) potentially|it is important to note|it's worth noting|in today's rapidly evolving)\b/gi },
    { id: 'en-rule-of-three', name: '三连堆砌', category: '结构', weight: 1,
        description: '连续三个并列名词/形容词组是 AI 让内容显得全面的手段，但人也常这么写，信号弱、权重最低。',
        regex: /\b(\w+), (\w+), and (\w+)\b/g },
    { id: 'en-serve-tone', name: '谄媚语气', category: '语气', weight: 3,
        description: 'Great question! / You\'re absolutely right! / Certainly! 是 AI 讨好用户的典型开场。',
        regex: /\b(great question|absolutely right|excellent point|of course!|certainly!|i hope this helps|let me know if you)\b/gi },
    { id: 'en-cutoff', name: '知识截止声明', category: '语气', weight: 2,
        description: '"as of my last training / up to my knowledge cutoff" 是 AI 身份泄漏，人不会这么说话。',
        regex: /\b(as of my last|up to my knowledge cutoff|based on available information|while specific details are limited)\b/gi },
    { id: 'en-conclusion', name: '泛化积极结尾', category: '句式', weight: 2,
        description: '"The future looks bright / exciting times lie ahead" 是 AI 的无信息量收尾。',
        regex: /\b(the future looks bright|exciting times lie ahead|in conclusion|to sum up)\b/gi },
    { id: 'en-persuasive', name: '说服权威套话', category: '句式', weight: 2,
        description: '"The real question is / at its core / what really matters" 是 AI 假装切入本质的仪式感。',
        regex: /\b(the real question is|at its core|what really matters|the heart of the matter|in reality)\b/gi },
    { id: 'en-filler', name: '填充短语', category: '词汇', weight: 1,
        description: 'In order to / Due to the fact that / At this point in time 是 AI 的冗余填充。',
        regex: /\b(in order to|due to the fact that|at this point in time|in the event that|has the ability to)\b/gi },
];
export function detectAiFlavor(text) {
    const hits = [];
    let score = 0;
    for (const p of PATTERNS) {
        p.regex.lastIndex = 0;
        const matches = text.match(p.regex);
        if (matches && matches.length > 0) {
            const samples = [...new Set(matches.map((m) => m.trim()).filter((m) => m.length > 0))].slice(0, 4);
            const points = matches.length * p.weight;
            score += points;
            hits.push({
                patternId: p.id,
                name: p.name,
                category: p.category,
                description: p.description,
                count: matches.length,
                samples,
            });
        }
    }
    hits.sort((a, b) => b.count - a.count || a.patternId.localeCompare(b.patternId));
    // 归一化到 0-100：按文本长度做密度校正，避免长文本天然高分。
    // 长度加下限：少于 MIN_LEN 字的输入按 MIN_LEN 字计密度，避免单个命中在超短文本里直接顶到 100。
    const MIN_LEN = 80;
    const len = Math.max(text.length, MIN_LEN);
    const density = score / (len / 200); // 每 200 字为一个单位
    const finalScore = Math.min(100, Math.round(density * 10));
    let verdict;
    if (finalScore >= 40 || (hits.length >= 4 && finalScore >= 25))
        verdict = 'ai';
    else if (finalScore >= 15 || hits.length >= 2)
        verdict = 'mild';
    else
        verdict = 'human';
    return { score: finalScore, hits, verdict };
}
