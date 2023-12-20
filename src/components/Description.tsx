export const Description = () => {
  return (
    <>
      <h1
        className="text-3xl font-bold sm:text-5xl dark:text-gray-200">
        I&apos;m Alex Yang
      </h1>
      <div
        className="flex flex-col items-start w-full flex-1 text-start pt-5 sm:pt-10 px-0 sm:px-10 lg:px-40">
        <p>
          A student and a open-source developer, focusing on building
          large-scale
          frontend applications.
        </p>
        <p>
          I'm working for {' '}
          <a
            className="text-blue-500 hover:underline"
            href="https://www.llamaindex.ai"
            target="_blank"
          >
            LlamaIndex
          </a>
          {' '}
          as a software engineer.
        </p>
      </div>
    </>
  )
}
