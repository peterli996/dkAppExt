import React from 'react'
import { usei18n } from '@j2inn/utils'

const Test = ()=> {
  const i18n = usei18n()
  return (
    <div>
      <h1>Test</h1>
      <p>{i18n.t('dkAppExt.testKey')}</p>
    </div>
  );
}

export default Test