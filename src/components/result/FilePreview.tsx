import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';

export function FilePreview({
  file,
  type,
  index
}: {
  file: File;
  type: 'image' | 'video' | 'audio' | 'pdf' | 'unknown';
  index: number;
}) {
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(
    null
  );
  useEffect(() => {
    if (type === 'unknown') return;
    const url = URL.createObjectURL(file);
    setPreview({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file, type]);
  if (type === 'unknown')
    return <Typography>File ready. Click below to download.</Typography>;
  if (preview?.file !== file) return null;
  const url = preview.url;
  if (type === 'image')
    return (
      <img
        src={url}
        alt={`Preview ${index}`}
        style={{ maxWidth: '100%', maxHeight: 300 }}
      />
    );
  if (type === 'video')
    return <video src={url} controls style={{ maxWidth: '100%' }} />;
  if (type === 'audio')
    return <audio src={url} controls style={{ width: '100%' }} />;
  return (
    <iframe
      src={url}
      title={`Preview ${file.name}`}
      width="100%"
      height="400px"
    />
  );
}
