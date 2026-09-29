/**
 * 黑心云 统一错误码 / 日志码规范 (HeixinCloud unified code standard)
 *
 * 格式: HX-<PROC>-<SEV>-<NNNNNN>
 *   HX      固定前缀, 便于全局检索
 *   PROC    进程: P = Panel(后端) / N = Node(节点)
 *   SEV     级别: ERR = 错误 / WARN = 警告 / INFO = 提示
 *   NNNNNN  六位序号, 同一 (PROC, SEV) 内唯一; 000000 保留为"未分类"
 *
 * 示例: HX-P-ERR-000001  HX-N-WARN-000001  HX-P-INFO-000001
 *
 * 规则:
 *   1. 已发布的码永不复用、永不改号, 新增只能追加到本文件末尾。
 *   2. HX_ERROR_CODES 与 ERRORS 的语义键一一对应。编号独立于上游 A###/N### 数字,
 *      因为上游存在同号不同义 (A089 / A199 / A219)。
 *   3. 新增警告/提示时, 在 HX_WARN_CODES / HX_INFO_CODES 里追加下一个序号。
 */
import { ERRORS } from './errors';
import { KNOWN_ERRORS } from './known-errors';

export const HX_CODE_PREFIX = 'HX';

export const HX_PROCESS = {
    PANEL: 'P',
    NODE: 'N',
} as const;
export type HxProcess = (typeof HX_PROCESS)[keyof typeof HX_PROCESS];

export const HX_SEVERITY = {
    ERROR: 'ERR',
    WARNING: 'WARN',
    INFO: 'INFO',
} as const;
export type HxSeverity = (typeof HX_SEVERITY)[keyof typeof HX_SEVERITY];

/** 无法归类时使用的兜底错误码 */
export const HX_UNKNOWN_ERROR_CODE = 'HX-N-ERR-000000';

const HX_CODE_PATTERN = /^HX-[PN]-(?:ERR|WARN|INFO)-\d{6}$/;

export function formatHxCode(process: HxProcess, severity: HxSeverity, sequence: number): string {
    if (!Number.isInteger(sequence) || sequence < 0 || sequence > 999_999) {
        throw new RangeError(`HX code sequence must be an integer in 0..999999, got ${sequence}`);
    }
    return `${HX_CODE_PREFIX}-${process}-${severity}-${String(sequence).padStart(6, '0')}`;
}

export function isHxCode(value: unknown): value is string {
    return typeof value === 'string' && HX_CODE_PATTERN.test(value);
}

/**
 * ERRORS 语义键 -> 稳定错误码。顺序即编号顺序, 一旦发布不可调整。
 */
export const HX_ERROR_CODES = {
    INTERNAL_SERVER_ERROR: 'HX-N-ERR-000001',
    LOGIN_ERROR: 'HX-N-ERR-000002',
    UNAUTHORIZED: 'HX-N-ERR-000003',
    FORBIDDEN_ROLE_ERROR: 'HX-N-ERR-000004',
    CREATE_API_TOKEN_ERROR: 'HX-N-ERR-000005',
    DELETE_API_TOKEN_ERROR: 'HX-N-ERR-000006',
    GET_XRAY_STATS_ERROR: 'HX-N-ERR-000007',
    FAILED_TO_GET_SYSTEM_STATS: 'HX-N-ERR-000008',
    FAILED_TO_GET_USERS_STATS: 'HX-N-ERR-000009',
    FAILED_TO_GET_INBOUND_STATS: 'HX-N-ERR-000010',
    FAILED_TO_GET_OUTBOUND_STATS: 'HX-N-ERR-000011',
    FAILED_TO_GET_INBOUND_USERS: 'HX-N-ERR-000012',
    FAILED_TO_GET_INBOUNDS_STATS: 'HX-N-ERR-000013',
    FAILED_TO_GET_OUTBOUNDS_STATS: 'HX-N-ERR-000014',
    FAILED_TO_GET_COMBINED_STATS: 'HX-N-ERR-000015',
    FAILED_TO_GET_GEOCHECK: 'HX-N-ERR-000016',
    XRAY_FAILED_TO_START: 'HX-N-ERR-000017',
} as const satisfies Record<keyof typeof ERRORS | keyof typeof KNOWN_ERRORS, string>;

export type HxErrorKey = keyof typeof HX_ERROR_CODES;

/**
 * 异常过滤器兜底码 (E###) -> 黑心云错误码。
 * 990000 段保留给基础设施/框架级错误, 不参与 HX_ERROR_CODES 的顺序编号。
 */
export const HX_FALLBACK_CODES: Record<string, string> = {
    E000: 'HX-N-ERR-990001',
    E401: 'HX-N-ERR-990002',
    E403: 'HX-N-ERR-990003',
    E500: 'HX-N-ERR-990004',
};

/** 警告码: 新增时在末尾追加下一个序号 */
export const HX_WARN_CODES: Record<string, string> = {};

/** 提示码: 新增时在末尾追加下一个序号 */
export const HX_INFO_CODES: Record<string, string> = {};

const HX_CODE_BY_LEGACY_CODE: ReadonlyMap<string, string> = new Map<string, string>([
    ...Object.entries(ERRORS).map(
        ([key, entry]) => [entry.code, HX_ERROR_CODES[key as HxErrorKey]] as [string, string],
    ),
    ...Object.entries(KNOWN_ERRORS).map(
        ([key, entry]) => [entry.code, HX_ERROR_CODES[key as HxErrorKey]] as [string, string],
    ),
    ...Object.entries(HX_FALLBACK_CODES),
]);

/** 用上游错误码 (A### / N### / E###) 反查黑心云错误码 */
export function hxErrorCodeForLegacyCode(legacyCode: string): string | undefined {
    return HX_CODE_BY_LEGACY_CODE.get(legacyCode);
}
