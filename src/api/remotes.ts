import { BaseAPI } from './base';
import { RemoteType } from '.';

class API extends BaseAPI {
  apiPath = this.getUIPath('remotes/');

  constructor() {
    super();
  }

  update(distribution, remote: RemoteType) {
    const reducedData = {};
    for (const field of [
      'url',
      'name',
      'auth_url',
      'token',
      'requirements_file',
      'tls_validation',
    ]) {
      reducedData[field] = remote[field];
    }
    for (const field of [
      'username',
      'password',
      'proxy_url',
      'tls_validation',
      'client_key',
      'client_cert',
      'ca_cert',
    ]) {
      if (!!remote[field]) {
        reducedData[field] = remote[field];
      }
    }

    for (const field of [
      'requirements_file',
      'client_key',
      'client_cert',
      'ca_cert',
    ]) {
      if (reducedData[field] === '') {
        reducedData[field] = null;
      }
    }

    return this.http.put(
      `content/${distribution}/v3/sync/config/`,
      reducedData,
    );
  }

  sync(distribution) {
    return this.http.post(`content/${distribution}/v3/sync/`, {});
  }
}

export const RemoteAPI = new API();
