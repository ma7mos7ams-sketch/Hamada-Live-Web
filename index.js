import { Container, getContainer } from '@cloudflare/containers';
import { env } from 'cloudflare:workers';

export class HamadaContainer extends Container {
  defaultPort = 8799;
  sleepAfter = '1h';
  enableInternet = true;
  envVars = {
    PORT: '8799',
    NODE_ENV: 'production',
    EULER_API_KEY: env.EULER_API_KEY || '',
    DATA_DIR: '/data',
    MUSIC_DIR: '/data/music'
  };
}

export default {
  async fetch(request, env) {
    const app = getContainer(env.HAMADA_CONTAINER, 'hamada-main');
    return app.fetch(request);
  }
};
