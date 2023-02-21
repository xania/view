const __refs = [];
export async function hydrate(state) {
    const result = { root: undefined };
    const stack = [[result, 'root', state]];
    while (stack.length) {
        const [target, key, input] = stack.pop();
        let output;
        if (input === null || input === undefined) {
            target[key] = output = input;
        }
        else if (isRef(input)) {
            target[key] = output = __refs[input.__ref - 1];
        }
        else if (input instanceof Array) {
            target[key] = output = [];
            for (let i = input.length - 1; i >= 0; i--) {
                stack.push([output, i, input[i]]);
            }
        }
        else if (isClosureDescriptor(input)) {
            target[key] = output = createLazyClosure(input);
        }
        else if (isCtorDescriptor(input)) {
            const { __ctor, ...instance } = input;
            for (const prop in instance) {
                stack.push([instance, prop, instance[prop]]);
            }
            const module = await input.__ctor.__ldr();
            const closure = module[input.__ctor.__name];
            const Ctor = closure();
            target[key] = output = {};
            Reflect.setPrototypeOf(output, Ctor.prototype);
            for (const prop in instance) {
                stack.push([output, prop, instance[prop]]);
            }
        }
        else if (typeof input === 'object') {
            target[key] = output = {};
            for (const prop in input) {
                stack.push([output, prop, input[prop]]);
            }
        }
        else {
            target[key] = output = input;
        }
        __refs.push(output);
    }
    return result.root;
}
function isClosureDescriptor(value) {
    if (value === null || value === undefined || typeof value !== 'object')
        return false;
    return '__ldr' in value && '__name' in value;
}
function isCtorDescriptor(value) {
    if (value === null || value === undefined || typeof value !== 'object')
        return false;
    return '__ctor' in value;
}
function createLazyClosure({ __ldr, __name, __args }) {
    return async function lazyClosure(...args) {
        const module = await __ldr();
        const closure = module[__name];
        if (__args) {
            return hydrate(__args).then((deps) => {
                const func = closure(...deps);
                return func.apply(this, args);
            });
        }
        else {
            const func = closure();
            return func.apply(this, args);
        }
    };
}
function isRef(value) {
    if (value === null || value === undefined || typeof value !== 'object')
        return false;
    return '__ref' in value;
}
//# sourceMappingURL=index.js.map