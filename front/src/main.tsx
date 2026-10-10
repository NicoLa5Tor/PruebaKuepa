import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  RouterProvider,
} from "react-router-dom";
import './index.css'
import router  from './router';
import { MantineProvider } from '@mantine/core';

import '@mantine/core/styles.css';

import i18n from './util/i18n';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

(async () => {
  await i18n.init({
    fallbackLng: 'es',
    debug: true,
  });
}
)()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider>
      <RouterProvider router={router} />
    </MantineProvider>
  </React.StrictMode>,
)
