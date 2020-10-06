import { Aurelia } from 'aurelia-framework';
import * as environment from '../config/environment.json';
import { PLATFORM } from 'aurelia-pal';
import * as UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';
import { AppInitialState as initialState } from 'store';

(UIkit as any).use(Icons);


export function configure(aurelia: Aurelia): void {
  aurelia.use
    .standardConfiguration()
    .feature(PLATFORM.moduleName('resources/index'))
    .developmentLogging(environment.debug ? 'debug' : 'warn')
    .plugin(PLATFORM.moduleName('aurelia-store'), { initialState });


  if (environment.testing) {
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'));
  }

  aurelia.start().then(() => aurelia.setRoot(PLATFORM.moduleName('app')));
}
