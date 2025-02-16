/* eslint-disable @typescript-eslint/no-unused-vars */
export const base64encode = (str: string): string => {
    try {
      return btoa(str);
    } catch (e) {
      return str;
    }
};