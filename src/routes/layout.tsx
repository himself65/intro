import { PropsWithChildren, ReactElement } from 'react'
import { Banner } from '../components/Banner.js'

export const Layout = ({ children }: PropsWithChildren): ReactElement => {
  return (
    <>
      {children}
      <Banner/>
    </>
  )
}

export default Layout
