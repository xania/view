import { describe, expect, it } from 'vitest';
import { Sandbox, useState } from '../reactivity';
import { ready } from '../lib';

describe('reactivity', () => {
  it('assign', () => {
    const source = useState(1);
    var sandbox = new Sandbox();
    const target = {
      value: 123,
    };

    sandbox.track(source.assign(target, 'value'));
    expect(target.value).toBe(1);
  });

  it('assign async', async () => {
    const source = useState(Promise.resolve(1));
    var sandbox = new Sandbox();
    const target = {
      value: 123,
    };

    sandbox.track(source.assign(target, 'value'));
    const value = await target.value;
    expect(value).toBe(1);
  });

  it('map', () => {
    var sandbox = new Sandbox();

    const state = useState(1);
    const addOne = state.map((x) => x + 1);
    sandbox.track(addOne);
    expect(sandbox.get(addOne)).toBe(2);
  });

  it('map async', async () => {
    var sandbox = new Sandbox();

    const state = useState(1);
    const addOne = state.map((x) => Promise.resolve(x + 1));
    sandbox.track(addOne);
    expect(await sandbox.get(addOne)).toBe(2);
  });

  it('map async from async', async () => {
    var sandbox = new Sandbox();

    const state = useState(Promise.resolve(1));
    const addOne = state.map((x) => Promise.resolve(x + 1));
    await ready(sandbox.track(addOne));

    const result = await sandbox.get(addOne);
    expect(result).toBe(2);
  });

  it('track property', () => {
    const sandbox = new Sandbox();

    const person = useState({
      firstName: 'Ibrahim',
    });

    const target = { value: '' };
    sandbox.track(person.prop('firstName').assign(target, 'value'));

    expect(target.value).toBe('Ibrahim');
  });

  it('update object', () => {
    const sandbox = new Sandbox();

    const person = useState({
      firstName: 'Ibrahim',
    });

    const target = { value: '' };
    sandbox.track(person.prop('firstName').assign(target, 'value'));

    sandbox.update(person, { firstName: 'Ramy' });
    expect(target.value).toBe('Ramy');
  });

  it('update property', () => {
    const sandbox = new Sandbox();

    const person = useState<{ leader: { firstName: string } }>();

    const target = { value: '' };
    const firstName = person.prop('leader').prop('firstName');
    sandbox.track(firstName.assign(target, 'value'));

    sandbox.update(firstName, 'Ramy');
    expect(target.value).toBe('Ramy');
    expect(sandbox.get(person)).toEqual({ leader: { firstName: 'Ramy' } });
  });

  it('effect async', async () => {
    const source = useState(1);
    var sandbox = new Sandbox();

    let callCount = 0;
    sandbox.track(
      source.effect(async (x, p?: number) => {
        callCount += x + (p! | 0);
        return x;
      })
    );

    expect(callCount).toBe(1);
    sandbox.update(source, 3);
    // sandbox.update(source, 4);
    // sandbox.update(source, 5);
    await ready(sandbox.update(source, 2));
    expect(callCount).toBe(4);
  });

  it('when', () => {
    const state = useState(1);
    const sandbox = new Sandbox();

    const target = { value: '' };

    sandbox.track(state.when(1, 'one', 'two').assign(target, 'value'));

    expect(target.value).toBe('one');
  });

  it('join', () => {
    const x = useState(1);
    const y = useState<number>();
    const sandbox = new Sandbox();

    const target: { value?: [number, number] } = {};

    sandbox.track(x.join([y]).assign(target, 'value'));
    sandbox.update(y, 2);

    expect(target.value).toEqual([1, 2]);
  });

  it('join map', () => {
    const x = useState<1>(1);
    const y = useState<2>(2);
    const z = useState<3>(3);
    const sandbox = new Sandbox();

    const target: { value?: number } = {};

    sandbox.track(
      x
        .join([y, z])
        .map(([x, y, z]) => x + y + z)
        .assign(target, 'value')
    );
    sandbox.update(y, 2);

    expect(target.value).toEqual(6);
  });

  it('cascade join', () => {
    const x = useState(1);
    const y = useState(2);
    const z = useState(3.0);
    const sandbox = new Sandbox();

    const target: { value?: number } = {};

    sandbox.track(
      x
        .join([y, z])
        .map(([x, y, z]) => x + y + z)
        .assign(target, 'value')
    );

    expect(target.value).toEqual(6);
  });
});
