import { Reducer } from "aurelia-store";
import { AppState } from "types";

export const AppInitialState: AppState = {
  canUseClipboardAPI: false,
  canUseShareAPI: false
}

export const ClipboardAction: { type: 'SetCanUseClipboard'; action: Reducer<AppState> } = {
  type: 'SetCanUseClipboard',
  action: (state: AppState, isEnabled: boolean) => ({ ...state, canUseClipboardAPI: isEnabled })
};

export const ShareAction: { type: 'SetCanUseShare'; action: Reducer<AppState> } = {
  type: 'SetCanUseShare',
  action: (state: AppState, isEnabled: boolean) => ({ ...state, canUseShareAPI: isEnabled })
};
