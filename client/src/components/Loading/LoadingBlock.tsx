import { FC } from 'react'
import { Loading, LoadingProps } from './Loading'
import './LoadingBlock.scss'

export const LoadingBlock: FC<LoadingProps> = props => (
  <div className="LoadingBlock">
    <Loading {...props} />
  </div>
)
