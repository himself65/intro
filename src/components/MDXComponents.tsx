export const MDXComponents = {
  h1: ({ children, ...rest }: any) => (
    <h1
      className="mb-2 mt-16 text-4xl font-bold leading-none text-white first-of-type:mt-0 sm:text-[3rem]"
      {...rest}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...rest }: any) => (
    <h2
      className="mb-2 mt-16 text-3xl font-bold leading-none text-white first-of-type:mt-0 sm:text-[2rem]"
      {...rest}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...rest }: any) => (
    <h3
      className="mb-2 mt-8 text-xl font-bold leading-none text-white sm:text-2xl"
      {...rest}
    >
      {children}
    </h3>
  ),
  h4: ({ children, ...rest }: any) => (
    <h3
      {...rest}
      className="mb-2 mt-8 text-lg font-bold uppercase leading-none tracking-wide text-white sm:text-xl"
    >
      {children}
    </h3>
  ),
  p: ({ children, ...rest }: any) => (
    <p
      className="mb-4 text-sm font-normal leading-normal text-white/80 sm:text-lg lg:text-xl"
      {...rest}
    >
      {children}
    </p>
  ),
  strong: ({ children, ...rest }: any) => (
    <b className="font-bold text-white" {...rest}>
      {children}
    </b>
  ),
  a: ({ children, ...rest }: any) => (
    <a className="text-white/80 underline" target="_blank" {...rest}>
      {children}
    </a>
  ),
  ul: ({ children, ...rest }: any) => (
    <ul
      className="mb-4 ml-4 list-disc text-base font-normal leading-normal text-white/60 sm:text-lg lg:text-xl"
      {...rest}
    >
      {children}
    </ul>
  ),
  code: ({ children, ...rest }: any) => (
    <span
      className="-my-0.5 inline-block rounded bg-gray-800 px-1.5 py-px font-mono text-sm text-white/80 sm:text-base"
      {...rest}
    >
      {children}
    </span>
  ),
} as const;
