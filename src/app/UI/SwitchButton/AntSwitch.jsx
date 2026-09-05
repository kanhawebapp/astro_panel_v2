"use client"
import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';

export const AntSwitch = styled(Switch)(({ theme }) => ({
    width: 45,
    height: 21,
    padding: 0,
    display: 'flex',
    '&:active': {
      '& .MuiSwitch-thumb': {
        width: 18,
      },
      '& .MuiSwitch-switchBase.Mui-checked': {
        transform: 'translateX(25px)',
      },
    },
    '& .MuiSwitch-switchBase': {
      padding: 1.5,
      '&.Mui-checked': {
        transform: 'translateX(24px)',
        color: '#fff',
        '& + .MuiSwitch-track': {
          opacity: 1,
          backgroundColor: '#32CD32',
          ...theme.applyStyles('dark', {
            backgroundColor: '#00FF00',
          }),
        },
      },
      '&.Mui-disabled': {
        opacity: 1, 
        cursor: 'not-allowed',
        '& + .MuiSwitch-track': {
          opacity: 1,
        },
      },
    },
    '& .MuiSwitch-thumb': {
      boxShadow: '0 2px 4px 0 rgb(0 35 11 / 20%)',
      width: 18,
      height: 18,
      borderRadius: 9,
      transition: theme.transitions.create(['width'], {
        duration: 200,
      }),
    },
    '& .MuiSwitch-track': {
      borderRadius: 9,
      opacity: 1,
      backgroundColor: 'rgba(0,0,0,.25)',
      boxSizing: 'border-box',
      ...theme.applyStyles('dark', {
        backgroundColor: 'rgba(255,255,255,.35)',
      }),
    },
  }));