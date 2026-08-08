import { Box } from "@mui/material"

type ContributionDay = {
    contributionCount: number
    date: string
    weekday: number
    color: string
}

type Month = {
    contributionDays: ContributionDay[]
}

const HeatMapCom = ({ month }: { month: Month }) => {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateRows: 'repeat(7, 14px)',   // max 7 rows per column
                gridAutoFlow: 'column',                 // fill down, then hop to next column
                rowGap: '3px',
                columnGap: '3px',                       // low spacing between columns
                pl: 2,
            }}
        >
            {month.contributionDays.map((day) => (
                <Box
                    key={day.date}
                    sx={{
                        width: 14,
                        height: 14,
                        bgcolor: day.color,
                        borderRadius: 1,
                    }}
                />
            ))}
        </Box>
    )
}

export default HeatMapCom
