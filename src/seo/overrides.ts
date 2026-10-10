import type { ToolSeoOverride } from './types';
import jsonPrettify from './tool-content/json/prettify';
import jsonValidatejson from './tool-content/json/validateJson';
import jsonMinify from './tool-content/json/minify';
import jsonJsonComparison from './tool-content/json/json-comparison';
import xmlXmlBeautifier from './tool-content/xml/xml-beautifier';
import jsonJsonToCsv from './tool-content/json/json-to-csv';
import csvCsvToJson from './tool-content/csv/csv-to-json';
import timeConvertUnixToDate from './tool-content/time/convert-unix-to-date';
import timeCrontabGuru from './tool-content/time/crontab-guru';
import pdfMergePdf from './tool-content/pdf/merge-pdf';
import pdfSplitPdf from './tool-content/pdf/split-pdf';
import pdfCompressPdf from './tool-content/pdf/compress-pdf';
import pdfConvertToPdf from './tool-content/pdf/convert-to-pdf';
import pdfPdfToPng from './tool-content/pdf/pdf-to-png';
import pdfProtectPdf from './tool-content/pdf/protect-pdf';
import imageGenericCompress from './tool-content/image-generic/compress';
import imageGenericResize from './tool-content/image-generic/resize';
import imageGenericQrCode from './tool-content/image-generic/qr-code';
import pngConvertJgpToPng from './tool-content/png/convert-jgp-to-png';
import convertersConvertToWebp from './tool-content/converters/convert-to-webp';
import convertersConvertToJpg from './tool-content/converters/convert-to-jpg';
import imageGenericRemoveBackground from './tool-content/image-generic/remove-background';
import imageGenericImageToText from './tool-content/image-generic/image-to-text';
import videoCompress from './tool-content/video/compress';
import convertersVideoToGif from './tool-content/converters/video-to-gif';
import stringBase64 from './tool-content/string/base64';
import stringPasswordGenerator from './tool-content/string/password-generator';
import stringTextCompare from './tool-content/string/text-compare';

/**
 * Hand-written SEO metadata and content, keyed by tool route path without
 * the leading slash (e.g. `json/prettify`). Each entry lives in
 * src/seo/tool-content/<route>.ts. Tools without an entry get metadata
 * generated from their English locale strings.
 */
export const TOOL_OVERRIDES: Record<string, ToolSeoOverride> = {
  'json/prettify': jsonPrettify,
  'json/validateJson': jsonValidatejson,
  'json/minify': jsonMinify,
  'json/json-comparison': jsonJsonComparison,
  'xml/xml-beautifier': xmlXmlBeautifier,
  'json/json-to-csv': jsonJsonToCsv,
  'csv/csv-to-json': csvCsvToJson,
  'time/convert-unix-to-date': timeConvertUnixToDate,
  'time/crontab-guru': timeCrontabGuru,
  'pdf/merge-pdf': pdfMergePdf,
  'pdf/split-pdf': pdfSplitPdf,
  'pdf/compress-pdf': pdfCompressPdf,
  'pdf/convert-to-pdf': pdfConvertToPdf,
  'pdf/pdf-to-png': pdfPdfToPng,
  'pdf/protect-pdf': pdfProtectPdf,
  'image-generic/compress': imageGenericCompress,
  'image-generic/resize': imageGenericResize,
  'image-generic/qr-code': imageGenericQrCode,
  'png/convert-jgp-to-png': pngConvertJgpToPng,
  'converters/convert-to-webp': convertersConvertToWebp,
  'converters/convert-to-jpg': convertersConvertToJpg,
  'image-generic/remove-background': imageGenericRemoveBackground,
  'image-generic/image-to-text': imageGenericImageToText,
  'video/compress': videoCompress,
  'converters/video-to-gif': convertersVideoToGif,
  'string/base64': stringBase64,
  'string/password-generator': stringPasswordGenerator,
  'string/text-compare': stringTextCompare
};
