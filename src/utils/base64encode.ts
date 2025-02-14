export const base64encode = (str: string): String => {
    try {
      return btoa(str);
    } catch (e) {
      return str;
    }
};