import type { ReactNode } from 'react';
import type { RouteProps } from './common.js';
type ChangeLocation = (pathname?: string, search?: string, mode?: 'push' | 'replace' | false) => void;
export declare function useChangeLocation(): ChangeLocation;
export declare function useLocation(): {
    pathname: string;
    search: string;
};
export declare function Link({ href, children, pending, notPending, unstable_prefetchOnEnter, }: {
    href: string;
    children: ReactNode;
    pending?: ReactNode;
    notPending?: ReactNode;
    unstable_prefetchOnEnter?: boolean;
}): import("react").ReactElement<{
    href: string;
    onClick: (event: MouseEvent) => void;
    onMouseEnter: (() => void) | undefined;
}, string | import("react").JSXElementConstructor<any>> | import("react").FunctionComponentElement<{
    children?: ReactNode;
}>;
type ShouldSkip = (componentId: string, props: RouteProps, prevProps: RouteProps) => boolean;
export declare function Router({ basePath, shouldSkip, }: {
    basePath?: string;
    shouldSkip?: ShouldSkip;
}): import("react").FunctionComponentElement<Omit<{
    initialInput?: string;
    children: ReactNode;
    basePath?: string;
}, "children">>;
export {};
