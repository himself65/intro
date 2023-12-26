import { Root } from '../../../layouts/Root.js'
import { Layout } from '../../../components/Layout.js'
// @ts-expect-error no exported member
import { compileMDX } from 'next-mdx-remote/rsc'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { MDXComponents } from '../../../components/MDXComponents.js'
import { Banner } from '../../../components/Banner.js'

export default async function Page () {
  const source = await readFile(
    fileURLToPath(new URL('./README.mdx', import.meta.url)), 'utf-8')

  const { content, frontmatter } = await compileMDX({
    source,
    components: MDXComponents,
    options: {
      parseFrontmatter: true
    }
  })

  return (
    <Layout>
      <meta name="description" content={frontmatter.description}/>
      <Root>
        <article
          className="mx-auto max-w-2xl bg-[--bg] px-5 py-12 text-[--text]">
          {content}
        </article>
        <Banner/>
      </Root>
    </Layout>
  )
}
