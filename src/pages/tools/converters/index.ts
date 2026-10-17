import { tool as convertersAudioConverter } from './audio-converter/meta';
import { tool as convertersWebpConverter } from './convert-to-webp/meta';
import { tool as convertersJpgConverter } from './convert-to-jpg/meta';
import { tool as convertersGifConverter } from './video-to-gif/meta';
import { tool as dockerRunCompose } from './docker-run-to-compose/meta';

export const convertersTools = [
  dockerRunCompose,
  convertersAudioConverter,
  convertersWebpConverter,
  convertersJpgConverter,
  convertersGifConverter
];
