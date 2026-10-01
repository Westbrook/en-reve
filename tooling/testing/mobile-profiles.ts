/** Shared phone/tablet emulation matrix. Device descriptors do not certify an OS release. */
export const mobileProfiles = [
	{ name: 'android-phone-portrait', device: 'Pixel 7', browserName: 'chromium' },
	{ name: 'android-phone-landscape', device: 'Pixel 7 landscape', browserName: 'chromium' },
	{ name: 'ios-phone-portrait', device: 'iPhone 12 Pro', browserName: 'webkit' },
	{ name: 'ios-phone-landscape', device: 'iPhone 12 Pro landscape', browserName: 'webkit' },
	{ name: 'ipad-portrait', device: 'iPad (gen 7)', browserName: 'webkit' },
	{ name: 'ipad-landscape', device: 'iPad (gen 7) landscape', browserName: 'webkit' },
	{ name: 'android-tablet-portrait', device: 'Galaxy Tab S4', browserName: 'chromium' },
	{ name: 'android-tablet-landscape', device: 'Galaxy Tab S4 landscape', browserName: 'chromium' },
] as const;
