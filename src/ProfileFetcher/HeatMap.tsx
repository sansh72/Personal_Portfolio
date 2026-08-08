import { useState } from "react";
import { Stack, Grid, Typography, Box } from "@mui/material";


const Heatmap: any = () =>{

    return (
    <Stack 
    direction={'row'}
    justifyContent={'center'}
    alignItems={'center'}
    spacing={4}
    sx={{
        bgcolor:'#414141',
        height:200,
        width:900,
        borderRadius:'12px',
        
    }}>
        <Stack>
            <Box
                sx={{
                    borderRadius:'12px',
                    width:260,
                    height:170,
                    aspectRatio:1,
                    bgcolor:'#999999',
                    
                }}>
                    <Box
                        justifyContent={'center'}
                        alignItems={'center'}
                        sx={{
                            mt:2,
                            ml:4,
                            display: "grid",
                            gridTemplateColumns: "repeat(6, 1fr)",
                            gap: 1,
                            width: 200,
                            
                        }}
                        >
                        {Array.from({ length: 30 }).map((_, index) => (
                            <Box
                            key={index}
                            sx={{
                                width: 20,
                                height: 20,
                                bgcolor: "#414141",
                                borderRadius: "2px",
                                border: 1,
                                borderColor: '#a8a7a7'
                            }}
                            />
                        ))}
                    </Box>
            </Box>

        </Stack>
        <Stack>
            <Box
                sx={{
                    borderRadius:'12px',
                    width:260,
                    height:170,
                    aspectRatio:1,
                    bgcolor:'#999999'
                }}>
                    <Box
                        justifyContent={'center'}
                        alignItems={'center'}
                        sx={{
                            mt:2,
                            ml:4,
                            display: "grid",
                            gridTemplateColumns: "repeat(6, 1fr)",
                            gap: 1,
                            width: 200,
                            
                        }}
                        >
                        {Array.from({ length: 30 }).map((_, index) => (
                            <Box
                            key={index}
                            sx={{
                                width: 20,
                                height: 20,
                                bgcolor: "#414141",
                                borderRadius: "2px",
                                border: 1,
                                borderColor: '#a8a7a7'
                            }}
                            />
                        ))}
                    </Box>
            </Box>
        </Stack>
        <Stack>
            <Box
                sx={{
                    borderRadius:'12px',
                    width:260,
                    height:170,
                    aspectRatio:1,
                    bgcolor:'#999999'
                }}>
                    <Box
                        justifyContent={'center'}
                        alignItems={'center'}
                        sx={{
                            mt:2,
                            ml:4,
                            display: "grid",
                            gridTemplateColumns: "repeat(6, 1fr)",
                            gap: 1,
                            width: 200,
                            
                        }}
                        >
                        {Array.from({ length: 30 }).map((_, index) => (
                            <Box
                            key={index}
                            sx={{
                                width: 20,
                                height: 20,
                                bgcolor: "#414141",
                                borderRadius: "2px",
                                border: 1,
                                borderColor: '#a8a7a7'
                            }}
                            />
                        ))}
                    </Box>
            </Box>
        </Stack>
    </Stack>
    )
}
export default Heatmap