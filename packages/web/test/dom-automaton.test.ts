// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  children,
  events,
  ForEach,
  If,
  render,
  type Sandbox,
  type,
  UpdateCommand,
  useState,
} from '@xania/reactivity';
import { DomAutomaton } from '../lib/dom-automaton';
import { renderDOM } from '../lib/render';

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

  it('renders DOM element events through renderDOM', () => {
    const root = document.createElement('div');
    let clicks = 0;
    const view = {
      [type]: 'button',
      [events]: {
        click() {
          clicks++;
        },
      },
    };

    expect(() => renderDOM(view, root)).not.toThrow();
    expect(root.firstElementChild?.[events]?.click).toBeTypeOf('function');

    (root.firstElementChild as HTMLButtonElement).click();

    expect(clicks).toBe(1);
  });

  it('renders foreach children into DOM containers', async () => {
    const root = document.createElement('div');
    const values = useState(['a', 'b']);
    const view = {
      [type]: 'ul',
      [children]: ForEach(values, (item) => ({
        [type]: 'li',
        [children]: item,
      })),
    };

    await renderDOM(view, root);

    expect(root.firstElementChild?.tagName).toBe('UL');
    expect(root.querySelectorAll('li')).toHaveLength(2);
    expect(root.textContent).toBe('ab');
  });

  it('returns the sandbox from renderDOM', async () => {
    const root = document.createElement('div');
    const sandbox = (await renderDOM(
      {
        [type]: 'div',
        [children]: 'value',
      },
      root
    )) as Sandbox;

    expect(sandbox).toBeDefined();
    expect(sandbox.rootValues).toEqual({});
  });

  it('updates nested DOM text nodes after state changes', async () => {
    const root = document.createElement('div');
    const count = useState(2);
    const sandbox = (await renderDOM(
      {
        [type]: 'section',
        [children]: {
          [type]: 'strong',
          [children]: count,
        },
      },
      root
    )) as Sandbox;

    expect(root.textContent).toBe('2');

    sandbox.update(count, 7);

    expect(root.textContent).toBe('7');
  });

  it('updates DOM text with conditional and foreach siblings present', async () => {
    const root = document.createElement('div');
    const count = useState(2);
    const visible = useState(true);
    const values = useState(['a', 'b']);
    const sandbox = (await renderDOM(
      {
        [type]: 'section',
        [children]: [
          If(
            visible,
            {
              [type]: 'article',
              [children]: {
                [type]: 'strong',
                [children]: count,
              },
            }
          ),
          {
            [type]: 'ul',
            [children]: ForEach(values, (item) => ({
              [type]: 'li',
              [children]: item,
            })),
          },
        ],
      },
      root
    )) as Sandbox;

    expect(root.textContent).toBe('2ab');

    sandbox.update(count, 7);

    expect(root.textContent).toBe('7ab');
  });

  it('updates foreach DOM items after list changes', async () => {
    const root = document.createElement('div');
    const values = useState([
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
    ]);
    const sandbox = (await renderDOM(
      {
        [type]: 'ul',
        [children]: ForEach(values, (item) => ({
          [type]: 'li',
          [children]: {
            [type]: 'span',
            [children]: item.map((value) => value.label),
          },
        })),
      },
      root
    )) as Sandbox;

    expect(root.textContent).toBe('ab');

    sandbox.update(values, [
      { id: 1, label: 'a' },
      { id: 2, label: 'b' },
      { id: 3, label: 'c' },
    ]);

    expect(root.textContent).toBe('abc');
  });

  it('updates conditional DOM content from native button clicks', async () => {
    const root = document.createElement('div');
    const visible = useState(true);
    await renderDOM(
      {
        [type]: 'section',
        [children]: [
          {
            [type]: 'button',
            [events]: {
              click: new UpdateCommand(visible, false),
            },
            [children]: 'Hide hero',
          },
          If(
            visible,
            {
              [type]: 'article',
              [children]: 'Hero',
            }
          ),
        ],
      },
      root
    );

    expect(root.textContent).toBe('Hide heroHero');

    (root.querySelector('button') as HTMLButtonElement).click();

    expect(root.textContent).toBe('Hide hero');
  });
});
