export const enum EDiffOp {
    Same = 0,
    Add = 1,
    Remove = 2,
}

// diffChars by Myers diff algorithm implementation
export function diffChars(
    oldStr: string,
    newStr: string,
): {
    Value: string;
    DiffOp: EDiffOp;
}[] {
    const n = oldStr.length;
    const m = newStr.length;
    const v: Record<int, { X: int; Ops: EDiffOp[] }> = { 0: { X: 0, Ops: [] } };
    let shortestPath: EDiffOp[] = [];

    loop: for (let d = 0; d <= n + m; d++) {
        for (let k = -d; k <= d; k += 2) {
            let x: int = 0;
            let y: int = 0;
            const op: EDiffOp[] = [];
            if (d > 0) {
                if (k === -d || (k !== d && v[k - 1]!.X < v[k + 1]!.X)) {
                    const pointAbove = v[k + 1]!;
                    x = pointAbove.X;
                    op.push(...pointAbove.Ops, EDiffOp.Add);
                } else {
                    const pointLeft = v[k - 1]!;
                    x = pointLeft.X + 1;
                    op.push(...pointLeft.Ops, EDiffOp.Remove);
                }
                y = x - k;
            }

            while (x < n && y < m && oldStr[x] === newStr[y]) {
                x++;
                y++;
                op.push(EDiffOp.Same);
            }

            v[k] = { X: x, Ops: op };

            if (x >= n && y >= m) {
                shortestPath = op;
                break loop;
            }
        }
    }
    const mergePathToComponent: [EDiffOp, int][] = [];
    let lastOp: EDiffOp = EDiffOp.Same;
    let count = 0;
    for (const op of shortestPath) {
        if (op === lastOp) {
            count++;
        } else {
            mergePathToComponent.push([lastOp, count]);
            lastOp = op;
            count = 1;
        }
    }
    mergePathToComponent.push([lastOp, count]);
    const result: { Value: string; DiffOp: EDiffOp }[] = [];
    let newIndex = 0;
    let oldIndex = 0;
    for (const [op, count] of mergePathToComponent) {
        switch (op) {
            case EDiffOp.Same:
                result.push({ Value: newStr.slice(newIndex, newIndex + count), DiffOp: EDiffOp.Same });
                newIndex += count;
                oldIndex += count;
                break;
            case EDiffOp.Add:
                result.push({ Value: newStr.slice(newIndex, newIndex + count), DiffOp: EDiffOp.Add });
                newIndex += count;
                break;
            case EDiffOp.Remove:
                result.push({ Value: oldStr.slice(oldIndex, oldIndex + count), DiffOp: EDiffOp.Remove });
                oldIndex += count;
                break;
        }
    }

    return result;
}

interface IDiffOp {
    Type: EDiffOp;
    Length: int;
    PreOp?: IDiffOp;
}

function mergeOp(op: EDiffOp, len: int, preOp?: IDiffOp): IDiffOp {
    if (preOp?.Type === op) {
        return { Type: op, Length: preOp.Length + len, PreOp: preOp.PreOp };
    }
    return { Type: op, Length: len, PreOp: preOp };
}

export function diffCharsEfficient(
    oldStr: string,
    newStr: string,
): {
    Value: string;
    DiffOp: EDiffOp;
}[] {
    const n = oldStr.length;
    const m = newStr.length;
    const v: Record<int, { X: int; Head?: IDiffOp }> = { 0: { X: 0 } };
    let lastOp: IDiffOp | undefined = undefined;
    let depth = 0;
    loop: for (; depth <= n + m; depth++) {
        for (let k = -depth; k <= depth; k += 2) {
            let x: int = 0;
            let y: int = 0;
            const kLine = v[k] ?? { X: x };
            if (depth > 0) {
                const isDown = k === -depth || (k !== depth && v[k - 1]!.X < v[k + 1]!.X);
                if (isDown) {
                    const kLineAbove = v[k + 1]!;
                    x = kLineAbove.X;
                    kLine.Head = mergeOp(EDiffOp.Add, 1, kLineAbove.Head);
                } else {
                    const kLineLeft = v[k - 1]!;
                    x = kLineLeft.X + 1;
                    kLine.Head = mergeOp(EDiffOp.Remove, 1, kLineLeft.Head);
                }
                y = x - k;
            }
            let commonSubLength = 0;
            while (x < n && y < m && oldStr[x] === newStr[y]) {
                x++;
                y++;
                commonSubLength++;
            }
            kLine.X = x;
            if (commonSubLength > 0) {
                kLine.Head = mergeOp(EDiffOp.Same, commonSubLength, kLine.Head);
            }
            v[k] = kLine;

            if (x >= n && y >= m) {
                lastOp = kLine.Head;
                break loop;
            }
        }
    }

    const shortestPath: IDiffOp[] = [];
    let op = lastOp;
    while (op) {
        shortestPath.push(op);
        op = op.PreOp;
    }
    shortestPath.reverse();

    const result: { Value: string; DiffOp: EDiffOp }[] = [];
    let newIndex = 0;
    let oldIndex = 0;
    for (const p of shortestPath) {
        const count = p.Length;
        switch (p.Type) {
            case EDiffOp.Same:
                result.push({ Value: newStr.slice(newIndex, newIndex + count), DiffOp: EDiffOp.Same });
                newIndex += count;
                oldIndex += count;
                break;
            case EDiffOp.Add:
                result.push({ Value: newStr.slice(newIndex, newIndex + count), DiffOp: EDiffOp.Add });
                newIndex += count;
                break;
            case EDiffOp.Remove:
                result.push({ Value: oldStr.slice(oldIndex, oldIndex + count), DiffOp: EDiffOp.Remove });
                oldIndex += count;
                break;
        }
    }

    return result;
}
