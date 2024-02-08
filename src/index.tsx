import React from 'react'
import ReactDOM from 'react-dom'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles';
import App from './App'
import web3Theme from './theme';

ReactDOM.render(
  <ThemeProvider theme={web3Theme}>
  <CssBaseline />
  <App />
</ThemeProvider>,
document.getElementById('root')
)
