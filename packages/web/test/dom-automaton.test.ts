import { describe, expect, it } from 'vitest';
import { render, type } from '@xania/reactivity';
import { DomAutomaton } from '../lib/dom-automaton';

describe('@xania/web DomAutomaton', () => {
  it('renders an element and maps scalar properties to attributes', async () => {
    const root = document.createElement('div');
    const view = {
      [type]: 'button',
      title: 'Save',
    };

    await render(view, new DomAutomaton(root));

    const button = root.firstElementChild;
    expect(button).toBeInstanceOf(HTMLElement);
    expect(button?.tagName).toBe('BUTTON');
    expect(button?.getAttribute('title')).toBe('Save');
  });
});
