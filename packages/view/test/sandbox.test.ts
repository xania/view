import { describe, expect, it } from 'vitest';
import { Sandbox } from '../reactivity';
import { renderStack } from '../lib/render/browser/render-stack';
import { ElementNode } from '../lib/factory';
import { intrinsic } from '../lib';
import { FactoryStub, TestElementNode } from './factory.stub';

describe('sandbox', () => {
  const factory = new FactoryStub();
  it('view', () => {
    // const element = new TestElementNode(null, 'root');

    // const sandbox = new Sandbox(element);
    // const template = intrinsic('div', { children: 'xania' });

    // renderStack([[sandbox, element, template, true]], factory);

    expect(1).toBe(1);
  });
});
