import { Description } from '../components/Description.js'

const Page = () => {
  return (
    <div role='main'
      className="flex flex-row items-center w-full flex-1">
      <div
        className="flex flex-col items-center w-full flex-1">
        <Description/>
      </div>
    </div>
  )
}

export default Page
