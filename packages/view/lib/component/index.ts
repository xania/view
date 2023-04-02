export class Component {
  constructor(public func: Function, public props?: any) {}

  execute() {
    const { func, props } = this;
    try {
      return func(props);
    } catch (err) {
      // if is class then try with `new` operator
      if (func.toString().startsWith('class')) {
        return Reflect.construct(func, props);
      } else {
        throw err;
      }
    }
  }
}
