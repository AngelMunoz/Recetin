import { bindable, bindingMode, computedFrom } from 'aurelia-framework';
import { IconName } from 'types';

export class RecIcon {
  @bindable({ bindingMode: bindingMode.toView }) color = "currentColor";
  @bindable({ bindingMode: bindingMode.toView }) canClick: boolean | 'true' | 'false' = false;
  @bindable({ bindingMode: bindingMode.toView }) icon?: IconName;

  public defaultStyle = {
    width: '24px',
    height: '24px',
    cursor: (this.canClick === true || this.canClick === 'true') ? 'pointer' : 'default'
  }

  canClickChanged(newVal: boolean | 'true' | 'false', oldVal: boolean | 'true' | 'false') {
    const cursor = (newVal === true || newVal === 'true') ? 'pointer' : 'default';
    this.defaultStyle = { ...this.defaultStyle, cursor };
  }

  @computedFrom('icon')
  get path(): string {
    switch (this.icon) {
      case 'Add':
        return 'M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z';
      case 'Edit':
        return 'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z';
      case 'Trash':
        return 'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z';
      case 'Save':
        return 'M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z';
      case 'MoreVert':
        return 'M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z';
      case 'Cancel':
        return 'M12 2C17.5 2 22 6.5 22 12S17.5 22 12 22 2 17.5 2 12 6.5 2 12 2M12 4C10.1 4 8.4 4.6 7.1 5.7L18.3 16.9C19.3 15.5 20 13.8 20 12C20 7.6 16.4 4 12 4M16.9 18.3L5.7 7.1C4.6 8.4 4 10.1 4 12C4 16.4 7.6 20 12 20C13.9 20 15.6 19.4 16.9 18.3Z';
      case 'Upload':
        return 'M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z';
    }
  }

}
