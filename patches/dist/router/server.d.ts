import type { FunctionComponent } from 'react';
import { defineEntries } from '../server.js';
export declare function defineRouter<P>(getComponent: (componentId: string) => Promise<FunctionComponent<P> | {
    default: FunctionComponent<P>;
} | null>, getPathsForBuild: () => Promise<string[]>): ReturnType<typeof defineEntries>;
