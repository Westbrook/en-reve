import type {CSSResult} from 'lit';
import {typographyStyles} from '@en-reve/styles/typography.js';
import {surfaceStyles, layoutStyles} from '@en-reve/styles/surfaces.js';
import {typographyStyles as fromFoundation} from '@en-reve/styles/foundations.js';
import {typographyStyles as fromIndex} from '@en-reve/styles';
const styles: CSSResult[] = [typographyStyles, surfaceStyles, layoutStyles, fromFoundation, fromIndex];
void styles;
