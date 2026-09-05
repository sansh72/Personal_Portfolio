import { Chip, Stack } from '@mui/material'

export function SuggestionTags({
  tags,
  labels,
  selected,
  onSelect,
  disabled,
}: {
  tags: string[]
  labels: Record<string, string>
  selected: string | null
  onSelect: (tag: string) => void
  disabled: boolean
}) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
      {tags.map((tag) => (
        <Chip
          key={tag}
          // The frontend only ever sends this identifier; the instruction it
          // maps to lives on the backend.
          label={labels[tag] ?? tag}
          size="small"
          clickable={!disabled}
          disabled={disabled}
          color={selected === tag ? 'primary' : 'default'}
          variant={selected === tag ? 'filled' : 'outlined'}
          onClick={() => !disabled && onSelect(tag)}
        />
      ))}
    </Stack>
  )
}
