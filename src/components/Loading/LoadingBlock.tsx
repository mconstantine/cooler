import { Loading, LoadingProps } from './Loading'
import './LoadingBlock.scss'

export function LoadingBlock(props: LoadingProps) {
  return (
    <div className="LoadingBlock">
      <Loading {...props} />
    </div>
  )
}
