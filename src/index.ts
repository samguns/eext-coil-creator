import * as extensionConfig from '../extension.json';

export function activate(status?: 'onStartupFinished', arg?: string): void {}

export function about(): void {
	eda.sys_MessageBox.showInformationMessage(
		eda.sys_I18n.text('线圈生成器 v', undefined, undefined, extensionConfig.version),
		eda.sys_I18n.text('About'),
	);
}

export function openIframe(): void {
	eda.sys_IFrame.openIFrame('/iframe/index.html', 440, 706);
}
