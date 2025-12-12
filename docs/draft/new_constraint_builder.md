# ConstraintBuilder 設計案

---

## 型定義

```typescript
type ExprTerm = [number, LayoutVar | number];
```

---

## クラス定義

```typescript
class ConstraintBuilder {
  solver: KiwiSolver;
  rawConstraints: RawConstraint[] = [];
  private tmp: Partial<{
    lhs: ExprTerm[];
    rhs: ExprTerm[];
    type: ConstraintType;
    strength: Strength;
  }> = {};

  constructor(solver: KiwiSolver) {
    this.solver = solver;
  }

  expr(...lhs: ExprTerm[]): this {
    this.tmp = {
      lhs,
      rhs: [],
      type: "eq",
      strength: "medium"
    };
    return this;
  }

  eq(...rhs: ExprTerm[]): this {
    this.tmp.rhs = rhs;
    this.tmp.type = "eq";
    return this;
  }

  ge(...rhs: ExprTerm[]): this {
    this.tmp.rhs = rhs;
    this.tmp.type = "ge";
    return this;
  }

  le(...rhs: ExprTerm[]): this {
    this.tmp.rhs = rhs;
    this.tmp.type = "le";
    return this;
  }

  eq0(): this {
    this.tmp.rhs = [[0, 1]];
    this.tmp.type = "eq";
    return this;
  }

  ge0(): this {
    this.tmp.rhs = [[0, 1]];
    this.tmp.type = "ge";
    return this;
  }

  le0(): this {
    this.tmp.rhs = [[0, 1]];
    this.tmp.type = "le";
    return this;
  }

  required() : this { return this._finalize("required")}
  strong(): this { return this._finalize("strong"); }
  medium(): this { return this._finalize("medium"); }
  weak(): this { return this._finalize("weak"); }

  private _finalize(strength: Strength): this {
    this.tmp.strength = strength;
    const rawConstraint = this.solver.addConstraint(
      this.tmp.lhs!, 
      this.tmp.rhs!, 
      this.tmp.type!, 
      this.tmp.strength!
    );
    this.rawConstraints.push(rawConstraint);
    this.tmp = {};
    return this;
  }
}
```

---

## 利用例

```typescript

const [x, y, z, w, a, b] : LayoutVar[] = variables
const builder = new ConstraintBuilder(solver);

builder
  .expr([1, height])
  .eq([2, radius], [1, strokeWidth])
  .strong(); // can use `strokeWidth` or other numeric constants on the RHS


builder.expr([1, x], [2, y]).eq([3, z]).strong();
builder.expr([1, x]).ge0().weak();
builder.expr([2, x]).le([5, w]).medium();
builder.expr([1, a], [1, b], [5, 1]).eq0().strong();

console.log(builder.rawConstraints);
// solver.addConstraint の返却値を格納している
```

---

### 備考

- `expr`／`eq`／`ge`／`le` など、可変長引数で複数項指定可能  
- 係数付きの定数項（例: `strokeWidth` や非 1 のオフセット）も `[number, number]` 形式で直接指定できる
- `eq0`／`ge0`／`le0` は右辺を `[[0, 0]]` で固定
- Chainable API形式
- 完成した制約は `this.solver.addConstraint` で確定
