import type { CustomConfig } from './base-config.js';

export class AppConfigService {
  constructor(public readonly config: CustomConfig) {}

  get msUserUrl() {
    return this.config.microServices.msUserUrl;
  }

  get msPostUrl() {
    return this.config.microServices.msPostUrl;
  }

  get msEventUrl() {
    return this.config.microServices.msEventUrl;
  }
}
