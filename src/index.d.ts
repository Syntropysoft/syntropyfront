/**
 * Copyright 2026 Syntropysoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface SyntropyFrontConfig {
    maxEvents?: number;
    endpoint?: string | null;
    headers?: Record<string, string>;
    usePersistentBuffer?: boolean;
    captureClicks?: boolean;
    captureFetch?: boolean;
    captureErrors?: boolean;
    captureUnhandledRejections?: boolean;
    onError?: (error: Error, context?: any) => void;
    fetch?: {
        url: string;
        options?: {
            headers?: Record<string, string>;
        };
    };
}

export interface AgentStats {
    isBufferActive: boolean;
    pendingItems: number;
    totalTransmitted: number;
    failedTransmissions: number;
}

export interface SyntropyFrontStats {
    isActive: boolean;
    breadcrumbs: number;
    agent: AgentStats;
    config: SyntropyFrontConfig;
}

export class SyntropyFront {
    isActive: boolean;
    config: SyntropyFrontConfig;

    init(): void;
    configure(config: SyntropyFrontConfig): void;
    addBreadcrumb(category: string, message: string, data?: any): void;
    getBreadcrumbs(): any[];
    clearBreadcrumbs(): void;
    sendError(error: Error | string, context?: any): any;
    flush(): Promise<void>;
    getStats(): SyntropyFrontStats;
    destroy(): void;
}

declare const syntropyFront: SyntropyFront;
export default syntropyFront;
