import { useLayoutEffect, useRef } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { MultiImageInput } from '../../components/input/ToolMultipleImageInput';
import { moveFrame } from './frame-order';

export function FrameOrder({
  frames,
  onChange
}: {
  frames: MultiImageInput[];
  onChange: (frames: MultiImageInput[]) => void;
}) {
  const { t } = useTranslation('video');
  const rows = useRef(new Map<number, HTMLLIElement>());
  const movedIdentity = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (movedIdentity.current !== null) {
      rows.current.get(movedIdentity.current)?.focus();
      movedIdentity.current = null;
    }
  }, [frames]);
  const move = (index: number, direction: -1 | 1) => {
    const next = moveFrame(frames, index, direction);
    if (next === frames) return;
    movedIdentity.current = frames[index].order;
    onChange(next);
  };
  if (!frames.length) return null;
  return (
    <Stack
      component="section"
      aria-label={t('gif.imagesToGif.frameOrderTitle')}
      spacing={1}
      mt={2}
    >
      <Typography component="h2" variant="h6">
        {t('gif.imagesToGif.frameOrderTitle')}
      </Typography>
      <Typography variant="body2">
        {t('gif.imagesToGif.frameOrderHint')}
      </Typography>
      <Box
        component="ol"
        aria-label={t('gif.imagesToGif.frameOrderTitle')}
        sx={{ pl: 3, m: 0, maxHeight: 360, overflow: 'auto' }}
      >
        {frames.map((frame, index) => (
          <Box
            component="li"
            key={frame.order}
            tabIndex={-1}
            aria-label={t('gif.imagesToGif.frameLabel', {
              position: index + 1,
              name: frame.file.name
            })}
            ref={(node: HTMLLIElement | null) => {
              if (node) rows.current.set(frame.order, node);
              else rows.current.delete(frame.order);
            }}
            sx={{
              mb: 1,
              p: 1,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              '&:focus': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 1
              }
            }}
          >
            <Typography sx={{ overflowWrap: 'anywhere' }}>
              {frame.file.name}
            </Typography>
            <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
              <Button
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={t('gif.imagesToGif.moveEarlierLabel', {
                  position: index + 1,
                  name: frame.file.name
                })}
              >
                {t('gif.imagesToGif.moveEarlier')}
              </Button>
              <Button
                disabled={index === frames.length - 1}
                onClick={() => move(index, 1)}
                aria-label={t('gif.imagesToGif.moveLaterLabel', {
                  position: index + 1,
                  name: frame.file.name
                })}
              >
                {t('gif.imagesToGif.moveLater')}
              </Button>
            </Stack>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
