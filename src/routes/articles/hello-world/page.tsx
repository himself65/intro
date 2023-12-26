import { Root } from '../../../layouts/Root.js'
import { Layout } from '../../../components/Layout.js'

export default function Page () {
  return (
    <Layout>
      <Root>
        <article className="mx-auto max-w-2xl bg-[--bg] px-5 py-12 text-[--text]">
          <h1 className="text-[40px] font-black leading-[44px] dark:text-gray-50">Hello World</h1>
        </article>
      </Root>
    </Layout>
  )
}
