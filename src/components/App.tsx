import { Layout } from './Layout.js'
import { ThemeButton } from './ThemeButton.js'

const App = () => {
  return (
    <Layout>
      <main
        className="flex min-h-screen flex-col items-start px-5 bg-white dark:bg-gray-900"
      >
        <div
          className="flex flex-row items-center w-full flex-1 px-20 text-center">
          <div
            className="flex flex-col items-center w-full flex-1 px-20 text-center">
            <h1 className="text-3xl font-bold sm:text-5xl dark:text-gray-200">
              Hey, I&apos;m Alex Yang
            </h1>
            <div
              className="text-xl font-light pt-5 sm:pt-10 dark:text-gray-300"
            >
              A student and a software engineer.
            </div>
          </div>
          <div className="self-start pt-5 sm:pt-10">
            <ThemeButton/>
          </div>
        </div>
      </main>
    </Layout>
  )
}

export default App
