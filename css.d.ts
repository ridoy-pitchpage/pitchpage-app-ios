/**
 * The root stylesheet is imported for its side effect: NativeWind's Metro
 * transform turns it into the compiled style registry. TypeScript needs to be
 * told the import resolves to nothing.
 */
declare module "*.css";
