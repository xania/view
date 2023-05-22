import { describe, expect, it, vi } from 'vitest';
import { Sandbox, useState } from '../reactivity';
import { ready } from '../lib';
import { Program, get } from '../lib/reactivity/program';

describe('reactivity', () => {
  it('export', () => {
    const source = useState(1);
    var sandbox = new Program();
    const target = {
      value: 123,
    };

    sandbox.track(source.export(target, 'value'));
    sandbox.reconcile({});
    expect(target.value).toBe(1);
  });

  it('assign async', async () => {
    const source = useState(Promise.resolve(1));
    var sandbox = new Program();
    const target = {
      value: 123,
    };

    sandbox.track(source.export(target, 'value'));
    sandbox.reconcile({});
    const value = await target.value;
    expect(value).toBe(1);
  });

  it('map', () => {
    var sandbox = new Program();

    const state = useState(1);
    const addOne = state.map((x) => x + 1);
    sandbox.track(addOne);
    const scope = {};
    sandbox.reconcile(scope);
    expect(get(scope, addOne.key)).toBe(2);
  });

  it('map async', async () => {
    var sandbox = new Program();

    const state = useState(1);
    const addOne = state.map((x) => Promise.resolve(x + 1));
    sandbox.track(addOne);
    const scope = {};
    sandbox.reconcile(scope);
    expect(await get(scope, addOne.key)).toBe(2);
  });

  it('map async from async', async () => {
    var sandbox = new Program();

    const state = useState(Promise.resolve(1));
    const addOne = state.map((x) => Promise.resolve(x + 1));
    sandbox.track(addOne);

    const scope = {};
    await ready(sandbox.reconcile(scope));
    const result = await get(scope, addOne.key);
    expect(result).toBe(2);
  });

  it('track property', () => {
    const sandbox = new Program();

    const person = useState({
      firstName: 'Ibrahim',
    });

    const target = { value: '' };
    sandbox.track(person.prop('firstName').export(target, 'value'));
    sandbox.reconcile({});

    expect(target.value).toBe('Ibrahim');
  });

  it('update object', () => {
    const sandbox = new Program();

    const person = useState({
      firstName: 'Ibrahim',
    });

    const target = { value: '' };
    sandbox.track(person.prop('firstName').export(target, 'value'));
    sandbox.reconcile({});

    sandbox.update({}, person, { firstName: 'Ramy' });
    expect(target.value).toBe('Ramy');
  });

  it('update property', () => {
    const sandbox = new Program();

    const person = useState<{ leader: { firstName: string } }>();

    const target = { value: '' };
    const firstName = person.prop('leader').prop('firstName');
    sandbox.track(firstName.export(target, 'value'));
    sandbox.reconcile({});

    const scope = {};
    sandbox.update(scope, firstName, 'Ramy');
    expect(target.value).toBe('Ramy');
    expect(get(scope, person.key)).toEqual({ leader: { firstName: 'Ramy' } });
  });

  it('effect async', async () => {
    const source = useState(1);
    var sandbox = new Program();

    let callCount = 0;
    sandbox.track(
      source.effect(async (x, p?: number) => {
        callCount += x + (p! | 0);
        return x;
      })
    );

    const scope = {};
    sandbox.reconcile(scope);

    expect(callCount).toBe(1);
    sandbox.update(scope, source, 3);
    // sandbox.update(source, 4);
    // sandbox.update(source, 5);
    await ready(sandbox.update(scope, source, 2));
    expect(callCount).toBe(4);
  });

  it('when', () => {
    const state = useState(1);
    const sandbox = new Program();

    const target = { value: '' };

    sandbox.track(state.when(1, 'one', 'two').export(target, 'value'));
    sandbox.reconcile({});

    expect(target.value).toBe('one');
  });

  it('join', () => {
    const x = useState(1);
    const y = useState<number>();
    const sandbox = new Program();

    const target: { value?: [number, number] } = {};

    sandbox.track(x.join([y]).export(target, 'value'));

    const scope = {};
    sandbox.update(scope, y, 2);

    expect(target.value).toEqual([1, 2]);
  });

  it('join map', () => {
    const x = useState<1>(1);
    const y = useState<2>();
    const z = useState<3>(3);
    const sandbox = new Program();

    const target: { value?: number } = {};

    sandbox.track(
      x.join([y, z], (x, y, z) => x + y + z).export(target, 'value')
    );
    sandbox.update({}, y, 2);

    expect(target.value).toEqual(6);
  });

  it('cascade join', () => {
    const x = useState(1);
    const y = useState(2);
    const z = useState(3.0);
    const sandbox = new Program();

    const target: { value?: number } = {};

    sandbox.track(
      x
        .join([y, z])
        .map(([x, y, z]) => x + y + z)
        .export(target, 'value')
    );
    sandbox.reconcile({});

    expect(target.value).toEqual(6);
  });
});
