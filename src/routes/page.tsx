import { Layout } from '../components/Layout.js'
import { ThemeButton } from '../components/ThemeButton.js'
import { Description } from '../components/Description.js'
import { Banner } from '../components/Banner.js'
import { Root } from '../layouts/Root.js'

const Page = () => {
  return (
    <Layout>
      <Root>
        <main
          className="flex flex-row items-center w-full flex-1">
          <div
            className="flex flex-col items-center w-full flex-1">
            <Description/>
          </div>
          <div className="self-start pt-5 sm:pt-10">
            <ThemeButton/>
          </div>
        </main>
        <Banner/>
      </Root>
    </Layout>
  )
}

export default Page
