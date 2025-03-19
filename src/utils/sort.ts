type SortDirection = 1 | -1;
type SortField<T> = keyof T;

export const createSorter = <T extends object>(
  field: SortField<T>,
  direction: SortDirection = 1,
) => {
  return (a: T, b: T) => {
    const valueA = a[field];
    const valueB = b[field];

    // 處理數字排序
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return direction * (valueA - valueB);
    }

    // 處理字串排序
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return direction * valueA.localeCompare(valueB);
    }

    // 處理日期排序
    if (valueA instanceof Date && valueB instanceof Date) {
      return direction * (valueA.getTime() - valueB.getTime());
    }

    return 0;
  };
};

// 使用範例：
// const users = [{ name: 'Alice', age: 25 }, { name: 'Bob', age: 30 }];
// users.sort(createSorter('age', -1)); // 依年齡降序排序
// users.sort(createSorter('name')); // 依名字升序排序
