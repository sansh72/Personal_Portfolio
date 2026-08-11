async function ProfileFetcher(){
    
    const url = 'https://api.github.com/users/sansh72'
    try{
        const response = await fetch(url)
        if (!response.ok){
            throw new Error('Resonse Statu code ')

        }
        console.log('came here')
        const result = await response.json()
        console.log(result)
    }
    catch(error: any){
        throw new Error(error.message)
    }

}

export default ProfileFetcher