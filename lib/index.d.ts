import type { Context } from '@deepseek-ai/cordis';

export declare const name = 'dsh-humanizer';
export declare const inject: ['tools', 'systemPrompt'];

export interface HumanizerConfig {
    enabled?: boolean;
    domain?: string;
    voice?: string;
}

export declare function apply(ctx: Context, config?: HumanizerConfig): void;
