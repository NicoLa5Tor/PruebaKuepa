import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  RouterProvider,
} from "react-router-dom";
import './index.css'
import router  from './router';
import { MantineProvider } from '@mantine/core';
import { LogtoProvider, UserScope, type LogtoConfig } from '@logto/react';
import { config } from './config';

import '@mantine/core/styles.css';

import i18n from './util/i18n';
import moment from 'moment';
// La ruta dist comparte la instancia ESM de moment que usa Vite; 'moment/locale/es' registra el idioma en otra copia
import 'moment/dist/locale/es';

moment.locale('es');

// Inicio de sesión social; el scope Email incluye email y email_verified en el ID token
const logtoConfig: LogtoConfig = {
  endpoint: config.logto.endpoint,
  appId: config.logto.appId,
  scopes: [UserScope.Email],
};

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
      <LogtoProvider config={logtoConfig}>
        <RouterProvider router={router} />
      </LogtoProvider>
    </MantineProvider>
  </React.StrictMode>,
)
