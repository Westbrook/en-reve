import type {ElementDefinition} from '@en-reve/primitives/interactions/registration.js';
import {EnOtpField} from '../otp-field.js';
export const otpFieldDefinition = { tagName: 'en-otp-field', elementClass: EnOtpField } as const satisfies ElementDefinition;
