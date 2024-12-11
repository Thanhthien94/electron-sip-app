// @save Item to local Storage
export const saveItem = async (value: any) => {
  if (typeof window !== "undefined") {
    // localStorage.setItem(item, value);
    await Promise.all(
      Object.keys(value).map((key: any) => {
        // console.log(key);
        // console.log(user[key]);
        window.localStorage && window.localStorage.setItem(key, JSON.stringify(value[key]));
      })
    );
  }
};
// @get Token from local Storage
export const getItem = (item: string): any | null => {
  if (typeof window !== "undefined") {
    const storedItem = localStorage.getItem(item)
    if(typeof storedItem === undefined) {return null}
    else if (typeof storedItem !== undefined) {
      return JSON.parse(storedItem as string)
    }
  }
  return null;
};
// @remove item in local Storage
export const removeItem = async (value: string) => {
  if (typeof window !== "undefined")
    window.localStorage && window.localStorage.removeItem(value);
};

export const clearLocalStorageExceptKeys = (keysToKeep: string[]) => {
  Object.keys(localStorage).forEach(key => {
    if (typeof window !== "undefined" && !keysToKeep.includes(key)) {
      window.localStorage && window.localStorage.removeItem(key);
    }
  });
};
export const clearLocalStorage = () => {
  Object.keys(localStorage).forEach(key => {
    if (typeof window !== "undefined") {
      window.localStorage && window.localStorage.removeItem(key);
    }
  });
};
