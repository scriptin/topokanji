import * as url from 'url';

export default function (importMetaUrl: string): string {
  return url.fileURLToPath(new URL('.', importMetaUrl));
}
