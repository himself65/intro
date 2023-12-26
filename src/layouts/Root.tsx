import { PropsWithChildren } from 'react'

export const Root = (props: PropsWithChildren) => {
  return (
    <div
      className="flex min-h-screen flex-col items-start px-5 bg-white dark:bg-gray-900 text-xl font-light dark:text-gray-300"
    >
      {props.children}
    </div>
  )
}
