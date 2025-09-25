import { createTheme } from '@mui/material/styles';

// Define a custom theme with a dark background
const web3Theme = createTheme({
  palette: {
    mode: 'dark', // Use a dark theme as a base
    primary: {
      main: '#00d1b2', // A teal-like color, common in web3 interfaces
    },
    secondary: {
      main: '#7e57c2', // A soft purple for secondary actions and elements
    },
    background: {
      default: '#121212', // Explicitly setting a dark background
      paper: '#242424', // Slightly lighter dark shade for paper elements
    },
    error: {
      main: '#ff3860', // A vibrant red for errors, alerts, and warnings
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', // A modern, clean font
    h4: {
      fontWeight: 700, // Making headers bold for emphasis
    },
    button: {
      textTransform: 'none', // Buttons with regular casing for a modern look
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: 'none', // Removing the default box-shadow for a flatter design
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined', // Defaulting all text fields to the outlined style
        InputLabelProps: {
          shrink: true, // Ensures labels in text fields are always visible
        },
      },
    },
  },
});

export default web3Theme;
