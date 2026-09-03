export interface AiPattern {
    id: string;
    name: string;
    category: string;
    description: string;
    regex: RegExp;
    weight: number;
}
export declare const PATTERNS: AiPattern[];
export declare function detectAiFlavor(text: string): {
    score: number;
    hits: Array<{
        patternId: string;
        name: string;
        category: string;
        description: string;
        count: number;
        samples: string[];
    }>;
    verdict: 'human' | 'mild' | 'ai';
};
