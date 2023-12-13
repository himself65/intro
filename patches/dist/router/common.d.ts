export type RouteProps = {
    path: string;
    search: string;
};
export declare function getComponentIds(pathname: string): readonly string[];
export declare function getInputString(pathname: string, search: string, skip?: string[]): string;
export declare function parseInputString(input: string): {
    pathname: string;
    search: string;
    skip?: string[];
};
