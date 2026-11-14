import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, setDefaultConfig } from 'antd-mobile'
import enUS from 'antd-mobile/es/locales/en-US'
import 'antd-mobile/es/global'
import './styles.css'
import { App } from './App'
import { initBridge } from './bridge'
import { startScaling } from './scale'
import { applyFont } from './fonts'

// Size the interface to the window before anything is drawn, and keep it in step as the window changes.
startScaling()
applyFont()

// Ant Design Mobile ships Chinese labels by default (Picker "确定/取消", Dialog, and so on).
// Pop-ups such as Picker.prompt are rendered outside the React tree, so the English locale is
// set as the library default as well as on the provider.
setDefaultConfig({ locale: enUS })

initBridge().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ConfigProvider locale={enUS}>
        <App />
      </ConfigProvider>
    </React.StrictMode>,
  )
})
