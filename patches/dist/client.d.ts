import type { ReactNode } from 'react';
type Elements = Promise<Record<string, ReactNode>>;
export declare const fetchRSC: (input: string, rerender: (fn: (prev: Elements) => Elements) => void, basePath?: string) => Elements;
export declare const Root: ({ initialInput, children, basePath, }: {
    initialInput?: string;
    children: ReactNode;
    basePath?: string;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<(input: string) => void>>;
export declare const useRefetch: () => (input: string) => void;
export declare const Slot: ({ id, children, }: {
    id: string;
    children?: ReactNode;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<ReactNode>>;
export declare const Children: () => ReactNode;
export declare const ServerRoot: ({ elements, children, }: {
    elements: Elements;
    children: ReactNode;
}) => import("react").FunctionComponentElement<import("react").ProviderProps<Elements | null>>;
export {};
