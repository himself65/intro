export const Banner = () => {
  return (
    <footer
      role="contentinfo"
      className="flex flex-col items-center justify-center text-center w-full h-24 dark:border-gray-700 text-sm"
    >
      <span>
        Powered by{' '}
        <a
          className="text text-blue-500 hover:underline"
          href="https://waku.gg/"
          target="_blank"
        >
          Waku
        </a>
      </span>
    </footer>
  )
}
