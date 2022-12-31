declare namespace JSX {
  type Expression<T = any> = ObservableExpression<T> | PropertyExpression<T>;

  enum ExpressionType {
    Property = 1,
    Observable = 2,
  }

  interface ObservableExpression<U = any> {
    type: ExpressionType.Observable;
    observable: Observable<U>;
  }

  interface PropertyExpression<U = any> {
    type: ExpressionType.Property;
    name: keyof U;
    readonly: boolean;
  }
}
