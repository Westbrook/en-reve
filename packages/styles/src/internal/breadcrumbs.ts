import { css } from 'lit';
import { token as t } from './values.js';

/** Shared native list layout; the legacy recipe retains its original geometry. */
export const breadcrumbLayoutStyles = css`
  .en-breadcrumbs__list, .en-recipe-breadcrumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${t('--en-space-2')};
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .en-breadcrumbs__item, .en-recipe-breadcrumbs li {
    display: inline-flex;
    align-items: center;
    gap: ${t('--en-space-2')};
    min-inline-size: 0;
  }
`;
