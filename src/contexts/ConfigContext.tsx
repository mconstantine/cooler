import { createContext, FC, useContext } from 'react'
import { PositiveInteger, unsafePositiveInteger } from '../globalDomain'

interface Config {
  entitiesPerPage: PositiveInteger
  entitiesPerSearch: PositiveInteger
}

const initialConfig: Config = {
  entitiesPerPage: unsafePositiveInteger(20),
  entitiesPerSearch: unsafePositiveInteger(10)
}

const ConfigContext = createContext<Config>(initialConfig)

export const ConfigProvider: FC = props => (
  <ConfigContext.Provider value={initialConfig}>
    {props.children}
  </ConfigContext.Provider>
)

export function useConfig() {
  return useContext(ConfigContext)
}
