import { Box, Typography, Stack, Tooltip, Dialog, DialogContent, CircularProgress, Snackbar, Alert } from "@mui/material"
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useAuth } from "./contexts/AuthContext";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from "./firebase";
import { BACKEND_URL } from "./config";
import type { User } from "firebase/auth";

function ChooseMethod(){
    const { template } = useLocation().state || { template: 'sde' }
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { user, signInWithGoogle } = useAuth()
    const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)

    async function checkExistingResume(account: User) {
        const docRef = doc(db, template, account.uid)
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
    async function handlePdfClick() {
        let account = user
        if (!account) {
            try {
                account = await signInWithGoogle()
            } catch {
                // Popup closed or blocked - not an error worth shouting about.
                return
            }
            setNotice({ text: `Signed in as ${account.email ?? 'your account'}` })
        }
        // Carry on with what they actually clicked, rather than leaving them
        // on an unchanged page wondering whether the sign-in worked.
        await checkExistingResume(account)
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch(`${BACKEND_URL}/parse-resume`, {
                method: 'POST',
                body: formData
            })
            if (!res.ok) {
                setNotice({
                    text: res.status === 429
                        ? "That's a lot of resumes - wait a minute and try again."
                        : "Couldn't read that resume. Try another PDF.",
                    error: true,
                })
                return
            }
            const data = await res.json()

            await setDoc(doc(db, template, user!.uid), {
                email: user!.email,
                portfolio: data,
                isPublished: false
            })

            navigate(`/resume?template=${template}&method=upload`, {
                state: { parsedResume: data }
            })
        } catch {
            setNotice({ text: "Couldn't reach the server. Check your connection.", error: true })
        } finally {
            // In a finally block so a failure can't leave the analysing dialog
            // spinning forever.
            setLoading(false)
        }
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
            <Snackbar
                open={notice !== null}
                autoHideDuration={4000}
                onClose={() => setNotice(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={notice?.error ? 'error' : 'success'}
                    variant="outlined"
                    onClose={() => setNotice(null)}
                    sx={{ bgcolor: 'background.paper' }}
                >
                    {notice?.text}
                </Alert>
            </Snackbar>
            <Box component="footer" sx={{ position:'fixed', bottom:0, left:0, right:0, textAlign:'center', py:2 }}>
                <Typography variant="body2" sx={{ color: '#8f8f8f' }}>
                    Port Flow 2026. All rights reserved.
                </Typography>
            </Box>
        </>
    )
}

export default ChooseMethod
