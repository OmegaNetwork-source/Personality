# Personality Avatar Images

Place circular profile pictures for each personality in this folder.

## File Naming Convention

Name your avatar images using the personality ID:

- `default.png` - Default avatar (fallback if personality-specific avatar doesn't exist)
- `slave.png` - Avatar for "slave" personality
- `airdrop_farmer.png` - Avatar for "airdrop_farmer" personality
- `vietnam_vet.png` - Avatar for "vietnam_vet" personality
- `gangster.png` - Avatar for "gangster" personality
- `[personality_id].png` - Avatar for any other personality

## Image Requirements

- **Format**: PNG (recommended) or JPG
- **Size**: 200x200 pixels or larger (square images work best)
- **Shape**: Images will be automatically cropped to circles
- **Aspect Ratio**: 1:1 (square) recommended for best results

## How It Works

1. When a user selects a personality, the system looks for `/avatars/[personality_id].png`
2. If the personality-specific avatar exists, it displays next to AI messages
3. If not found, it falls back to `/avatars/default.png`
4. Avatars appear as circular profile pictures next to all AI assistant messages

## Example

If you have a personality with ID "developer", place the image at:
`frontend/public/avatars/developer.png`

The avatar will automatically appear next to all messages from that personality.
