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
  get msSocialUrl() {
    return this.config.microServices.msSocialUrl;
  }

  get msStorageUrl() {
    return this.config.microServices.msStorageUrl;
  }

  get postIdNamespace(): string {
    return this.config.postIdNamespace ?? 'a2d04a60-9d04-4e4b-97e3-0d3f23c7c2b5';
  }
}
