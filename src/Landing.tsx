import { Box, Stack, Typography, ThemeProvider, createTheme, CssBaseline, useMediaQuery } from "@mui/material"
import { Link } from "react-router-dom"

const Template = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')

  const theme = createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
    },
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Stack direction='column' gap={4}  
        sx={{
          minHeight: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
          mt:-1
        }}>
        <Box>
            <Typography 
            sx={{fontSize:50, fontFamily:'ui-sans-serif', fontWeight:500}}>
                Choose <span style={{fontStyle:'italic', color:'#8f8f8f'}}>What </span>Describes You
            </Typography>
        </Box>
        <Stack direction="row" gap={4}
            sx={{
                justifyContent: 'center',
                alignItems: 'center'
            }}>
        <Link to="/resume" style={{ textDecoration: 'none', color: 'inherit' }} state={{template: 'sde'}}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              cursor: 'pointer',
              transition: 'transform 0.2s, border-color 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: 'primary.main'
              }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Software Developer
            </Typography>
          </Box>
        </Link>

        <Link to="/resume" style={{ textDecoration: 'none', color: 'inherit' }} state={{template: 'bda'}}>
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              cursor: 'pointer',
              transition: 'transform 0.2s, border-color 0.2s',
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: 'primary.main'
              }
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              Business Development Associate
            </Typography>
          </Box>
        </Link>
      </Stack>
    </Stack>
    <Box component="footer"
        sx={{
            position:'fixed',
            bottom:0,
            left:0,
            right:0,
            textAlign:'center',
            py:2
        }}
    >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Port Flow 2025. All rights reserved.
        </Typography>
    </Box>
    </ThemeProvider>
  )
}

export default Template
