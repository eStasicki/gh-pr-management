export function createArrayToggleHandler<T>(
  array: T[],
  onArrayChange: (newArray: T[]) => void
) {
  function toggleItem(item: T) {
    if (array.includes(item)) {
      onArrayChange(array.filter((i) => i !== item));
    } else {
      onArrayChange([...array, item]);
    }
  }

  function addItem(item: T) {
    if (!array.includes(item)) {
      onArrayChange([...array, item]);
    }
  }

  function removeItem(item: T) {
    onArrayChange(array.filter((i) => i !== item));
  }

  function clearArray() {
    onArrayChange([]);
  }

  function isItemInArray(item: T): boolean {
    return array.includes(item);
  }

  return {
    toggleItem,
    addItem,
    removeItem,
    clearArray,
    isItemInArray,
  };
}

export function createArraySelectionHandler<T>(
  allItems: T[],
  selectedItems: T[],
  onSelectionChange: (selected: T[]) => void,
  getItemId: (item: T) => any
) {
  function toggleItem(item: T) {
    const itemId = getItemId(item);
    const isSelected = selectedItems.some(
      (selected) => getItemId(selected) === itemId
    );

    if (isSelected) {
      onSelectionChange(
        selectedItems.filter((selected) => getItemId(selected) !== itemId)
      );
    } else {
      onSelectionChange([...selectedItems, item]);
    }
  }

  function selectAll() {
    onSelectionChange([...allItems]);
  }

  function deselectAll() {
    onSelectionChange([]);
  }

  function isAllSelected(): boolean {
    return (
      allItems.length > 0 &&
      allItems.every((item) =>
        selectedItems.some(
          (selected) => getItemId(selected) === getItemId(item)
        )
      )
    );
  }

  function isItemSelected(item: T): boolean {
    const itemId = getItemId(item);
    return selectedItems.some((selected) => getItemId(selected) === itemId);
  }

  return {
    toggleItem,
    selectAll,
    deselectAll,
    isAllSelected,
    isItemSelected,
  };
}
