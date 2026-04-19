import { Box, Typography, Stack, Tooltip, Dialog, DialogContent, CircularProgress } from "@mui/material"
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from "./firebase";

function ChooseMethod(){
    const { template } = useLocation().state || { template: 'sde' }
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user, signInWithGoogle } = useAuth()

    async function checkExistingResume() {
        console.log('Resume exists')
        console.log(template)
        const docRef = doc(db, template, user!.uid)
        const docSnap = await getDoc(docRef)
        console.log('this exists or not', docSnap.exists())

        if (docSnap.exists()) {
            navigate(`/resume?template=${template}&method=upload`, {
                state: { parsedResume: docSnap.data().portfolio, alreadyFound: true }
            })
        } else {
            fileInputRef.current?.click()
        }
    }
    function handlePdfClick() {
        if (!user) {
            signInWithGoogle()
            return
        }
        checkExistingResume()
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)

        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('https://portflow-backend-m7jo.onrender.com/parse-resume', {
            method: 'POST',
            body: formData
        })
        const data = await res.json()
        console.log('FastAPI success:', data)

        await setDoc(doc(db, template, user!.uid), {
            email: user!.email,
            portfolio: data,
            isPublished: false
        })
        console.log('Firestore success')

        setLoading(false)
        navigate(`/resume?template=${template}&method=upload`, {
            state: { parsedResume: data }
        })
    }

    return(
        <>
            <input
                type="file"
                accept=".pdf"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
            <Dialog open={loading} PaperProps={{ sx: { backgroundColor: '#1a1a1a', color: '#ffffff' } }}>
                <DialogContent>
                    <Stack alignItems="center" gap={2} sx={{ p: 2 }}>
                        <CircularProgress sx={{ color: '#ffffff' }} />
                        <Typography sx={{ fontSize: { xs: 18, sm: 24, md: 30 }, fontFamily:'ui-sans-serif', fontWeight:500 }}>
                            Analysing your <span style={{ fontStyle:'italic', color:'#8f8f8f' }}>Resume</span>
                        </Typography>
                    </Stack>
                </DialogContent>
            </Dialog>
            <Box sx={{
                display:'flex',
                justifyContent:'center',
                alignItems:'center',
                width:'100vw',
                height:'100vh'
            }}>
                <Stack direction={'column'} alignItems="center" gap={5}>
                    <Typography sx={{ fontSize: { xs: 28, sm: 40, md: 50 }, fontFamily:'ui-sans-serif', fontWeight:500 }}>
                        Upload <span style={{ fontStyle:'italic', color:'#8f8f8f' }}>Your</span> Resume
                    </Typography>
                    <Stack direction={'row'} gap={10}>
                        <Tooltip title={'Upload Your Resume'}>
                            <Box onClick={handlePdfClick} sx={{ pl:6, pr:6, borderRadius:4, cursor:'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
                                <PictureAsPdfIcon sx={{ width:60, height:60 }} />
                            </Box>
                        </Tooltip>
                        <Tooltip title={'Edit from Scratch'}>
                            <Box onClick={() => navigate(`/resume?template=${template}&method=scratch`)} sx={{ pl:6, pr:6, borderRadius:4, cursor:'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.1)' } }}>
                                <EditIcon sx={{ width:60, height:60 }} />
                            </Box>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Box>
            <Box component="footer" sx={{ position:'fixed', bottom:0, left:0, right:0, textAlign:'center', py:2 }}>
                <Typography variant="body2" sx={{ color: '#8f8f8f' }}>
                    Port Flow 2026. All rights reserved.
                </Typography>
            </Box>
        </>
    )
}

export default ChooseMethod
