import { Box, Skeleton, Stack } from '@mui/material'

/**
 * Stands in for the portfolio while it loads.
 *
 * Mirrors the real layout's spacing so the page doesn't jump when content
 * arrives, and — more importantly — replaces the moment where empty template
 * defaults ("Your Name", "Software Developer") were briefly on screen and
 * looked like real, wrong data.
 */
export function PortfolioSkeleton() {
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 8 }}>
        <Skeleton variant="text" width="45%" height={64} />
        <Skeleton variant="text" width="22%" height={32} />
      </Box>

      {/* About */}
      <Box sx={{ mb: 6 }}>
        <Skeleton variant="text" width={60} height={20} sx={{ mb: 2 }} />
        {[100, 98, 96, 70].map((w, i) => (
          <Skeleton key={i} variant="text" width={`${w}%`} height={26} />
        ))}
      </Box>

      {/* Experience */}
      <Box sx={{ mb: 6 }}>
        <Skeleton variant="text" width={90} height={20} sx={{ mb: 2 }} />
        <Stack spacing={4}>
          {[0, 1].map((i) => (
            <Box key={i}>
              <Skeleton variant="text" width="35%" height={26} />
              <Skeleton variant="text" width="20%" height={20} sx={{ mb: 1 }} />
              {[97, 92, 60].map((w, j) => (
                <Skeleton key={j} variant="text" width={`${w}%`} height={22} />
              ))}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Projects */}
      <Box sx={{ mb: 6 }}>
        <Skeleton variant="text" width={70} height={20} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 3 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={260} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      </Box>

      {/* Skills */}
      <Box sx={{ mb: 6 }}>
        <Skeleton variant="text" width={50} height={20} sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {[72, 88, 60, 104, 80, 68, 96, 76, 92, 64].map((w, i) => (
            <Skeleton key={i} variant="rounded" width={w} height={32} sx={{ borderRadius: 999 }} />
          ))}
        </Stack>
      </Box>
    </Box>
  )
}
